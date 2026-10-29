import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MultiSelectFilter } from './MultiSelectFilter';

const options = [
  { value: 'g1', label: 'Novela' },
  { value: 'g2', label: 'Poesía' },
  { value: 'g3', label: 'Ensayo' },
];

function setup(selected: string[] = [], opts = options) {
  const onChange = jest.fn();
  render(
    <MultiSelectFilter
      label="géneros"
      allLabel="Todos los géneros"
      options={opts}
      selected={selected}
      onChange={onChange}
    />,
  );
  return onChange;
}

const trigger = () => screen.getByRole('button', { name: 'Filtrar por géneros' });

describe('MultiSelectFilter', () => {
  it('sin selección muestra el texto de "todos"', () => {
    setup();
    expect(trigger()).toHaveTextContent('Todos los géneros');
  });

  it('con una opción muestra su nombre', () => {
    setup(['g2']);
    expect(trigger()).toHaveTextContent('Poesía');
  });

  it('con varias muestra cuántas hay', () => {
    setup(['g1', 'g3']);
    expect(trigger()).toHaveTextContent('2 géneros');
  });

  it('marcar una opción la suma a las elegidas', async () => {
    const onChange = setup(['g1']);

    await userEvent.click(trigger());
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Poesía' }));

    expect(onChange).toHaveBeenCalledWith(['g1', 'g2']);
  });

  it('desmarcar una opción la quita', async () => {
    const onChange = setup(['g1', 'g2']);

    await userEvent.click(trigger());
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Novela' }));

    expect(onChange).toHaveBeenCalledWith(['g2']);
  });

  it('refleja cuáles están marcadas y el menú sigue abierto tras elegir', async () => {
    setup(['g3']);

    await userEvent.click(trigger());
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Novela' }));

    expect(screen.getByRole('menuitemcheckbox', { name: 'Ensayo' })).toBeChecked();
    expect(screen.getByRole('menuitemcheckbox', { name: 'Novela' })).toBeInTheDocument();
  });

  it('sin opciones lo avisa', async () => {
    setup([], []);

    await userEvent.click(trigger());

    expect(await screen.findByText('Sin opciones')).toBeInTheDocument();
  });
});
