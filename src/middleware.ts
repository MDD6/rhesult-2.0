import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/painel", "/admin", "/assets", "/banco-talentos", "/vagas"];
const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout"];

function isStaticPath(pathname: string) {
  return pathname.startsWith("/_next") || /\.[^/]+$/.test(pathname);
}

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((publicPath) => pathname === publicPath || pathname.startsWith(`${publicPath}/`));
}

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get("rhesult_token")?.value;

  if (isStaticPath(pathname) || isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (isProtectedPath(pathname) && !token) {
    const next = `${pathname}${search}`;
    const loginUrl = new URL(`/login?next=${encodeURIComponent(next)}`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/dashboard/:path*", "/painel/:path*", "/admin/:path*", "/assets/:path*", "/banco-talentos/:path*", "/vagas/:path*", "/api/auth/:path*"],
};
