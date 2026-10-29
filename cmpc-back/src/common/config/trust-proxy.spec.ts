import { parseTrustProxy } from './trust-proxy';

describe('parseTrustProxy', () => {
  it.each([undefined, '', '  ', 'false'])('%p no confía en ningún proxy', (value) => {
    expect(parseTrustProxy(value)).toBe(false);
  });

  it('"true" confía en todos', () => {
    expect(parseTrustProxy('true')).toBe(true);
  });

  it('un número son los saltos de confianza', () => {
    expect(parseTrustProxy('1')).toBe(1);
    expect(parseTrustProxy(' 2 ')).toBe(2);
  });

  it('cualquier otra cosa se pasa tal cual (IPs, subredes, loopback)', () => {
    expect(parseTrustProxy('loopback, 10.0.0.0/8')).toBe('loopback, 10.0.0.0/8');
  });
});
