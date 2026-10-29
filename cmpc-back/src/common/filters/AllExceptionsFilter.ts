import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface NormalizedError {
  statusCode: number;
  error: string;
  message: string | string[];
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, error, message } = this.normalize(exception);

    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.originalUrl} -> ${statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.originalUrl} -> ${statusCode}`,
      );
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      error,
      message,
      path: request.originalUrl,
      requestId: response.getHeader('X-Request-Id'),
      timestamp: new Date().toISOString(),
    });
  }

  private normalize(exception: unknown): NormalizedError {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        return { statusCode, error: exception.name, message: body };
      }
      const { message, error } = body as {
        message?: string | string[];
        error?: string;
      };
      return {
        statusCode,
        error: error ?? exception.name,
        message: message ?? exception.message,
      };
    }

    const prismaError = this.fromPrisma(exception);
    if (prismaError) {
      return prismaError;
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'Ocurrió un error inesperado',
    };
  }

  private fromPrisma(exception: unknown): NormalizedError | null {
    const code = (exception as { code?: unknown })?.code;
    if (
      (exception as { name?: unknown })?.name !==
        'PrismaClientKnownRequestError' ||
      typeof code !== 'string'
    ) {
      return null;
    }

    switch (code) {
      case 'P2002':
        return {
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
          message: 'Ya existe un registro con esos datos',
        };
      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Not Found',
          message: 'Registro no encontrado',
        };
      case 'P2003':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message: 'Referencia a un registro que no existe',
        };
      default:
        return null;
    }
  }
}
