import { formatDate, formatPrice } from './format';

describe('format', () => {
  it('da formato de pesos chilenos', () => {
    expect(formatPrice(12990)).toMatch(/12\.990/);
    expect(formatPrice(12990)).toContain('$');
  });

  it('conserva hasta 2 decimales', () => {
    expect(formatPrice(100.5)).toMatch(/100,5/);
  });

  it('formatea fecha y hora con el año completo', () => {
    expect(formatDate('2026-10-28T12:30:00.000Z')).toMatch(/2026/);
  });
});
