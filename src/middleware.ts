import { NextResponse } from "next/server";
import type { NextRequest } from "next/request";
import { jwtVerify } from "jose";

const PUBLIC_ROUTES = ["/", "/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/_next") || pathname.startsWith("/api/health") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/agendar/");
  const sessionCookie = request.cookies.get("saas_auth_session")?.value;

  let session = null;
  if (sessionCookie) {
    try {
      const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "fallback_secret_32_caracteres_min");
      const { payload } = await jwtVerify(sessionCookie, secret);
      session = payload;
    } catch {}
  }

  if (session && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isPublic) return NextResponse.next();

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/health|_next/static|_next/image|favicon.ico).*)"],
};