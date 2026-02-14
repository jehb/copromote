
import {
    getOrganizations,
    getOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization
} from '@/app/actions/organizations'
import { prisma } from '@/lib/db'
import { logActivity } from '@/app/actions/activity-logs'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Mock dependencies
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

jest.mock('@/app/actions/activity-logs', () => ({
    logActivity: jest.fn(),
}))

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

// redirect is mocked in jest.setup.ts

describe('Organization Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('getOrganizations', () => {
        it('should fetch organizations', async () => {
            const mockOrgs = [{ id: '1', name: 'Org 1' }]
                ; (prisma.organization.findMany as jest.Mock).mockResolvedValue(mockOrgs)

            const result = await getOrganizations()
            expect(result).toEqual(mockOrgs)
        })
    })

    describe('createOrganization', () => {
        it('should create organization and redirect', async () => {
            const formData = new FormData()
            formData.append('name', 'New Org')
            formData.append('category', 'Tech')
            formData.append('primaryContactId', 'c1')

                ; (prisma.organization.create as jest.Mock).mockResolvedValue({ id: '1', name: 'New Org' })

            await createOrganization(formData)

            expect(prisma.organization.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    name: 'New Org',
                    primaryContactId: 'c1',
                })
            })
            expect(logActivity).toHaveBeenCalledWith('CREATE', 'Organization', '1', expect.any(String))
            expect(redirect).toHaveBeenCalledWith('/organizations')
        })
    })

    describe('updateOrganization', () => {
        it('should update organization', async () => {
            const formData = new FormData()
            formData.append('id', '1')
            formData.append('name', 'Updated Org')

            await updateOrganization(formData)

            expect(prisma.organization.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: expect.objectContaining({
                    name: 'Updated Org',
                })
            })
            expect(revalidatePath).toHaveBeenCalledWith('/organizations')
            expect(redirect).toHaveBeenCalledWith('/organizations')
        })
    })

    describe('deleteOrganization', () => {
        it('should delete organization', async () => {
            await deleteOrganization('1')
            expect(prisma.organization.delete).toHaveBeenCalledWith({ where: { id: '1' } })
            expect(redirect).toHaveBeenCalledWith('/organizations')
        })
    })
})
