'use server'
import { getSession } from '@/lib/session'

import { prisma } from '@/lib/db'

export type EventItem = {
    id: string
    title: string
    date: Date
    type: 'project_start' | 'project_end' | 'event' | 'promotion_start' | 'promotion_end' | 'social_post' | 'logistics_event' | 'promotion_ad_live' | 'promotion_image_deadline' | 'promotion_publishing_deadline' | 'theme'
    description?: string
    projectId?: string
}

export async function getCalendarEvents(): Promise<EventItem[]> {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    // Bolt: Parallelize independent DB queries to eliminate N+1 latency blocking on calendar dashboard load
    const [
        projects,
        events,
        promotions,
        themes,
        logisticsEvents,
        socialPosts
    ] = await Promise.all([
        prisma.project.findMany(),
        prisma.calendarEvent.findMany(),
        prisma.promotionPeriod.findMany(),
        prisma.theme.findMany(),
        prisma.event.findMany({ include: { location: true } }),
        prisma.socialPost.findMany({ where: { scheduledDate: { not: null } } })
    ])

    const items: EventItem[] = []

    projects.forEach((p: any) => {
        items.push({
            id: p.id,
            title: `${p.name} (Start)`,
            date: p.startDate,
            type: 'project_start',
            projectId: p.id
        })
        if (p.endDate) {
            items.push({
                id: p.id + '_end',
                title: `${p.name} (End)`,
                date: p.endDate,
                type: 'project_end',
                projectId: p.id
            })
        }
    })

    promotions.forEach((p: any) => {
        items.push({
            id: p.id + '_start',
            title: `${p.name} (Start)`,
            date: p.startDate,
            type: 'promotion_start',
            description: 'Promotion Start',
            projectId: p.id
        })
        items.push({
            id: p.id + '_end',
            title: `${p.name} (End)`,
            date: p.endDate,
            type: 'promotion_end',
            description: 'Promotion End',
            projectId: p.id
        })

        if (p.adLiveDate) {
            items.push({
                id: p.id + '_ad_live',
                title: `${p.name} (Ad Live)`,
                date: p.adLiveDate,
                type: 'promotion_ad_live',
                projectId: p.id
            })
        }
        if (p.adImageDeadline) {
            items.push({
                id: p.id + '_image_deadline',
                title: `${p.name} (Image Deadline)`,
                date: p.adImageDeadline,
                type: 'promotion_image_deadline',
                projectId: p.id
            })
        }
        if (p.adPublishingDeadline) {
            items.push({
                id: p.id + '_publishing_deadline',
                title: `${p.name} (Publishing Deadline)`,
                date: p.adPublishingDeadline,
                type: 'promotion_publishing_deadline',
                projectId: p.id
            })
        }
    })

    events.forEach((e: any) => {
        items.push({
            id: e.id,
            title: e.title,
            date: e.date,
            type: 'event',
            projectId: e.projectId || undefined
        })
    })

    logisticsEvents.forEach((e: any) => {
        items.push({
            id: e.id,
            title: `${e.title} @ ${e.location.name}`,
            date: e.startTime,
            type: 'logistics_event',
            description: e.description || undefined
        })
    })

    socialPosts.forEach((p: any) => {
        if (p.scheduledDate) {
            items.push({
                id: p.id,
                title: `${p.platform}: ${p.content.substring(0, 20)}...`,
                date: p.scheduledDate,
                type: 'social_post',
                projectId: p.id // using id for linking
            })
        }
    })

    themes.forEach((t: any) => {
        const start = new Date(t.startDate)
        const end = new Date(t.endDate)
        
        const years = t.isRecurring ? [-1, 0, 1, 2] : [0]
        
        years.forEach(offset => {
            const currentYear = new Date().getFullYear() + offset
            const origYear = start.getFullYear()
            
            const projectedStart = new Date(start)
            projectedStart.setFullYear(currentYear)
            
            const projectedEnd = new Date(end)
            projectedEnd.setFullYear(currentYear)

            const currentDate = new Date(projectedStart)
            // Limit to avoid infinite loops if dates are bad
            let safeCounter = 0
            while (currentDate <= projectedEnd && safeCounter < 366) {
                items.push({
                    id: t.id + '_' + currentYear + '_' + currentDate.toISOString(),
                    title: t.name,
                    date: new Date(currentDate),
                    type: 'theme',
                    description: t.description || undefined,
                    projectId: t.id
                })
                currentDate.setDate(currentDate.getDate() + 1)
                safeCounter++
            }
        })
    })

    return items
}
