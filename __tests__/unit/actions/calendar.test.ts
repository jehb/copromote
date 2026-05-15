import { getCalendarEvents } from '@/app/actions/calendar'
import { prisma } from '@/lib/db'

jest.mock('@/lib/db', () => ({
    prisma: {
        project: { findMany: jest.fn() },
        calendarEvent: { findMany: jest.fn() },
        promotionPeriod: { findMany: jest.fn() },
        theme: { findMany: jest.fn() },
        event: { findMany: jest.fn() },
        socialPost: { findMany: jest.fn() },
    },
}))

describe('Calendar Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('getCalendarEvents', () => {
        it('should correctly aggregate and format calendar events from multiple sources', async () => {
            const mockProjects = [
                { id: 'p1', name: 'Project A', startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
                { id: 'p2', name: 'Project B', startDate: new Date('2024-02-01'), endDate: null }, // No end date
            ]

            const mockCalendarEvents = [
                { id: 'ce1', title: 'Manual Event', date: new Date('2024-01-15'), projectId: 'p1' },
                { id: 'ce2', title: 'Manual Event 2', date: new Date('2024-01-16') }
            ]

            const mockPromotions = [
                {
                    id: 'promo1',
                    name: 'Winter Sale',
                    startDate: new Date('2024-01-10'),
                    endDate: new Date('2024-01-20'),
                    adLiveDate: new Date('2024-01-05'),
                    adImageDeadline: new Date('2024-01-02'),
                    adPublishingDeadline: new Date('2024-01-03'),
                },
                {
                    id: 'promo2',
                    name: 'Spring Sale',
                    startDate: new Date('2024-03-01'),
                    endDate: new Date('2024-03-10'),
                    // Missing ad dates to test optional fields
                }
            ]

            const mockLogisticsEvents = [
                {
                    id: 'le1',
                    title: 'Trade Show',
                    startTime: new Date('2024-01-18'),
                    description: 'Booth setup',
                    location: { name: 'Convention Center' },
                },
                {
                    id: 'le2',
                    title: 'Trade Show 2',
                    startTime: new Date('2024-01-19'),
                    location: { name: 'Convention Center' },
                }
            ]

            const mockSocialPosts = [
                { id: 'sp1', content: 'Exciting news coming soon!', scheduledDate: new Date('2024-01-05'), platform: 'Twitter' },
                // Should ignore posts without scheduled date
                { id: 'sp2', content: 'Random post', scheduledDate: null, platform: 'LinkedIn' },
            ]

                ; (prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects)
                ; (prisma.calendarEvent.findMany as jest.Mock).mockResolvedValue(mockCalendarEvents)
                ; (prisma.promotionPeriod.findMany as jest.Mock).mockResolvedValue(mockPromotions)
            ; (prisma.theme.findMany as jest.Mock).mockResolvedValue([])
                ; (prisma.event.findMany as jest.Mock).mockResolvedValue(mockLogisticsEvents)
                ; (prisma.socialPost.findMany as jest.Mock).mockResolvedValue(mockSocialPosts)

            const events = await getCalendarEvents()

            // Calculate expected number of events:
            // Projects: p1 (start + end = 2), p2 (start = 1) -> 3
            // Calendar Events: ce1, ce2 -> 2
            // Promotions: promo1 (start + end + live + image + publish = 5), promo2 (start + end = 2) -> 7
            // Logistics: le1, le2 -> 2
            // Social: sp1 (sp2 skipped) -> 1
            // Total: 3 + 2 + 7 + 2 + 1 = 15

            expect(events).toHaveLength(15)

            // Verify a few specifically mapped events
            const projectAStart = events.find(e => e.id === 'p1')
            expect(projectAStart).toMatchObject({
                title: 'Project A (Start)',
                type: 'project_start',
                projectId: 'p1'
            })

            const promo1Live = events.find(e => e.id === 'promo1_ad_live')
            expect(promo1Live).toMatchObject({
                title: 'Winter Sale (Ad Live)',
                type: 'promotion_ad_live',
                projectId: 'promo1'
            })

            const tradeShow = events.find(e => e.id === 'le1')
            expect(tradeShow).toMatchObject({
                title: 'Trade Show @ Convention Center',
                type: 'logistics_event',
                description: 'Booth setup'
            })

            const tweet = events.find(e => e.id === 'sp1')
            expect(tweet).toMatchObject({
                title: expect.stringContaining('Twitter: Exciting news coming'),
                type: 'social_post'
            })

            // Verify query arguments
            expect(prisma.event.findMany).toHaveBeenCalledWith({ include: { location: true } })
            expect(prisma.socialPost.findMany).toHaveBeenCalledWith({ where: { scheduledDate: { not: null } } })
        })

        it('should handle empty returns from all sources', async () => {
            ; (prisma.project.findMany as jest.Mock).mockResolvedValue([])
                ; (prisma.calendarEvent.findMany as jest.Mock).mockResolvedValue([])
                ; (prisma.promotionPeriod.findMany as jest.Mock).mockResolvedValue([])
            ; (prisma.theme.findMany as jest.Mock).mockResolvedValue([])
                ; (prisma.event.findMany as jest.Mock).mockResolvedValue([])
                ; (prisma.socialPost.findMany as jest.Mock).mockResolvedValue([])

            const events = await getCalendarEvents()
            expect(events).toHaveLength(0)
        })
    })
})
