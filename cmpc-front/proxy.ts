import { NextResponse, type NextRequest } from 'next/server';

const ACCESS_COOKIE = 'access_token';
const LOGIN_PATH = '/login';

export function proxy(request: NextRequest) {
  if (!request.cookies.has(ACCESS_COOKIE)) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/books/:path*'],
};
