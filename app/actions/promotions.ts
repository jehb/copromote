'use server'
import { getSession } from '@/lib/session'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { logActivity } from '@/app/actions/activity-logs'

const PromotionSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    startDate: z.string().transform((str) => new Date(str)),
    endDate: z.string().transform((str) => new Date(str)),
    adLiveDate: z.string().nullable().optional().transform((str) => {
        if (!str) return null
        return new Date(str)
    }),
    adImageDeadline: z.string().nullable().optional().transform((str) => {
        if (!str) return null
        return new Date(str)
    }),
    adPublishingDeadline: z.string().nullable().optional().transform((str) => {
        if (!str) return null
        return new Date(str)
    }),
})

export async function getPromotions() {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    return await prisma.promotionPeriod.findMany({
        orderBy: { startDate: 'desc' },
        include: {
            _count: {
                select: {
                    assets: true,
                    posts: true
                }
            }
        }
    })
}

export async function getPromotion(id: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    return await prisma.promotionPeriod.findUnique({
        where: { id },
        include: {
            assets: true,
            posts: true,
        },
    })
}

export async function createPromotion(formData: FormData) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const rawData = {
        name: formData.get('name') as string,
        startDate: formData.get('startDate') as string,
        endDate: formData.get('endDate') as string,
        adLiveDate: formData.get('adLiveDate') as string,
        adImageDeadline: formData.get('adImageDeadline') as string,
        adPublishingDeadline: formData.get('adPublishingDeadline') as string,
    }

    const result = PromotionSchema.safeParse(rawData)

    if (!result.success) {
        console.error(result.error)
        throw new Error('Invalid data')
    }

    const promotion = await prisma.promotionPeriod.create({
        data: result.data,
    })

    await logActivity('CREATE', 'Promotion', promotion.id, `Created promotion: ${result.data.name}`)

    revalidatePath('/promotions')
    redirect('/promotions')
}

export async function updatePromotion(id: string, formData: FormData) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const rawData = {
        name: formData.get('name') as string,
        startDate: formData.get('startDate') as string,
        endDate: formData.get('endDate') as string,
        adLiveDate: formData.get('adLiveDate') as string,
        adImageDeadline: formData.get('adImageDeadline') as string,
        adPublishingDeadline: formData.get('adPublishingDeadline') as string,
    }

    const result = PromotionSchema.safeParse(rawData)

    if (!result.success) {
        console.error(result.error)
        throw new Error('Invalid data')
    }

    await prisma.promotionPeriod.update({
        where: { id },
        data: result.data,
    })

    await logActivity('UPDATE', 'Promotion', id, `Updated promotion: ${result.data.name}`)

    revalidatePath(`/promotions/${id}`)
    revalidatePath('/promotions')
    redirect(`/promotions/${id}`)
}

export async function deletePromotion(id: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    await prisma.promotionPeriod.delete({
        where: { id },
    })

    await logActivity('DELETE', 'Promotion', id, 'Deleted promotion')

    revalidatePath('/promotions')
    redirect('/promotions')
}

// Asset Management
export async function addAssetToPromotion(formData: FormData) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const promotionPeriodId = formData.get('promotionPeriodId') as string
    const name = formData.get('name') as string
    const type = formData.get('type') as string
    const url = formData.get('url') as string

    if (!promotionPeriodId || !name || !url) return

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

export async function deletePromotionAsset(assetId: string, promotionPeriodId: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    await prisma.asset.delete({
        where: { id: assetId }
    })
    revalidatePath(`/promotions/${promotionPeriodId}`)
}
