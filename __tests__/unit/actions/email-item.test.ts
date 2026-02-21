import {
    createEmailItem,
    updateEmailItem,
    deleteEmailItem,
    addItemEvent,
    removeItemEvent,
    addItemProduct,
    removeItemProduct,
    reorderEmailItems,
} from '@/app/actions/email-item'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

jest.mock('@/lib/prisma', () => ({
    prisma: {
        emailItem: {
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findUnique: jest.fn(),
        },
        emailItemProduct: {
            create: jest.fn(),
            delete: jest.fn(),
            findUnique: jest.fn(),
        },
        $transaction: jest.fn(),
    },
}))

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

describe('Email Item Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.spyOn(console, 'error').mockImplementation(() => { })
    })

    describe('createEmailItem', () => {
        it('should create an email item successfully', async () => {
            const mockItem = { id: '1', planId: 'p1', title: 'New Item', order: 0 }
                ; (prisma.emailItem.create as jest.Mock).mockResolvedValue(mockItem)

            const result = await createEmailItem('p1', { title: 'New Item' })

            expect(result.success).toBe(true)
            expect(result.data).toEqual(mockItem)
            expect(prisma.emailItem.create).toHaveBeenCalledWith({
                data: {
                    planId: 'p1',
                    title: 'New Item',
                    description: undefined,
                    order: 0,
                },
            })
            expect(revalidatePath).toHaveBeenCalledWith('/email-planner/p1')
        })

        it('should handle errors when creating an item', async () => {
            ; (prisma.emailItem.create as jest.Mock).mockImplementationOnce(async () => { throw new Error('DB Error') })

            const result = await createEmailItem('p1', { title: 'New Item' })

            expect(result.success).toBe(false)
            expect(result.error).toBe('Failed to create email item')
        })
    })

    describe('updateEmailItem', () => {
        it('should update an email item successfully', async () => {
            ; (prisma.emailItem.findUnique as jest.Mock).mockResolvedValue({ planId: 'p1' })
            const updatedItem = { id: '1', planId: 'p1', title: 'Updated' }
                ; (prisma.emailItem.update as jest.Mock).mockResolvedValue(updatedItem)

            const result = await updateEmailItem('1', { title: 'Updated' })

            expect(result.success).toBe(true)
            expect(result.data).toEqual(updatedItem)
            expect(prisma.emailItem.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: { title: 'Updated' },
            })
            expect(revalidatePath).toHaveBeenCalledWith('/email-planner/p1')
        })

        it('should return error if item not found', async () => {
            ; (prisma.emailItem.findUnique as jest.Mock).mockResolvedValue(null)

            const result = await updateEmailItem('1', { title: 'Updated' })

            expect(result.success).toBe(false)
            expect(result.error).toBe('Item not found')
        })

        it('should handle errors when updating an item', async () => {
            ; (prisma.emailItem.findUnique as jest.Mock).mockImplementationOnce(async () => { throw new Error('DB Error') })

            const result = await updateEmailItem('1', { title: 'Updated' })

            expect(result.success).toBe(false)
            expect(result.error).toBe('Failed to update email item')
        })
    })

    describe('deleteEmailItem', () => {
        it('should delete an email item successfully', async () => {
            ; (prisma.emailItem.findUnique as jest.Mock).mockResolvedValue({ planId: 'p1' })
                ; (prisma.emailItem.delete as jest.Mock).mockResolvedValue({})

            const result = await deleteEmailItem('1')

            expect(result.success).toBe(true)
            expect(prisma.emailItem.delete).toHaveBeenCalledWith({ where: { id: '1' } })
            expect(revalidatePath).toHaveBeenCalledWith('/email-planner/p1')
        })

        it('should return error if item not found for deletion', async () => {
            ; (prisma.emailItem.findUnique as jest.Mock).mockResolvedValue(null)

            const result = await deleteEmailItem('1')

            expect(result.success).toBe(false)
            expect(result.error).toBe('Item not found')
        })

        it('should handle errors when deleting an item', async () => {
            ; (prisma.emailItem.findUnique as jest.Mock).mockImplementationOnce(async () => { throw new Error('DB Error') })

            const result = await deleteEmailItem('1')

            expect(result.success).toBe(false)
            expect(result.error).toBe('Failed to delete email item')
        })
    })

    describe('addItemEvent', () => {
        it('should add event to item successfully', async () => {
            ; (prisma.emailItem.update as jest.Mock).mockResolvedValue({ planId: 'p1' })

            const result = await addItemEvent('1', 'e1')

            expect(result.success).toBe(true)
            expect(prisma.emailItem.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: { events: { connect: { id: 'e1' } } },
                select: { planId: true },
            })
            expect(revalidatePath).toHaveBeenCalledWith('/email-planner/p1')
        })

        it('should handle errors when adding event', async () => {
            ; (prisma.emailItem.update as jest.Mock).mockImplementationOnce(async () => { throw new Error('DB Error') })

            const result = await addItemEvent('1', 'e1')

            expect(result.success).toBe(false)
            expect(result.error).toBe('Failed to add event to item')
        })
    })

    describe('removeItemEvent', () => {
        it('should remove event from item successfully', async () => {
            ; (prisma.emailItem.update as jest.Mock).mockResolvedValue({ planId: 'p1' })

            const result = await removeItemEvent('1', 'e1')

            expect(result.success).toBe(true)
            expect(prisma.emailItem.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: { events: { disconnect: { id: 'e1' } } },
                select: { planId: true },
            })
            expect(revalidatePath).toHaveBeenCalledWith('/email-planner/p1')
        })

        it('should handle errors when removing event', async () => {
            ; (prisma.emailItem.update as jest.Mock).mockImplementationOnce(async () => { throw new Error('DB Error') })

            const result = await removeItemEvent('1', 'e1')

            expect(result.success).toBe(false)
            expect(result.error).toBe('Failed to remove event from item')
        })
    })

    describe('addItemProduct', () => {
        it('should add product to item successfully', async () => {
            ; (prisma.emailItemProduct.create as jest.Mock).mockResolvedValue({ item: { planId: 'p1' } })

            const result = await addItemProduct('1', '123456789012')

            expect(result.success).toBe(true)
            expect(prisma.emailItemProduct.create).toHaveBeenCalledWith({
                data: { itemId: '1', upc: '123456789012' },
                include: { item: { select: { planId: true } } },
            })
            expect(revalidatePath).toHaveBeenCalledWith('/email-planner/p1')
        })

        it('should handle errors when adding product', async () => {
            ; (prisma.emailItemProduct.create as jest.Mock).mockImplementationOnce(async () => { throw new Error('DB Error') })

            const result = await addItemProduct('1', '123456789012')

            expect(result.success).toBe(false)
            expect(result.error).toBe('Failed to add product to item')
        })
    })

    describe('removeItemProduct', () => {
        it('should remove product from item successfully', async () => {
            ; (prisma.emailItemProduct.findUnique as jest.Mock).mockResolvedValue({ item: { planId: 'p1' } })
                ; (prisma.emailItemProduct.delete as jest.Mock).mockResolvedValue({})

            const result = await removeItemProduct('1', '123456789012')

            expect(result.success).toBe(true)
            expect(prisma.emailItemProduct.delete).toHaveBeenCalledWith({
                where: { itemId_upc: { itemId: '1', upc: '123456789012' } },
            })
            expect(revalidatePath).toHaveBeenCalledWith('/email-planner/p1')
        })

        it('should return error if product not found on item for revalidation', async () => {
            ; (prisma.emailItemProduct.findUnique as jest.Mock).mockResolvedValue(null)

            const result = await removeItemProduct('1', '123456789012')

            expect(result.success).toBe(false)
            expect(result.error).toBe('Product not found on item')
            expect(prisma.emailItemProduct.delete).not.toHaveBeenCalled()
            expect(revalidatePath).not.toHaveBeenCalled()
        })

        it('should handle errors when removing product', async () => {
            ; (prisma.emailItemProduct.findUnique as jest.Mock).mockImplementationOnce(async () => { throw new Error('DB Error') })

            const result = await removeItemProduct('1', '123456789012')

            expect(result.success).toBe(false)
            expect(result.error).toBe('Failed to remove product from item')
        })
    })

    describe('reorderEmailItems', () => {
        it('should reorder items and revalidate successfully if items provided', async () => {
            ; (prisma.emailItem.findUnique as jest.Mock).mockResolvedValue({ planId: 'p1' })
                ; (prisma.emailItem.update as jest.Mock).mockResolvedValue({})
                ; (prisma.$transaction as jest.Mock).mockResolvedValue([{}, {}])

            const itemsToReorder = [
                { id: '1', order: 1 },
                { id: '2', order: 2 },
            ]

            const result = await reorderEmailItems(itemsToReorder)

            expect(result.success).toBe(true)
            expect(prisma.emailItem.findUnique).toHaveBeenCalledWith({
                where: { id: '1' },
                select: { planId: true },
            })
            expect(prisma.$transaction).toHaveBeenCalled()
            expect(revalidatePath).toHaveBeenCalledWith('/email-planner/p1')
        })

        it('should reorder successfully even if no items provided', async () => {
            ; (prisma.$transaction as jest.Mock).mockResolvedValue([])

            const result = await reorderEmailItems([])

            expect(result.success).toBe(true)
            expect(prisma.emailItem.findUnique).not.toHaveBeenCalled()
            expect(prisma.$transaction).toHaveBeenCalledWith([])
            expect(revalidatePath).not.toHaveBeenCalled()
        })

        it('should handle errors during reorder', async () => {
            ; (prisma.emailItem.findUnique as jest.Mock).mockImplementationOnce(async () => { throw new Error('DB Error') })

            const result = await reorderEmailItems([{ id: '1', order: 1 }])

            expect(result.success).toBe(false)
            expect(result.error).toBe('Failed to reorder items')
        })
    })
})
