import { render, screen } from '@testing-library/react';
import { BookCover } from './BookCover';

describe('BookCover', () => {
  it('muestra la portada con su texto alternativo', () => {
    render(<BookCover src="https://res.cloudinary.com/demo/portada.webp" title="Rayuela" />);

    expect(screen.getByAltText('Portada de Rayuela')).toBeInTheDocument();
  });

  it('sin imagen muestra el ícono de "sin portada"', () => {
    render(<BookCover src={null} title="Rayuela" />);

    expect(screen.getByLabelText('Sin portada')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /Portada de/ })).not.toBeInTheDocument();
  });

  it('aplica el tamaño recibido', () => {
    const { container } = render(<BookCover src={null} title="x" className="h-14 w-10" />);

    expect(container.firstChild).toHaveClass('h-14', 'w-10');
  });

  it('acepta un `sizes` propio para la imagen', () => {
    render(
      <BookCover src="https://res.cloudinary.com/demo/p.webp" title="Rayuela" sizes="50vw" />,
    );

    expect(screen.getByAltText('Portada de Rayuela')).toHaveAttribute('sizes', '50vw');
  });

  it('con un encuadre posiciona y escala la imagen para mostrar solo esa zona', () => {
    render(
      <BookCover
        src="blob:preview"
        title="Rayuela"
        framing={{ x: 10, y: 20, width: 50, height: 40, imageAspect: 5 / 7 }}
      />,
    );

    const style = screen.getByAltText('Portada de Rayuela').style;
    expect(parseFloat(style.width)).toBeCloseTo(250);
    expect(parseFloat(style.height)).toBeCloseTo(250);
    expect(parseFloat(style.left)).toBeCloseTo(-37.5);
    expect(parseFloat(style.top)).toBeCloseTo(-50);
  });
});
