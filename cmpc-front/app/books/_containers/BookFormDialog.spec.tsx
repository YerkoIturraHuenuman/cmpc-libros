import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookFormDialog } from './BookFormDialog';
import { makeBook } from './fixtures';

jest.mock('./BookFormPanel', () => ({
  BookFormPanel: ({ book, onCancel }: { book: { title: string } | null; onCancel: () => void }) => (
    <div>
      <p>{book ? `editando ${book.title}` : 'creando'}</p>
      <button onClick={onCancel}>cancelar panel</button>
    </div>
  ),
}));

const base = {
  authors: [],
  publishers: [],
  genres: [],
  onSaved: jest.fn(),
  onCatalogItemCreated: jest.fn(),
};

describe('BookFormDialog', () => {
  it('cerrado no monta el panel', () => {
    render(<BookFormDialog {...base} open={false} book={null} onClose={jest.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('creando')).not.toBeInTheDocument();
  });

  it('abierto sin libro crea', () => {
    render(<BookFormDialog {...base} open book={null} onClose={jest.fn()} />);
    expect(screen.getByText('creando')).toBeInTheDocument();
  });

  it('abierto con libro edita', () => {
    render(<BookFormDialog {...base} open book={makeBook()} onClose={jest.fn()} />);
    expect(screen.getByText('editando Rayuela')).toBeInTheDocument();
  });

  it('Escape cierra', async () => {
    const onClose = jest.fn();
    render(<BookFormDialog {...base} open book={null} onClose={onClose} />);

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
  });

  it('el panel puede cancelar', async () => {
    const onClose = jest.fn();
    render(<BookFormDialog {...base} open book={null} onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: 'cancelar panel' }));

    expect(onClose).toHaveBeenCalled();
  });
});
