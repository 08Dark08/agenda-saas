'use server';
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function createRealServiceAction(data: {
  name: string;
  durationMinutes: number;
  price: number;
}) {
  const session = await getSession();
  if (!session) return { success: false, error: "Sessão expirada. Faça login novamente." };

  try {
    await prisma.service.create({
      data: {
        organizationId: session.organizationId,
        name: data.name,
        durationMinutes: Number(data.durationMinutes),
        priceCents: Math.round(Number(data.price) * 100),
        isActive: true,
        allowOnlineBooking: true,
      },
    });

    revalidatePath("/services");
    revalidatePath("/dashboard");
    revalidatePath("/agendar/viverbem");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteRealServiceAction(serviceId: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Não autenticado." };

  try {
    await prisma.service.deleteMany({
      where: {
        id: serviceId,
        organizationId: session.organizationId,
      },
    });

    revalidatePath("/services");
    revalidatePath("/dashboard");
    revalidatePath("/agendar/viverbem");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}