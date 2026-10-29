import { AuditLog } from './AuditLog';

describe('AuditLog', () => {
  it('guarda quién hizo qué sobre qué entidad', () => {
    const createdAt = new Date('2026-01-01');
    const log = new AuditLog('l-1', 'u-1', 'DELETE', 'Book', 'b-1', { outcome: 'SUCCESS' }, createdAt);

    expect(log).toMatchObject({
      id: 'l-1',
      userId: 'u-1',
      action: 'DELETE',
      entity: 'Book',
      entityId: 'b-1',
      metadata: { outcome: 'SUCCESS' },
      createdAt,
    });
  });

  it('permite operaciones sin usuario (por ejemplo un login fallido)', () => {
    const log = new AuditLog('l-2', null, 'LOGIN', 'Auth', null, null, new Date());
    expect(log.userId).toBeNull();
  });
});
