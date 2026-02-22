import { getEventSeries, createEventSeries } from '@/app/actions/event-series'
import { prisma } from '@/lib/db'
import { logActivity } from '@/app/actions/activity-logs'
import { revalidatePath } from 'next/cache'

jest.mock('@/lib/db', () => ({
    prisma: {
        eventSeries: {
            findMany: jest.fn(),
            create: jest.fn(),
        }
    }
}))

jest.mock('@/app/actions/activity-logs', () => ({
    logActivity: jest.fn()
}))

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn()
}))

describe('Event Series Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.spyOn(console, 'error').mockImplementation(() => { })
    })

    describe('getEventSeries', () => {
        it('should fetch all event series with their ordered events', async () => {
            const mockSeries = [
                { id: '1', title: 'Series A', events: [] }
            ]
                ; (prisma.eventSeries.findMany as jest.Mock).mockResolvedValue(mockSeries)

            const result = await getEventSeries()

            expect(prisma.eventSeries.findMany).toHaveBeenCalledWith({
                orderBy: { title: 'asc' },
                include: {
                    events: {
                        orderBy: { startTime: 'asc' },
                        select: {
                            id: true,
                            title: true,
                            startTime: true
                        }
                    }
                }
            })
            expect(result).toEqual(mockSeries)
        })
    })

    describe('createEventSeries', () => {
        it('should return error if title is empty', async () => {
            const result = await createEventSeries('   ')
            expect(result).toEqual({ success: false, message: 'Title is required' })
            expect(prisma.eventSeries.create).not.toHaveBeenCalled()
        })

        it('should create an event series successfully', async () => {
            const mockSeries = { id: 's1', title: 'New Series' }
                ; (prisma.eventSeries.create as jest.Mock).mockResolvedValue(mockSeries)

            const result = await createEventSeries('New Series ')

            expect(prisma.eventSeries.create).toHaveBeenCalledWith({
                data: {
                    title: 'New Series' // trimmed
                }
            })
            expect(logActivity).toHaveBeenCalledWith(
                'CREATE',
                'EventSeries',
                's1',
                'Created event series: New Series'
            )
            expect(revalidatePath).toHaveBeenCalledWith('/events')
            expect(result).toEqual({ success: true, series: mockSeries })
        })

        it('should handle creation errors gracefully', async () => {
            ; (prisma.eventSeries.create as jest.Mock).mockRejectedValue(new Error('DB Error'))

            const result = await createEventSeries('New Series')

            expect(console.error).toHaveBeenCalled()
            expect(result).toEqual({ success: false, message: 'Failed to create event series' })
        })
    })
})
