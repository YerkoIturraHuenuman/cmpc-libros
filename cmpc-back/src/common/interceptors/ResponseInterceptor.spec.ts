import { CallHandler, ExecutionContext, StreamableFile } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { PaginatedResult } from '../dto/PaginatedResponseDTO';
import { ResponseInterceptor } from './ResponseInterceptor';

const run = (value: unknown) =>
  lastValueFrom(
    new ResponseInterceptor().intercept(
      {} as ExecutionContext,
      { handle: () => of(value) } as CallHandler,
    ),
  );

describe('ResponseInterceptor', () => {
  it('envuelve la respuesta en { success, data, timestamp }', async () => {
    const result = (await run({ id: 1 })) as Record<string, unknown>;

    expect(result).toMatchObject({ success: true, data: { id: 1 } });
    expect(typeof result.timestamp).toBe('string');
    expect(result).not.toHaveProperty('meta');
  });

  it('convierte undefined en data: null', async () => {
    expect(await run(undefined)).toMatchObject({ success: true, data: null });
  });

  it('separa items y meta en respuestas paginadas', async () => {
    const result = await run(new PaginatedResult(['a', 'b'], 25, 2, 10));

    expect(result).toMatchObject({
      success: true,
      data: ['a', 'b'],
      meta: { page: 2, limit: 10, total: 25, totalPages: 3 },
    });
  });

  it('no toca los archivos (StreamableFile)', async () => {
    const file = new StreamableFile(Buffer.from('x'));
    expect(await run(file)).toBe(file);
  });
});

describe('PaginatedResult', () => {
  it('calcula totalPages y nunca baja de 1', () => {
    expect(new PaginatedResult([], 0, 1, 10).totalPages).toBe(1);
    expect(new PaginatedResult([], 21, 1, 10).totalPages).toBe(3);
  });
});
