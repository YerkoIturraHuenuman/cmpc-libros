import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionTimeoutDialog } from './SessionTimeoutDialog';

function setup(secondsLeft: number | null) {
  const onKeepAlive = jest.fn();
  const onLogout = jest.fn();
  render(
    <SessionTimeoutDialog secondsLeft={secondsLeft} onKeepAlive={onKeepAlive} onLogout={onLogout} />,
  );
  return { onKeepAlive, onLogout };
}

describe('SessionTimeoutDialog', () => {
  it('no se muestra sin aviso', () => {
    setup(null);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('muestra la cuenta regresiva', () => {
    setup(42);
    expect(screen.getByRole('alertdialog')).toHaveTextContent('se cerrará en 42 segundos');
  });

  it('usa el singular con un segundo', () => {
    setup(1);
    expect(screen.getByRole('alertdialog')).toHaveTextContent('en 1 segundo.');
  });

  it('«Seguir conectado» renueva', async () => {
    const { onKeepAlive, onLogout } = setup(30);

    await userEvent.click(screen.getByRole('button', { name: 'Seguir conectado' }));

    expect(onKeepAlive).toHaveBeenCalled();
    expect(onLogout).not.toHaveBeenCalled();
  });

  it('«Cerrar sesión» cierra', async () => {
    const { onKeepAlive, onLogout } = setup(30);

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(onLogout).toHaveBeenCalled();
    expect(onKeepAlive).not.toHaveBeenCalled();
  });
});
