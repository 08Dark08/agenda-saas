// build-project.js
const fs = require("fs");
const path = require("path");

console.log("🚀 Iniciando extração e geração da base do SaaS...\n");

const files = {
  // 1. CONFIGURAÇÕES & DEPENDÊNCIAS
  "package.json": JSON.stringify({
    name: "saas-scheduling-platform",
    version: "1.0.0",
    private: true,
    scripts: {
      dev: "next dev",
      build: "prisma generate && next build",
      start: "next start",
      lint: "next lint",
      "prisma:generate": "prisma generate",
      "prisma:migrate": "prisma migrate dev",
      "prisma:seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts",
      test: "jest --runInBand"
    },
    dependencies: {
      "@hookform/resolvers": "^3.9.0",
      "@prisma/client": "^5.21.1",
      "@tanstack/react-query": "^5.59.0",
      "bcryptjs": "^2.4.3",
      "class-variance-authority": "^0.7.0",
      "clsx": "^2.1.1",
      "date-fns": "^4.1.0",
      "date-fns-tz": "^3.2.0",
      "jose": "^5.9.6",
      "lucide-react": "^0.453.0",
      "next": "14.2.15",
      "react": "^18.3.1",
      "react-dom": "^18.3.1",
      "react-hook-form": "^7.53.0",
      "resend": "^4.0.0",
      "tailwind-merge": "^2.5.4",
      "tailwindcss-animate": "^1.0.7",
      "zod": "^3.23.8"
    },
    devDependencies: {
      "@types/bcryptjs": "^2.4.6",
      "@types/node": "^20.16.11",
      "@types/react": "^18.3.11",
      "@types/react-dom": "^18.3.0",
      "eslint": "^8.57.1",
      "eslint-config-next": "14.2.15",
      "postcss": "^8.4.47",
      "prisma": "^5.21.1",
      "tailwindcss": "^3.4.13",
      "ts-node": "^10.9.2",
      "typescript": "^5.6.3"
    }
  }, null, 2),

  "tsconfig.json": JSON.stringify({
    compilerOptions: {
      lib: ["dom", "dom.iterable", "esnext"],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: "esnext",
      moduleResolution: "bundler",
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: "preserve",
      incremental: true,
      plugins: [{ name: "next" }],
      paths: { "@/*": ["./src/*"] }
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    exclude: ["node_modules"]
  }, null, 2),

  "tailwind.config.ts": `import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: {} },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;`,

  "postcss.config.js": `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`,

  "next.config.mjs": `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};
export default nextConfig;`,

  ".env": `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/scheduling_saas?schema=public"
AUTH_SECRET="chave_super_secreta_com_mais_de_32_caracteres_gerada"
ENCRYPTION_KEY="chave_de_exatos_32_caracteres!"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
RESEND_API_KEY=""
EMAIL_FROM="agendamentos@seudominio.com"
ASAAS_API_KEY=""
ASAAS_ENVIRONMENT="sandbox"
ASAAS_WEBHOOK_TOKEN="token_do_webhook"`,

  "docker-compose.yml": `version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    container_name: saas_postgres
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: scheduling_saas
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:`,

  // 2. PRISMA SCHEMA & SEED
  "prisma/schema.prisma": `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum UserRole {
  SUPER_ADMIN
  OWNER
  ADMIN
  PROFESSIONAL
  STAFF
}

enum PlanTier {
  FREE
  BASIC
  PRO
  PREMIUM
  ENTERPRISE
}

enum SubscriptionStatus {
  TRIALING
  ACTIVE
  PAST_DUE
  CANCELED
  UNPAID
}

enum AppointmentStatus {
  PENDING
  CONFIRMED
  WAITING_PAYMENT
  PAID
  CANCELLED
  RESCHEDULED
  COMPLETED
  NO_SHOW
}

enum PaymentStatus {
  NOT_REQUESTED
  PENDING
  AUTHORIZED
  PAID
  FAILED
  REFUNDED
  EXPIRED
}

enum PaymentGateway {
  STRIPE
  ASAAS
  MERCADO_PAGO
}

enum PaymentRequirement {
  NONE
  FULL_UPFRONT
  FIXED_DEPOSIT
  PERCENTAGE_DEPOSIT
}

enum NotificationChannel {
  WHATSAPP
  EMAIL
  INTERNAL
}

enum NotificationStatus {
  PENDING
  SENT
  DELIVERED
  FAILED
}

enum DayOfWeek {
  MONDAY
  TUESDAY
  WEDNESDAY
  THURSDAY
  FRIDAY
  SATURDAY
  SUNDAY
}

model Organization {
  id                String       @id @default(uuid())
  slug              String       @unique
  name              String
  legalName         String?
  document          String?
  phone             String
  email             String
  timezone          String       @default("America/Sao_Paulo")
  currency          String       @default("BRL")
  isActive          Boolean      @default(true)
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  members           OrganizationMember[]
  professionals     Professional[]
  services          Service[]
  clients           Client[]
  appointments      Appointment[]
  publicSettings    PublicBookingSettings?
  subscription      Subscription?
  payments          Payment[]
  auditLogs         AuditLog[]
  whatsAppConfig    WhatsAppConnection?
  notificationLogs  NotificationLog[]

  @@index([slug])
  @@index([isActive])
}

model User {
  id                String       @id @default(uuid())
  email             String       @unique
  passwordHash      String
  fullName          String
  phone             String?
  avatarUrl         String?
  isSuperAdmin      Boolean      @default(false)
  isActive          Boolean      @default(true)
  emailVerifiedAt   DateTime?
  resetToken        String?
  resetTokenExpires DateTime?
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  memberships       OrganizationMember[]
  auditLogs         AuditLog[]

  @@index([email])
}

model OrganizationMember {
  id              String       @id @default(uuid())
  organizationId  String
  userId          String
  role            UserRole     @default(STAFF)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user            User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  professional    Professional?

  @@unique([organizationId, userId])
  @@index([organizationId])
  @@index([userId])
}

model Plan {
  id                String         @id @default(uuid())
  tier              PlanTier       @unique
  name              String
  description       String
  monthlyPriceCents Int
  annualPriceCents  Int
  maxProfessionals  Int            @default(1)
  maxAppointmentsMo Int            @default(100)
  maxClients        Int            @default(200)
  hasWhatsApp       Boolean        @default(false)
  hasGoogleCalendar Boolean        @default(false)
  hasOnlinePayment  Boolean        @default(false)
  hasCustomDomain   Boolean        @default(false)
  isActive          Boolean        @default(true)
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  subscriptions     Subscription[]
}

model Subscription {
  id                   String             @id @default(uuid())
  organizationId       String             @unique
  planId               String
  status               SubscriptionStatus @default(TRIALING)
  currentPeriodStart   DateTime
  currentPeriodEnd     DateTime
  cancelAtPeriodEnd    Boolean            @default(false)
  externalCustomerId   String?
  externalSubscriptionId String?
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt

  organization         Organization       @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  plan                 Plan               @relation(fields: [planId], references: [id])

  @@index([organizationId])
  @@index([status])
}

model Professional {
  id              String             @id @default(uuid())
  organizationId  String
  memberId        String             @unique
  name            String
  bio             String?
  avatarUrl       String?
  specialty       String?
  registrationId  String?
  phone           String?
  color           String             @default("#3B82F6")
  isActive        Boolean            @default(true)
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  organization    Organization       @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  member          OrganizationMember @relation(fields: [memberId], references: [id], onDelete: Cascade)
  services        ServiceProfessional[]
  availabilities  WeeklyAvailability[]
  exceptions      AvailabilityException[]
  appointments    Appointment[]
  calendarSync    CalendarConnection?

  @@index([organizationId])
  @@index([isActive])
}

model Service {
  id                   String                @id @default(uuid())
  organizationId       String
  name                 String
  description          String?
  durationMinutes      Int
  bufferMinutes        Int                   @default(10)
  priceCents           Int
  promotionalPriceCents Int?
  color                String                @default("#10B981")
  isActive             Boolean               @default(true)
  allowOnlineBooking   Boolean               @default(true)
  paymentRequirement   PaymentRequirement    @default(NONE)
  depositValueCents    Int?
  createdAt            DateTime              @default(now())
  updatedAt            DateTime              @updatedAt

  organization         Organization          @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  professionals        ServiceProfessional[]
  appointments         Appointment[]

  @@index([organizationId])
  @@index([isActive])
}

model ServiceProfessional {
  serviceId      String
  professionalId String

  service        Service      @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  professional   Professional @relation(fields: [professionalId], references: [id], onDelete: Cascade)

  @@id([serviceId, professionalId])
}

model WeeklyAvailability {
  id             String       @id @default(uuid())
  professionalId String
  dayOfWeek      DayOfWeek
  startTime      String
  endTime        String
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  professional   Professional @relation(fields: [professionalId], references: [id], onDelete: Cascade)

  @@index([professionalId, dayOfWeek])
}

model AvailabilityException {
  id             String       @id @default(uuid())
  professionalId String
  date           DateTime     @db.Date
  startTime      String?
  endTime        String?
  isBlocked      Boolean      @default(true)
  reason         String?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  professional   Professional @relation(fields: [professionalId], references: [id], onDelete: Cascade)

  @@index([professionalId, date])
}

model Client {
  id                   String        @id @default(uuid())
  organizationId       String
  fullName             String
  phone                String
  email                String?
  birthDate            DateTime?     @db.Date
  notes                String?
  communicationConsent Boolean       @default(true)
  createdAt            DateTime      @default(now())
  updatedAt            DateTime      @updatedAt

  organization         Organization  @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  appointments         Appointment[]

  @@unique([organizationId, phone])
  @@index([organizationId])
  @@index([fullName])
}

model Appointment {
  id                  String             @id @default(uuid())
  organizationId      String
  professionalId      String
  serviceId           String
  clientId            String
  startTime           DateTime           @db.Timestamptz
  endTime             DateTime           @db.Timestamptz
  slotKey             String
  status              AppointmentStatus  @default(CONFIRMED)
  totalPriceCents     Int
  depositAmountCents  Int                @default(0)
  isOnlineMeeting     Boolean            @default(false)
  meetingUrl          String?
  notes               String?
  cancellationReason  String?
  cancelledAt         DateTime?
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt

  organization        Organization       @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  professional        Professional       @relation(fields: [professionalId], references: [id])
  service             Service            @relation(fields: [serviceId], references: [id])
  client              Client             @relation(fields: [clientId], references: [id])
  payment             Payment?
  bookingToken        BookingToken?
  notificationLogs    NotificationLog[]

  @@unique([slotKey, status])
  @@index([organizationId, startTime])
  @@index([professionalId, startTime])
  @@index([clientId])
  @@index([status])
}

model BookingToken {
  id            String       @id @default(uuid())
  token         String       @unique
  appointmentId String       @unique
  expiresAt     DateTime
  createdAt     DateTime     @default(now())

  appointment   Appointment  @relation(fields: [appointmentId], references: [id], onDelete: Cascade)

  @@index([token])
}

model Payment {
  id                   String         @id @default(uuid())
  organizationId       String
  appointmentId        String         @unique
  gateway              PaymentGateway
  amountCents          Int
  status               PaymentStatus  @default(PENDING)
  externalInvoiceId    String?
  externalPaymentId    String?
  pixQrCodeText        String?
  pixQrCodeBase64      String?
  paymentUrl           String?
  paidAt               DateTime?
  failedAt             DateTime?
  refundedAt           DateTime?
  createdAt            DateTime       @default(now())
  updatedAt            DateTime       @updatedAt

  organization         Organization   @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  appointment          Appointment    @relation(fields: [appointmentId], references: [id], onDelete: Cascade)

  @@index([organizationId])
  @@index([status])
  @@index([externalInvoiceId])
}

model PublicBookingSettings {
  id                   String       @id @default(uuid())
  organizationId       String       @unique
  headline             String       @default("Agende seu horário online")
  aboutText            String?
  logoUrl              String?
  bannerUrl            String?
  primaryColor         String       @default("#2563EB")
  minNoticeHours       Int          @default(2)
  maxNoticeDays        Int          @default(60)
  allowCancellation    Boolean      @default(true)
  cancellationHoursLimit Int        @default(24)
  allowRescheduling    Boolean      @default(true)
  rescheduleHoursLimit Int          @default(24)
  termsText            String?
  createdAt            DateTime     @default(now())
  updatedAt            DateTime     @updatedAt

  organization         Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}

model WhatsAppConnection {
  id              String       @id @default(uuid())
  organizationId  String       @unique
  phoneNumberId   String?
  wabaId          String?
  accessTokenEnc  String?
  isConnected     Boolean      @default(false)
  lastHealthCheck DateTime?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}

model CalendarConnection {
  id              String       @id @default(uuid())
  professionalId  String       @unique
  refreshTokenEnc String
  calendarId      String       @default("primary")
  syncEnabled     Boolean      @default(true)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  professional    Professional @relation(fields: [professionalId], references: [id], onDelete: Cascade)
}

model NotificationLog {
  id              String              @id @default(uuid())
  organizationId  String
  appointmentId   String?
  channel         NotificationChannel
  recipient       String
  templateName    String
  status          NotificationStatus  @default(PENDING)
  errorMessage    String?
  sentAt          DateTime?
  createdAt       DateTime            @default(now())

  organization    Organization        @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  appointment     Appointment?        @relation(fields: [appointmentId], references: [id], onDelete: SetNull)

  @@index([organizationId])
  @@index([status])
}

model AuditLog {
  id             String       @id @default(uuid())
  organizationId String
  userId         String?
  action         String
  entity         String
  entityId       String
  ipAddress      String?
  details        Json?
  createdAt      DateTime     @default(now())

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user           User?        @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([organizationId])
  @@index([action])
}`,

  "prisma/seed.ts": `import { PrismaClient, PlanTier } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const plans = [
    {
      tier: PlanTier.FREE,
      name: "Gratuito",
      description: "Ideal para começar.",
      monthlyPriceCents: 0,
      annualPriceCents: 0,
      maxProfessionals: 1,
      maxAppointmentsMo: 30,
      maxClients: 50,
      hasWhatsApp: false,
      hasGoogleCalendar: false,
      hasOnlinePayment: false,
      hasCustomDomain: false,
    },
    {
      tier: PlanTier.BASIC,
      name: "Básico",
      description: "Para profissionais autônomos ativos.",
      monthlyPriceCents: 4900,
      annualPriceCents: 47000,
      maxProfessionals: 1,
      maxAppointmentsMo: 150,
      maxClients: 300,
      hasWhatsApp: false,
      hasGoogleCalendar: true,
      hasOnlinePayment: true,
      hasCustomDomain: false,
    },
    {
      tier: PlanTier.PRO,
      name: "Profissional",
      description: "WhatsApp automatizado e equipe.",
      monthlyPriceCents: 9900,
      annualPriceCents: 95000,
      maxProfessionals: 3,
      maxAppointmentsMo: 500,
      maxClients: 1000,
      hasWhatsApp: true,
      hasGoogleCalendar: true,
      hasOnlinePayment: true,
      hasCustomDomain: false,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { tier: plan.tier },
      update: plan,
      create: plan,
    });
  }
  console.log("Seed concluído!");
}

main().finally(async () => await prisma.$disconnect());`,

  // 3. CORE UTILITIES & AUTH
  "src/lib/env.ts": `import { z } from "zod";
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().length(32),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("agendamentos@seudominio.com"),
});
export const env = envSchema.parse(process.env);`,

  "src/lib/db/prisma.ts": `import { PrismaClient } from "@prisma/client";
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;`,

  "src/lib/auth/password.ts": `import bcrypt from "bcryptjs";
export const hashPassword = async (p: string) => bcrypt.hash(p, 12);
export const verifyPassword = async (p: string, h: string) => bcrypt.compare(p, h);`,

  "src/lib/auth/session.ts": `import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { UserRole } from "@prisma/client";

const COOKIE_NAME = "saas_auth_session";
const encodedSecret = new TextEncoder().encode(process.env.AUTH_SECRET || "fallback_secret_32_caracteres_min");

export interface SessionPayload {
  userId: string;
  email: string;
  fullName: string;
  organizationId: string;
  role: UserRole;
  isSuperAdmin: boolean;
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedSecret);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", { expires: new Date(0), path: "/" });
}`,

  "src/middleware.ts": `import { NextResponse } from "next/server";
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
};`,

  // 4. MOTOR DE DISPONIBILIDADE
  "src/modules/availability/slot-calculator.ts": `import { addMinutes, isAfter, parse, format } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

export function calculateAvailableSlots({
  date,
  timezone,
  durationMinutes,
  bufferMinutes,
  weeklySchedule,
  exceptions,
  existingAppointments,
  minNoticeHours,
  now,
}: any) {
  if (exceptions.some((e: any) => e.isBlocked && !e.startTime)) return [];
  const availableSlots: any[] = [];
  const dateStr = format(date, "yyyy-MM-dd");
  const earliestAllowedUtc = addMinutes(now, minNoticeHours * 60);

  for (const block of weeklySchedule) {
    const blockStartLocal = parse(\`\${dateStr} \${block.startTime}\`, "yyyy-MM-dd HH:mm", new Date());
    const blockEndLocal = parse(\`\${dateStr} \${block.endTime}\`, "yyyy-MM-dd HH:mm", new Date());
    let current = blockStartLocal;

    while (true) {
      const currentEnd = addMinutes(current, durationMinutes);
      if (isAfter(currentEnd, blockEndLocal)) break;

      const slotStartUtc = fromZonedTime(current, timezone);
      const slotEndUtc = fromZonedTime(currentEnd, timezone);

      if (isAfter(slotStartUtc, earliestAllowedUtc)) {
        const conflict = existingAppointments.some((appt: any) => (
          slotStartUtc < appt.endTime && slotEndUtc > appt.startTime
        ));
        if (!conflict) {
          availableSlots.push({
            startTime: slotStartUtc,
            endTime: slotEndUtc,
            formattedLocal: format(current, "HH:mm"),
          });
        }
      }
      current = addMinutes(currentEnd, bufferMinutes);
    }
  }
  return availableSlots;
}`,

  // 5. ROOT LAYOUT & STYLES
  "src/app/globals.css": `@tailwind base;
@tailwind components;
@tailwind utilities;`,

  "src/app/layout.tsx": `import "./globals.css";
export const metadata = {
  title: "AgendaPro | Sistema de Agendamentos Online",
  description: "Tenha sua própria página de agendamentos e receba confirmações automáticas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-neutral-50 text-neutral-900 antialiased">{children}</body>
    </html>
  );
}`,

  "src/app/api/health/route.ts": `import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({ status: "healthy", timestamp: new Date().toISOString() });
}`
};

// Escreve cada arquivo recursivamente no disco
Object.entries(files).forEach(([relativeFilePath, content]) => {
  const absolutePath = path.join(process.cwd(), relativeFilePath);
  const dirName = path.dirname(absolutePath);

  if (!fs.existsSync(dirName)) {
    fs.mkdirSync(dirName, { recursive: true });
  }

  fs.writeFileSync(absolutePath, content, "utf-8");
  console.log(`  ✓ Criado: ${relativeFilePath}`);
});

console.log("\n🎉 Projeto gerado com sucesso!");
console.log("\nPróximos passos:");
console.log("  1. npm install");
console.log("  2. docker compose up -d    (ou configure seu PostgreSQL no .env)");
console.log("  3. npx prisma migrate dev --name init");
console.log("  4. npm run prisma:seed");
console.log("  5. npm run dev");