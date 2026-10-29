import { render, screen } from '@testing-library/react';
import NotFound from './not-found';

describe('NotFound', () => {
  it('explica que la página no existe y lleva a los libros', () => {
    render(<NotFound />);

    expect(screen.getByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir a los libros' })).toHaveAttribute('href', '/books');
  });
});
