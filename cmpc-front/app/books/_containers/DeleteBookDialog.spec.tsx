import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useDeleteBook } from '../_hooks/useDeleteBook';
import { DeleteBookDialog } from './DeleteBookDialog';
import { makeBook } from './fixtures';

jest.mock('../_hooks/useDeleteBook');

describe('DeleteBookDialog', () => {
  const confirmDelete = jest.fn();

  beforeEach(() => {
    confirmDelete.mockReset();
    jest.mocked(useDeleteBook).mockReturnValue({ confirmDelete, isDeleting: false });
  });

  it('sin libro no se muestra', () => {
    render(<DeleteBookDialog book={null} onDeleted={jest.fn()} onClose={jest.fn()} />);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('pide confirmación nombrando el libro', () => {
    render(<DeleteBookDialog book={makeBook()} onDeleted={jest.fn()} onClose={jest.fn()} />);

    expect(screen.getByRole('alertdialog')).toHaveTextContent('¿Eliminar este libro?');
    expect(screen.getByRole('alertdialog')).toHaveTextContent('«Rayuela»');
  });

  it('el hook recibe el libro y el callback', () => {
    const book = makeBook();
    const onDeleted = jest.fn();
    render(<DeleteBookDialog book={book} onDeleted={onDeleted} onClose={jest.fn()} />);

    expect(useDeleteBook).toHaveBeenCalledWith(book, onDeleted);
  });

  it('confirmar elimina', async () => {
    render(<DeleteBookDialog book={makeBook()} onDeleted={jest.fn()} onClose={jest.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(confirmDelete).toHaveBeenCalled();
  });

  it('cancelar cierra sin eliminar', async () => {
    const onClose = jest.fn();
    render(<DeleteBookDialog book={makeBook()} onDeleted={jest.fn()} onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onClose).toHaveBeenCalled();
    expect(confirmDelete).not.toHaveBeenCalled();
  });

  it('mientras elimina deshabilita los botones', () => {
    jest.mocked(useDeleteBook).mockReturnValue({ confirmDelete, isDeleting: true });
    render(<DeleteBookDialog book={makeBook()} onDeleted={jest.fn()} onClose={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Eliminando…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  });
});
