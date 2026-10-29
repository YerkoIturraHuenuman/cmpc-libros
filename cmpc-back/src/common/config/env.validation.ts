const REQUIRED = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
] as const;

const MIN_SECRET_LENGTH = 16;

export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const missing = REQUIRED.filter(
    (key) => typeof config[key] !== 'string' || config[key].trim() === '',
  );
  if (missing.length > 0) {
    throw new Error(`Faltan variables de entorno: ${missing.join(', ')}`);
  }

  for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']) {
    if ((config[key] as string).length < MIN_SECRET_LENGTH) {
      throw new Error(
        `${key} debe tener al menos ${MIN_SECRET_LENGTH} caracteres`,
      );
    }
  }

  for (const key of ['THROTTLE_LIMIT', 'DB_POOL_MAX']) {
    const value = config[key];
    if (value !== undefined && value !== '' && !/^[1-9]\d*$/.test(String(value))) {
      throw new Error(`${key} debe ser un entero positivo`);
    }
  }

  if (
    config.NODE_ENV === 'production' &&
    (typeof config.CORS_ORIGIN !== 'string' || config.CORS_ORIGIN.trim() === '')
  ) {
    throw new Error('CORS_ORIGIN es obligatorio en producción');
  }

  if (config.JWT_ACCESS_SECRET === config.JWT_REFRESH_SECRET) {
    throw new Error('JWT_ACCESS_SECRET y JWT_REFRESH_SECRET deben ser distintos');
  }

  return config;
}
