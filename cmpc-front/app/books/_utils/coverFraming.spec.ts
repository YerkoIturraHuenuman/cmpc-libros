import { COVER_ASPECT, framingStyle } from './coverFraming';

describe('framingStyle', () => {
  it('la imagen completa con proporción de portada llena el recuadro sin moverse', () => {
    expect(
      framingStyle({ x: 0, y: 0, width: 100, height: 100, imageAspect: COVER_ASPECT }),
    ).toEqual({ width: '100%', height: '100%', left: '0%', top: '0%' });
  });

  it('una foto más alta que el recuadro llena el ancho y recorta arriba y abajo por igual', () => {
    const style = framingStyle({ x: 0, y: 0, width: 100, height: 100, imageAspect: 0.5 });

    expect(parseFloat(style.width)).toBeCloseTo(100);
    expect(parseFloat(style.height)).toBeCloseTo(142.857, 2);
    expect(parseFloat(style.top)).toBeCloseTo(-21.4285, 2);
    expect(parseFloat(style.left)).toBeCloseTo(0);
  });

  it('una zona acercada escala y desplaza la imagen para mostrar solo esa zona', () => {
    const style = framingStyle({ x: 10, y: 20, width: 50, height: 40, imageAspect: COVER_ASPECT });

    expect(parseFloat(style.width)).toBeCloseTo(250);
    expect(parseFloat(style.height)).toBeCloseTo(250);
    expect(parseFloat(style.left)).toBeCloseTo(-37.5);
    expect(parseFloat(style.top)).toBeCloseTo(-50);
  });
});
