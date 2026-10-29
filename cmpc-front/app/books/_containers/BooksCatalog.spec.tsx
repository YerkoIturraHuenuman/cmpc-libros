import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BooksCatalog } from './BooksCatalog';
import { makeBook } from './fixtures';

function setup(props: Partial<React.ComponentProps<typeof BooksCatalog>> = {}) {
  const handlers = {
    onView: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onRetry: jest.fn(),
  };
  const view = render(
    <BooksCatalog books={[]} view="grid" isLoading={false} error={null} {...handlers} {...props} />,
  );
  return { ...handlers, ...view };
}

const books = [makeBook(), makeBook({ id: 'b2', title: 'Ficciones', isAvailable: false })];

describe('BooksCatalog', () => {
  it('en cuadrícula muestra una tarjeta por libro', () => {
    const { container } = setup({ books, view: 'grid' });

    expect(container.querySelector('[data-view="grid"]')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(screen.getByText('Ficciones')).toBeInTheDocument();
  });

  it('en lista muestra una fila por libro', () => {
    const { container } = setup({ books, view: 'list' });

    expect(container.querySelector('[data-view="list"]')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });

  it('las acciones reciben el libro de su tarjeta', async () => {
    const { onView, onEdit, onDelete } = setup({ books });

    await userEvent.click(screen.getByRole('button', { name: 'Ver Rayuela' }));
    await userEvent.click(screen.getByRole('button', { name: 'Editar Ficciones' }));
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar Rayuela' }));

    expect(onView).toHaveBeenCalledWith(books[0]);
    expect(onEdit).toHaveBeenCalledWith(books[1]);
    expect(onDelete).toHaveBeenCalledWith(books[0]);
  });

  it.each(['grid', 'list'] as const)('la primera carga muestra esqueletos (%s)', (view) => {
    const { container } = setup({ isLoading: true, view });

    expect(container.querySelectorAll('[data-skeleton-item]')).toHaveLength(8);
    expect(screen.queryByText('No hay libros que coincidan.')).not.toBeInTheDocument();
    expect(container.firstChild).toHaveAttribute('aria-busy', 'true');
  });

  it('al recargar con datos previos los sigue mostrando atenuados', () => {
    const { container } = setup({ isLoading: true, books });

    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(container.firstChild).toHaveClass('opacity-60');
  });

  it('sin resultados muestra el estado vacío', () => {
    setup();
    expect(screen.getByText('No hay libros que coincidan.')).toBeInTheDocument();
  });

  it('con error muestra el mensaje y permite reintentar', async () => {
    const { onRetry } = setup({ error: 'No se pudo conectar con el servidor' });

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo conectar con el servidor');
    expect(screen.queryByText('No hay libros que coincidan.')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
