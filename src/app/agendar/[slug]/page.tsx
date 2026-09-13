import React from 'react';
import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import { PublicBookingClientView } from '@/components/booking/public-booking-client-view';

export default async function PublicBookingPage({ params }: { params: { slug: string } }) {
  const org = await prisma.organization.findUnique({
    where: { slug: params.slug },
    include: {
      services: { where: { isActive: true }, orderBy: { createdAt: 'desc' } },
    },
  });

  if (!org) notFound();

  const serializedServices = org.services.map(s => ({
    id: s.id,
    name: s.name,
    duration: s.durationMinutes,
    price: s.priceCents / 100,
  }));

  return (
    <PublicBookingClientView
      slug={org.slug}
      businessName={org.name}
      phone={org.phone}
      services={serializedServices}
    />
  );
}