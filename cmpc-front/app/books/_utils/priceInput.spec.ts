import { caretFor, cleanPriceInput, countSignificant, formatPriceInput } from './priceInput';

describe('cleanPriceInput', () => {
  it.each([
    ['', ''],
    ['$', ''],
    ['$12.990', '12990'],
    ['12a9b90', '12990'],
    ['007', '7'],
    ['0', '0'],
    [',', '0,'],
    ['$12.990,5', '12990,5'],
    ['1,234', '1,23'],
    ['1,2,3', '1,23'],
  ])('%j → %j', (text, expected) => {
    expect(cleanPriceInput(text)).toBe(expected);
  });
});

describe('formatPriceInput', () => {
  it.each([
    ['', ''],
    ['5', '$5'],
    ['999', '$999'],
    ['12990', '$12.990'],
    ['1234567', '$1.234.567'],
    ['12990,5', '$12.990,5'],
    ['12990.50', '$12.990,50'],
    ['0,', '$0,'],
  ])('%j → %j', (raw, expected) => {
    expect(formatPriceInput(raw)).toBe(expected);
  });
});

describe('countSignificant', () => {
  it('ignora el signo, los puntos y las letras', () => {
    expect(countSignificant('$12.990,5')).toBe(7);
    expect(countSignificant('$')).toBe(0);
  });
});

describe('caretFor', () => {
  it('deja el cursor tras el signo si no hay caracteres relevantes', () => {
    expect(caretFor('$12.990', 0)).toBe(1);
    expect(caretFor('', 0)).toBe(0);
  });

  it('salta los puntos de miles', () => {
    expect(caretFor('$12.990', 2)).toBe(3);
    expect(caretFor('$12.990', 3)).toBe(5);
  });

  it('al final queda al final', () => {
    expect(caretFor('$12.990', 5)).toBe(7);
    expect(caretFor('$12.990', 99)).toBe(7);
  });
});
