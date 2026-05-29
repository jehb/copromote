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
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logActivity } from '@/app/actions/activity-logs'

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

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

jest.mock('next/navigation', () => ({
    redirect: jest.fn(),
}))

jest.mock('@/app/actions/activity-logs', () => ({
    logActivity: jest.fn(),
}))

describe('Promotions Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        // Mock console.error to prevent pollution of test output
        jest.spyOn(console, 'error').mockImplementation(() => { })
    })

    describe('getPromotions', () => {
        it('should fetch all promotions ordered by startDate desc', async () => {
            const mockPromotions = [{ id: '1', name: 'Promo 1' }]
                ; (prisma.promotionPeriod.findMany as jest.Mock).mockResolvedValue(mockPromotions)

            const result = await getPromotions()

            expect(result).toEqual(mockPromotions)
            expect(prisma.promotionPeriod.findMany).toHaveBeenCalledWith(expect.objectContaining({
                orderBy: { startDate: 'desc' },
                include: expect.any(Object)
            }))
        })
    })

    describe('getPromotion', () => {
        it('should fetch a single promotion by id', async () => {
            const mockPromo = { id: '1', name: 'Promo 1' }
                ; (prisma.promotionPeriod.findUnique as jest.Mock).mockResolvedValue(mockPromo)

            const result = await getPromotion('1')

            expect(result).toEqual(mockPromo)
            expect(prisma.promotionPeriod.findUnique).toHaveBeenCalledWith({
                where: { id: '1' },
                include: expect.any(Object)
            })
        })
    })

    describe('createPromotion', () => {
        it('should create a promotion with valid data', async () => {
            const formData = new FormData()
            formData.append('name', 'New Promo')
            formData.append('startDate', '2025-01-01')
            formData.append('endDate', '2025-01-31')
            formData.append('adLiveDate', '2025-01-15')

                ; (prisma.promotionPeriod.create as jest.Mock).mockResolvedValue({ id: 'promo-1' })
                ; (redirect as unknown as jest.Mock).mockImplementation(() => { throw new Error('NEXT_REDIRECT') })

            await expect(createPromotion(formData)).rejects.toThrow('NEXT_REDIRECT')

            expect(prisma.promotionPeriod.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    name: 'New Promo',
                    startDate: new Date('2025-01-01'),
                    endDate: new Date('2025-01-31'),
                    adLiveDate: new Date('2025-01-15'),
                    adImageDeadline: null,
                    adPublishingDeadline: null,
                })
            })
            expect(logActivity).toHaveBeenCalledWith('CREATE', 'Promotion', 'promo-1', 'Created promotion: New Promo')
            expect(revalidatePath).toHaveBeenCalledWith('/promotions')
            expect(redirect).toHaveBeenCalledWith('/promotions')
        })

        it('should throw an error with invalid data', async () => {
            const formData = new FormData()
            formData.append('name', '') // Invalid name

            await expect(createPromotion(formData)).rejects.toThrow('Invalid data')
            expect(prisma.promotionPeriod.create).not.toHaveBeenCalled()
            expect(console.error).toHaveBeenCalled()
        })

        it('should create a promotion with valid data including all optional dates', async () => {
            const formData = new FormData()
            formData.append('name', 'Promo All Dates')
            formData.append('startDate', '2025-01-01')
            formData.append('endDate', '2025-01-31')
            formData.append('adLiveDate', '2025-01-15')
            formData.append('adImageDeadline', '2025-01-10')
            formData.append('adPublishingDeadline', '2025-01-12')

                ; (prisma.promotionPeriod.create as jest.Mock).mockResolvedValue({ id: 'promo-2' })
                ; (redirect as unknown as jest.Mock).mockImplementation(() => { throw new Error('NEXT_REDIRECT') })

            await expect(createPromotion(formData)).rejects.toThrow('NEXT_REDIRECT')

            expect(prisma.promotionPeriod.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    name: 'Promo All Dates',
                    startDate: new Date('2025-01-01'),
                    endDate: new Date('2025-01-31'),
                    adLiveDate: new Date('2025-01-15'),
                    adImageDeadline: new Date('2025-01-10'),
                    adPublishingDeadline: new Date('2025-01-12'),
                })
            })
        })
    })

    describe('updatePromotion', () => {
        it('should update a promotion with valid data', async () => {
            const formData = new FormData()
            formData.append('name', 'Updated Promo')
            formData.append('startDate', '2025-02-01')
            formData.append('endDate', '2025-02-28')

                ; (prisma.promotionPeriod.update as jest.Mock).mockResolvedValue({ id: 'promo-1' })
                ; (redirect as unknown as jest.Mock).mockImplementation(() => { throw new Error('NEXT_REDIRECT') })

            await expect(updatePromotion('promo-1', formData)).rejects.toThrow('NEXT_REDIRECT')

            expect(prisma.promotionPeriod.update).toHaveBeenCalledWith({
                where: { id: 'promo-1' },
                data: expect.objectContaining({
                    name: 'Updated Promo',
                    startDate: new Date('2025-02-01'),
                    endDate: new Date('2025-02-28'),
                    adLiveDate: null,
                    adImageDeadline: null,
                    adPublishingDeadline: null,
                })
            })
            expect(logActivity).toHaveBeenCalledWith('UPDATE', 'Promotion', 'promo-1', 'Updated promotion: Updated Promo')
            expect(revalidatePath).toHaveBeenCalledWith('/promotions/promo-1')
            expect(revalidatePath).toHaveBeenCalledWith('/promotions')
            expect(redirect).toHaveBeenCalledWith('/promotions/promo-1')
        })

        it('should throw an error with invalid data', async () => {
            const formData = new FormData()
            formData.append('name', '') // Invalid name

            await expect(updatePromotion('promo-1', formData)).rejects.toThrow('Invalid data')
            expect(prisma.promotionPeriod.update).not.toHaveBeenCalled()
            expect(console.error).toHaveBeenCalled()
        })
    })

    describe('deletePromotion', () => {
        it('should delete a promotion', async () => {
            ; (prisma.promotionPeriod.delete as jest.Mock).mockResolvedValue({ id: 'promo-1' })
                ; (redirect as unknown as jest.Mock).mockImplementation(() => { throw new Error('NEXT_REDIRECT') })

            await expect(deletePromotion('promo-1')).rejects.toThrow('NEXT_REDIRECT')

            expect(prisma.promotionPeriod.delete).toHaveBeenCalledWith({
                where: { id: 'promo-1' }
            })
            expect(logActivity).toHaveBeenCalledWith('DELETE', 'Promotion', 'promo-1', 'Deleted promotion')
            expect(revalidatePath).toHaveBeenCalledWith('/promotions')
            expect(redirect).toHaveBeenCalledWith('/promotions')
        })
    })

    describe('addAssetToPromotion', () => {
        it('should add an asset to a promotion', async () => {
            const formData = new FormData()
            formData.append('promotionPeriodId', 'promo-1')
            formData.append('name', 'Image 1')
            formData.append('type', 'image')
            formData.append('url', 'http://example.com/image.jpg')

                ; (prisma.asset.create as jest.Mock).mockResolvedValue({ id: 'asset-1' })

            await addAssetToPromotion(formData)

            expect(prisma.asset.create).toHaveBeenCalledWith({
                data: {
                    name: 'Image 1',
                    type: 'image',
                    url: 'http://example.com/image.jpg',
                    promotionPeriodId: 'promo-1'
                }
            })
            expect(revalidatePath).toHaveBeenCalledWith('/promotions/promo-1')
        })

        it('should return early if required fields are missing', async () => {
            const formData = new FormData()
            formData.append('promotionPeriodId', 'promo-1')
            // Missing name and url

            await addAssetToPromotion(formData)

            expect(prisma.asset.create).not.toHaveBeenCalled()
            expect(revalidatePath).not.toHaveBeenCalled()
        })
    })

    describe('deletePromotionAsset', () => {
        it('should delete an asset from a promotion', async () => {
            ; (prisma.asset.delete as jest.Mock).mockResolvedValue({ id: 'asset-1' })

            await deletePromotionAsset('asset-1', 'promo-1')

            expect(prisma.asset.delete).toHaveBeenCalledWith({
                where: { id: 'asset-1' }
            })
            expect(revalidatePath).toHaveBeenCalledWith('/promotions/promo-1')
        })
    })
})
