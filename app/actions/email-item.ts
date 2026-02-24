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

export async function addItemProduct(itemId: string, upc: string) {
    try {
        const item = await prisma.emailItemProduct.create({
            data: {
                itemId,
                upc,
            },
            include: {
                item: { select: { planId: true } },
            },
        })

        revalidatePath(`/email-planner/${item.item.planId}`)
        return { success: true }
    } catch (error) {
        console.error('Failed to add product to item:', error)
        return { success: false, error: 'Failed to add product to item' }
    }
}

export async function removeItemProduct(itemId: string, upc: string) {
    try {
        const product = await prisma.emailItemProduct.findUnique({
            where: {
                itemId_upc: {
                    itemId,
                    upc,
                }
            },
            include: {
                item: { select: { planId: true } },
            },
        })

        if (!product) return { success: false, error: 'Product not found on item' }

        await prisma.emailItemProduct.delete({
            where: {
                itemId_upc: {
                    itemId,
                    upc,
                }
            },
        })

        revalidatePath(`/email-planner/${product.item.planId}`)
        return { success: true }
    } catch (error) {
        console.error('Failed to remove product from item:', error)
        return { success: false, error: 'Failed to remove product from item' }
    }
}

export async function updateItemAsset(itemId: string, assetId: string | null) {
    try {
        const item = await prisma.emailItem.update({
            where: { id: itemId },
            data: {
                savedAssetId: assetId,
            },
            select: { planId: true },
        })

        revalidatePath(`/email-planner/${item.planId}`)
        return { success: true }
    } catch (error) {
        console.error('Failed to update asset on item:', error)
        return { success: false, error: 'Failed to update asset on item' }
    }
}

export async function addItemPhoto(itemId: string, photoId: string) {
    try {
        const item = await prisma.emailItemPhoto.create({
            data: {
                itemId,
                photoId,
            },
            include: {
                item: { select: { planId: true } },
            },
        })

        revalidatePath(`/email-planner/${item.item.planId}`)
        return { success: true }
    } catch (error) {
        console.error('Failed to add photo to item:', error)
        return { success: false, error: 'Failed to add photo to item' }
    }
}

export async function removeItemPhoto(itemId: string, photoId: string) {
    try {
        const photo = await prisma.emailItemPhoto.findUnique({
            where: {
                itemId_photoId: {
                    itemId,
                    photoId,
                }
            },
            include: {
                item: { select: { planId: true } },
            },
        })

        if (!photo) return { success: false, error: 'Photo not found on item' }

        await prisma.emailItemPhoto.delete({
            where: {
                itemId_photoId: {
                    itemId,
                    photoId,
                }
            },
        })

        revalidatePath(`/email-planner/${photo.item.planId}`)
        return { success: true }
    } catch (error) {
        console.error('Failed to remove photo from item:', error)
        return { success: false, error: 'Failed to remove photo from item' }
    }
}
