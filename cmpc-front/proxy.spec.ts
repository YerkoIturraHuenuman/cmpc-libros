/** @jest-environment node */
import { NextRequest } from 'next/server';
import { config, proxy } from './proxy';

const request = (cookie?: string) =>
  new NextRequest('http://localhost:3000/books', {
    headers: cookie ? { cookie } : {},
  });

describe('proxy', () => {
  it('redirige a /login si no hay cookie de sesión', () => {
    const response = proxy(request());

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/login');
  });

  it('deja pasar si existe la cookie', () => {
    const response = proxy(request('access_token=abc'));

    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('solo protege las rutas de libros', () => {
    expect(config.matcher).toEqual(['/books/:path*']);
  });
});
