'use server'
import { getSession } from '@/lib/session'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/app/actions/activity-logs'

export async function getEventSeries() {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    return await prisma.eventSeries.findMany({
        orderBy: { title: 'asc' },
        include: {
            events: {
                orderBy: { startTime: 'asc' },
                select: {
                    id: true,
                    title: true,
                    startTime: true
                }
            }
        }
    })
}

export async function createEventSeries(title: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    if (!title || title.trim() === '') {
        return { success: false, message: 'Title is required' }
    }

    try {
        const series = await prisma.eventSeries.create({
            data: {
                title: title.trim()
            }
        })

        await logActivity('CREATE', 'EventSeries', series.id, `Created event series: ${series.title}`)
        revalidatePath('/events')
        return { success: true, series }
    } catch (error) {
        console.error('Failed to create event series:', error)
        return { success: false, message: 'Failed to create event series' }
    }
}
