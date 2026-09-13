// fix-timezone.js
const fs = require("fs");
const path = require("path");

console.log("🇧🇷 Travando o fuso horário oficial de Brasília (-03:00) para eliminar o erro de 3 horas...\n");

// 1. CORRIGE O AGENDAMENTO PÚBLICO: public-actions.ts
const publicActionPath = path.join(process.cwd(), "src/modules/booking/public-actions.ts");
const publicActionCode = `'use server';
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";
import { addMinutes } from "date-fns";
import { revalidatePath } from "next/cache";

export async function createRealBookingAction(data: {
  slug: string;
  clientName: string;
  clientPhone: string;
  dateStr: string; // "YYYY-MM-DD"
  timeSlot: string; // "16:00"
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

    // TRAVA NO FUSO DE BRASÍLIA (-03:00) - Elimina a perda de 3 horas na Vercel
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
}`;

fs.writeFileSync(publicActionPath, publicActionCode, "utf-8");
console.log("  ✓ public-actions.ts travado no fuso -03:00!");

// 2. CORRIGE O AGENDAMENTO MANUAL: interactive-actions.ts
const manualActionPath = path.join(process.cwd(), "src/modules/appointments/interactive-actions.ts");
const manualActionCode = `'use server';
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
}`;

fs.writeFileSync(manualActionPath, manualActionCode, "utf-8");
console.log("  ✓ interactive-actions.ts travado no fuso -03:00!");

console.log("\n🚀 Fuso horário de Brasília configurado em 100% dos agendamentos!");