import { search } from '@/app/actions/search'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

jest.mock('@/lib/prisma', () => ({
    prisma: {
        project: { findMany: jest.fn() },
        task: { findMany: jest.fn() },
        contact: { findMany: jest.fn() },
        organization: { findMany: jest.fn() },
        event: { findMany: jest.fn() },
        socialPost: { findMany: jest.fn() },
        user: { findMany: jest.fn() },
        hyperlink: { findMany: jest.fn() },
    },
}))

jest.mock('@/lib/session', () => ({
    getSession: jest.fn(),
}))

describe('Search Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.spyOn(console, 'error').mockImplementation(() => { })
            // Default authenticated session
            ; (getSession as jest.Mock).mockResolvedValue({ id: '1' })
    })

    describe('search', () => {
        it('should return empty results for short queries', async () => {
            const results = await search('a')
            expect(results.projects).toEqual([])
            expect(results.tasks).toEqual([])
            expect(prisma.project.findMany).not.toHaveBeenCalled()
        })

        it('should return empty results for null/empty queries', async () => {
            const results = await search('')
            expect(results.projects).toEqual([])
            expect(prisma.project.findMany).not.toHaveBeenCalled()
        })

        it('should throw Unauthorized if no session', async () => {
            ; (getSession as jest.Mock).mockResolvedValue(null)
            await expect(search('test')).rejects.toThrow('Unauthorized')
        })

        it('should perform global search and map results correctly', async () => {
            // Mock empty arrays for most models to keep test clean, but provide some data for a few
            ; (prisma.project.findMany as jest.Mock).mockResolvedValue([
                { id: 'p1', name: 'Project 1', description: 'Desc 1' }
            ])
                ; (prisma.task.findMany as jest.Mock).mockResolvedValue([
                    { id: 't1', title: 'Task 1', status: 'TODO' }
                ])
                ; (prisma.contact.findMany as jest.Mock).mockResolvedValue([
                    { id: 'c1', firstName: 'John', lastName: 'Doe', company: 'Acme' }
                ])
                ; (prisma.organization.findMany as jest.Mock).mockResolvedValue([
                    { id: 'o1', name: 'Org 1', category: 'Tech' }
                ])
                ; (prisma.event.findMany as jest.Mock).mockResolvedValue([
                    { id: 'e1', title: 'Event 1', startTime: new Date('2024-01-01T12:00:00Z') }
                ])
                ; (prisma.socialPost.findMany as jest.Mock).mockResolvedValue([
                    { id: 's1', content: 'Short post', platform: 'Twitter' },
                    { id: 's2', content: 'A very long post that exceeds fifty characters to test truncation', platform: 'LinkedIn' }
                ])
                ; (prisma.user.findMany as jest.Mock).mockResolvedValue([
                    { id: 'u1', name: 'Alice', email: 'alice@test.com' }
                ])
                ; (prisma.hyperlink.findMany as jest.Mock).mockResolvedValue([
                    { id: 'h1', title: 'Link 1', url: 'http://link.com', description: 'desc' }
                ])

            const results = await search('test query')

            expect(results.projects).toHaveLength(1)
            expect(results.projects[0]).toEqual({
                id: 'p1', type: 'project', title: 'Project 1', subtitle: 'Desc 1', url: '/projects/p1'
            })

            expect(results.tasks).toHaveLength(1)
            expect(results.contacts).toHaveLength(1)
            expect(results.contacts[0].title).toBe('John Doe')

            expect(results.events).toHaveLength(1)
            expect(results.events[0].subtitle).toBe(new Date('2024-01-01T12:00:00Z').toLocaleDateString())

            expect(results.posts).toHaveLength(2)
            expect(results.posts[0].title).toBe('Short post')
            // Check truncation
            expect(results.posts[1].title).toBe('A very long post that exceeds fifty characters to ...')

            expect(results.users).toHaveLength(1)
            expect(results.hyperlinks).toHaveLength(1)

            // Verify query arguments
            expect(prisma.project.findMany).toHaveBeenCalledWith({
                where: {
                    OR: [
                        { name: { contains: 'test query' } },
                        { description: { contains: 'test query' } }
                    ]
                },
                take: 5,
                select: { id: true, name: true, description: true }
            })
        })

        it('should handle missing subtitle fields gracefully', async () => {
            ; (prisma.project.findMany as jest.Mock).mockResolvedValue([{ id: 'p1', name: 'Project 1', description: null }])
                ; (prisma.contact.findMany as jest.Mock).mockResolvedValue([{ id: 'c1', firstName: 'John', lastName: 'Doe', company: null }])
                ; (prisma.organization.findMany as jest.Mock).mockResolvedValue([{ id: 'o1', name: 'Org 1', category: null }])
                ; (prisma.hyperlink.findMany as jest.Mock).mockResolvedValue([{ id: 'h1', title: 'Link', url: 'http://l.com', description: null }])

                // Need to mock the rest as empty to avoid undefined errors
                ; (prisma.task.findMany as jest.Mock).mockResolvedValue([])
                ; (prisma.event.findMany as jest.Mock).mockResolvedValue([])
                ; (prisma.socialPost.findMany as jest.Mock).mockResolvedValue([])
                ; (prisma.user.findMany as jest.Mock).mockResolvedValue([])

            const results = await search('test')

            expect(results.projects[0].subtitle).toBe('')
            expect(results.contacts[0].subtitle).toBe('')
            expect(results.organizations[0].subtitle).toBe('')
            expect(results.hyperlinks[0].subtitle).toBe('')
        })

        it('should handle general database errors', async () => {
            ; (prisma.project.findMany as jest.Mock).mockRejectedValue(new Error('DB Timeout'))

            await expect(search('test query')).rejects.toThrow('Failed to search')
            expect(console.error).toHaveBeenCalled()
        })
    })
})
