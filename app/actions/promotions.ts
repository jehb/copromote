'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

// New function to fetch all promotions for dropdowns
export async function getPromotionPeriods() {
    return await prisma.promotionPeriod.findMany({
        orderBy: { startDate: 'desc' }
    })
}

export async function getPromotion(id: string) {
    return await prisma.promotionPeriod.findUnique({
        where: { id },
        include: {
            assets: true,
            posts: {
                orderBy: { scheduledDate: 'asc' }
            }
        }
    })
}

export async function addAssetToPromotion(formData: FormData) {
    const name = formData.get('name') as string
    const type = formData.get('type') as string
    const url = formData.get('url') as string
    const promotionPeriodId = formData.get('promotionPeriodId') as string

    await prisma.asset.create({
        data: {
            name,
            type,
            url,
            promotionPeriodId
        }
    })

    revalidatePath(`/promotions/${promotionPeriodId}`)
}

export async function deletePromotionAsset(id: string, promotionPeriodId: string) {
    await prisma.asset.delete({ where: { id } })
    revalidatePath(`/promotions/${promotionPeriodId}`)
}
