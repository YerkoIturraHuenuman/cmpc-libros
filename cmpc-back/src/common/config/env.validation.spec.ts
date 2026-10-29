import { validateEnv } from './env.validation';

const valid = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_ACCESS_SECRET: 'a'.repeat(24),
  JWT_REFRESH_SECRET: 'b'.repeat(24),
};

describe('validateEnv', () => {
  it('devuelve la configuración cuando es válida', () => {
    expect(validateEnv(valid)).toBe(valid);
  });

  it('lista las variables que faltan', () => {
    expect(() => validateEnv({ ...valid, DATABASE_URL: '  ' })).toThrow(
      'DATABASE_URL',
    );
    expect(() => validateEnv({})).toThrow(
      /DATABASE_URL.*JWT_ACCESS_SECRET.*JWT_REFRESH_SECRET/,
    );
  });

  it('rechaza secretos demasiado cortos', () => {
    expect(() => validateEnv({ ...valid, JWT_ACCESS_SECRET: 'corto' })).toThrow(
      'al menos',
    );
  });

  it('rechaza usar el mismo secreto para access y refresh', () => {
    expect(() =>
      validateEnv({ ...valid, JWT_REFRESH_SECRET: valid.JWT_ACCESS_SECRET }),
    ).toThrow('distintos');
  });

  it.each(['0', '-1', 'abc', '1.5'])('rechaza THROTTLE_LIMIT=%p', (value) => {
    expect(() => validateEnv({ ...valid, THROTTLE_LIMIT: value })).toThrow('THROTTLE_LIMIT');
  });

  it('rechaza un DB_POOL_MAX inválido y acepta uno válido', () => {
    expect(() => validateEnv({ ...valid, DB_POOL_MAX: 'x' })).toThrow('DB_POOL_MAX');
    expect(validateEnv({ ...valid, DB_POOL_MAX: '20', THROTTLE_LIMIT: '200' })).toBeTruthy();
  });

  it('en producción exige CORS_ORIGIN', () => {
    expect(() => validateEnv({ ...valid, NODE_ENV: 'production' })).toThrow('CORS_ORIGIN');
    expect(() => validateEnv({ ...valid, NODE_ENV: 'production', CORS_ORIGIN: ' ' })).toThrow(
      'CORS_ORIGIN',
    );
    expect(
      validateEnv({ ...valid, NODE_ENV: 'production', CORS_ORIGIN: 'https://libros.cmpc.cl' }),
    ).toBeTruthy();
  });
});
