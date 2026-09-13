'use server';
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function createProfessionalAction(data: {
  name: string;
  specialty: string;
  phone: string;
}) {
  const session = await getSession();
  if (!session || !session.organizationId) {
    return { success: false, error: "Não autenticado." };
  }

  try {
    // Cria o membro na organização e o perfil do profissional no Supabase
    const member = await prisma.organizationMember.create({
      data: {
        organizationId: session.organizationId,
        userId: session.userId,
        role: "PROFESSIONAL",
      },
    });

    await prisma.professional.create({
      data: {
        organizationId: session.organizationId,
        memberId: member.id,
        name: data.name,
        specialty: data.specialty,
        phone: data.phone,
        isActive: true,
      },
    });

    revalidatePath("/team");
    revalidatePath("/dashboard");
    revalidatePath("/agendar/[slug]");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteProfessionalAction(professionalId: string) {
  const session = await getSession();
  if (!session || !session.organizationId) {
    return { success: false, error: "Não autenticado." };
  }

  try {
    await prisma.professional.deleteMany({
      where: {
        id: professionalId,
        organizationId: session.organizationId,
      },
    });

    revalidatePath("/team");
    revalidatePath("/dashboard");
    revalidatePath("/agendar/[slug]");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}