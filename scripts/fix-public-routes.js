// fix-public-routes.js
const fs = require("fs");
const path = require("path");

console.log("🔓 Liberando as rotas de Termos de Uso e Privacidade no Middleware...\n");

const targetPath = path.join(process.cwd(), "src/middleware.ts");

const code = `import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// LISTA OFICIAL DE ROTAS PÚBLICAS (NÃO PEDEM LOGIN)
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/termos",
  "/privacidade"
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Libera arquivos de sistema e assets
  if (
    pathname.startsWith("/_next") || 
    pathname.startsWith("/api/health") || 
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Libera páginas públicas ou links públicos de agendamento e auto-gestão do cliente
  const isPublic = 
    PUBLIC_ROUTES.includes(pathname) || 
    pathname.startsWith("/agendar/") || 
    pathname.startsWith("/manage-booking/");

  const sessionCookie = request.cookies.get("saas_auth_session")?.value;

  let session = null;
  if (sessionCookie) {
    try {
      const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "fallback_secret_32_caracteres_min");
      const { payload } = await jwtVerify(sessionCookie, secret);
      session = payload;
    } catch {}
  }

  // Se já estiver logado e tentar ir para login ou cadastro, vai direto para o dashboard
  if (session && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Se for rota pública, libera o acesso imediatamente
  if (isPublic) return NextResponse.next();

  // Se for rota protegida (Dashboard, CRM, etc.) e não estiver logado, redireciona para login
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/health|_next/static|_next/image|favicon.ico).*)"],
};`;

fs.writeFileSync(targetPath, code, "utf-8");
console.log("✓ Middleware atualizado com /termos e /privacidade liberados!");