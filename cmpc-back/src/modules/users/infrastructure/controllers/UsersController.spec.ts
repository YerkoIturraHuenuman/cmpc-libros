import type { GetMyProfile } from '../../application/use-cases/GetMyProfile';
import { UsersController } from './UsersController';

describe('UsersController', () => {
  it('me() consulta el perfil con el id del token', async () => {
    const execute = jest.fn().mockResolvedValue({ id: 'u-1' });
    const controller = new UsersController({ execute } as unknown as GetMyProfile);

    const result = await controller.me({
      userId: 'u-1',
      sessionId: 's-1',
      role: 'USER',
    });

    expect(execute).toHaveBeenCalledWith('u-1');
    expect(result).toEqual({ id: 'u-1' });
  });
});
