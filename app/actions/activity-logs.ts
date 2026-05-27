'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export async function logActivity(
    action: string,
    entityType: string,
    entityId?: string,
    details?: string,
    metadata?: any,
    userId?: string
) {
    try {
        const session = !userId ? await getSession() : null
        const finalUserId = userId || session?.id

        await prisma.activityLog.create({
            data: {
                action,
                entityType,
                entityId,
                details,
                metadata: metadata ? JSON.stringify(metadata) : undefined,
                userId: finalUserId
            }
        })
    } catch (error) {
        // Silently fail to avoid blocking the main action
        console.error('Failed to log activity:', error)
    }
}

export async function getActivityLogs() {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
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
