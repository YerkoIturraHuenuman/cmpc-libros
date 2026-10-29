import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorPage from './error';

describe('ErrorPage', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => consoleError.mockRestore());

  it('avisa del error y permite reintentar', async () => {
    const reset = jest.fn();
    render(<ErrorPage error={new Error('boom')} reset={reset} />);

    expect(screen.getByRole('heading', { name: 'Algo salió mal' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('registra el error en la consola', () => {
    const error = new Error('boom');
    render(<ErrorPage error={error} reset={jest.fn()} />);

    expect(consoleError).toHaveBeenCalledWith(error);
  });

  it('muestra el código (digest) para que soporte pueda rastrearlo', () => {
    render(<ErrorPage error={Object.assign(new Error('x'), { digest: 'abc123' })} reset={jest.fn()} />);

    expect(screen.getByText('abc123')).toBeInTheDocument();
  });

  it('sin digest no muestra código', () => {
    const { container } = render(<ErrorPage error={new Error('x')} reset={jest.fn()} />);

    expect(container.querySelector('code')).toBeNull();
  });
});
