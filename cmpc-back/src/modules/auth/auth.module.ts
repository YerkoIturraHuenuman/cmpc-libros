import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import {
  PASSWORD_HASHER,
  SESSION_REPOSITORY,
  TOKEN_SERVICE,
} from '@/common/config/di-tokens';
import { UsersModule } from '../users/users.module';
import { Login } from './application/use-cases/Login';
import { Logout } from './application/use-cases/Logout';
import { RefreshToken } from './application/use-cases/RefreshToken';
import { AuthController } from './infrastructure/controllers/AuthController';
import { JwtAuthGuard } from './infrastructure/interceptors/guards/JwtAuthGuard';
import { SessionRepositoryPrisma } from './infrastructure/repositories/SessionRepositoryPrisma';
import { BcryptPasswordHasherService } from './infrastructure/services/BcryptPasswordHasherService';
import { JwtTokenService } from './infrastructure/services/JwtTokenService';

@Module({
  imports: [JwtModule.register({}), UsersModule],
  controllers: [AuthController],
  providers: [
    Login,
    RefreshToken,
    Logout,
    JwtTokenService,
    { provide: SESSION_REPOSITORY, useClass: SessionRepositoryPrisma },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasherService },
    { provide: TOKEN_SERVICE, useExisting: JwtTokenService },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AuthModule {}
