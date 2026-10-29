import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { PaginatedResult } from '../dto/PaginatedResponseDTO';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((result: unknown) => {
        if (result instanceof StreamableFile) {
          return result;
        }

        const timestamp = new Date().toISOString();

        if (result instanceof PaginatedResult) {
          return {
            success: true,
            data: result.items,
            meta: {
              page: result.page,
              limit: result.limit,
              total: result.total,
              totalPages: result.totalPages,
            },
            timestamp,
          };
        }

        return { success: true, data: result ?? null, timestamp };
      }),
    );
  }
}
