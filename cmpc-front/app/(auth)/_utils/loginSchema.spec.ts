import { loginSchema } from './loginSchema';

describe('loginSchema', () => {
  it('acepta credenciales válidas', () => {
    expect(loginSchema.safeParse({ email: 'a@b.cl', password: 'x' }).success).toBe(true);
  });

  it('rechaza un email mal formado', () => {
    expect(loginSchema.safeParse({ email: 'no-es-email', password: 'x' }).success).toBe(false);
  });

  it('rechaza una contraseña vacía', () => {
    expect(loginSchema.safeParse({ email: 'a@b.cl', password: '' }).success).toBe(false);
  });
});
