import {NextRequest, NextResponse} from 'next/server';
import {jwtVerify} from 'jose';

// Middleware для проверки JWT токена
export async function middleware(req: NextRequest) {
  try {
    // Секретный ключ для расшифровки JWT токена
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) throw new Error('JWT_SECRET not found in env');

    const secret = new TextEncoder().encode(JWT_SECRET);

    // Извлекаем куку с токеном
    const jwt = req.cookies.get('admjwt')?.value;

    // Проверяем, есть ли токен
    if (!jwt) {
      console.warn('\t[WARN] JWT Token not found in cookie');
      return;
    }

    const {payload} = await jwtVerify(jwt, secret);

    if (payload.version !== '2') {
      throw new Error('Fail to verify token version');
    }
    if (req.nextUrl.pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(err.message, err.stack);
    }
    // Если токен валидный, редирект на /dashboard
    if (!req.nextUrl.pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
