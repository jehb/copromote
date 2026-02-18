'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getEmailPlans() {
    try {
        const plans = await prisma.emailPlan.findMany({
            orderBy: {
                sendDate: 'desc',
            },
            include: {
                _count: {
                    select: { items: true },
                },
            },
        })
        return { success: true, data: plans }
    } catch (error) {
        console.error('Failed to fetch email plans:', error)
        return { success: false, error: 'Failed to fetch email plans' }
    }
}

export async function getEmailPlan(id: string) {
    try {
        const plan = await prisma.emailPlan.findUnique({
            where: { id },
            include: {
                items: {
                    orderBy: {
                        order: 'asc',
                    },
                    include: {
                        events: true,
                    },
                },
            },
        })

        if (!plan) {
            return { success: false, error: 'Email plan not found' }
        }

        return { success: true, data: plan }
    } catch (error) {
        console.error('Failed to fetch email plan:', error)
        return { success: false, error: 'Failed to fetch email plan' }
    }
}

export async function createEmailPlan(data: {
    subject: string
    sendDate: Date
    notes?: string
}) {
    try {
        const plan = await prisma.emailPlan.create({
            data: {
                subject: data.subject,
                sendDate: data.sendDate,
                notes: data.notes,
            },
        })

        revalidatePath('/email-planner')
        return { success: true, data: plan }
    } catch (error) {
        console.error('Failed to create email plan:', error)
        return { success: false, error: 'Failed to create email plan' }
    }
}

export async function updateEmailPlan(
    id: string,
    data: {
        subject?: string
        sendDate?: Date
        notes?: string
    }
) {
    try {
        const plan = await prisma.emailPlan.update({
            where: { id },
            data: {
                ...data,
            },
        })

        revalidatePath('/email-planner')
        revalidatePath(`/email-planner/${id}`)
        return { success: true, data: plan }
    } catch (error) {
        console.error('Failed to update email plan:', error)
        return { success: false, error: 'Failed to update email plan' }
    }
}

export async function deleteEmailPlan(id: string) {
    try {
        await prisma.emailPlan.delete({
            where: { id },
        })

        revalidatePath('/email-planner')
        return { success: true }
    } catch (error) {
        console.error('Failed to delete email plan:', error)
        return { success: false, error: 'Failed to delete email plan' }
    }
}
