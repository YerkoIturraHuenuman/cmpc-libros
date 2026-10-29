import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BooksPagination } from './BooksPagination';

const meta = (page: number, total = 25) => ({ page, limit: 10, total, totalPages: 3 });

function setup(props: Partial<React.ComponentProps<typeof BooksPagination>> = {}) {
  const onPage = jest.fn();
  const view = render(
    <BooksPagination meta={meta(2)} isLoading={false} onPage={onPage} {...props} />,
  );
  return { onPage, ...view };
}

describe('BooksPagination', () => {
  it('no se muestra sin datos', () => {
    const { container } = setup({ meta: null });
    expect(container).toBeEmptyDOMElement();
  });

  it('no se muestra si no hay libros', () => {
    const { container } = setup({ meta: meta(1, 0) });
    expect(container).toBeEmptyDOMElement();
  });

  it('muestra el rango y la página', () => {
    setup();

    expect(screen.getByText('Mostrando 11–20 de 25')).toBeInTheDocument();
    expect(screen.getByText('Página 2 de 3')).toBeInTheDocument();
  });

  it('en la última página el rango termina en el total', () => {
    setup({ meta: meta(3) });
    expect(screen.getByText('Mostrando 21–25 de 25')).toBeInTheDocument();
  });

  it('navega a la página anterior y a la siguiente', async () => {
    const { onPage } = setup();

    await userEvent.click(screen.getByRole('button', { name: /página anterior/i }));
    await userEvent.click(screen.getByRole('button', { name: /página siguiente/i }));

    expect(onPage).toHaveBeenNthCalledWith(1, 1);
    expect(onPage).toHaveBeenNthCalledWith(2, 3);
  });

  it('en la primera página no se puede retroceder', () => {
    setup({ meta: meta(1) });
    expect(screen.getByRole('button', { name: /página anterior/i })).toBeDisabled();
  });

  it('en la última página no se puede avanzar', () => {
    setup({ meta: meta(3) });
    expect(screen.getByRole('button', { name: /página siguiente/i })).toBeDisabled();
  });

  it('mientras carga deshabilita ambos botones', () => {
    setup({ isLoading: true });

    expect(screen.getByRole('button', { name: /página anterior/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /página siguiente/i })).toBeDisabled();
  });
});
