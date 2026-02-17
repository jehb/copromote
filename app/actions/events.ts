'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logActivity } from '@/app/actions/activity-logs'
import { getCurrentUserId } from '@/lib/user-util'
import { fromZonedTime } from 'date-fns-tz'

const TIMEZONE = 'America/New_York'

export async function getEvents() {
    return await prisma.event.findMany({
        orderBy: { startTime: 'asc' },
        include: {
            location: true,
            primaryContact: true,
            series: true,
            contacts: true,
            organizations: true,
            socialPosts: {
                orderBy: { scheduledDate: 'asc' }
            }
        }
    })
}

export async function getEvent(id: string) {
    return await prisma.event.findUnique({
        where: { id },
        include: {
            location: true,
            primaryContact: true,
            series: true,
            contacts: true,
            organizations: true,
            socialPosts: {
                orderBy: { scheduledDate: 'asc' }
            }
        }
    })
}

export async function createEvent(formData: FormData) {
    const title = formData.get('title') as string
    const description = formData.get('description') as string
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

    const event = await prisma.event.create({
        data: {
            title,
            description,
            startTime: fromZonedTime(startTimeStr, TIMEZONE),
            endTime: fromZonedTime(endTimeStr, TIMEZONE),
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
    const title = formData.get('title') as string
    const description = formData.get('description') as string
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

    await prisma.event.update({
        where: { id },
        data: {
            title,
            description,
            startTime: fromZonedTime(startTimeStr, TIMEZONE),
            endTime: fromZonedTime(endTimeStr, TIMEZONE),
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
            updatedById: await getCurrentUserId()
        }
    })

    await logActivity('UPDATE', 'Event', id, `Updated event: ${title}`)

    revalidatePath('/events')
    revalidatePath('/calendar')
    revalidatePath(`/events/${id}`)
}

export async function deleteEvent(id: string) {
    await prisma.event.delete({
        where: { id }
    })
    await logActivity('DELETE', 'Event', id, `Deleted event`)
    revalidatePath('/events')
    revalidatePath('/calendar')
}

export async function getLocations() {
    return await prisma.location.findMany({
        orderBy: { name: 'asc' }
    })
}

export async function getUsers() {
    return await prisma.user.findMany({
        orderBy: { name: 'asc' }
    })
}
