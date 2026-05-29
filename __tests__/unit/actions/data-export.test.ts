import { getExportData } from '@/app/actions/data-export'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
    prisma: {
        contact: { findMany: jest.fn() },
        organization: { findMany: jest.fn() },
        event: { findMany: jest.fn() },
        task: { findMany: jest.fn() },
        project: { findMany: jest.fn() },
        hyperlink: { findMany: jest.fn() },
        socialPost: { findMany: jest.fn() },
        promotionPeriod: { findMany: jest.fn() },
        emailPlan: { findMany: jest.fn() },
        emailItem: { findMany: jest.fn() },
    },
}))

describe('Data Export Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    const testDate = new Date('2024-01-01T12:00:00Z') // UTC time
    // formatInTimeZone will format this based on 'America/New_York'
    // 2024-01-01T12:00:00Z is 2024-01-01T07:00:00-05:00 in NY

    describe('getExportData', () => {
        it('should get export data for contacts', async () => {
            ; (prisma.contact.findMany as jest.Mock).mockResolvedValue([
                {
                    id: '1',
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                    type: 'Lead',
                    createdAt: testDate,
                    organization: { name: 'Acme Corp' },
                },
            ])

            const result = await getExportData(['contacts'])

            expect(result.contacts).toBeDefined()
            expect(result.contacts[0]).toEqual(
                expect.objectContaining({
                    ID: '1',
                    'First Name': 'John',
                    'Last Name': 'Doe',
                    Email: 'john@example.com',
                    Type: 'Lead',
                    Organization: 'Acme Corp',
                    'Created At': expect.stringContaining('2024-01-01T07:00:00-05:00'),
                })
            )
        })

        it('should get export data for organizations', async () => {
            ; (prisma.organization.findMany as jest.Mock).mockResolvedValue([
                {
                    id: '1',
                    name: 'Acme Corp',
                    category: 'Client',
                    createdAt: testDate,
                    primaryContact: { firstName: 'Jane', lastName: 'Smith' },
                },
            ])

            const result = await getExportData(['organizations'])

            expect(result.organizations).toBeDefined()
            expect(result.organizations[0]).toEqual(
                expect.objectContaining({
                    ID: '1',
                    Name: 'Acme Corp',
                    Category: 'Client',
                    'Primary Contact': 'Jane Smith',
                })
            )
        })

        it('should get export data for events', async () => {
            ; (prisma.event.findMany as jest.Mock).mockResolvedValue([
                {
                    id: '1',
                    title: 'Annual Meetup',
                    startTime: testDate,
                    endTime: testDate,
                    createdAt: testDate,
                    location: { name: 'Main Hall' },
                    primaryContact: { name: 'Bob' },
                },
            ])

            const result = await getExportData(['events'])

            expect(result.events).toBeDefined()
            expect(result.events[0]).toEqual(
                expect.objectContaining({
                    Title: 'Annual Meetup',
                    Location: 'Main Hall',
                    'Primary Contact': 'Bob',
                })
            )
        })

        it('should get export data for tasks', async () => {
            ; (prisma.task.findMany as jest.Mock).mockResolvedValue([
                {
                    id: '1',
                    title: 'Update DB',
                    status: 'TODO',
                    dueDate: testDate,
                    createdAt: testDate,
                    assignee: { name: 'Alice' },
                    project: { name: 'Migration' },
                },
            ])

            const result = await getExportData(['tasks'])

            expect(result.tasks).toBeDefined()
            expect(result.tasks[0]).toEqual(
                expect.objectContaining({
                    Title: 'Update DB',
                    Status: 'TODO',
                    Assignee: 'Alice',
                    Project: 'Migration',
                })
            )
        })

        it('should get export data for projects and hyperlinks', async () => {
            ; (prisma.project.findMany as jest.Mock).mockResolvedValue([
                {
                    id: '1',
                    name: 'Migration',
                    status: 'Active',
                    createdAt: testDate,
                },
            ])
                ; (prisma.hyperlink.findMany as jest.Mock).mockResolvedValue([
                    {
                        id: '1',
                        title: 'Google',
                        url: 'https://google.com',
                        createdAt: testDate,
                    },
                ])

            const result = await getExportData(['projects', 'hyperlinks'])

            expect(result.projects).toBeDefined()
            expect(result.hyperlinks).toBeDefined()
        })

        it('should get export data for social-posts and promotions', async () => {
            ; (prisma.socialPost.findMany as jest.Mock).mockResolvedValue([
                {
                    id: '1',
                    content: 'Hello World',
                    platform: 'Twitter',
                    status: 'DRAFT',
                    createdAt: testDate,
                },
            ])
                ; (prisma.promotionPeriod.findMany as jest.Mock).mockResolvedValue([
                    {
                        id: '1',
                        name: 'Summer Sale',
                        startDate: testDate,
                        endDate: testDate,
                        createdAt: testDate,
                    },
                ])

            const result = await getExportData(['social-posts', 'promotions'])

            expect(result['social-posts']).toBeDefined()
            expect(result.promotions).toBeDefined()
        })

        it('should get export data for email-plans and email-items', async () => {
            ; (prisma.emailPlan.findMany as jest.Mock).mockResolvedValue([
                {
                    id: '1',
                    subject: 'Newsletter',
                    sendDate: testDate,
                    createdAt: testDate,
                },
            ])
                ; (prisma.emailItem.findMany as jest.Mock).mockResolvedValue([
                    {
                        id: '1',
                        title: 'Article 1',
                        order: 0,
                        createdAt: testDate,
                        plan: { subject: 'Newsletter' },
                    },
                ])

            const result = await getExportData(['email-plans', 'email-items'])

            expect(result['email-plans']).toBeDefined()
            expect(result['email-items']).toBeDefined()
        })

        it('should handle null dates gracefully', async () => {
            ; (prisma.contact.findMany as jest.Mock).mockResolvedValue([
                {
                    id: '1',
                    firstName: 'John',
                    lastName: null,
                    email: null,
                    createdAt: null,
                    type: 'Lead',
                },
            ])

            const result = await getExportData(['contacts'])
            expect(result.contacts[0]['Created At']).toBe('')
        })
    })
})
