import { Session } from './Session';

const HOUR = 60 * 60 * 1000;

const make = (expiresAt: Date, revokedAt: Date | null = null) =>
  new Session('s-1', 'u-1', 'hash', null, null, expiresAt, revokedAt, new Date());

describe('Session.isActive', () => {
  it('está activa si no expiró ni fue revocada', () => {
    expect(make(new Date(Date.now() + HOUR)).isActive()).toBe(true);
  });

  it('no está activa si expiró', () => {
    expect(make(new Date(Date.now() - HOUR)).isActive()).toBe(false);
  });

  it('no está activa si fue revocada', () => {
    expect(make(new Date(Date.now() + HOUR), new Date()).isActive()).toBe(false);
  });

  it('acepta una fecha de referencia', () => {
    const session = make(new Date('2026-01-02T00:00:00Z'));
    expect(session.isActive(new Date('2026-01-01T00:00:00Z'))).toBe(true);
    expect(session.isActive(new Date('2026-01-03T00:00:00Z'))).toBe(false);
  });
});
