import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PriceInput } from './PriceInput';

function Harness({ initial = '', onValue }: { initial?: string; onValue?: (v: string) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <PriceInput
      aria-label="Precio"
      value={value}
      onChange={(next) => {
        setValue(next);
        onValue?.(next);
      }}
    />
  );
}

describe('PriceInput', () => {
  it('muestra el precio en pesos mientras se escribe y entrega el número crudo', async () => {
    const onValue = jest.fn();
    render(<Harness onValue={onValue} />);
    const input = screen.getByLabelText('Precio');

    await userEvent.type(input, '12990');

    expect(input).toHaveValue('$12.990');
    expect(onValue).toHaveBeenLastCalledWith('12990');
  });

  it('acepta decimales con coma y descarta letras', async () => {
    const onValue = jest.fn();
    render(<Harness onValue={onValue} />);

    await userEvent.type(screen.getByLabelText('Precio'), '1a2,50');

    expect(screen.getByLabelText('Precio')).toHaveValue('$12,50');
    expect(onValue).toHaveBeenLastCalledWith('12,50');
  });

  it('formatea el valor inicial', () => {
    render(<Harness initial="1234567" />);
    expect(screen.getByLabelText('Precio')).toHaveValue('$1.234.567');
  });

  it('al borrar todo queda vacío', async () => {
    render(<Harness initial="5" />);

    await userEvent.type(screen.getByLabelText('Precio'), '{Backspace}');

    expect(screen.getByLabelText('Precio')).toHaveValue('');
  });
});
