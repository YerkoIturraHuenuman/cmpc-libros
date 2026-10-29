import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { validateEnv } from './common/config/env.validation';
import { PrismaModule } from './common/database/prisma/prisma.module';
import { AllExceptionsFilter } from './common/filters/AllExceptionsFilter';
import { ResponseInterceptor } from './common/interceptors/ResponseInterceptor';
import { RequestLoggerMiddleware } from './common/interceptors/middlewares/RequestLoggerMiddleware';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { BooksModule } from './modules/books/books.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          { ttl: 60_000, limit: Number(config.get<string>('THROTTLE_LIMIT') ?? 120) },
        ],
      }),
    }),
    PrismaModule,
    AuditModule,
    UsersModule,
    AuthModule,
    CatalogModule,
    BooksModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*path');
  }
}
