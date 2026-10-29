import { Module } from '@nestjs/common';
import { USER_REPOSITORY } from '@/common/config/di-tokens';
import { GetMyProfile } from './application/use-cases/GetMyProfile';
import { UsersController } from './infrastructure/controllers/UsersController';
import { UserRepositoryPrisma } from './infrastructure/repositories/UserRepositoryPrisma';

@Module({
  controllers: [UsersController],
  providers: [
    GetMyProfile,
    { provide: USER_REPOSITORY, useClass: UserRepositoryPrisma },
  ],
  exports: [USER_REPOSITORY],
})
export class UsersModule {}
