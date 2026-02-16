
import {
    getPromotions,
    getPromotion,
    createPromotion,
    updatePromotion,
    deletePromotion,
    addAssetToPromotion,
    deletePromotionAsset
} from '@/app/actions/promotions'
import { prisma } from '@/lib/db'
import { logActivity } from '@/app/actions/activity-logs'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Mock dependencies
jest.mock('@/lib/db', () => ({
    prisma: {
        promotionPeriod: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        asset: {
            create: jest.fn(),
            delete: jest.fn(),
        }
    },
}))

jest.mock('@/app/actions/activity-logs', () => ({
    logActivity: jest.fn(),
}))

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

// redirect is mocked in jest.setup.ts

describe('Promotion Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('getPromotions', () => {
        it('should fetch promotions', async () => {
            const mockData = [{ id: '1', name: 'Promo 1' }]
                ; (prisma.promotionPeriod.findMany as jest.Mock).mockResolvedValue(mockData)

            const result = await getPromotions()
            expect(result).toEqual(mockData)
        })
    })

    describe('createPromotion', () => {
        it('should create promotion and redirect', async () => {
            const formData = new FormData()
            formData.append('name', 'New Promo')
            formData.append('startDate', '2023-01-01')
            formData.append('endDate', '2023-01-31')

                ; (prisma.promotionPeriod.create as jest.Mock).mockResolvedValue({ id: '1', name: 'New Promo' })

            await createPromotion(formData)

            expect(prisma.promotionPeriod.create).toHaveBeenCalled()
            expect(logActivity).toHaveBeenCalledWith('CREATE', 'Promotion', '1', expect.any(String))
            expect(redirect).toHaveBeenCalledWith('/promotions')
        })

        it('should return error on invalid data', async () => {
            const formData = new FormData()
            // Missing required fields

            await expect(createPromotion(formData)).rejects.toThrow('Invalid data')
            expect(prisma.promotionPeriod.create).not.toHaveBeenCalled()
        })
    })

    describe('updatePromotion', () => {
        it('should update promotion', async () => {
            const formData = new FormData()
            formData.append('name', 'Updated Promo')
            formData.append('startDate', '2023-01-01')
            formData.append('endDate', '2023-01-31')

            await updatePromotion('1', formData)

            expect(prisma.promotionPeriod.update).toHaveBeenCalled()
            expect(revalidatePath).toHaveBeenCalledWith('/promotions')
        })
    })

    describe('deletePromotion', () => {
        it('should delete promotion', async () => {
            await deletePromotion('1')
            expect(prisma.promotionPeriod.delete).toHaveBeenCalledWith({ where: { id: '1' } })
            expect(redirect).toHaveBeenCalledWith('/promotions')
        })
    })

    describe('addAssetToPromotion', () => {
        it('should add asset', async () => {
            const formData = new FormData()
            formData.append('promotionPeriodId', 'p1')
            formData.append('name', 'Asset 1')
            formData.append('type', 'image')
            formData.append('url', 'http://example.com/img.jpg')

            await addAssetToPromotion(formData)

            expect(prisma.asset.create).toHaveBeenCalled()
            expect(revalidatePath).toHaveBeenCalledWith('/promotions/p1')
        })
    })

    describe('deletePromotionAsset', () => {
        it('should delete asset', async () => {
            await deletePromotionAsset('a1', 'p1')
            expect(prisma.asset.delete).toHaveBeenCalledWith({ where: { id: 'a1' } })
            expect(revalidatePath).toHaveBeenCalledWith('/promotions/p1')
        })
    })
})
