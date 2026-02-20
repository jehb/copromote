import {
    getEmailPlans,
    getEmailPlan,
    createEmailPlan,
    updateEmailPlan,
    deleteEmailPlan,
} from '@/app/actions/email-plan'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        emailPlan: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    },
}))

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

describe('Email Plan Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('getEmailPlans', () => {
        it('should fetch all email plans successfully', async () => {
            const mockPlans = [{ id: '1', subject: 'Test Plan' }]
                ; (prisma.emailPlan.findMany as jest.Mock).mockResolvedValue(mockPlans)

            const result = await getEmailPlans()

            expect(result.success).toBe(true)
            expect(result.data).toEqual(mockPlans)
            expect(prisma.emailPlan.findMany).toHaveBeenCalledWith({
                orderBy: { sendDate: 'desc' },
                include: { _count: { select: { items: true } } },
            })
        })

        it('should handle errors when fetching email plans', async () => {
            ; (prisma.emailPlan.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'))

            const result = await getEmailPlans()

            expect(result.success).toBe(false)
            expect(result.error).toBe('Failed to fetch email plans')
        })
    })

    describe('getEmailPlan', () => {
        it('should fetch a single email plan successfully', async () => {
            const mockPlan = { id: '1', subject: 'Test Plan', items: [] }
                ; (prisma.emailPlan.findUnique as jest.Mock).mockResolvedValue(mockPlan)

            const result = await getEmailPlan('1')

            expect(result.success).toBe(true)
            expect(result.data).toEqual(mockPlan)
            expect(prisma.emailPlan.findUnique).toHaveBeenCalledWith({
                where: { id: '1' },
                include: {
                    items: {
                        orderBy: { order: 'asc' },
                        include: { events: true },
                    },
                },
            })
        })

        it('should return error if plan not found', async () => {
            ; (prisma.emailPlan.findUnique as jest.Mock).mockResolvedValue(null)

            const result = await getEmailPlan('999')

            expect(result.success).toBe(false)
            expect(result.error).toBe('Email plan not found')
        })

        it('should handle errors when fetching a single plan', async () => {
            ; (prisma.emailPlan.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'))

            const result = await getEmailPlan('1')

            expect(result.success).toBe(false)
            expect(result.error).toBe('Failed to fetch email plan')
        })
    })

    describe('createEmailPlan', () => {
        const testDate = new Date('2024-01-01')

        it('should create an email plan successfully', async () => {
            const newPlan = { id: '2', subject: 'New Plan', sendDate: testDate }
                ; (prisma.emailPlan.create as jest.Mock).mockResolvedValue(newPlan)

            const result = await createEmailPlan({
                subject: 'New Plan',
                sendDate: testDate,
                notes: 'Some notes',
            })

            expect(result.success).toBe(true)
            expect(result.data).toEqual(newPlan)
            expect(prisma.emailPlan.create).toHaveBeenCalledWith({
                data: {
                    subject: 'New Plan',
                    sendDate: testDate,
                    notes: 'Some notes',
                },
            })
            expect(revalidatePath).toHaveBeenCalledWith('/email-planner')
        })

        it('should handle errors when creating a plan', async () => {
            ; (prisma.emailPlan.create as jest.Mock).mockRejectedValue(new Error('DB Error'))

            const result = await createEmailPlan({
                subject: 'New Plan',
                sendDate: testDate,
            })

            expect(result.success).toBe(false)
            expect(result.error).toBe('Failed to create email plan')
        })
    })

    describe('updateEmailPlan', () => {
        it('should update an email plan successfully', async () => {
            const updatedPlan = { id: '1', subject: 'Updated Plan' }
                ; (prisma.emailPlan.update as jest.Mock).mockResolvedValue(updatedPlan)

            const result = await updateEmailPlan('1', { subject: 'Updated Plan' })

            expect(result.success).toBe(true)
            expect(result.data).toEqual(updatedPlan)
            expect(prisma.emailPlan.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: { subject: 'Updated Plan' },
            })
            expect(revalidatePath).toHaveBeenCalledWith('/email-planner')
            expect(revalidatePath).toHaveBeenCalledWith('/email-planner/1')
        })

        it('should handle errors when updating a plan', async () => {
            ; (prisma.emailPlan.update as jest.Mock).mockRejectedValue(new Error('DB Error'))

            const result = await updateEmailPlan('1', { subject: 'Updated Plan' })

            expect(result.success).toBe(false)
            expect(result.error).toBe('Failed to update email plan')
        })
    })

    describe('deleteEmailPlan', () => {
        it('should delete an email plan successfully', async () => {
            ; (prisma.emailPlan.delete as jest.Mock).mockResolvedValue({})

            const result = await deleteEmailPlan('1')

            expect(result.success).toBe(true)
            expect(prisma.emailPlan.delete).toHaveBeenCalledWith({
                where: { id: '1' },
            })
            expect(revalidatePath).toHaveBeenCalledWith('/email-planner')
        })

        it('should handle errors when deleting a plan', async () => {
            ; (prisma.emailPlan.delete as jest.Mock).mockRejectedValue(new Error('DB Error'))

            const result = await deleteEmailPlan('1')

            expect(result.success).toBe(false)
            expect(result.error).toBe('Failed to delete email plan')
        })
    })
})
