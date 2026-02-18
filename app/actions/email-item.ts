'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createEmailItem(
    planId: string,
    data: {
        title: string
        description?: string
        order?: number
    }
) {
    try {
        const item = await prisma.emailItem.create({
            data: {
                planId,
                title: data.title,
                description: data.description,
                order: data.order ?? 0,
            },
        })

        revalidatePath(`/email-planner/${planId}`)
        return { success: true, data: item }
    } catch (error) {
        console.error('Failed to create email item:', error)
        return { success: false, error: 'Failed to create email item' }
    }
}

export async function updateEmailItem(
    id: string,
    data: {
        title?: string
        description?: string
        order?: number
    }
) {
    try {
        // Find the planId first to revalidate
        const currentItem = await prisma.emailItem.findUnique({
            where: { id },
            select: { planId: true },
        })

        if (!currentItem) {
            return { success: false, error: 'Item not found' }
        }

        const item = await prisma.emailItem.update({
            where: { id },
            data: {
                ...data,
            },
        })

        revalidatePath(`/email-planner/${currentItem.planId}`)
        return { success: true, data: item }
    } catch (error) {
        console.error('Failed to update email item:', error)
        return { success: false, error: 'Failed to update email item' }
    }
}

export async function deleteEmailItem(id: string) {
    try {
        const currentItem = await prisma.emailItem.findUnique({
            where: { id },
            select: { planId: true },
        })

        if (!currentItem) return { success: false, error: 'Item not found' }

        await prisma.emailItem.delete({
            where: { id },
        })

        revalidatePath(`/email-planner/${currentItem.planId}`)
        return { success: true }
    } catch (error) {
        console.error('Failed to delete email item:', error)
        return { success: false, error: 'Failed to delete email item' }
    }
}

export async function addItemEvent(itemId: string, eventId: string) {
    try {
        const item = await prisma.emailItem.update({
            where: { id: itemId },
            data: {
                events: {
                    connect: { id: eventId },
                },
            },
            select: { planId: true },
        })

        revalidatePath(`/email-planner/${item.planId}`)
        return { success: true }
    } catch (error) {
        console.error('Failed to add event to item:', error)
        return { success: false, error: 'Failed to add event to item' }
    }
}

export async function removeItemEvent(itemId: string, eventId: string) {
    try {
        const item = await prisma.emailItem.update({
            where: { id: itemId },
            data: {
                events: {
                    disconnect: { id: eventId },
                },
            },
            select: { planId: true },
        })

        revalidatePath(`/email-planner/${item.planId}`)
        return { success: true }
    } catch (error) {
        console.error('Failed to remove event from item:', error)
        return { success: false, error: 'Failed to remove event from item' }
    }
}

export async function reorderEmailItems(items: { id: string; order: number }[]) {
    try {
        // We need to know the planId to revalidate. 
        // Optimization: fetch it from the first item if list is not empty.
        let planId = ''
        if (items.length > 0) {
            const firstItem = await prisma.emailItem.findUnique({
                where: { id: items[0].id },
                select: { planId: true }
            })
            if (firstItem) planId = firstItem.planId
        }

        // Use a transaction to update all items
        await prisma.$transaction(
            items.map((item) =>
                prisma.emailItem.update({
                    where: { id: item.id },
                    data: { order: item.order },
                })
            )
        )

        if (planId) {
            revalidatePath(`/email-planner/${planId}`)
        }

        return { success: true }
    } catch (error) {
        console.error('Failed to reorder items:', error)
        return { success: false, error: 'Failed to reorder items' }
    }
}
