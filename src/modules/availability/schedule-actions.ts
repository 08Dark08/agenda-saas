'use server';
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function updateBookingRulesAction(rules: {
  minNoticeHours: number;
  maxNoticeDays: number;
  cancellationHoursLimit: number;
  allowCancellation: boolean;
}) {
  const session = await getSession();
  if (!session) return { success: false, error: "Não autenticado." };

  try {
    await prisma.publicBookingSettings.upsert({
      where: { organizationId: session.organizationId },
      update: {
        minNoticeHours: Number(rules.minNoticeHours),
        maxNoticeDays: Number(rules.maxNoticeDays),
        cancellationHoursLimit: Number(rules.cancellationHoursLimit),
        allowCancellation: Boolean(rules.allowCancellation),
      },
      create: {
        organizationId: session.organizationId,
        minNoticeHours: Number(rules.minNoticeHours),
        maxNoticeDays: Number(rules.maxNoticeDays),
        cancellationHoursLimit: Number(rules.cancellationHoursLimit),
        allowCancellation: Boolean(rules.allowCancellation),
      },
    });

    revalidatePath("/schedule");
    revalidatePath("/agendar/[slug]");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateWeeklyScheduleAction(schedule: any[]) {
  const session = await getSession();
  if (!session) return { success: false, error: "Não autenticado." };

  try {
    revalidatePath("/schedule");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}