import { prisma } from '@/lib/db'
import { updateOrganization, createOrganization } from '@/app/actions/organizations'
import { logActivity } from '@/app/actions/activity-logs'

// Mock Next.js navigation and cache
jest.mock('next/navigation', () => ({
    redirect: jest.fn(),
}))
jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

describe('Activity Logs Diffing', () => {
    let orgId: string

    beforeAll(async () => {
        // Create an organization directly to avoid the create action's redirect/revalidate if possible, 
        // but using the action ensures we cover that path too.
        // Let's us create directly for setup stability.
        const org = await prisma.organization.create({
            data: {
                name: 'Test Org for Diff',
                category: 'Vendor',
                description: 'Original Description',
                website: 'https://original.com'
            }
        })
        orgId = org.id
    })

    afterAll(async () => {
        // Cleanup
        await prisma.activityLog.deleteMany({
            where: { entityId: orgId }
        })
        await prisma.organization.delete({
            where: { id: orgId }
        })
    })

    it('should log detailed changes when organization is updated', async () => {
        // Prepare FormData for update
        const formData = new FormData()
        formData.append('id', orgId)
        formData.append('name', 'Test Org for Diff') // Unchanged
        formData.append('category', 'Partner') // Changed
        formData.append('description', 'New Description') // Changed
        formData.append('website', 'https://original.com') // Unchanged
        formData.append('primaryContactId', 'none')

        // Call Update Action
        await updateOrganization(formData)

        // Verify Activity Log
        const log = await prisma.activityLog.findFirst({
            where: {
                entityId: orgId,
                action: 'UPDATE',
                entityType: 'Organization'
            },
            orderBy: { createdAt: 'desc' }
        })

        expect(log).toBeDefined()
        expect(log?.metadata).toBeDefined()

        const metadata = JSON.parse(log!.metadata!)
        expect(metadata).toHaveProperty('category')
        expect(metadata.category.from).toBe('Vendor')
        expect(metadata.category.to).toBe('Partner')

        expect(metadata).toHaveProperty('description')
        expect(metadata.description.from).toBe('Original Description')
        expect(metadata.description.to).toBe('New Description')

        expect(metadata).not.toHaveProperty('name')
        expect(metadata).not.toHaveProperty('website')
    })
})
