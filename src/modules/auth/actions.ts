'use server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { createSession, destroySession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { addDays } from 'date-fns';

export async function registerAction(_: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries()) as any;
  const passwordHash = await hashPassword(data.password);

  const defaultPlan = await prisma.plan.findFirst({ where: { tier: 'BASIC' } });
  if (!defaultPlan) return { error: 'Planos não encontrados. Execute o seed.' };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email: data.email, passwordHash, fullName: data.fullName, phone: data.phone },
      });

      const org = await tx.organization.create({
        data: { name: data.businessName, slug: data.slug, phone: data.phone, email: data.email },
      });

      const member = await tx.organizationMember.create({
        data: { organizationId: org.id, userId: user.id, role: 'OWNER' },
      });

      await tx.professional.create({
        data: { organizationId: org.id, memberId: member.id, name: data.fullName, phone: data.phone },
      });

      await tx.subscription.create({
        data: {
          organizationId: org.id,
          planId: defaultPlan.id,
          status: 'TRIALING',
          currentPeriodStart: new Date(),
          currentPeriodEnd: addDays(new Date(), 14),
        },
      });

      await tx.publicBookingSettings.create({
        data: { organizationId: org.id, headline: `Agendamento com ${data.businessName}` },
      });

      return { user, org, member };
    });

    await createSession({
      userId: result.user.id,
      email: result.user.email,
      fullName: result.user.fullName,
      organizationId: result.org.id,
      role: result.member.role,
      isSuperAdmin: false,
    });
  } catch (err: any) {
    return { error: 'Falha ao registrar conta. Verifique se o e-mail ou slug já estão em uso.' };
  }

  redirect('/onboarding');
}

export async function loginAction(_: any, formData: FormData) {
  const { email, password } = Object.fromEntries(formData.entries()) as any;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { memberships: true },
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: 'E-mail ou senha incorretos.' };
  }

  const primary = user.memberships[0];

  await createSession({
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    organizationId: primary?.organizationId || '',
    role: primary?.role || 'STAFF',
    isSuperAdmin: user.isSuperAdmin,
  });

  redirect('/dashboard');
}

export async function logoutAction() {
  await destroySession();
  redirect('/login');
}