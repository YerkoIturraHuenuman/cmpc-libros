import { parseDurationMs } from './duration';

describe('parseDurationMs', () => {
  it.each([
    ['30s', 30_000],
    ['15m', 900_000],
    ['2h', 7_200_000],
    ['7d', 604_800_000],
    [' 5m ', 300_000],
  ])('convierte %s a %d ms', (input, expected) => {
    expect(parseDurationMs(input)).toBe(expected);
  });

  it.each(['', '10', 'm', '5x', '-5m', '1.5h'])('rechaza "%s"', (input) => {
    expect(() => parseDurationMs(input)).toThrow('Duración inválida');
  });
});
