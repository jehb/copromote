
import { getTasks, createTask, updateTask, updateTaskStatus, deleteTask } from '@/app/actions/tasks'
import { prisma } from '@/lib/db'
import { logActivity } from '@/app/actions/activity-logs'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

// Mock dependencies
jest.mock('@/lib/db', () => ({
    prisma: {
        task: {
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
        },
    },
}))

jest.mock('@/app/actions/activity-logs', () => ({
    logActivity: jest.fn(),
}))

jest.mock('@/lib/session', () => ({
    getSession: jest.fn(),
}))

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

describe('Task Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('getTasks', () => {
        it('should fetch tasks', async () => {
            const mockTasks = [{ id: '1', title: 'Task 1' }]
                ; (prisma.task.findMany as jest.Mock).mockResolvedValue(mockTasks)

            const tasks = await getTasks()

            expect(tasks).toEqual(mockTasks)
            expect(prisma.task.findMany).toHaveBeenCalledWith({
                orderBy: { createdAt: 'desc' },
                include: { assignee: true, project: true },
            })
        })
    })

    describe('createTask', () => {
        it('should create task with assignee from session', async () => {
            const formData = new FormData()
            formData.append('title', 'New Task')

                ; (getSession as jest.Mock).mockResolvedValue({ id: 'user-1' })
                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' })

            await createTask(formData)

            expect(prisma.task.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    title: 'New Task',
                    assigneeId: 'user-1',
                    status: 'todo',
                }),
            })
            expect(logActivity).toHaveBeenCalledWith('CREATE', 'Task', undefined, expect.stringContaining('New Task'))
            expect(revalidatePath).toHaveBeenCalledWith('/tasks')
        })

        it('should create task without assignee if no session', async () => {
            const formData = new FormData()
            formData.append('title', 'New Task')

                ; (getSession as jest.Mock).mockResolvedValue(null)

            await createTask(formData)

            expect(prisma.task.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    title: 'New Task',
                    assigneeId: null,
                }),
            })
        })
    })

    describe('updateTask', () => {
        it('should update task details', async () => {
            const formData = new FormData()
            formData.append('title', 'Updated Task')
            formData.append('assigneeId', 'user-2')

            await updateTask('task-1', formData)

            expect(prisma.task.update).toHaveBeenCalledWith({
                where: { id: 'task-1' },
                data: expect.objectContaining({
                    title: 'Updated Task',
                    assigneeId: 'user-2',
                }),
            })
        })

        it('should handle unassigning task', async () => {
            const formData = new FormData()
            formData.append('title', 'Updated Task')
            formData.append('assigneeId', 'none')

            await updateTask('task-1', formData)

            expect(prisma.task.update).toHaveBeenCalledWith({
                where: { id: 'task-1' },
                data: expect.objectContaining({
                    assigneeId: null,
                }),
            })
        })
    })

    describe('updateTaskStatus', () => {
        it('should update task status', async () => {
            await updateTaskStatus('task-1', 'done')

            expect(prisma.task.update).toHaveBeenCalledWith({
                where: { id: 'task-1' },
                data: { status: 'done' },
            })
        })
    })

    describe('deleteTask', () => {
        it('should delete task', async () => {
            await deleteTask('task-1')

            expect(prisma.task.delete).toHaveBeenCalledWith({
                where: { id: 'task-1' },
            })
            expect(logActivity).toHaveBeenCalledWith('DELETE', 'Task', 'task-1', 'Deleted task')
        })
    })
})
