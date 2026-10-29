import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { makeBook } from '../_containers/fixtures';
import { BookCard } from './BookCard';

function setup(overrides = {}) {
  const book = makeBook(overrides);
  const handlers = { onView: jest.fn(), onEdit: jest.fn(), onDelete: jest.fn() };
  render(<BookCard book={book} {...handlers} />);
  return { book, ...handlers };
}

describe('BookCard', () => {
  it('muestra título, autor, editorial, género y precio', () => {
    setup();

    expect(screen.getByText('Rayuela')).toBeInTheDocument();
    expect(screen.getByText('Julio Cortázar')).toBeInTheDocument();
    expect(screen.getByText('Alfaguara · Novela')).toBeInTheDocument();
    expect(screen.getByText(/12\.990/)).toBeInTheDocument();
  });

  it('indica la disponibilidad', () => {
    setup({ isAvailable: false });
    expect(screen.getByText('No disponible')).toBeInTheDocument();
  });

  it('la portada y el título abren el detalle', async () => {
    const { book, onView } = setup();

    await userEvent.click(screen.getByRole('button', { name: 'Ver Rayuela' }));
    await userEvent.click(screen.getByRole('button', { name: 'Rayuela' }));

    expect(onView).toHaveBeenNthCalledWith(1, book);
    expect(onView).toHaveBeenNthCalledWith(2, book);
  });

  it('editar y eliminar reciben el libro', async () => {
    const { book, onEdit, onDelete } = setup();

    await userEvent.click(screen.getByRole('button', { name: 'Editar Rayuela' }));
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar Rayuela' }));

    expect(onEdit).toHaveBeenCalledWith(book);
    expect(onDelete).toHaveBeenCalledWith(book);
  });

  it('sin portada muestra el marcador', () => {
    setup({ imageUrl: null });
    expect(screen.getByLabelText('Sin portada')).toBeInTheDocument();
  });

  it('con portada la muestra', () => {
    setup({ imageUrl: 'https://res.cloudinary.com/demo/p.webp' });
    expect(screen.getByAltText('Portada de Rayuela')).toBeInTheDocument();
  });
});
