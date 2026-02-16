'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export async function logActivity(
    action: string,
    entityType: string,
    entityId?: string,
    details?: string,
    metadata?: any
) {
    try {
        const session = await getSession()
        const userId = session?.id

        await prisma.activityLog.create({
            data: {
                action,
                entityType,
                entityId,
                details,
                metadata: metadata ? JSON.stringify(metadata) : undefined,
                userId
            }
        })
    } catch (error) {
        // Silently fail to avoid blocking the main action
        console.error('Failed to log activity:', error)
    }
}

export async function getActivityLogs() {
    try {
        return await prisma.activityLog.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        username: true,
                        email: true,
                        avatar: true
                    }
                }
            },
            take: 100
        })
    } catch (error) {
        console.error('Failed to fetch activity logs:', error)
        return []
    }
}
