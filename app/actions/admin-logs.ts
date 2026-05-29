'use server'
import { getSession } from '@/lib/session'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getSecurityLogs() {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    try {
        const logs = await prisma.securityLog.findMany({
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { username: true, email: true } } },
            take: 100 // Limit to recent 100 logs
        })
        return logs
    } catch (error) {
        console.error('Failed to fetch logs:', error)
        return []
    }
}

import { headers } from 'next/headers'

export async function logSecurityEvent(
    action: string,
    details?: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    try {
        const headerStore = await headers()

        // Auto-detect IP if not provided
        if (!ipAddress) {
            const forwardedFor = headerStore.get('x-forwarded-for')
            if (forwardedFor) {
                ipAddress = forwardedFor.split(',')[0].trim()
            } else {
                ipAddress = headerStore.get('x-real-ip') || 'Unknown IP'
            }
        }

        // Auto-detect User Agent if not provided
        if (!userAgent || userAgent === 'System') {
            userAgent = headerStore.get('user-agent') || 'Unknown User Agent'
        }

        await prisma.securityLog.create({
            data: {
                action,
                details,
                userId,
                ipAddress,
                userAgent
            }
        })
        revalidatePath('/admin/logs')
    } catch (error) {
        console.error('Failed to log security event:', error)
    }
}
