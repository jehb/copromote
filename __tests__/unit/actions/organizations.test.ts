import {
    getOrganizations,
    getOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization
} from '@/app/actions/organizations'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logActivity } from '@/app/actions/activity-logs'
import { getCurrentUserId } from '@/lib/user-util'

jest.mock('@/lib/db', () => ({
    prisma: {
        organization: {
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

jest.mock('next/navigation', () => ({
    redirect: jest.fn(),
}))

jest.mock('@/app/actions/activity-logs', () => ({
    logActivity: jest.fn(),
}))

jest.mock('@/lib/user-util', () => ({
    getCurrentUserId: jest.fn(),
}))

describe('Organizations Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
            ; (getCurrentUserId as jest.Mock).mockResolvedValue('user-1')
    })

    describe('getOrganizations', () => {
        it('should fetch all organizations ordered by name', async () => {
            const mockOrgs = [{ id: '1', name: 'Org A' }]
                ; (prisma.organization.findMany as jest.Mock).mockResolvedValue(mockOrgs)

            const result = await getOrganizations()

            expect(result).toEqual(mockOrgs)
            expect(prisma.organization.findMany).toHaveBeenCalledWith(expect.objectContaining({
                orderBy: { name: 'asc' },
                include: expect.any(Object)
            }))
        })
    })

    describe('getOrganization', () => {
        it('should fetch a single organization by id', async () => {
            const mockOrg = { id: '1', name: 'Org A' }
                ; (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrg)

            const result = await getOrganization('1')

            expect(result).toEqual(mockOrg)
            expect(prisma.organization.findUnique).toHaveBeenCalledWith({
                where: { id: '1' },
                include: expect.any(Object)
            })
        })
    })

    describe('createOrganization', () => {
        it('should create an organization with primaryContactId', async () => {
            const formData = new FormData()
            formData.append('name', 'New Org')
            formData.append('category', 'Tech')
            formData.append('description', 'A tech org')
            formData.append('website', 'https://tech.com')
            formData.append('primaryContactId', 'contact-1')

                ; (prisma.organization.create as jest.Mock).mockResolvedValue({ id: 'org-1' })
                ; (redirect as unknown as jest.Mock).mockImplementation(() => { throw new Error('NEXT_REDIRECT') })

            await expect(createOrganization(formData)).rejects.toThrow('NEXT_REDIRECT')

            expect(prisma.organization.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    name: 'New Org',
                    category: 'Tech',
                    description: 'A tech org',
                    website: 'https://tech.com',
                    primaryContactId: 'contact-1',
                    createdById: 'user-1',
                    updatedById: 'user-1'
                })
            })
            expect(logActivity).toHaveBeenCalledWith('CREATE', 'Organization', 'org-1', 'Created organization: New Org')
            expect(revalidatePath).toHaveBeenCalledWith('/organizations')
            expect(redirect).toHaveBeenCalledWith('/organizations')
        })

        it('should create an organization with null primaryContactId when "none" is provided', async () => {
            const formData = new FormData()
            formData.append('name', 'New Org')
            formData.append('category', 'Tech')
            formData.append('primaryContactId', 'none')

                ; (prisma.organization.create as jest.Mock).mockResolvedValue({ id: 'org-2' })
                ; (redirect as unknown as jest.Mock).mockImplementation(() => { throw new Error('NEXT_REDIRECT') })

            await expect(createOrganization(formData)).rejects.toThrow('NEXT_REDIRECT')

            expect(prisma.organization.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    primaryContactId: null
                })
            })
        })
    })

    describe('updateOrganization', () => {
        it('should update an organization and calculate diffs', async () => {
            const formData = new FormData()
            formData.append('id', 'org-1')
            formData.append('name', 'Updated Org')
            formData.append('category', 'New Tech')
            formData.append('description', 'Updated desc')
            formData.append('website', 'https://newtech.com')
            formData.append('primaryContactId', 'contact-2')

            const currentOrg = {
                id: 'org-1',
                name: 'Old Org',
                category: 'Old Tech',
                description: 'Old desc',
                website: 'https://oldtech.com',
                primaryContactId: 'contact-1'
            }

                ; (prisma.organization.findUnique as jest.Mock).mockResolvedValue(currentOrg)
                ; (prisma.organization.update as jest.Mock).mockResolvedValue({ id: 'org-1' })
                ; (redirect as unknown as jest.Mock).mockImplementation(() => { throw new Error('NEXT_REDIRECT') })

            await expect(updateOrganization(formData)).rejects.toThrow('NEXT_REDIRECT')

            expect(prisma.organization.update).toHaveBeenCalledWith({
                where: { id: 'org-1' },
                data: expect.objectContaining({
                    name: 'Updated Org',
                    category: 'New Tech',
                    description: 'Updated desc',
                    website: 'https://newtech.com',
                    primaryContactId: 'contact-2',
                    updatedById: 'user-1'
                })
            })

            const expectedChanges = {
                name: { from: 'Old Org', to: 'Updated Org' },
                category: { from: 'Old Tech', to: 'New Tech' },
                description: { from: 'Old desc', to: 'Updated desc' },
                website: { from: 'https://oldtech.com', to: 'https://newtech.com' },
                primaryContact: { from: 'contact-1', to: 'contact-2' }
            }

            expect(logActivity).toHaveBeenCalledWith(
                'UPDATE',
                'Organization',
                'org-1',
                'Updated organization: Updated Org',
                expectedChanges
            )
            expect(revalidatePath).toHaveBeenCalledWith('/organizations')
            expect(revalidatePath).toHaveBeenCalledWith('/organizations/org-1')
            expect(redirect).toHaveBeenCalledWith('/organizations')
        })

        it('should handle "none" primaryContactId in update', async () => {
            const formData = new FormData()
            formData.append('id', 'org-1')
            formData.append('name', 'Org')
            formData.append('primaryContactId', 'none')

                ; (prisma.organization.findUnique as jest.Mock).mockResolvedValue(null) // Simulate getting diffs without a current org
                ; (prisma.organization.update as jest.Mock).mockResolvedValue({ id: 'org-1' })
                ; (redirect as unknown as jest.Mock).mockImplementation(() => { throw new Error('NEXT_REDIRECT') })

            await expect(updateOrganization(formData)).rejects.toThrow('NEXT_REDIRECT')

            expect(prisma.organization.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    primaryContactId: null
                })
            }))
        })
    })

    describe('deleteOrganization', () => {
        it('should delete an organization and revalidate paths', async () => {
            ; (prisma.organization.delete as jest.Mock).mockResolvedValue({ id: 'org-1' })
                ; (redirect as unknown as jest.Mock).mockImplementation(() => { throw new Error('NEXT_REDIRECT') })

            await expect(deleteOrganization('org-1')).rejects.toThrow('NEXT_REDIRECT')

            expect(prisma.organization.delete).toHaveBeenCalledWith({ where: { id: 'org-1' } })
            expect(logActivity).toHaveBeenCalledWith('DELETE', 'Organization', 'org-1', 'Deleted organization')
            expect(revalidatePath).toHaveBeenCalledWith('/organizations')
            expect(redirect).toHaveBeenCalledWith('/organizations')
        })
    })
})
