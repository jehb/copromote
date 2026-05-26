import {
    getEvents,
    getEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    getLocations,
    getUsers,
    searchEventsForAutocomplete
} from '@/app/actions/events'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logActivity } from '@/app/actions/activity-logs'
import { getCurrentUserId } from '@/lib/user-util'
import { fromZonedTime } from 'date-fns-tz'
import { EventStatus } from '@prisma/client'

jest.mock('@/lib/db', () => ({
    prisma: {
        event: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            updateMany: jest.fn(),
        },
        location: {
            findMany: jest.fn(),
        },
        user: {
            findMany: jest.fn(),
        }
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

describe('Events Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
            ; (getCurrentUserId as jest.Mock).mockResolvedValue('user-1')
    })

    describe('getEvents', () => {
        it('should fetch events with includes ordered by startTime', async () => {
            const mockEvents = [{ id: '1' }]
                ; (prisma.event.findMany as jest.Mock).mockResolvedValue(mockEvents)

            const result = await getEvents()

            expect(result).toEqual(mockEvents)
            expect(prisma.event.findMany).toHaveBeenCalledWith(expect.objectContaining({
                orderBy: { startTime: 'asc' },
                include: expect.any(Object),
            }))
        })
    })

    describe('getEvent', () => {
        it('should fetch a single event by id', async () => {
            const mockEvent = { id: '1' }
                ; (prisma.event.findFirst as jest.Mock).mockResolvedValue(mockEvent)

            const result = await getEvent('1')

            expect(result).toEqual(mockEvent)
            expect(prisma.event.findFirst).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: '1', deletedAt: null },
                include: expect.any(Object),
            }))
        })
    })

    describe('createEvent', () => {
        it('should create an event with basic fields', async () => {
            const formData = new FormData()
            formData.append('title', 'Test Event')
            formData.append('description', 'Test Desc')
            formData.append('startTime', '2025-01-01T10:00:00')
            formData.append('endTime', '2025-01-01T12:00:00')
            formData.append('locationId', 'loc-1')

                ; (prisma.event.create as jest.Mock).mockResolvedValue({ id: 'event-1' })
                ; (redirect as unknown as jest.Mock).mockImplementation(() => { throw new Error('NEXT_REDIRECT') })

            await expect(createEvent(formData)).rejects.toThrow('NEXT_REDIRECT')

            expect(prisma.event.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    title: 'Test Event',
                    description: 'Test Desc',
                    locationId: 'loc-1',
                    status: EventStatus.SCHEDULED,
                    createdById: 'user-1',
                    updatedById: 'user-1',
                })
            })
            expect(logActivity).toHaveBeenCalled()
            expect(revalidatePath).toHaveBeenCalledWith('/calendar')
            expect(revalidatePath).toHaveBeenCalledWith('/events')
            expect(redirect).toHaveBeenCalledWith('/events')
        })

        it('should create an event with optional fields and relations', async () => {
            const formData = new FormData()
            formData.append('title', 'Complex Event')
            formData.append('startTime', '2025-01-01T10:00:00')
            formData.append('endTime', '2025-01-01T12:00:00')
            formData.append('primaryContactId', 'contact-1')
            formData.append('seriesId', 'series-1')
            formData.append('wordpressId', '123')
            formData.append('wordpressUrl', 'http://wp.com')
            formData.append('contactIds', 'c1')
            formData.append('contactIds', 'c2')
            formData.append('organizationIds', 'o1')
            formData.append('productUpcs', '123456789012')
            formData.append('productUpcs', '987654321098')
            formData.append('status', EventStatus.CANCELED)

                ; (prisma.event.create as jest.Mock).mockResolvedValue({ id: 'event-2' })
                ; (redirect as unknown as jest.Mock).mockImplementation(() => { throw new Error('NEXT_REDIRECT') })

            await expect(createEvent(formData)).rejects.toThrow('NEXT_REDIRECT')

            expect(prisma.event.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    primaryContactId: 'contact-1',
                    seriesId: 'series-1',
                    wordpressId: 123,
                    wordpressUrl: 'http://wp.com',
                    status: EventStatus.CANCELED,
                    contacts: { connect: [{ id: 'c1' }, { id: 'c2' }] },
                    organizations: { connect: [{ id: 'o1' }] },
                    products: { create: [{ upc: '123456789012' }, { upc: '987654321098' }] },
                })
            })
        })

        it('should handle "none" seriesId correctly', async () => {
            const formData = new FormData()
            formData.append('title', 'Event')
            formData.append('startTime', '2025-01-01T10:00:00')
            formData.append('endTime', '2025-01-01T12:00:00')
            formData.append('seriesId', 'none')

                ; (prisma.event.create as jest.Mock).mockResolvedValue({ id: 'event-3' })
                ; (redirect as unknown as jest.Mock).mockImplementation(() => { throw new Error('NEXT_REDIRECT') })

            await expect(createEvent(formData)).rejects.toThrow('NEXT_REDIRECT')

            expect(prisma.event.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    seriesId: undefined
                })
            }))
        })
    })

    describe('updateEvent', () => {
        it('should update an event successfully', async () => {
            const formData = new FormData()
            formData.append('title', 'Updated Event')
            formData.append('startTime', '2025-01-01T10:00:00')
            formData.append('endTime', '2025-01-01T12:00:00')
            formData.append('primaryContactId', 'contact-2')
            formData.append('wordpressId', '456')
            formData.append('status', EventStatus.PAST)
            formData.append('contactIds', 'c3')
            formData.append('organizationIds', 'o2')
            formData.append('productUpcs', '555555555555')

                ; (prisma.event.update as jest.Mock).mockResolvedValue({ id: 'event-1' })

            await updateEvent('event-1', formData)

            expect(prisma.event.update).toHaveBeenCalledWith({
                where: { id: 'event-1' },
                data: expect.objectContaining({
                    title: 'Updated Event',
                    status: EventStatus.PAST,
                    primaryContactId: 'contact-2',
                    wordpressId: 456,
                    seriesId: null, // Since seriesId is undefined/not provided
                    contacts: { set: [{ id: 'c3' }] },
                    organizations: { set: [{ id: 'o2' }] },
                    products: {
                        deleteMany: {},
                        create: [{ upc: '555555555555' }]
                    },
                    updatedById: 'user-1'
                })
            })
            expect(logActivity).toHaveBeenCalled()
            expect(revalidatePath).toHaveBeenCalledWith('/events')
            expect(revalidatePath).toHaveBeenCalledWith('/calendar')
            expect(revalidatePath).toHaveBeenCalledWith('/events/event-1')
        })

        it('should handle "none" seriesId in update', async () => {
            const formData = new FormData()
            formData.append('title', 'Event')
            formData.append('startTime', '2025-01-01T10:00:00')
            formData.append('endTime', '2025-01-01T12:00:00')
            formData.append('seriesId', 'none')

                ; (prisma.event.update as jest.Mock).mockResolvedValue({ id: 'event-1' })

            await updateEvent('event-1', formData)

            expect(prisma.event.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    seriesId: null
                })
            }))
        })

        it('should handle a valid seriesId in update', async () => {
            const formData = new FormData()
            formData.append('title', 'Event')
            formData.append('startTime', '2025-01-01T10:00:00')
            formData.append('endTime', '2025-01-01T12:00:00')
            formData.append('seriesId', 'series-123')

                ; (prisma.event.update as jest.Mock).mockResolvedValue({ id: 'event-1' })

            await updateEvent('event-1', formData)

            expect(prisma.event.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    seriesId: 'series-123'
                })
            }))
        })
    })

    describe('deleteEvent', () => {
        it('should delete an event and revalidate paths', async () => {
            ; (prisma.event.update as jest.Mock).mockResolvedValue({ id: 'event-1' })

            await deleteEvent('event-1')

            expect(prisma.event.update).toHaveBeenCalledWith({
                where: { id: 'event-1' },
                data: expect.objectContaining({
                    deletedAt: expect.any(Date),
                })
            })
            expect(logActivity).toHaveBeenCalledWith('DELETE', 'Event', 'event-1', 'Soft deleted event')
            expect(revalidatePath).toHaveBeenCalledWith('/events')
            expect(revalidatePath).toHaveBeenCalledWith('/calendar')
        })
    })

    describe('getLocations', () => {
        it('should fetch locations ordered by name', async () => {
            const mockLocations = [{ id: '1' }]
                ; (prisma.location.findMany as jest.Mock).mockResolvedValue(mockLocations)

            const result = await getLocations()

            expect(result).toEqual(mockLocations)
            expect(prisma.location.findMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } })
        })
    })

    describe('getUsers', () => {
        it('should fetch users ordered by name', async () => {
            const mockUsers = [{ id: '1' }]
                ; (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers)

            const result = await getUsers()

            expect(result).toEqual(mockUsers)
            expect(prisma.user.findMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } })
        })
    })

    describe('searchEventsForAutocomplete', () => {
        beforeAll(() => {
            jest.useFakeTimers().setSystemTime(new Date('2025-01-01T00:00:00.000Z'))
        })

        afterAll(() => {
            jest.useRealTimers()
        })

        it('should return recent events sorted by time proximity when query is empty', async () => {
            const mockEvents = [
                { id: '1', title: 'Far Future', startTime: new Date('2026-01-01T00:00:00.000Z') },
                { id: '2', title: 'Near Future', startTime: new Date('2025-01-02T00:00:00.000Z') },
                { id: '3', title: 'Near Past', startTime: new Date('2024-12-31T00:00:00.000Z') }
            ]
                ; (prisma.event.findMany as jest.Mock).mockResolvedValue(mockEvents)

            const result = await searchEventsForAutocomplete('')

            expect(prisma.event.findMany).toHaveBeenCalledWith({
                where: { deletedAt: null },
                take: 10,
                select: expect.any(Object)
            })
            // Nearest expected: Near Past (1 day diff), Near Future (1 day diff), Far Future (~365 days diff)
            // Due to absolute diff:
            // diff3 (Near Past) = 24h
            // diff2 (Near Future) = 24h
            // The exact sort between equal diffs doesn't strictly matter, as long as 1 is last
            expect(result[2].id).toBe('1')
            // Assert objects possess serializable datestrings
            expect(typeof result[0].startTime).toBe('string')
        })

        it('should filter events by query', async () => {
            const mockEvents = [
                { id: '1', title: 'Test', startTime: new Date('2025-01-02T00:00:00.000Z') }
            ]
                ; (prisma.event.findMany as jest.Mock).mockResolvedValue(mockEvents)

            const result = await searchEventsForAutocomplete('Test')

            expect(prisma.event.findMany).toHaveBeenCalledWith({
                where: { title: { contains: 'Test' }, deletedAt: null },
                take: 10,
                select: expect.any(Object)
            })
            expect(result.length).toBe(1)
            expect(result[0].title).toBe('Test')
        })
    })
})
