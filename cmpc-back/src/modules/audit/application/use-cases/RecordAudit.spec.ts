import { Logger } from '@nestjs/common';
import type { AuditLogPort, NewAuditEntry } from '../../domain/ports/AuditLogPort';
import { RecordAudit } from './RecordAudit';

const entry: NewAuditEntry = {
  userId: 'u-1',
  action: 'CREATE',
  entity: 'Book',
  entityId: 'b-1',
  metadata: { outcome: 'SUCCESS' },
};

describe('RecordAudit', () => {
  const auditLog: jest.Mocked<AuditLogPort> = { record: jest.fn() };
  let log: jest.SpyInstance;
  let error: jest.SpyInstance;

  beforeEach(() => {
    log = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    error = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });
  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  it('guarda en la base y deja una línea JSON en el log', async () => {
    auditLog.record.mockResolvedValue(undefined);

    await new RecordAudit(auditLog).execute(entry);

    expect(auditLog.record).toHaveBeenCalledWith(entry);
    expect(JSON.parse(log.mock.calls[0][0] as string)).toMatchObject({
      action: 'CREATE',
      entity: 'Book',
      entityId: 'b-1',
    });
  });

  it('si la base falla, no propaga el error y lo deja en el log', async () => {
    auditLog.record.mockRejectedValue(new Error('db caída'));

    await expect(new RecordAudit(auditLog).execute(entry)).resolves.toBeUndefined();
    expect(error).toHaveBeenCalled();
  });

  it('tolera errores que no son instancias de Error', async () => {
    auditLog.record.mockRejectedValue('texto');

    await expect(new RecordAudit(auditLog).execute(entry)).resolves.toBeUndefined();
    expect(error).toHaveBeenCalledWith(expect.any(String), 'texto');
  });
});
