// sync-real-database.js
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Sincronizando serviços e gravando agendamento real no Supabase...\n");

  // 1. Localiza a organização 'viverbem'
  const org = await prisma.organization.findFirst({
    where: { slug: "viverbem" },
    include: { professionals: true },
  });

  if (!org) {
    console.error("❌ Organização viverbem não encontrada.");
    return;
  }

  // 2. Garante que o profissional existe
  let professional = org.professionals[0];
  if (!professional) {
    const member = await prisma.organizationMember.findFirst({ where: { organizationId: org.id } });
    professional = await prisma.professional.create({
      data: {
        organizationId: org.id,
        memberId: member.id,
        name: "Rodrigo Vieira",
        phone: "54996591765",
      },
    });
  }

  // 3. Grava os 3 Serviços reais na tabela 'Service' do Supabase
  const servicesData = [
    { name: "Consulta Inicial / Avaliação", durationMinutes: 50, priceCents: 15000 },
    { name: "Sessão de Retorno", durationMinutes: 30, priceCents: 10000 },
    { name: "Terapia de casal", durationMinutes: 50, priceCents: 15000 },
  ];

  for (const s of servicesData) {
    const existing = await prisma.service.findFirst({
      where: { organizationId: org.id, name: s.name },
    });
    if (!existing) {
      await prisma.service.create({
        data: {
          organizationId: org.id,
          name: s.name,
          durationMinutes: s.durationMinutes,
          priceCents: s.priceCents,
          isActive: true,
          allowOnlineBooking: true,
        },
      });
      console.log(`  ✓ Serviço gravado no Supabase: ${s.name}`);
    }
  }

  const targetService = await prisma.service.findFirst({
    where: { organizationId: org.id, name: "Terapia de casal" },
  });

  // 4. Cria o Cliente e o Agendamento das 09:30 no Supabase
  const client = await prisma.client.upsert({
    where: {
      organizationId_phone: {
        organizationId: org.id,
        phone: "54996591765",
      },
    },
    update: { fullName: "Rodrigo de Lima Vieira" },
    create: {
      organizationId: org.id,
      fullName: "Rodrigo de Lima Vieira",
      phone: "54996591765",
    },
  });

  const startTime = new Date();
  startTime.setHours(9, 30, 0, 0);
  const endTime = new Date(startTime.getTime() + 50 * 60000);
  const slotKey = `slot_${professional.id}_${startTime.toISOString()}`;

  await prisma.appointment.upsert({
    where: { slotKey_status: { slotKey, status: "CONFIRMED" } },
    update: {},
    create: {
      organizationId: org.id,
      professionalId: professional.id,
      serviceId: targetService.id,
      clientId: client.id,
      startTime,
      endTime,
      slotKey,
      status: "CONFIRMED",
      totalPriceCents: 15000,
    },
  });

  console.log("  ✓ Agendamento das 09:30 gravado com sucesso na tabela Appointment!");

  // 5. Atualiza a Server Action para que os próximos agendamentos venham direto do Supabase
  const actionPath = path.join(process.cwd(), "src/modules/booking/public-actions.ts");
  const updatedAction = `'use server';
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

    const slotKey = \`slot_\${professional.id}_\${startTime.toISOString()}_\${Date.now()}\`;

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

  fs.writeFileSync(actionPath, updatedAction, "utf-8");
  console.log("  ✓ Server Action atualizada com revalidação de rotas!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());