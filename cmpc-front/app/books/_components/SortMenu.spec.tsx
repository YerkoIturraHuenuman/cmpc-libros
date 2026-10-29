import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { BookSort } from '../_services/booksService';
import { SORT_PRESETS } from '../_utils/sortPresets';
import { SortMenu } from './SortMenu';

function setup(sort: BookSort[]) {
  const onChange = jest.fn();
  const onCustom = jest.fn();
  render(<SortMenu sort={sort} onChange={onChange} onCustom={onCustom} />);
  return { onChange, onCustom };
}

const open = () => userEvent.click(screen.getByRole('button', { name: /Ordenar por/ }));

describe('SortMenu', () => {
  it('muestra el orden activo en el botón', () => {
    setup([{ field: 'price', direction: 'desc' }]);

    expect(screen.getByRole('button', { name: 'Ordenar por: Mayor a menor precio' })).toBeInTheDocument();
  });

  it('sin criterios dice «Más recientes»', () => {
    setup([]);
    expect(screen.getByRole('button', { name: 'Ordenar por: Más recientes' })).toBeInTheDocument();
  });

  it('un orden que no es un preset figura como «Personalizado»', () => {
    setup([{ field: 'publisher', direction: 'asc' }]);
    expect(screen.getByRole('button', { name: 'Ordenar por: Personalizado' })).toBeInTheDocument();
  });

  it('lista todos los presets más «Personalizado…»', async () => {
    setup([]);

    await open();

    const items = await screen.findAllByRole('menuitemcheckbox');
    expect(items.map((item) => item.textContent)).toEqual([
      ...SORT_PRESETS.map((preset) => preset.label),
      'Personalizado…',
    ]);
  });

  it('marca solo el orden activo', async () => {
    setup([{ field: 'title', direction: 'asc' }]);

    await open();

    expect(await screen.findByRole('menuitemcheckbox', { name: 'Título: A → Z' })).toBeChecked();
    expect(screen.getByRole('menuitemcheckbox', { name: 'Más recientes' })).not.toBeChecked();
    expect(screen.getByRole('menuitemcheckbox', { name: 'Personalizado…' })).not.toBeChecked();
  });

  it('con un orden propio marca «Personalizado…»', async () => {
    setup([{ field: 'publisher', direction: 'asc' }]);

    await open();

    expect(await screen.findByRole('menuitemcheckbox', { name: 'Personalizado…' })).toBeChecked();
  });

  it('elegir un preset avisa con su orden (incluso uno de varios campos)', async () => {
    const { onChange } = setup([]);

    await open();
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Género y precio' }));

    expect(onChange).toHaveBeenCalledWith([
      { field: 'genre', direction: 'asc' },
      { field: 'price', direction: 'asc' },
    ]);
  });

  it('elegir «Más recientes» limpia los criterios', async () => {
    const { onChange } = setup([{ field: 'title', direction: 'asc' }]);

    await open();
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Más recientes' }));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('«Personalizado…» abre el orden propio y no cambia el orden', async () => {
    const { onChange, onCustom } = setup([]);

    await open();
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Personalizado…' }));

    expect(onCustom).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
  });
});
