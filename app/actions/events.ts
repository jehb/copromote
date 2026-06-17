'use server'
import { getSession } from '@/lib/session'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logActivity } from '@/app/actions/activity-logs'
import { getCurrentUserId } from '@/lib/user-util'
import { fromZonedTime } from 'date-fns-tz'
import { EventStatus } from '@prisma/client'

const TIMEZONE = 'America/New_York'

export async function getEvents() {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    // Automatically mark events older than 1 day as PAST
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    await prisma.event.updateMany({
        where: {
            status: EventStatus.SCHEDULED,
            endTime: {
                lt: oneDayAgo
            },
            deletedAt: null
        },
        data: {
            status: EventStatus.PAST
        }
    });

    return await prisma.event.findMany({
        where: { deletedAt: null },
        orderBy: { startTime: 'asc' },
        include: {
            location: true,
            primaryContact: true,
            series: true,
            contacts: true,
            organizations: true,
            products: true,
            socialPosts: {
                orderBy: { scheduledDate: 'asc' }
            }
        }
    })
}

export async function getEvent(id: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    return await prisma.event.findFirst({
        where: { id, deletedAt: null },
        include: {
            location: true,
            primaryContact: true,
            series: true,
            contacts: true,
            organizations: true,
            products: true,
            socialPosts: {
                orderBy: { scheduledDate: 'asc' }
            }
        }
    })
}

export async function createEvent(formData: FormData) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const internalNotes = formData.get('internalNotes') as string
    const startTimeStr = formData.get('startTime') as string
    const endTimeStr = formData.get('endTime') as string
    const locationId = formData.get('locationId') as string
    const primaryContactId = formData.get('primaryContactId') as string
    const seriesIdRaw = formData.get('seriesId') as string
    const seriesId = seriesIdRaw === 'none' || !seriesIdRaw ? undefined : seriesIdRaw
    const wordpressId = formData.get('wordpressId') ? parseInt(formData.get('wordpressId') as string) : undefined
    const wordpressUrl = formData.get('wordpressUrl') as string

    // Multi-select values as JSON string or multiple fields
    const contactIds = formData.getAll('contactIds') as string[]
    const organizationIds = formData.getAll('organizationIds') as string[]
    const productUpcs = formData.getAll('productUpcs') as string[]
    const status = (formData.get('status') as EventStatus) || EventStatus.SCHEDULED

    const event = await prisma.event.create({
        data: {
            title,
            description,
            internalNotes,
            startTime: fromZonedTime(startTimeStr, TIMEZONE),
            endTime: fromZonedTime(endTimeStr, TIMEZONE),
            status,
            locationId,
            primaryContactId: primaryContactId || undefined,
            seriesId: seriesId || undefined,
            wordpressId,
            wordpressUrl: wordpressUrl || undefined,
            contacts: {
                connect: contactIds.map(id => ({ id }))
            },
            organizations: {
                connect: organizationIds.map(id => ({ id }))
            },
            products: {
                create: productUpcs.map(upc => ({ upc }))
            },
            createdById: await getCurrentUserId(),
            updatedById: await getCurrentUserId()
        }
    })

    await logActivity('CREATE', 'Event', event.id, `Created event: ${title}`)

    revalidatePath('/calendar')
    revalidatePath('/events')
    redirect('/events')
}

export async function updateEvent(id: string, formData: FormData) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const internalNotes = formData.get('internalNotes') as string
    const startTimeStr = formData.get('startTime') as string
    const endTimeStr = formData.get('endTime') as string
    const locationId = formData.get('locationId') as string
    const primaryContactId = formData.get('primaryContactId') as string
    const seriesIdRaw = formData.get('seriesId') as string
    const seriesId = seriesIdRaw === 'none' || !seriesIdRaw ? undefined : seriesIdRaw
    const wordpressId = formData.get('wordpressId') ? parseInt(formData.get('wordpressId') as string) : undefined
    const wordpressUrl = formData.get('wordpressUrl') as string

    const contactIds = formData.getAll('contactIds') as string[]
    const organizationIds = formData.getAll('organizationIds') as string[]
    const productUpcs = formData.getAll('productUpcs') as string[]
    const status = (formData.get('status') as EventStatus) || EventStatus.SCHEDULED

    await prisma.event.update({
        where: { id },
        data: {
            title,
            description,
            internalNotes,
            startTime: fromZonedTime(startTimeStr, TIMEZONE),
            endTime: fromZonedTime(endTimeStr, TIMEZONE),
            status,
            locationId,
            primaryContactId: primaryContactId || null,
            seriesId: seriesId || null,
            wordpressId: wordpressId || null,
            wordpressUrl: wordpressUrl || null,
            contacts: {
                set: contactIds.map(id => ({ id }))
            },
            organizations: {
                set: organizationIds.map(id => ({ id }))
            },
            products: {
                deleteMany: {},
                create: productUpcs.map(upc => ({ upc }))
            },
            updatedById: await getCurrentUserId()
        }
    })

    await logActivity('UPDATE', 'Event', id, `Updated event: ${title}`)

    revalidatePath('/events')
    revalidatePath('/calendar')
    revalidatePath(`/events/${id}`)
}

export async function deleteEvent(id: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const userId = await getCurrentUserId()
    await prisma.event.update({
        where: { id },
        data: {
            deletedAt: new Date(),
            updatedById: userId
        }
    })
    await logActivity('DELETE', 'Event', id, `Soft deleted event`)
    revalidatePath('/events')
    revalidatePath('/calendar')
}

export async function getLocations() {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    return await prisma.location.findMany({
        orderBy: { name: 'asc' }
    })
}

export async function getUsers() {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    return await prisma.user.findMany({
        orderBy: { name: 'asc' }
    })
}
export async function searchEventsForAutocomplete(query: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const now = new Date()

    // Fetch events matching query or just latest if query is empty
    const events = await prisma.event.findMany({
        where: query ? {
            title: { contains: query },
            deletedAt: null
        } : {
            deletedAt: null
        },
        take: 10,
        select: {
            id: true,
            title: true,
            startTime: true
        }
    })

    // We calculate the absolute difference in milliseconds
    return events.sort((a, b) => {
        const diffA = Math.abs(a.startTime.getTime() - now.getTime())
        const diffB = Math.abs(b.startTime.getTime() - now.getTime())
        return diffA - diffB
    }).map(e => ({
        ...e,
        startTime: e.startTime.toISOString() // Ensure serializability
    }))
}

export async function bulkUpdateEvents(updates: {
    id: string;
    title?: string;
    startTime?: string;
    endTime?: string;
    status?: EventStatus;
    locationId?: string;
    primaryContactId?: string | null;
    seriesId?: string | null;
    description?: string | null;
    internalNotes?: string | null;
}[]) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const userId = await getCurrentUserId();

    await prisma.$transaction(
        updates.map(update => {
            const { id, startTime, endTime, ...data } = update;
            return prisma.event.update({
                where: { id },
                data: {
                    ...data,
                    ...(startTime ? { startTime: fromZonedTime(startTime, TIMEZONE) } : {}),
                    ...(endTime ? { endTime: fromZonedTime(endTime, TIMEZONE) } : {}),
                    updatedById: userId
                }
            });
        })
    );

    // ⚡ Bolt: Performance optimization
    // Pre-fetch titles for all updated events to avoid O(N) sequential database queries in loop
    const eventTitles = await prisma.event.findMany({
        where: { id: { in: updates.map(u => u.id) } },
        select: { id: true, title: true }
    });

    // Create an O(1) lookup map
    const titleMap = new Map(eventTitles.map(e => [e.id, e.title]));

    // ⚡ Bolt: Use Promise.all to log all activities concurrently instead of awaiting each sequentially
    await Promise.all(
        updates.map(update => {
            const title = titleMap.get(update.id);
            const fields = Object.keys(update).filter(k => k !== 'id').join(', ');
            return logActivity('UPDATE', 'Event', update.id, `Bulk updated fields (${fields}) on event: ${title || update.id}`);
        })
    );

    revalidatePath('/events');
    revalidatePath('/calendar');
}

