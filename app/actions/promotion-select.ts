'use server'

import { prisma } from '@/lib/db'

export async function getPromotionPeriods() {
    return await prisma.promotionPeriod.findMany({
        orderBy: { startDate: 'asc' }
    })
}
