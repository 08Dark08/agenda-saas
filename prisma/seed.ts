import { PrismaClient, PlanTier } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const plans = [
    {
      tier: PlanTier.FREE,
      name: "Gratuito",
      description: "Ideal para começar.",
      monthlyPriceCents: 0,
      annualPriceCents: 0,
      maxProfessionals: 1,
      maxAppointmentsMo: 30,
      maxClients: 50,
      hasWhatsApp: false,
      hasGoogleCalendar: false,
      hasOnlinePayment: false,
      hasCustomDomain: false,
    },
    {
      tier: PlanTier.BASIC,
      name: "Básico",
      description: "Para profissionais autônomos ativos.",
      monthlyPriceCents: 4900,
      annualPriceCents: 47000,
      maxProfessionals: 1,
      maxAppointmentsMo: 150,
      maxClients: 300,
      hasWhatsApp: false,
      hasGoogleCalendar: true,
      hasOnlinePayment: true,
      hasCustomDomain: false,
    },
    {
      tier: PlanTier.PRO,
      name: "Profissional",
      description: "WhatsApp automatizado e equipe.",
      monthlyPriceCents: 9900,
      annualPriceCents: 95000,
      maxProfessionals: 3,
      maxAppointmentsMo: 500,
      maxClients: 1000,
      hasWhatsApp: true,
      hasGoogleCalendar: true,
      hasOnlinePayment: true,
      hasCustomDomain: false,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { tier: plan.tier },
      update: plan,
      create: plan,
    });
  }
  console.log("Seed concluído!");
}

main().finally(async () => await prisma.$disconnect());