
import {
    getEvents,
    getEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    getLocations,
    getUsers
} from '@/app/actions/events'
import { prisma } from '@/lib/db'
import { logActivity } from '@/app/actions/activity-logs'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Mock dependencies


jest.mock('@/app/actions/activity-logs', () => ({
    logActivity: jest.fn(),
}))

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

// redirect is mocked in jest.setup.ts

describe('Event Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('getEvents', () => {
        it('should fetch events', async () => {
            const mockEvents = [{ id: '1', title: 'Event 1' }]
                ; (prisma.event.findMany as jest.Mock).mockResolvedValue(mockEvents)

            const result = await getEvents()
            expect(result).toEqual(mockEvents)
        })
    })

    describe('createEvent', () => {
        it('should create event and redirect', async () => {
            const formData = new FormData()
            formData.append('title', 'New Event')
            formData.append('description', 'Desc')
            formData.append('startTime', '2023-01-01T10:00:00')
            formData.append('endTime', '2023-01-01T12:00:00')
            formData.append('locationId', 'loc-1')

            await createEvent(formData)

            expect(prisma.event.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    title: 'New Event',
                    locationId: 'loc-1',
                })
            })
            expect(logActivity).toHaveBeenCalledWith('CREATE', 'Event', 'mock_event_id', expect.any(String))
            expect(redirect).toHaveBeenCalledWith('/events')
        })
    })

    describe('updateEvent', () => {
        it('should update event', async () => {
            const formData = new FormData()
            formData.append('title', 'Updated Event')
            formData.append('startTime', '2023-01-01T10:00:00')
            formData.append('endTime', '2023-01-01T12:00:00')

            await updateEvent('1', formData)

            expect(prisma.event.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: expect.objectContaining({
                    title: 'Updated Event',
                })
            })
            expect(revalidatePath).toHaveBeenCalledWith('/events')
        })
    })

    describe('deleteEvent', () => {
        it('should delete event', async () => {
            await deleteEvent('1')
            expect(prisma.event.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: {
                    deletedAt: expect.any(Date),
                    updatedById: 'mock_user_id'
                }
            })
            expect(revalidatePath).toHaveBeenCalledWith('/events')
        })
    })

    describe('getLocations', () => {
        it('should fetch locations', async () => {
            await getLocations()
            expect(prisma.location.findMany).toHaveBeenCalled()
        })
    })

    describe('getUsers', () => {
        it('should fetch users', async () => {
            await getUsers()
            expect(prisma.user.findMany).toHaveBeenCalled()
        })
    })
})
