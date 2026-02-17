'use server'

import { prisma } from '@/lib/db'

export type EventItem = {
    id: string
    title: string
    date: Date
    type: 'project_start' | 'project_end' | 'event' | 'promotion_start' | 'promotion_end' | 'social_post' | 'logistics_event' | 'promotion_ad_live' | 'promotion_image_deadline' | 'promotion_publishing_deadline'
    description?: string
    projectId?: string
}

export async function getCalendarEvents(): Promise<EventItem[]> {
    const projects = await prisma.project.findMany()
    const events = await prisma.calendarEvent.findMany()
    const promotions = await prisma.promotionPeriod.findMany()

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

    const logisticsEvents = await prisma.event.findMany({
        include: { location: true }
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

    const socialPosts = await prisma.socialPost.findMany({
        where: {
            scheduledDate: { not: null }
        }
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

    return items
}
