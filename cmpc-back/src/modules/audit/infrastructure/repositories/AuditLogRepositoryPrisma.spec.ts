import type { PrismaService } from '@/common/database/prisma/PrismaService';
import { AuditLogRepositoryPrisma } from './AuditLogRepositoryPrisma';

jest.mock('@/common/database/prisma/PrismaService', () => ({
  PrismaService: class {},
}));

describe('AuditLogRepositoryPrisma', () => {
  const create = jest.fn().mockResolvedValue({});
  const repo = new AuditLogRepositoryPrisma({
    auditLog: { create },
  } as unknown as PrismaService);

  afterEach(() => create.mockClear());

  it('inserta la entrada con sus metadatos', async () => {
    await repo.record({
      userId: 'u-1',
      action: 'UPDATE',
      entity: 'Book',
      entityId: 'b-1',
      metadata: { outcome: 'SUCCESS' },
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        userId: 'u-1',
        action: 'UPDATE',
        entity: 'Book',
        entityId: 'b-1',
        metadata: { outcome: 'SUCCESS' },
      },
    });
  });

  it('omite metadata cuando es null', async () => {
    await repo.record({
      userId: null,
      action: 'LOGIN',
      entity: 'Auth',
      entityId: null,
      metadata: null,
    });

    expect(create.mock.calls[0][0].data.metadata).toBeUndefined();
  });
});
