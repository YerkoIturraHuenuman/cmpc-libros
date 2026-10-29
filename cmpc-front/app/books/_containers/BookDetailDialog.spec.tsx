import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookDetailDialog } from './BookDetailDialog';
import { makeBook } from './fixtures';

describe('BookDetailDialog', () => {
  it('sin libro no se muestra', () => {
    render(<BookDetailDialog book={null} onClose={jest.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('muestra todos los datos del libro', () => {
    render(<BookDetailDialog book={makeBook()} onClose={jest.fn()} />);

    const dialog = screen.getByRole('dialog', { name: 'Rayuela' });
    expect(dialog).toHaveTextContent('Julio Cortázar');
    expect(dialog).toHaveTextContent('Alfaguara');
    expect(dialog).toHaveTextContent('Novela');
    expect(dialog).toHaveTextContent('Disponible');
    expect(dialog).toHaveTextContent(/12\.990/);
    expect(dialog).toHaveTextContent('Creado');
    expect(dialog).toHaveTextContent('Actualizado');
  });

  it('cierra con Escape', async () => {
    const onClose = jest.fn();
    render(<BookDetailDialog book={makeBook()} onClose={onClose} />);

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
  });
});
