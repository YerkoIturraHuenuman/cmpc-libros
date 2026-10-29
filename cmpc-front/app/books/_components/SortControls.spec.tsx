import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { BookSort } from '../_services/booksService';
import { SortControls } from './SortControls';

jest.mock('./OptionSelect', () => ({
  OptionSelect: (props: {
    value: string;
    onValueChange: (value: string) => void;
    options: { value: string; label: string }[];
    ariaLabel?: string;
  }) => (
    <select
      aria-label={props.ariaLabel}
      value={props.value}
      onChange={(event) => props.onValueChange(event.target.value)}
    >
      {props.options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

const title = (direction: 'asc' | 'desc' = 'asc'): BookSort => ({ field: 'title', direction });
const price = (direction: 'asc' | 'desc' = 'asc'): BookSort => ({ field: 'price', direction });

function setup(sort: BookSort[]) {
  const onChange = jest.fn();
  render(<SortControls sort={sort} onChange={onChange} />);
  return onChange;
}

describe('SortControls', () => {
  it('sin criterios explica el orden por defecto y ofrece agregar uno', () => {
    setup([]);

    expect(screen.getByText(/más recientes primero/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Agregar criterio/ })).toBeInTheDocument();
  });

  it('agrega el primer campo libre en orden ascendente', async () => {
    const onChange = setup([title()]);

    await userEvent.click(screen.getByRole('button', { name: /Agregar criterio/ }));

    expect(onChange).toHaveBeenCalledWith([title(), { field: 'author', direction: 'asc' }]);
  });

  it('no deja agregar más criterios al llegar al máximo', () => {
    setup([title(), price(), { field: 'genre', direction: 'asc' }]);
    expect(screen.queryByRole('button', { name: /Agregar criterio/ })).not.toBeInTheDocument();
  });

  it('muestra un criterio por fila con su campo', () => {
    setup([title(), price('desc')]);

    expect(screen.getByRole('combobox', { name: 'Campo del criterio 1' })).toHaveValue('title');
    expect(screen.getByRole('combobox', { name: 'Campo del criterio 2' })).toHaveValue('price');
    expect(screen.queryByText(/más recientes primero/)).not.toBeInTheDocument();
  });

  it('cambiar el campo conserva la dirección', async () => {
    const onChange = setup([price('desc')]);

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Campo del criterio 1' }), 'author');

    expect(onChange).toHaveBeenCalledWith([{ field: 'author', direction: 'desc' }]);
  });

  it('cada campo solo aparece en la fila que lo usa, o libre', () => {
    setup([title(), price()]);

    const first = screen.getByRole('combobox', { name: 'Campo del criterio 1' });
    const values = within(first).getAllByRole('option').map((o) => o.getAttribute('value'));
    expect(values).toContain('title');
    expect(values).not.toContain('price');
    expect(values).toContain('author');
  });

  it('cambia la dirección de un criterio', async () => {
    const onChange = setup([title('asc'), price('desc')]);

    await userEvent.click(screen.getByRole('button', { name: /Criterio 1: ascendente/ }));
    await userEvent.click(screen.getByRole('button', { name: /Criterio 2: descendente/ }));

    expect(onChange).toHaveBeenNthCalledWith(1, [title('desc'), price('desc')]);
    expect(onChange).toHaveBeenNthCalledWith(2, [title('asc'), price('asc')]);
  });

  it('quita un criterio', async () => {
    const onChange = setup([title(), price()]);

    await userEvent.click(screen.getByRole('button', { name: 'Quitar criterio 1' }));

    expect(onChange).toHaveBeenCalledWith([price()]);
  });
});
