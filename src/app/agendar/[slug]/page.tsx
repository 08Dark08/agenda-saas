import React from 'react';
import { prisma } from '@/lib/db/prisma';
import { PublicBookingClientView } from '@/components/booking/public-booking-client-view';

export const dynamic = 'force-dynamic';

export default async function PublicBookingPage({ params }: { params: { slug: string } }) {
  const slug = params?.slug || 'viverbem';

  // Busca a organização no Supabase ou pega a primeira cadastrada
  let org = await prisma.organization.findFirst({
    where: { slug: slug },
    include: {
      services: { where: { isActive: true }, orderBy: { createdAt: 'desc' } },
    },
  });

  if (!org) {
    org = await prisma.organization.findFirst({
      include: {
        services: { where: { isActive: true }, orderBy: { createdAt: 'desc' } },
      },
    });
  }

  // Fallbacks de segurança para garantir que a tela NUNCA quebre
  const businessName = org?.name || 'Viver Bem';
  const phone = org?.phone || '54996591765';

  const defaultServices = [
    { id: '1', name: 'Consulta Inicial / Avaliação', duration: 50, price: 150 },
    { id: '2', name: 'Sessão de Retorno', duration: 30, price: 100 },
    { id: '3', name: 'Terapia de casal', duration: 50, price: 150 },
  ];

  const serializedServices = (org?.services && org.services.length > 0)
    ? org.services.map(s => ({
        id: s.id,
        name: s.name,
        duration: s.durationMinutes,
        price: s.priceCents / 100,
      }))
    : defaultServices;

  return (
    <PublicBookingClientView
      slug={slug}
      businessName={businessName}
      phone={phone}
      services={serializedServices}
    />
  );
}