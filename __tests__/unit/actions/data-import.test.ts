import { importData } from '@/app/actions/data-import'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

jest.mock('@/lib/prisma', () => ({
    prisma: {
        contact: { upsert: jest.fn() },
        organization: { upsert: jest.fn() },
        project: { upsert: jest.fn() },
        task: { upsert: jest.fn() },
        event: { upsert: jest.fn() },
        socialPost: { upsert: jest.fn() },
        hyperlink: { upsert: jest.fn() },
        promotionPeriod: { upsert: jest.fn() },
        location: {
            findUnique: jest.fn(),
            create: jest.fn(),
            findFirst: jest.fn(),
        },
    },
}))

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

describe('Data Import Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.spyOn(console, 'error').mockImplementation(() => { })
    })

    describe('importData', () => {
        it('should import contacts successfully', async () => {
            ; (prisma.contact.upsert as jest.Mock).mockResolvedValue({})

            const mockData = [
                {
                    ID: '1',
                    'First Name': 'John',
                    'Last Name': 'Doe',
                    Email: 'john@example.com',
                },
                {
                    'First Name': 'Jane',
                },
            ]

            const result = await importData('contacts', mockData)

            expect(result.success).toBe(true)
            expect(result.message).toContain('Successfully processed 2 records')
            expect(prisma.contact.upsert).toHaveBeenCalledWith({
                where: { id: '1' },
                update: expect.any(Object),
                create: expect.any(Object),
            })
            expect(revalidatePath).toHaveBeenCalledWith('/admin/data')
        })

        it('should import organizations successfully', async () => {
            ; (prisma.organization.upsert as jest.Mock).mockResolvedValue({})

            const mockData = [
                {
                    Name: 'Acme Corp',
                    Category: 'Client',
                },
                {
                    Name: 'No Category Corp',
                },
            ]

            const result = await importData('organizations', mockData)

            expect(result.success).toBe(true)
            expect(prisma.organization.upsert).toHaveBeenCalled()
        })

        it('should import projects successfully', async () => {
            ; (prisma.project.upsert as jest.Mock).mockResolvedValue({})

            const mockData = [
                {
                    Name: 'Project A',
                    'Start Date': '2023-01-01',
                },
                {
                    Name: 'Project B',
                    StartDate: new Date('2023-01-02'),
                },
                {
                    Name: 'Project C',
                },
            ]

            const result = await importData('projects', mockData)

            expect(result.success).toBe(true)
            expect(prisma.project.upsert).toHaveBeenCalled()
        })

        it('should import tasks successfully', async () => {
            ; (prisma.task.upsert as jest.Mock).mockResolvedValue({})

            const mockData = [
                {
                    Title: 'Task A',
                },
            ]

            const result = await importData('tasks', mockData)

            expect(result.success).toBe(true)
            expect(prisma.task.upsert).toHaveBeenCalled()
        })

        it('should import events and handle locations successfully', async () => {
            ; (prisma.event.upsert as jest.Mock).mockResolvedValue({})
                ; (prisma.location.findUnique as jest.Mock).mockResolvedValue({ id: 'loc1' })

            const mockData = [
                {
                    Title: 'Event A',
                    Location: 'Conference Hall',
                },
            ]

            const result = await importData('events', mockData)

            expect(result.success).toBe(true)
            expect(prisma.location.findUnique).toHaveBeenCalledWith({
                where: { name: 'Conference Hall' },
            })
            expect(prisma.event.upsert).toHaveBeenCalled()
        })

        it('should create default location if not found during event import', async () => {
            ; (prisma.event.upsert as jest.Mock).mockResolvedValue({})
                ; (prisma.location.findUnique as jest.Mock).mockResolvedValue(null)
                ; (prisma.location.create as jest.Mock).mockResolvedValue({ id: 'loc2' })

            const mockData = [
                {
                    Title: 'Event B',
                    Location: 'New Hall',
                },
            ]

            const result = await importData('events', mockData)

            expect(result.success).toBe(true)
            expect(prisma.location.create).toHaveBeenCalledWith({
                data: { name: 'New Hall' },
            })
        })

        it('should create TBD location if no location provided and no locations exist', async () => {
            ; (prisma.event.upsert as jest.Mock).mockResolvedValue({})
                ; (prisma.location.findFirst as jest.Mock).mockResolvedValue(null)
                ; (prisma.location.create as jest.Mock).mockResolvedValue({ id: 'loc-tbd' })

            const mockData = [
                {
                    Title: 'Event C',
                },
            ]

            const result = await importData('events', mockData)

            expect(result.success).toBe(true)
            expect(prisma.location.create).toHaveBeenCalledWith({
                data: { name: 'TBD' },
            })
            expect(prisma.event.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    update: expect.objectContaining({ locationId: 'loc-tbd' }),
                })
            )
        })

        it('should import social posts successfully', async () => {
            ; (prisma.socialPost.upsert as jest.Mock).mockResolvedValue({})

            const mockData = [{ Content: 'Hello' }]

            const result = await importData('social-posts', mockData)

            expect(result.success).toBe(true)
            expect(prisma.socialPost.upsert).toHaveBeenCalled()
        })

        it('should import hyperlinks successfully', async () => {
            ; (prisma.hyperlink.upsert as jest.Mock).mockResolvedValue({})

            const mockData = [
                { Title: 'Google', URL: 'google.com' },
                { Title: 'Bing', Url: 'bing.com' },
            ]

            const result = await importData('hyperlinks', mockData)

            expect(result.success).toBe(true)
            expect(prisma.hyperlink.upsert).toHaveBeenCalled()
        })

        it('should import promotions successfully', async () => {
            ; (prisma.promotionPeriod.upsert as jest.Mock).mockResolvedValue({})

            const mockData = [{ Name: 'Summer Promo' }]

            const result = await importData('promotions', mockData)

            expect(result.success).toBe(true)
            expect(prisma.promotionPeriod.upsert).toHaveBeenCalled()
        })

        it('should handle import errors gracefully', async () => {
            ; (prisma.contact.upsert as jest.Mock).mockRejectedValue(new Error('DB Error'))

            const mockData = [{ ID: '1' }]

            const result = await importData('contacts', mockData)

            expect(result.success).toBe(false)
            expect(result.message).toContain('Import failed')
        })
    })
})
