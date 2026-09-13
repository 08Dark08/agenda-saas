'use server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';
import { addMinutes, format } from 'date-fns';

export async function saveFullScheduleConfigAction(data: {
  bufferMinutes: number;
  minNoticeHours: number;
  maxNoticeDays: number;
  cancellationHoursLimit: number;
  allowCancellation: boolean;
  weeklySchedule: any[];
}) {
  const session = await getSession();
  if (!session) return { success: false, error: 'Não autenticado.' };

  try {
    await prisma.publicBookingSettings.upsert({
      where: { organizationId: session.organizationId },
      update: {
        minNoticeHours: Number(data.minNoticeHours),
        maxNoticeDays: Number(data.maxNoticeDays),
        cancellationHoursLimit: Number(data.cancellationHoursLimit),
        allowCancellation: Boolean(data.allowCancellation),
        termsText: JSON.stringify({
          bufferMinutes: data.bufferMinutes,
          weeklySchedule: data.weeklySchedule
        }),
      },
      create: {
        organizationId: session.organizationId,
        minNoticeHours: Number(data.minNoticeHours),
        maxNoticeDays: Number(data.maxNoticeDays),
        cancellationHoursLimit: Number(data.cancellationHoursLimit),
        allowCancellation: Boolean(data.allowCancellation),
        termsText: JSON.stringify({
          bufferMinutes: data.bufferMinutes,
          weeklySchedule: data.weeklySchedule
        }),
      },
    });

    revalidatePath('/schedule');
    revalidatePath('/agendar/[slug]');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getDynamicSlotsForDayAction(slug: string, dateStr: string, serviceDuration: number) {
  try {
    const org = await prisma.organization.findUnique({
      where: { slug },
      include: { publicSettings: true }
    });
    if (!org) return { slots: [] };

    let scheduleConfig: any = null;
    if (org.publicSettings?.termsText) {
      try { scheduleConfig = JSON.parse(org.publicSettings.termsText); } catch {}
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

    const weekly = scheduleConfig?.weeklySchedule || defaultSchedule;
    const buffer = scheduleConfig?.bufferMinutes || 10;

    const dateParts = dateStr.split('-').map(Number);
    const targetDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    const dayOfWeek = targetDate.getDay();
    const mapIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const dayConfig = weekly[mapIdx];

    if (!dayConfig || !dayConfig.enabled) {
      return { slots: [], isClosed: true };
    }

    const dayStart = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 0, 0, 0);
    const dayEnd = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 23, 59, 59);

    const bookedAppointments = await prisma.appointment.findMany({
      where: {
        organizationId: org.id,
        status: 'CONFIRMED',
        startTime: { gte: dayStart, lte: dayEnd }
      },
      select: { startTime: true }
    });

    const bookedTimes = bookedAppointments.map(a => format(new Date(a.startTime), 'HH:mm'));

    function sliceShift(startStr: string, endStr: string) {
      const resSlots: string[] = [];
      const [sh, sm] = startStr.split(':').map(Number);
      const [eh, em] = endStr.split(':').map(Number);

      let cur = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], sh, sm, 0);
      const maxEnd = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], eh, em, 0);

      while (true) {
        const sEnd = addMinutes(cur, serviceDuration);
        if (sEnd > maxEnd) break;
        const tStr = format(cur, 'HH:mm');
        if (!bookedTimes.includes(tStr)) {
          resSlots.push(tStr);
        }
        cur = addMinutes(sEnd, buffer);
      }
      return resSlots;
    }

    const mSlots = sliceShift(dayConfig.mStart || '08:00', dayConfig.mEnd || '12:00');
    const aSlots = sliceShift(dayConfig.aStart || '13:30', dayConfig.aEnd || '18:00');

    return { slots: [...mSlots, ...aSlots], isClosed: false };
  } catch (err: any) {
    return { slots: ['08:30', '09:30', '10:30', '14:00', '15:00', '16:00'], isClosed: false };
  }
}