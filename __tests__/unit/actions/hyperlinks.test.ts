import {
    getHyperlinks,
    createHyperlink,
    updateHyperlink,
    deleteHyperlink,
} from '@/app/actions/hyperlinks'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/app/actions/activity-logs'

jest.mock('@/lib/prisma', () => ({
    prisma: {
        hyperlink: {
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findUnique: jest.fn(),
        },
    },
}))

jest.mock('@/lib/session', () => ({
    getSession: jest.fn(),
}))

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

jest.mock('@/app/actions/activity-logs', () => ({
    logActivity: jest.fn(),
}))

describe('Hyperlinks Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
            // Default authenticated session
            ; (getSession as jest.Mock).mockResolvedValue({ id: '1', user: { id: '1' } })
    })

    describe('getHyperlinks', () => {
        it('should fetch hyperlinks ordered by createdAt', async () => {
            const mockLinks = [{ id: '1', title: 'Google', url: 'https://google.com' }]
                ; (prisma.hyperlink.findMany as jest.Mock).mockResolvedValue(mockLinks)

            const result = await getHyperlinks()

            expect(result).toEqual(mockLinks)
            expect(prisma.hyperlink.findMany).toHaveBeenCalledWith({
                orderBy: { createdAt: 'desc' },
            })
        })
    })

    describe('createHyperlink', () => {
        it('should throw error if title is missing', async () => {
            const formData = new FormData()
            formData.append('url', 'http://test.com')

            await expect(createHyperlink(formData)).rejects.toThrow('Title and URL are required')
        })

        it('should throw error if url is missing', async () => {
            const formData = new FormData()
            formData.append('title', 'Test')

            await expect(createHyperlink(formData)).rejects.toThrow('Title and URL are required')
        })

        it('should create hyperlink successfully', async () => {
            const formData = new FormData()
            formData.append('title', 'Test Link')
            formData.append('url', 'http://test.com')
            formData.append('description', 'A test link')
            formData.append('icon', 'LinkIcon')

            const mockLink = { id: 'hl1', title: 'Test Link' }
                ; (prisma.hyperlink.create as jest.Mock).mockResolvedValue(mockLink)

            const result = await createHyperlink(formData)

            expect(result).toEqual(mockLink)
            expect(prisma.hyperlink.create).toHaveBeenCalledWith({
                data: {
                    title: 'Test Link',
                    url: 'http://test.com',
                    description: 'A test link',
                    icon: 'LinkIcon',
                }
            })
            expect(logActivity).toHaveBeenCalledWith('CREATE', 'Hyperlink', 'hl1', 'Created hyperlink: Test Link')
            expect(revalidatePath).toHaveBeenCalledWith('/admin/hyperlinks')
            expect(revalidatePath).toHaveBeenCalledWith('/')
        })
    })

    describe('updateHyperlink', () => {
        it('should throw error if title is missing', async () => {
            const formData = new FormData()
            formData.append('url', 'http://test.com')

            await expect(updateHyperlink('1', formData)).rejects.toThrow('Title and URL are required')
        })

        it('should throw error if url is missing', async () => {
            const formData = new FormData()
            formData.append('title', 'Test')

            await expect(updateHyperlink('1', formData)).rejects.toThrow('Title and URL are required')
        })

        it('should update hyperlink successfully', async () => {
            const formData = new FormData()
            formData.append('title', 'Updated Link')
            formData.append('url', 'http://updated.com')
            formData.append('description', 'Updated desc')
            formData.append('icon', 'NewIcon')

            const mockLink = { id: 'hl1', title: 'Updated Link' }
                ; (prisma.hyperlink.update as jest.Mock).mockResolvedValue(mockLink)

            const result = await updateHyperlink('hl1', formData)

            expect(result).toEqual(mockLink)
            expect(prisma.hyperlink.update).toHaveBeenCalledWith({
                where: { id: 'hl1' },
                data: {
                    title: 'Updated Link',
                    url: 'http://updated.com',
                    description: 'Updated desc',
                    icon: 'NewIcon',
                }
            })
            expect(logActivity).toHaveBeenCalledWith('UPDATE', 'Hyperlink', 'hl1', 'Updated hyperlink: Updated Link')
            expect(revalidatePath).toHaveBeenCalledWith('/admin/hyperlinks')
            expect(revalidatePath).toHaveBeenCalledWith('/')
        })
    })

    describe('deleteHyperlink', () => {
        it('should delete hyperlink and log activity if it exists', async () => {
            ; (prisma.hyperlink.findUnique as jest.Mock).mockResolvedValue({
                id: 'hl1', title: 'Delete Me'
            })

            await deleteHyperlink('hl1')

            expect(prisma.hyperlink.delete).toHaveBeenCalledWith({ where: { id: 'hl1' } })
            expect(logActivity).toHaveBeenCalledWith('DELETE', 'Hyperlink', 'hl1', 'Deleted hyperlink: Delete Me')
            expect(revalidatePath).toHaveBeenCalledWith('/admin/hyperlinks')
            expect(revalidatePath).toHaveBeenCalledWith('/')
        })

        it('should not throw error if hyperlink does not exist', async () => {
            ; (prisma.hyperlink.findUnique as jest.Mock).mockResolvedValue(null)

            await deleteHyperlink('nonexistent')

            expect(prisma.hyperlink.delete).not.toHaveBeenCalled()
            expect(logActivity).not.toHaveBeenCalled()
            expect(revalidatePath).toHaveBeenCalledWith('/admin/hyperlinks')
            expect(revalidatePath).toHaveBeenCalledWith('/')
        })
    })
})
