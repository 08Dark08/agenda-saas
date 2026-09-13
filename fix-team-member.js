// fix-team-member.js
const fs = require("fs");
const path = require("path");

console.log("👥 Corrigindo criação de membros da equipe com ID independente no Supabase...\n");

const targetPath = path.join(process.cwd(), "src/modules/team/actions.ts");

const code = `'use server';
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
    await prisma.$transaction(async (tx) => {
      // 1. Cria um usuário independente para o novo profissional da equipe
      const cleanName = data.name.toLowerCase().replace(/\\s+/g, "");
      const uniqueEmail = cleanName + "_" + Date.now() + "@equipe.agendapro.com";

      const newUser = await tx.user.create({
        data: {
          email: uniqueEmail,
          fullName: data.name,
          passwordHash: "CONVITE_EQUIPE_PENDENTE",
          phone: data.phone,
        },
      });

      // 2. Vincula à clínica como PROFESSIONAL com ID exclusivo
      const member = await tx.organizationMember.create({
        data: {
          organizationId: session.organizationId,
          userId: newUser.id,
          role: "PROFESSIONAL",
        },
      });

      // 3. Cria o perfil do profissional ativo
      await tx.professional.create({
        data: {
          organizationId: session.organizationId,
          memberId: member.id,
          name: data.name,
          specialty: data.specialty,
          phone: data.phone,
          isActive: true,
        },
      });
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
    const pro = await prisma.professional.findFirst({
      where: { id: professionalId, organizationId: session.organizationId },
    });

    if (pro) {
      await prisma.professional.delete({ where: { id: pro.id } });
      await prisma.organizationMember.deleteMany({ where: { id: pro.memberId } });
    }

    revalidatePath("/team");
    revalidatePath("/dashboard");
    revalidatePath("/agendar/[slug]");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}`;

fs.writeFileSync(targetPath, code, "utf-8");
console.log("✓ Ações de equipe corrigidas com sucesso!");