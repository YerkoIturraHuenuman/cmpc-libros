import type { SessionRepositoryPort } from '../../domain/ports/SessionRepositoryPort';
import { Logout } from './Logout';

describe('Logout', () => {
  it('revoca la sesión indicada', async () => {
    const revoke = jest.fn().mockResolvedValue(undefined);
    const logout = new Logout({ revoke } as unknown as SessionRepositoryPort);

    await logout.execute('s-1');

    expect(revoke).toHaveBeenCalledWith('s-1');
  });
});
