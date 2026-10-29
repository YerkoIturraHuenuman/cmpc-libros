import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import type { LoginValues } from '../../../_utils/loginSchema';
import { LoginForm } from './LoginForm';

function Harness(props: {
  onSubmit?: () => void;
  serverError?: string | null;
  isSubmitting?: boolean;
  isReady?: boolean;
}) {
  const form = useForm<LoginValues>({ defaultValues: { email: '', password: '' } });
  return (
    <LoginForm
      form={form}
      onSubmit={props.onSubmit ?? jest.fn()}
      serverError={props.serverError ?? null}
      isSubmitting={props.isSubmitting ?? false}
      isReady={props.isReady ?? true}
    />
  );
}

describe('LoginForm', () => {
  it('muestra los campos de correo y contraseña', () => {
    render(<Harness />);

    expect(screen.getByLabelText('Correo')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeEnabled();
  });

  it('permite escribir', async () => {
    render(<Harness />);

    await userEvent.type(screen.getByLabelText('Correo'), 'a@b.cl');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secreta');

    expect(screen.getByLabelText('Correo')).toHaveValue('a@b.cl');
    expect(screen.getByLabelText('Contraseña')).toHaveValue('secreta');
  });

  it('enviar el formulario llama a onSubmit', async () => {
    const onSubmit = jest.fn((event?: React.FormEvent) => event?.preventDefault());
    render(<Harness onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(onSubmit).toHaveBeenCalled();
  });

  it('muestra el error del servidor', () => {
    render(<Harness serverError="Correo o contraseña incorrectos" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos');
  });

  it('antes de hidratar no se puede enviar y nunca va por GET', () => {
    const { container } = render(<Harness isReady={false} />);

    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeDisabled();
    expect(container.querySelector('form')).toHaveAttribute('method', 'post');
  });

  it('mientras envía deshabilita el botón', () => {
    render(<Harness isSubmitting />);
    expect(screen.getByRole('button', { name: 'Ingresando…' })).toBeDisabled();
  });
});
