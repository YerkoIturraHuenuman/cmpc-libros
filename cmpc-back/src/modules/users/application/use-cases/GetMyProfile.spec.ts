import { NotFoundException } from '@nestjs/common';
import { User } from '../../domain/entities/User';
import type { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { GetMyProfile } from './GetMyProfile';

describe('GetMyProfile', () => {
  const users: jest.Mocked<UserRepositoryPort> = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
  };
  const useCase = new GetMyProfile(users);

  it('devuelve el perfil sin el hash de la contraseña', async () => {
    users.findById.mockResolvedValue(
      new User('1', 'a@b.cl', 'Ana', 'USER', 'secret-hash', new Date('2026-01-01')),
    );

    const profile = await useCase.execute('1');

    expect(profile).toMatchObject({ id: '1', email: 'a@b.cl', name: 'Ana', role: 'USER' });
    expect(profile).not.toHaveProperty('passwordHash');
  });

  it('lanza NotFound si el usuario no existe', async () => {
    users.findById.mockResolvedValue(null);
    await expect(useCase.execute('x')).rejects.toBeInstanceOf(NotFoundException);
  });
});
