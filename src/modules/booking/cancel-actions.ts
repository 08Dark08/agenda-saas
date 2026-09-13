'use server';
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { subHours, isBefore } from "date-fns";

export async function cancelAppointmentByClientAction(appointmentId: string, reason?: string) {
  try {
    const appt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { organization: { include: { publicSettings: true } } }
    });

    if (!appt) return { success: false, error: "Agendamento não encontrado." };
    if (appt.status === "CANCELLED") return { success: false, error: "Este agendamento já foi cancelado." };

    const limitHours = appt.organization?.publicSettings?.cancellationHoursLimit ?? 24;
    const deadline = subHours(new Date(appt.startTime), limitHours);

    if (isBefore(deadline, new Date())) {
      return {
        success: false,
        error: "Cancelamentos online só são permitidos com até " + limitHours + " horas de antecedência."
      };
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancellationReason: reason || "Cancelado pelo cliente online.",
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/appointments");
    revalidatePath("/agendar/[slug]");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function findClientAppointmentsAction(slug: string, phone: string) {
  try {
    const cleanPhone = phone.replace(/\D/g, "");
    const org = await prisma.organization.findUnique({ where: { slug } });
    if (!org) return { success: false, appointments: [] };

    const client = await prisma.client.findFirst({
      where: {
        organizationId: org.id,
        phone: { contains: cleanPhone.slice(-8) },
      },
      include: {
        appointments: {
          where: { status: "CONFIRMED" },
          include: { service: true, bookingToken: true },
          orderBy: { startTime: "asc" }
        }
      }
    });

    if (!client || client.appointments.length === 0) {
      return { success: false, error: "Nenhum agendamento ativo encontrado para este WhatsApp." };
    }

    const formatted = client.appointments.map(a => ({
      id: a.id,
      serviceName: a.service.name,
      startTime: a.startTime.toISOString(),
      token: a.bookingToken?.token || a.id
    }));

    return { success: true, appointments: formatted };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}