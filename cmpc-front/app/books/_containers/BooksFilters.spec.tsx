import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEFAULT_QUERY } from '../_utils/booksQuery';
import { BooksFilters } from './BooksFilters';

jest.mock('../_components/MultiSelectFilter', () => ({
  MultiSelectFilter: (props: {
    label: string;
    options: { value: string; label: string }[];
    selected: string[];
    onChange: (selected: string[]) => void;
  }) => (
    <fieldset aria-label={props.label}>
      {props.options.map((o) => (
        <label key={o.value}>
          <input
            type="checkbox"
            checked={props.selected.includes(o.value)}
            onChange={(event) =>
              props.onChange(
                event.target.checked
                  ? [...props.selected, o.value]
                  : props.selected.filter((v) => v !== o.value),
              )
            }
          />
          {o.label}
        </label>
      ))}
    </fieldset>
  ),
}));
jest.mock('../_components/OptionSelect', () => ({
  OptionSelect: (props: {
    value: string;
    onValueChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder: string;
    allLabel?: string;
  }) => (
    <select
      aria-label={props.placeholder}
      value={props.value}
      onChange={(event) => props.onValueChange(event.target.value)}
    >
      {props.allLabel && <option value="all">{props.allLabel}</option>}
      {props.options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

function setup(props: Partial<React.ComponentProps<typeof BooksFilters>> = {}) {
  const handlers = { onSearch: jest.fn(), onFilter: jest.fn(), onClear: jest.fn() };
  render(
    <BooksFilters
      query={DEFAULT_QUERY}
      authors={[{ id: 'a1', name: 'Cortázar' }]}
      publishers={[{ id: 'p1', name: 'Alfaguara' }]}
      genres={[{ id: 'g1', name: 'Novela' }]}
      hasFilters={false}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
}

describe('BooksFilters', () => {
  it('escribir en el buscador avisa cada cambio', async () => {
    const { onSearch } = setup();

    await userEvent.type(screen.getByLabelText('Buscar libros'), 'ab');

    expect(onSearch).toHaveBeenNthCalledWith(1, 'a');
    expect(onSearch).toHaveBeenNthCalledWith(2, 'b');
  });

  it('muestra el texto de búsqueda actual', () => {
    setup({ query: { ...DEFAULT_QUERY, search: 'borges' } });
    expect(screen.getByLabelText('Buscar libros')).toHaveValue('borges');
  });

  it.each([
    ['Novela', 'genreIds', ['g1']],
    ['Alfaguara', 'publisherIds', ['p1']],
    ['Cortázar', 'authorIds', ['a1']],
  ])('marcar %s avisa con la lista de ids (%s)', async (option, key, ids) => {
    const { onFilter } = setup();

    await userEvent.click(screen.getByLabelText(option));

    expect(onFilter).toHaveBeenCalledWith(key, ids);
  });

  it('desmarcar una opción la quita de la lista', async () => {
    const { onFilter } = setup({ query: { ...DEFAULT_QUERY, genreIds: ['g1'] } });

    await userEvent.click(screen.getByLabelText('Novela'));

    expect(onFilter).toHaveBeenCalledWith('genreIds', []);
  });

  it('el filtro de disponibilidad avisa con su valor', async () => {
    const { onFilter } = setup();

    await userEvent.selectOptions(screen.getByLabelText('Disponibilidad'), 'true');

    expect(onFilter).toHaveBeenCalledWith('availability', 'true');
  });

  it('la disponibilidad ofrece "todas"', () => {
    setup();
    expect(screen.getByRole('option', { name: 'Toda disponibilidad' })).toBeInTheDocument();
  });

  it('el botón de limpiar solo aparece con filtros activos', async () => {
    const { onClear } = setup({ hasFilters: true });

    await userEvent.click(screen.getByRole('button', { name: 'Limpiar' }));

    expect(onClear).toHaveBeenCalled();
  });

  it('sin filtros no hay botón de limpiar', () => {
    setup({ hasFilters: false });
    expect(screen.queryByRole('button', { name: 'Limpiar' })).not.toBeInTheDocument();
  });
});
