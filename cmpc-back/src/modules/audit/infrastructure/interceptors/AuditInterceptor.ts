import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { Observable, tap } from 'rxjs';
import type { AuthenticatedUser } from '@/common/dto/AuthenticatedUserDTO';
import { RecordAudit } from '../../application/use-cases/RecordAudit';
import { AUDIT_KEY, type AuditOptions } from './Audit';

type AuditedRequest = Request & { user?: AuthenticatedUser };

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly recordAudit: RecordAudit,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const options = this.reflector.get<AuditOptions | undefined>(
      AUDIT_KEY,
      context.getHandler(),
    );
    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<AuditedRequest>();

    return next.handle().pipe(
      tap({
        next: (result) => {
          void this.recordAudit.execute(
            this.buildEntry(options, request, 'SUCCESS', result),
          );
        },
        error: (error: unknown) => {
          const status = error instanceof HttpException ? error.getStatus() : 500;
          void this.recordAudit.execute(
            this.buildEntry(options, request, 'FAILED', undefined, status),
          );
        },
      }),
    );
  }

  private buildEntry(
    options: AuditOptions,
    request: AuditedRequest,
    outcome: 'SUCCESS' | 'FAILED',
    result?: unknown,
    errorStatus?: number,
  ) {
    const payload = this.unwrap(result);
    const params = request.params as Record<string, string | undefined>;
    const body = (request.body ?? {}) as Record<string, unknown>;

    const bodyFields = Object.fromEntries(
      (options.bodyFields ?? [])
        .filter((field) => body[field] !== undefined)
        .map((field) => [field, body[field]]),
    );

    return {
      userId: request.user?.userId ?? this.readUserId(payload),
      action: options.action,
      entity: options.entity,
      entityId: this.readId(payload) ?? params.id ?? null,
      metadata: {
        outcome,
        method: request.method,
        path: request.originalUrl,
        ip: request.ip ?? null,
        ...(errorStatus ? { errorStatus } : {}),
        ...bodyFields,
      },
    };
  }

  private unwrap(result: unknown): Record<string, unknown> | null {
    if (!result || typeof result !== 'object') return null;
    const record = result as Record<string, unknown>;
    const data = record.data;
    return data && typeof data === 'object' && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : record;
  }

  private readId(payload: Record<string, unknown> | null): string | null {
    return typeof payload?.id === 'string' ? payload.id : null;
  }

  private readUserId(payload: Record<string, unknown> | null): string | null {
    const user = payload?.user as { id?: unknown } | undefined;
    return typeof user?.id === 'string' ? user.id : null;
  }
}
