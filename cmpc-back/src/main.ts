import { ConsoleLogger, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { setupSwagger } from './common/config/swagger';
import { parseTrustProxy } from './common/config/trust-proxy';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new ConsoleLogger({ json: isProduction, colors: !isProduction }),
  });
  const config = app.get(ConfigService);

  app.set('trust proxy', parseTrustProxy(config.get<string>('TRUST_PROXY')));
  app.disable('x-powered-by');

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cookieParser());

  app.enableCors({
    origin: (config.get<string>('CORS_ORIGIN') ?? 'http://localhost:3000')
      .split(',')
      .map((origin) => origin.trim()),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableShutdownHooks();
  if (config.get<string>('SWAGGER_ENABLED') !== 'false') {
    setupSwagger(app);
  }

  const port = config.get<number>('PORT') ?? 3001;
  await app.listen(port);
  Logger.log(`API lista en http://localhost:${port} (docs en /docs)`, 'Bootstrap');
}
void bootstrap();
