import { HttpException, Logger } from '@nestjs/common';

type Details = Record<string, unknown>;

function describe(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

/** Registra los puntos clave de un flujo con el formato `[Clase][metodo][Request|Response|Error]`. */
export class FlowLogger {
  private readonly logger = new Logger();

  constructor(private readonly className: string) {}

  request(method: string, details?: Details): void {
    this.logger.log(this.format(method, 'Request', details));
  }

  response(method: string, details?: Details): void {
    this.logger.log(this.format(method, 'Response', details));
  }

  error(method: string, error: unknown, details?: Details): void {
    const message = describe(error);
    const line = this.format(method, 'Error', { ...details, message });
    if (error instanceof HttpException && error.getStatus() < 500) {
      this.logger.warn(line);
    } else {
      this.logger.error(line, error instanceof Error ? error.stack : undefined);
    }
  }

  /** Registra la entrada y la salida de `action`, y el error si falla (que se vuelve a lanzar). */
  async track<T>(
    method: string,
    details: Details | undefined,
    action: () => Promise<T>,
    summarize?: (result: T) => Details,
  ): Promise<T> {
    this.request(method, details);
    try {
      const result = await action();
      this.response(method, summarize?.(result));
      return result;
    } catch (error) {
      this.error(method, error, details);
      throw error;
    }
  }

  private format(method: string, phase: string, details?: Details): string {
    const tag = `[${this.className}][${method}][${phase}]`;
    return details ? `${tag} ${JSON.stringify(details)}` : tag;
  }
}
