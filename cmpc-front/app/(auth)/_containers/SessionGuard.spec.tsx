import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSessionTimeout } from '../_hooks/useSessionTimeout';
import { SessionGuard } from './SessionGuard';

jest.mock('../_hooks/useSessionTimeout');

describe('SessionGuard', () => {
  const keepAlive = jest.fn();
  const logoutNow = jest.fn();

  const mockHook = (secondsLeft: number | null) =>
    jest.mocked(useSessionTimeout).mockReturnValue({ secondsLeft, keepAlive, logoutNow });

  beforeEach(() => {
    keepAlive.mockReset();
    logoutNow.mockReset();
  });

  it('sin aviso no muestra nada', () => {
    mockHook(null);
    render(<SessionGuard />);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('con aviso muestra el diálogo y conecta los botones', async () => {
    mockHook(25);
    render(<SessionGuard />);

    expect(screen.getByRole('alertdialog')).toHaveTextContent('25 segundos');

    await userEvent.click(screen.getByRole('button', { name: 'Seguir conectado' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(keepAlive).toHaveBeenCalledTimes(1);
    expect(logoutNow).toHaveBeenCalledTimes(1);
  });
});
