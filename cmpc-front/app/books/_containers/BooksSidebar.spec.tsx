import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEFAULT_QUERY } from '../_utils/booksQuery';
import { BooksSidebar } from './BooksSidebar';

jest.mock('./BooksFilters', () => ({
  BooksFilters: ({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) => (
    <div>
      <p>filtros {hasFilters ? 'activos' : 'inactivos'}</p>
      <button onClick={onClear}>limpiar (mock)</button>
    </div>
  ),
}));
function setup(props: Partial<React.ComponentProps<typeof BooksSidebar>> = {}) {
  const handlers = {
    onSearch: jest.fn(),
    onFilter: jest.fn(),
    onClear: jest.fn(),
    onExport: jest.fn(),
    onLogout: jest.fn(),
  };
  render(
    <BooksSidebar
      query={DEFAULT_QUERY}
      authors={[]}
      publishers={[]}
      genres={[]}
      hasFilters={false}
      isExporting={false}
      isLoggingOut={false}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
}

describe('BooksSidebar', () => {
  it('muestra la marca y los filtros', () => {
    setup({ hasFilters: true });

    expect(screen.getByText('CMPC Libros')).toBeInTheDocument();
    expect(screen.getByText('filtros activos')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Ordenar por' })).not.toBeInTheDocument();
  });

  it('reenvía limpiar filtros', async () => {
    const { onClear } = setup();

    await userEvent.click(screen.getByRole('button', { name: 'limpiar (mock)' }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('abajo están exportar y cerrar sesión', async () => {
    const { onExport, onLogout } = setup();

    await userEvent.click(screen.getByRole('button', { name: /Exportar CSV/ }));
    await userEvent.click(screen.getByRole('button', { name: /Cerrar sesión/ }));

    expect(onExport).toHaveBeenCalledTimes(1);
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('mientras exporta deshabilita el botón', () => {
    setup({ isExporting: true });
    expect(screen.getByRole('button', { name: /Exportando…/ })).toBeDisabled();
  });

  it('mientras cierra sesión deshabilita el botón', () => {
    setup({ isLoggingOut: true });
    expect(screen.getByRole('button', { name: /Cerrar sesión/ })).toBeDisabled();
  });
});
