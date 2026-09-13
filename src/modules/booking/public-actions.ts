'use server';
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";
import { addMinutes } from "date-fns";
import { revalidatePath } from "next/cache";

export async function createRealBookingAction(data: {
  slug: string;
  clientName: string;
  clientPhone: string;
  dateStr: string;
  timeSlot: string;
  professionalId?: string;
  depositPaidCents?: number; // VALOR DO SINAL PAGO VIA PIX
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
    let professional = org.professionals[0];
    if (data.professionalId) {
      const selected = org.professionals.find(p => p.id === data.professionalId);
      if (selected) professional = selected;
    }

    const isoStringWithTimezone = data.dateStr + "T" + data.timeSlot + ":00-03:00";
    const startTime = new Date(isoStringWithTimezone);
    const endTime = addMinutes(startTime, service.durationMinutes);

    const slotKey = "slot_" + professional.id + "_" + startTime.toISOString() + "_" + Date.now();

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

    const depositCents = data.depositPaidCents || 0;

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
        depositAmountCents: depositCents, // REGISTRA O SINAL PAGO NO SUPABASE
      },
    });

    // Se houve sinal, registra o pagamento no histórico financeiro
    if (depositCents > 0) {
      await prisma.payment.create({
        data: {
          organizationId: org.id,
          appointmentId: appointment.id,
          gateway: "ASAAS",
          amountCents: depositCents,
          status: "PAID",
          paidAt: new Date(),
        }
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/appointments");
    revalidatePath("/clients");
    revalidatePath("/financial");

    return { 
      success: true, 
      token: "tok_" + appointment.id,
      professionalName: professional.name 
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}