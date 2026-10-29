import { fireEvent, render, screen } from '@testing-library/react';
import { AuthLayout } from './AuthLayout';

jest.mock('@/components/ShinyText', () => ({
  __esModule: true,
  default: ({ text }: { text: string }) => <span>{text}</span>,
}));
jest.mock('@/components/Lightfall', () => ({ __esModule: true, default: () => <div data-testid="background" /> }));

describe('AuthLayout', () => {
  it('muestra la marca, el título, la descripción, el contenido y el pie', () => {
    render(
      <AuthLayout title="Bienvenido" description="Ingresa con tu cuenta">
        <p>formulario</p>
      </AuthLayout>,
    );

    expect(screen.getByText('CMPC Libros')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Bienvenido' })).toBeInTheDocument();
    expect(screen.getByText('Ingresa con tu cuenta')).toBeInTheDocument();
    expect(screen.getByText('formulario')).toBeInTheDocument();
    expect(screen.getByText('© 2026 CMPC Libros')).toBeInTheDocument();
  });

  it('el panel derecho es solo el fondo animado y está oculto a lectores de pantalla', () => {
    render(
      <AuthLayout title="Bienvenido" description="x">
        <p>formulario</p>
      </AuthLayout>,
    );

    const panel = screen.getByTestId('background').closest('aside');
    expect(panel).toHaveAttribute('aria-hidden', 'true');
    expect(panel?.textContent).toBe('');
    expect(panel?.children).toHaveLength(1);
  });

  describe('clics y el fondo animado', () => {
    const onWindowPointerDown = jest.fn();

    beforeEach(() => {
      onWindowPointerDown.mockClear();
      window.addEventListener('pointerdown', onWindowPointerDown);
    });
    afterEach(() => window.removeEventListener('pointerdown', onWindowPointerDown));

    it('un clic sobre el formulario no llega al fondo', () => {
      render(
        <AuthLayout title="CMPC Libros" description="x">
          <button>dentro</button>
        </AuthLayout>,
      );

      fireEvent.pointerDown(screen.getByRole('button', { name: 'dentro' }));

      expect(onWindowPointerDown).not.toHaveBeenCalled();
    });

    it('un clic fuera de la tarjeta sí llega al fondo', () => {
      render(
        <AuthLayout title="CMPC Libros" description="x">
          <p>formulario</p>
        </AuthLayout>,
      );

      fireEvent.pointerDown(screen.getByTestId('background'));

      expect(onWindowPointerDown).toHaveBeenCalledTimes(1);
    });
  });
});
