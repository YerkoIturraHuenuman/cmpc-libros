import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import type { CatalogFormValues } from '../_utils/catalogSchema';
import { CatalogItemForm } from './CatalogItemForm';

function Harness(props: {
  onSubmit?: () => void;
  onCancel?: () => void;
  serverError?: string | null;
  isSubmitting?: boolean;
}) {
  const form = useForm<CatalogFormValues>({ defaultValues: { name: '' } });
  return (
    <CatalogItemForm
      form={form}
      label="autor"
      placeholder="Gabriel García Márquez"
      onSubmit={props.onSubmit ?? jest.fn()}
      onCancel={props.onCancel ?? jest.fn()}
      serverError={props.serverError ?? null}
      isSubmitting={props.isSubmitting ?? false}
    />
  );
}

describe('CatalogItemForm', () => {
  it('muestra el campo con su ejemplo y el botón con el nombre del tipo', () => {
    render(<Harness />);

    expect(screen.getByLabelText('Nombre')).toHaveAttribute('placeholder', 'Gabriel García Márquez');
    expect(screen.getByRole('button', { name: 'Crear autor' })).toBeEnabled();
  });

  it('envía y cancela', async () => {
    const onSubmit = jest.fn((event?: React.FormEvent) => event?.preventDefault());
    const onCancel = jest.fn();
    render(<Harness onSubmit={onSubmit} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole('button', { name: 'Crear autor' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onSubmit).toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalled();
  });

  it('muestra el error del servidor', () => {
    render(<Harness serverError="Ya existe" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Ya existe');
  });

  it('mientras guarda deshabilita el botón', () => {
    render(<Harness isSubmitting />);
    expect(screen.getByRole('button', { name: 'Guardando…' })).toBeDisabled();
  });
});
