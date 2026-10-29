import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useBooksPage } from '../_hooks/useBooksPage';
import { makeBook } from '../_containers/fixtures';
import BooksPage from './page';

jest.mock('../_hooks/useBooksPage');
jest.mock('@/app/(auth)/_containers/SessionGuard', () => ({
  SessionGuard: () => <div data-testid="session-guard" />,
}));
jest.mock('../_components/OptionSelect', () => ({ OptionSelect: () => null }));
jest.mock('../_components/SortControls', () => ({ SortControls: () => <p>controles de orden</p> }));

function mockPage(overrides: Record<string, unknown> = {}, listOverrides: Record<string, unknown> = {}) {
  const actions = {
    closeDialog: jest.fn(),
    onSaved: jest.fn(),
    onDeleted: jest.fn(),
    openCreate: jest.fn(),
    openDetail: jest.fn(),
    openEdit: jest.fn(),
    openDelete: jest.fn(),
  };
  jest.mocked(useBooksPage).mockReturnValue({
    list: {
      query: { search: '', genreIds: [], publisherIds: [], authorIds: [], availability: 'all', sort: [], page: 1 },
      books: [makeBook()],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      isLoading: false,
      error: null,
      hasFilters: false,
      setSearch: jest.fn(),
      setFilter: jest.fn(),
      setSort: jest.fn(),
      goToPage: jest.fn(),
      clearFilters: jest.fn(),
      reload: jest.fn(),
      ...listOverrides,
    },
    catalogs: { authors: [], publishers: [], genres: [] },
    exporter: { exportCsv: jest.fn(), isExporting: false },
    session: { logout: jest.fn(), isLoggingOut: false },
    dialog: null,
    view: 'grid',
    setView: jest.fn(),
    ...actions,
    ...overrides,
  } as unknown as ReturnType<typeof useBooksPage>);
  return actions;
}

describe('BooksPage', () => {
  it('mientras no llega la primera respuesta dice que carga', () => {
    mockPage({}, { meta: null, books: [], isLoading: true });
    render(<BooksPage />);

    expect(screen.getByText('Cargando…')).toBeInTheDocument();
  });

  it('arma la pantalla: barra lateral, cabecera, catálogo, paginación y la guarda de sesión', () => {
    mockPage();
    render(<BooksPage />);

    expect(screen.getByRole('heading', { name: 'Libros' })).toBeInTheDocument();
    expect(screen.getByText('Rayuela')).toBeInTheDocument();
    expect(screen.getByText('Mostrando 1–1 de 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ordenar por: Más recientes/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Exportar CSV/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cerrar sesión/ })).toBeInTheDocument();
    expect(screen.getByTestId('session-guard')).toBeInTheDocument();
  });

  it('los botones llaman a las acciones del hook', async () => {
    const { openCreate, openEdit, openDelete, openDetail } = mockPage();
    render(<BooksPage />);

    await userEvent.click(screen.getByRole('button', { name: /Nuevo libro/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Ver Rayuela' }));
    await userEvent.click(screen.getByRole('button', { name: 'Editar Rayuela' }));
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar Rayuela' }));

    expect(openCreate).toHaveBeenCalled();
    expect(openDetail).toHaveBeenCalled();
    expect(openEdit).toHaveBeenCalled();
    expect(openDelete).toHaveBeenCalled();
  });

  it('«Personalizado…» abre el orden propio', () => {
    mockPage({ dialog: { type: 'sort' } });
    render(<BooksPage />);

    expect(screen.getByRole('dialog', { name: 'Orden personalizado' })).toBeInTheDocument();
    expect(screen.getByText('controles de orden')).toBeInTheDocument();
  });

  it('abre el formulario para crear', () => {
    mockPage({ dialog: { type: 'create' } });
    render(<BooksPage />);

    expect(screen.getByRole('heading', { name: 'Nuevo libro' })).toBeInTheDocument();
  });

  it('abre el formulario para editar el libro elegido', () => {
    mockPage({ dialog: { type: 'edit', book: makeBook() } });
    render(<BooksPage />);

    expect(screen.getByRole('heading', { name: 'Editar libro' })).toBeInTheDocument();
    expect(screen.getByLabelText('Título')).toHaveValue('Rayuela');
  });

  it('abre el detalle del libro elegido', () => {
    mockPage({ dialog: { type: 'detail', book: makeBook() } });
    render(<BooksPage />);

    expect(screen.getByRole('dialog', { name: 'Rayuela' })).toBeInTheDocument();
  });

  it('abre la confirmación de borrado', () => {
    mockPage({ dialog: { type: 'delete', book: makeBook() } });
    render(<BooksPage />);

    expect(screen.getByRole('alertdialog')).toHaveTextContent('¿Eliminar este libro?');
  });
});
