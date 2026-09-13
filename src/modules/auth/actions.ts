'use server';
import { prisma } from '@/lib/db/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { createSession, destroySession } from '@/lib/auth/session';
import { cookies } from 'next/headers';
import { addDays } from 'date-fns';

export async function loginAction(_: any, formData: FormData) {
  try {
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");

    if (!email || !password) {
      return { error: "Preencha o e-mail e a senha." };
    }

    const user = await prisma.user.findFirst({
      where: { email },
      include: { memberships: true },
    });

    if (!user) {
      return { error: "Nenhuma conta encontrada com este e-mail." };
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return { error: "Senha incorreta. Tente novamente." };
    }

    const primaryMembership = user.memberships[0];
    const organizationId = primaryMembership ? primaryMembership.organizationId : "";

    await createSession({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      organizationId,
      role: primaryMembership?.role || 'OWNER',
      isSuperAdmin: user.isSuperAdmin,
    });

    return { success: true };
  } catch (err: any) {
    return { error: "Erro ao autenticar: " + err.message };
  }
}

export async function registerAction(_: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries()) as any;
  const passwordHash = await hashPassword(data.password);
  const email = String(data.email).trim().toLowerCase();

  const defaultPlan = await prisma.plan.findFirst({ where: { tier: 'BASIC' } });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, passwordHash, fullName: data.fullName, phone: data.phone },
      });

      const org = await tx.organization.create({
        data: { name: data.businessName, slug: data.slug, phone: data.phone, email },
      });

      const member = await tx.organizationMember.create({
        data: { organizationId: org.id, userId: user.id, role: 'OWNER' },
      });

      await tx.professional.create({
        data: { organizationId: org.id, memberId: member.id, name: data.fullName, phone: data.phone },
      });

      if (defaultPlan) {
        await tx.subscription.create({
          data: {
            organizationId: org.id,
            planId: defaultPlan.id,
            status: 'TRIALING',
            currentPeriodStart: new Date(),
            currentPeriodEnd: addDays(new Date(), 14),
          },
        });
      }

      await tx.publicBookingSettings.create({
        data: { organizationId: org.id, headline: "Agendamento com " + data.businessName },
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

    return { success: true };
  } catch (err: any) {
    return { error: 'E-mail ou link já em uso. Tente outro.' };
  }
}

export async function logoutAction() {
  await destroySession();
}