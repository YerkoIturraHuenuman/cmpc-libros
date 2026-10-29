import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { BookSort } from '../_services/booksService';
import { BooksToolbar } from './BooksToolbar';

function setup(total: number | null, view: 'grid' | 'list' = 'grid', sort: BookSort[] = []) {
  const handlers = {
    onViewChange: jest.fn(),
    onCreate: jest.fn(),
    onSortChange: jest.fn(),
    onCustomSort: jest.fn(),
  };
  render(<BooksToolbar total={total} view={view} sort={sort} {...handlers} />);
  return handlers;
}

describe('BooksToolbar', () => {
  it('muestra el título y cuántos libros hay', () => {
    setup(30);

    expect(screen.getByRole('heading', { name: 'Libros' })).toBeInTheDocument();
    expect(screen.getByText('30 libros')).toBeInTheDocument();
  });

  it('usa el singular con un libro', () => {
    setup(1);
    expect(screen.getByText('1 libro')).toBeInTheDocument();
  });

  it('mientras no hay respuesta dice que carga', () => {
    setup(null);
    expect(screen.getByText('Cargando…')).toBeInTheDocument();
  });

  it('«Nuevo libro» crea', async () => {
    const { onCreate } = setup(3);

    await userEvent.click(screen.getByRole('button', { name: /Nuevo libro/ }));

    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('el selector de vista cambia la vista', async () => {
    const { onViewChange } = setup(3, 'grid');

    await userEvent.click(screen.getByRole('button', { name: 'Vista en lista' }));

    expect(onViewChange).toHaveBeenCalledWith('list');
  });

  it('incluye el menú «Ordenar por» junto al selector de vista', async () => {
    const { onSortChange } = setup(3, 'grid', []);

    await userEvent.click(screen.getByRole('button', { name: /Ordenar por: Más recientes/ }));
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Menor a mayor precio' }));

    expect(onSortChange).toHaveBeenCalledWith([{ field: 'price', direction: 'asc' }]);
  });

  it('«Personalizado…» pide abrir el orden propio', async () => {
    const { onCustomSort } = setup(3);

    await userEvent.click(screen.getByRole('button', { name: /Ordenar por/ }));
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Personalizado…' }));

    expect(onCustomSort).toHaveBeenCalledTimes(1);
  });
});
