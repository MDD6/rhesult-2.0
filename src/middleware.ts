import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/login"];
const PUBLIC_PREFIXES = ["/api/auth/login", "/api/auth/logout", "/api/public", "/api/vagas"];

function isStaticPath(pathname: string) {
  return pathname.startsWith("/_next") || /\.[^/]+$/.test(pathname);
}

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.some((publicPath) => pathname === publicPath)) {
    return true;
  }

  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isApiPath(pathname: string) {
  return pathname.startsWith("/api");
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get("rhesult_token")?.value;

  if (isStaticPath(pathname) || isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!token) {
    if (isApiPath(pathname)) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const next = `${pathname}${search}`;
    const loginUrl = new URL(`/login?next=${encodeURIComponent(next)}`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
