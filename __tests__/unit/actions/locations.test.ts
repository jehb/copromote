import {
    getLocations,
    createLocation,
    updateLocation,
    deleteLocation,
} from '@/app/actions/locations'
import { prisma } from '@/lib/db'
import { logActivity } from '@/app/actions/activity-logs'
import { revalidatePath } from 'next/cache'

jest.mock('@/lib/db', () => ({
    prisma: {
        location: {
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findUnique: jest.fn(),
        },
    },
}))

jest.mock('@/app/actions/activity-logs', () => ({
    logActivity: jest.fn(),
}))

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

describe('Locations Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('getLocations', () => {
        it('should fetch locations with event counts', async () => {
            const mockLocs = [{ id: '1', name: 'Main Hall', _count: { events: 2 } }]
                ; (prisma.location.findMany as jest.Mock).mockResolvedValue(mockLocs)

            const result = await getLocations()

            expect(result).toEqual(mockLocs)
            expect(prisma.location.findMany).toHaveBeenCalledWith({
                orderBy: { name: 'asc' },
                include: { _count: { select: { events: true } } },
            })
        })
    })

    describe('createLocation', () => {
        it('should throw error if name missing', async () => {
            const formData = new FormData()

            await expect(createLocation(formData)).rejects.toThrow('Name is required')
        })

        it('should create location successfully', async () => {
            const formData = new FormData()
            formData.append('name', 'Room B')

                ; (prisma.location.create as jest.Mock).mockResolvedValue({ id: '2', name: 'Room B' })

            const result = await createLocation(formData)

            expect(result.success).toBe(true)
            expect(result.location?.name).toBe('Room B')
            expect(logActivity).toHaveBeenCalledWith('CREATE', 'Location', '2', 'Created location: Room B')
            expect(revalidatePath).toHaveBeenCalledWith('/admin/locations')
        })

        it('should handle duplicate name error', async () => {
            const formData = new FormData()
            formData.append('name', 'Room B')

            const error = new Error('Unique constraint failed')
                ; (error as any).code = 'P2002'
                ; (prisma.location.create as jest.Mock).mockRejectedValue(error)

            const result = await createLocation(formData)

            expect(result.success).toBe(false)
            expect(result.message).toContain('already exists')
        })

        it('should handle generic creation error', async () => {
            const formData = new FormData()
            formData.append('name', 'Room B')

                ; (prisma.location.create as jest.Mock).mockRejectedValue(new Error('DB error'))

            const result = await createLocation(formData)

            expect(result.success).toBe(false)
            expect(result.message).toContain('Failed to create')
        })
    })

    describe('updateLocation', () => {
        it('should throw error if name missing', async () => {
            const formData = new FormData()

            await expect(updateLocation('1', formData)).rejects.toThrow('Name is required')
        })

        it('should update location successfully', async () => {
            const formData = new FormData()
            formData.append('name', 'Updated Room')

                ; (prisma.location.update as jest.Mock).mockResolvedValue({ id: '1', name: 'Updated Room' })

            const result = await updateLocation('1', formData)

            expect(result.success).toBe(true)
            expect(result.location?.name).toBe('Updated Room')
            expect(logActivity).toHaveBeenCalledWith('UPDATE', 'Location', '1', 'Updated location: Updated Room')
            expect(revalidatePath).toHaveBeenCalledWith('/admin/locations')
        })

        it('should handle duplicate name error', async () => {
            const formData = new FormData()
            formData.append('name', 'Updated Room')

            const error = new Error('Unique constraint failed')
                ; (error as any).code = 'P2002'
                ; (prisma.location.update as jest.Mock).mockRejectedValue(error)

            const result = await updateLocation('1', formData)

            expect(result.success).toBe(false)
            expect(result.message).toContain('already exists')
        })

        it('should handle generic update error', async () => {
            const formData = new FormData()
            formData.append('name', 'Updated Room')

                ; (prisma.location.update as jest.Mock).mockRejectedValue(new Error('DB error'))

            const result = await updateLocation('1', formData)

            expect(result.success).toBe(false)
            expect(result.message).toContain('Failed to update')
        })
    })

    describe('deleteLocation', () => {
        it('should handle location not found', async () => {
            ; (prisma.location.findUnique as jest.Mock).mockResolvedValue(null)

            const result = await deleteLocation('1')

            expect(result.success).toBe(false)
            expect(result.message).toContain('not found')
        })

        it('should prevent deleting location in use', async () => {
            ; (prisma.location.findUnique as jest.Mock).mockResolvedValue({
                id: '1', name: 'In Use Loc', _count: { events: 5 }
            })

            const result = await deleteLocation('1')

            expect(result.success).toBe(false)
            expect(result.message).toContain('Cannot delete location')
            expect(result.message).toContain('5 events')
        })

        it('should delete location successfully', async () => {
            ; (prisma.location.findUnique as jest.Mock).mockResolvedValue({
                id: '1', name: 'Delete Me Loc', _count: { events: 0 }
            })
                ; (prisma.location.delete as jest.Mock).mockResolvedValue({})

            const result = await deleteLocation('1')

            expect(result.success).toBe(true)
            expect(prisma.location.delete).toHaveBeenCalledWith({ where: { id: '1' } })
            expect(logActivity).toHaveBeenCalledWith('DELETE', 'Location', '1', 'Deleted location: Delete Me Loc')
            expect(revalidatePath).toHaveBeenCalledWith('/admin/locations')
        })

        it('should handle generic deletion errors', async () => {
            ; (prisma.location.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'))

            const result = await deleteLocation('1')

            expect(result.success).toBe(false)
            expect(result.message).toContain('Failed to delete')
        })
    })
})
