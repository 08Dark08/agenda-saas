'use server';
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";
import { addDays, addMinutes } from "date-fns";
import { revalidatePath } from "next/cache";

export async function createRealBookingAction(data: {
  slug: string;
  clientName: string;
  clientPhone: string;
  timeSlot: string;
}) {
  try {
    const org = await prisma.organization.findUnique({
      where: { slug: data.slug },
      include: {
        services: { where: { isActive: true } },
        professionals: { where: { isActive: true } },
      },
    });

    if (!org || org.services.length === 0 || org.professionals.length === 0) {
      return { success: false, error: "Clínica ou serviços não disponíveis." };
    }

    const service = org.services[0];
    const professional = org.professionals[0];

    const [hours, minutes] = data.timeSlot.split(":").map(Number);
    const startTime = new Date();
    startTime.setHours(hours, minutes, 0, 0);
    const endTime = addMinutes(startTime, service.durationMinutes);

    const slotKey = `slot_${professional.id}_${startTime.toISOString()}_${Date.now()}`;

    const client = await prisma.client.upsert({
      where: {
        organizationId_phone: {
          organizationId: org.id,
          phone: data.clientPhone,
        },
      },
      update: { fullName: data.clientName },
      create: {
        organizationId: org.id,
        fullName: data.clientName,
        phone: data.clientPhone,
      },
    });

    const appointment = await prisma.appointment.create({
      data: {
        organizationId: org.id,
        professionalId: professional.id,
        serviceId: service.id,
        clientId: client.id,
        startTime,
        endTime,
        slotKey,
        status: "CONFIRMED",
        totalPriceCents: service.priceCents,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/appointments");
    revalidatePath("/clients");

    return { success: true, token: "tok_" + appointment.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}