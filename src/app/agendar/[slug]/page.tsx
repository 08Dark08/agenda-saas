import React from 'react';
import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import { PublicBookingClientView } from '@/components/booking/public-booking-client-view';

export const dynamic = 'force-dynamic';

export default async function PublicBookingPage({ params }: { params: { slug: string } }) {
  const slug = params?.slug || 'viverbem';

  const org = await prisma.organization.findFirst({
    where: { slug },
    include: {
      publicSettings: true,
      services: { where: { isActive: true }, orderBy: { createdAt: 'desc' } },
    },
  });

  if (!org) notFound();

  let scheduleConfig = null;
  if (org.publicSettings?.termsText) {
    try {
      scheduleConfig = JSON.parse(org.publicSettings.termsText);
    } catch {}
  }

  const defaultSchedule = [
    { day: 'Segunda-feira', enabled: true, mStart: '08:00', mEnd: '12:00', aStart: '13:30', aEnd: '18:00' },
    { day: 'Terça-feira', enabled: true, mStart: '08:00', mEnd: '12:00', aStart: '13:30', aEnd: '18:00' },
    { day: 'Quarta-feira', enabled: true, mStart: '08:00', mEnd: '12:00', aStart: '13:30', aEnd: '18:00' },
    { day: 'Quinta-feira', enabled: true, mStart: '08:00', mEnd: '12:00', aStart: '13:30', aEnd: '18:00' },
    { day: 'Sexta-feira', enabled: true, mStart: '08:00', mEnd: '12:00', aStart: '13:30', aEnd: '18:00' },
    { day: 'Sábado', enabled: false, mStart: '08:00', mEnd: '12:00', aStart: '13:30', aEnd: '18:00' },
    { day: 'Domingo', enabled: false, mStart: '08:00', mEnd: '12:00', aStart: '13:30', aEnd: '18:00' },
  ];

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
      weeklySchedule={scheduleConfig?.weeklySchedule || defaultSchedule}
      bufferMinutes={scheduleConfig?.bufferMinutes || 0}
    />
  );
}