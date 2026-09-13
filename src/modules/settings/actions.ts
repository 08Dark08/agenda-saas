'use server';
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function updateOrganizationSettingsAction(formData: {
  name: string;
  phone: string;
  headline?: string;
  aboutText?: string;
}) {
  const session = await getSession();
  if (!session) return { success: false, error: "Não autenticado." };

  try {
    await prisma.$transaction([
      prisma.organization.update({
        where: { id: session.organizationId },
        data: {
          name: formData.name,
          phone: formData.phone,
        },
      }),
      prisma.publicBookingSettings.upsert({
        where: { organizationId: session.organizationId },
        update: {
          headline: formData.headline || "Agendamento online imediato",
          aboutText: formData.aboutText,
        },
        create: {
          organizationId: session.organizationId,
          headline: formData.headline || "Agendamento online imediato",
          aboutText: formData.aboutText,
        },
      }),
    ]);

    revalidatePath("/dashboard");
    revalidatePath("/settings");
    revalidatePath("/agendar/[slug]");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}