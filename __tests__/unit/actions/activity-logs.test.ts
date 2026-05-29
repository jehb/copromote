
import { logActivity, getActivityLogs } from '@/app/actions/activity-logs'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        activityLog: {
            create: jest.fn(),
            findMany: jest.fn(),
        },
    },
}))

jest.mock('@/lib/session', () => ({
    getSession: jest.fn(),
}))

describe('Activity Logs Action', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('logActivity', () => {
        it('should create an activity log entry', async () => {
            (getSession as jest.Mock).mockResolvedValue({ id: 'user-123' })

            await logActivity('CREATE', 'Task', 'task-123', 'Created a task')

            expect(prisma.activityLog.create).toHaveBeenCalledWith({
                data: {
                    action: 'CREATE',
                    entityType: 'Task',
                    entityId: 'task-123',
                    details: 'Created a task',
                    userId: 'user-123',
                },
            })
        })

        it('should handle errors gracefully', async () => {
            (getSession as jest.Mock).mockResolvedValue({ id: 'user-123' })
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { })
                ; (prisma.activityLog.create as jest.Mock).mockRejectedValue(new Error('DB Error'))

            await logActivity('CREATE', 'Task')

            expect(consoleSpy).toHaveBeenCalledWith('Failed to log activity:', expect.any(Error))
            consoleSpy.mockRestore()
        })
    })

    describe('getActivityLogs', () => {
        it('should fetch activity logs', async () => {
            const mockLogs = [{ id: '1', action: 'CREATE' }]
                ; (prisma.activityLog.findMany as jest.Mock).mockResolvedValue(mockLogs)

            const logs = await getActivityLogs()

            expect(logs).toEqual(mockLogs)
            expect(prisma.activityLog.findMany).toHaveBeenCalledWith({
                orderBy: { createdAt: 'desc' },
                include: expect.any(Object),
                take: 100,
            })
        })

        it('should return empty array on error', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { })
                ; (prisma.activityLog.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'))

            const logs = await getActivityLogs()

            expect(logs).toEqual([])
            expect(consoleSpy).toHaveBeenCalled()
            consoleSpy.mockRestore()
        })
    })
})
