import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { authService } from '../../_services/authService';
import LoginPage from './page';

const mockReplace = jest.fn();
const mockRouter = { replace: mockReplace };
jest.mock('next/navigation', () => ({ useRouter: () => mockRouter }));
jest.mock('@/components/ShinyText', () => ({
  __esModule: true,
  default: ({ text }: { text: string }) => <span>{text}</span>,
}));
jest.mock('@/components/Lightfall', () => ({ __esModule: true, default: () => null }));
jest.mock('../../_services/authService');

describe('LoginPage', () => {
  beforeEach(() => jest.resetAllMocks());

  it('muestra el formulario de acceso', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { name: 'Bienvenido' })).toBeInTheDocument();
    expect(screen.getByText('CMPC Libros')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
  });

  it('iniciar sesión lleva a /books', async () => {
    jest.mocked(authService.login).mockResolvedValue({} as never);
    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText('Correo'), 'admin@cmpc.test');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Admin1234!');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/books'));
  });

  it('con datos inválidos muestra los errores', async () => {
    render(<LoginPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByText('Ingresa tu correo')).toBeInTheDocument();
    expect(screen.getByText('Ingresa tu contraseña')).toBeInTheDocument();
    expect(authService.login).not.toHaveBeenCalled();
  });
});
