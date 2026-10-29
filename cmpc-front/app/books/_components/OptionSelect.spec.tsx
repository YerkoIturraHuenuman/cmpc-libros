import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OptionSelect } from './OptionSelect';

const options = [
  { value: 'g1', label: 'Novela' },
  { value: 'g2', label: 'Poesía' },
];

describe('OptionSelect', () => {
  it('muestra el placeholder sin valor', () => {
    render(<OptionSelect value="" onValueChange={jest.fn()} options={options} placeholder="Género" />);

    expect(screen.getByRole('combobox')).toHaveTextContent('Género');
  });

  it('muestra la opción elegida', () => {
    render(<OptionSelect value="g2" onValueChange={jest.fn()} options={options} placeholder="Género" />);

    expect(screen.getByRole('combobox')).toHaveTextContent('Poesía');
  });

  it('al elegir una opción avisa con su valor', async () => {
    const onValueChange = jest.fn();
    render(<OptionSelect value="" onValueChange={onValueChange} options={options} placeholder="Género" />);

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByRole('option', { name: 'Novela' }));

    expect(onValueChange).toHaveBeenCalledWith('g1');
  });

  it('con allLabel agrega la opción "todos" con el valor all', async () => {
    const onValueChange = jest.fn();
    render(
      <OptionSelect
        value="g1"
        onValueChange={onValueChange}
        options={options}
        placeholder="Género"
        allLabel="Todos los géneros"
      />,
    );

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByRole('option', { name: 'Todos los géneros' }));

    expect(onValueChange).toHaveBeenCalledWith('all');
  });

  it('sin allLabel no ofrece la opción "todos"', async () => {
    render(<OptionSelect value="" onValueChange={jest.fn()} options={options} placeholder="Género" />);

    await userEvent.click(screen.getByRole('combobox'));

    expect(await screen.findAllByRole('option')).toHaveLength(2);
  });

  it('marca el campo como inválido', () => {
    render(<OptionSelect value="" onValueChange={jest.fn()} options={options} placeholder="Género" invalid />);

    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('acepta un nombre accesible', () => {
    render(
      <OptionSelect
        value=""
        onValueChange={jest.fn()}
        options={options}
        placeholder="Género"
        ariaLabel="Campo de orden"
      />,
    );

    expect(screen.getByRole('combobox', { name: 'Campo de orden' })).toBeInTheDocument();
  });
});
