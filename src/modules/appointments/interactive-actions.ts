'use server';
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { addMinutes, format } from "date-fns";

export async function updateAppointmentStatusAction(appointmentId: string, newStatus: any) {
  try {
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: newStatus },
    });

    revalidatePath("/appointments");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createManualAppointmentAction(formData: {
  clientName: string;
  clientPhone: string;
  serviceId: string;
  time: string;
}) {
  try {
    const service = await prisma.service.findUnique({ where: { id: formData.serviceId } });
    if (!service) return { success: false, error: "Serviço não encontrado." };

    const professional = await prisma.professional.findFirst({
      where: { organizationId: service.organizationId },
    });

    const todayStr = format(new Date(), "yyyy-MM-dd");
    // TRAVA NO FUSO DE BRASÍLIA (-03:00)
    const startTime = new Date(todayStr + "T" + formData.time + ":00-03:00");
    const endTime = addMinutes(startTime, service.durationMinutes);

    const client = await prisma.client.upsert({
      where: {
        organizationId_phone: {
          organizationId: service.organizationId,
          phone: formData.clientPhone,
        },
      },
      update: { fullName: formData.clientName },
      create: {
        organizationId: service.organizationId,
        fullName: formData.clientName,
        phone: formData.clientPhone,
      },
    });

    const slotKey = "manual_" + (professional?.id || "pro") + "_" + startTime.toISOString() + "_" + Date.now();

    await prisma.appointment.create({
      data: {
        organizationId: service.organizationId,
        professionalId: professional!.id,
        serviceId: service.id,
        clientId: client.id,
        startTime,
        endTime,
        slotKey,
        status: "CONFIRMED",
        totalPriceCents: service.priceCents,
      },
    });

    revalidatePath("/appointments");
    revalidatePath("/dashboard");
    revalidatePath("/clients");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}