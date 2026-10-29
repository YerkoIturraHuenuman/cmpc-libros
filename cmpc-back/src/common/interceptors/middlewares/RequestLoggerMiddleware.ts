import { randomUUID } from 'node:crypto';
import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import type { AuthenticatedUser } from '../../dto/AuthenticatedUserDTO';

export const REQUEST_ID_HEADER = 'X-Request-Id';
const VALID_REQUEST_ID = /^[\w.-]{8,64}$/;

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const startedAt = Date.now();
    const incoming = req.headers['x-request-id'];
    const requestId =
      typeof incoming === 'string' && VALID_REQUEST_ID.test(incoming)
        ? incoming
        : randomUUID();
    res.setHeader(REQUEST_ID_HEADER, requestId);

    res.on('finish', () => {
      const user = (req as Request & { user?: AuthenticatedUser }).user;
      const who = user ? ` user=${user.userId}` : '';
      this.logger.log(
        `${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startedAt}ms id=${requestId}${who}`,
      );
    });

    next();
  }
}
