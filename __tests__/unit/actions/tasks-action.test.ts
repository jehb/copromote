
import { getTasks, createTask, updateTask, updateTaskStatus, deleteTask } from '@/app/actions/tasks'
import { prisma } from '@/lib/db'
import { logActivity } from '@/app/actions/activity-logs'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

// Mock dependencies


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
        ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1' })
    })

    describe('getTasks', () => {
        it('should fetch tasks', async () => {
            const mockTasks = [{ id: '1', title: 'Task 1' }]
                ; (prisma.task.findMany as jest.Mock).mockResolvedValue(mockTasks)

            const tasks = await getTasks()

            expect(tasks).toEqual(mockTasks)
            expect(prisma.task.findMany).toHaveBeenCalledWith({
                where: { deletedAt: null },
                orderBy: { createdAt: 'desc' },
                include: expect.objectContaining({
                    assignee: true,
                    project: true,
                    createdBy: expect.any(Object),
                    updatedBy: expect.any(Object)
                }),
            })
        })
    })

    describe('createTask', () => {
        it('should create task with assignee from session', async () => {
            const formData = new FormData()
            formData.append('title', 'New Task')
            formData.append('dueDate', '2024-01-01')
            formData.append('projectId', 'proj-1')

                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' })

            await createTask(formData)

            expect(prisma.task.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    title: 'New Task',
                    assigneeId: 'user-1',
                    status: 'todo',
                    dueDate: expect.any(Date),
                    projectId: 'proj-1'
                }),
            })
            expect(logActivity).toHaveBeenCalledWith('CREATE', 'Task', 'mock_task_id', expect.stringContaining('New Task'))
            expect(revalidatePath).toHaveBeenCalledWith('/tasks')
        })

        it('should throw Unauthorized if no session', async () => {
            const formData = new FormData()
            formData.append('title', 'New Task')
            formData.append('projectId', 'none')

                ; (getSession as jest.Mock).mockResolvedValue(null)

            await expect(createTask(formData)).rejects.toThrow('Unauthorized')
        })
    })

    describe('updateTask', () => {
        it('should update task details', async () => {
            const formData = new FormData()
            formData.append('title', 'Updated Task')
            formData.append('assigneeId', 'user-2')
            formData.append('dueDate', '2024-01-01')
            formData.append('projectId', 'proj-1')

            await updateTask('task-1', formData)

            expect(prisma.task.update).toHaveBeenCalledWith({
                where: { id: 'task-1' },
                data: expect.objectContaining({
                    title: 'Updated Task',
                    assigneeId: 'user-2',
                    dueDate: expect.any(Date),
                    projectId: 'proj-1'
                }),
            })
        })

        it('should handle unassigning task', async () => {
            const formData = new FormData()
            formData.append('title', 'Updated Task')
            formData.append('assigneeId', 'none')
            formData.append('projectId', 'none')

            await updateTask('task-1', formData)

            expect(prisma.task.update).toHaveBeenCalledWith({
                where: { id: 'task-1' },
                data: expect.objectContaining({
                    assigneeId: null,
                    dueDate: null,
                    projectId: null
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

            expect(prisma.task.update).toHaveBeenCalledWith({
                where: { id: 'task-1' },
                data: {
                    deletedAt: expect.any(Date),
                    updatedById: 'user-1'
                }
            })
            expect(logActivity).toHaveBeenCalledWith('DELETE', 'Task', 'task-1', 'Soft deleted task')
        })
    })
})
