import {
    getProjects,
    getProject,
    createProject,
    deleteProject,
    updateProjectStatus,
    updateProject
} from '@/app/actions/projects'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logActivity } from '@/app/actions/activity-logs'
import { getCurrentUserId, getCurrentUser } from '@/lib/user-util'

jest.mock('@/lib/db', () => ({
    prisma: {
        project: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
            update: jest.fn(),
        },
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
    getCurrentUser: jest.fn(),
}))

describe('Projects Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
            ; (getCurrentUserId as jest.Mock).mockResolvedValue('user-1')
            ; (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1', role: 'USER' })
    })

    describe('getProjects', () => {
        it('should fetch all projects ordered by createdAt desc', async () => {
            const mockProjects = [{ id: '1', name: 'Project A' }]
                ; (prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects)

            const result = await getProjects()

            expect(result).toEqual(mockProjects)
            expect(prisma.project.findMany).toHaveBeenCalledWith(expect.objectContaining({
                orderBy: { createdAt: 'desc' },
                include: expect.any(Object)
            }))
        })
    })

    describe('getProject', () => {
        it('should fetch a single project by id', async () => {
            const mockProject = { id: '1', name: 'Project A' }
                ; (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)

            const result = await getProject('1')

            expect(result).toEqual(mockProject)
            expect(prisma.project.findUnique).toHaveBeenCalledWith({
                where: { id: '1' },
                include: expect.any(Object)
            })
        })
    })

    describe('createProject', () => {
        it('should create a project with dates correctly parsed', async () => {
            const formData = new FormData()
            formData.append('name', 'New Project')
            formData.append('description', 'A test project')
            formData.append('startDate', '2025-01-01')
            formData.append('endDate', '2025-12-31')

                ; (prisma.project.create as jest.Mock).mockResolvedValue({ id: 'proj-1' })
                ; (redirect as unknown as jest.Mock).mockImplementation(() => { throw new Error('NEXT_REDIRECT') })

            await expect(createProject(formData)).rejects.toThrow('NEXT_REDIRECT')

            expect(prisma.project.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    name: 'New Project',
                    description: 'A test project',
                    startDate: new Date('2025-01-01'),
                    endDate: new Date('2025-12-31'),
                    status: 'active',
                    createdById: 'user-1',
                    updatedById: 'user-1'
                })
            })
            expect(logActivity).toHaveBeenCalledWith('CREATE', 'Project', 'proj-1', 'Created project: New Project')
            expect(revalidatePath).toHaveBeenCalledWith('/projects')
            expect(revalidatePath).toHaveBeenCalledWith('/')
            expect(redirect).toHaveBeenCalledWith('/projects')
        })

        it('should create a project without an endDate if not provided', async () => {
            const formData = new FormData()
            formData.append('name', 'P2')
            formData.append('description', 'D2')
            formData.append('startDate', '2025-01-01')

                ; (prisma.project.create as jest.Mock).mockResolvedValue({ id: 'proj-2' })
                ; (redirect as unknown as jest.Mock).mockImplementation(() => { throw new Error('NEXT_REDIRECT') })

            await expect(createProject(formData)).rejects.toThrow('NEXT_REDIRECT')

            expect(prisma.project.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    endDate: null
                })
            }))
        })
    })

    describe('deleteProject', () => {
        it('should throw error if user is not ADMIN', async () => {
            ; (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1', role: 'USER' })

            await expect(deleteProject('proj-1')).rejects.toThrow('Only admins can delete projects')
            expect(prisma.project.delete).not.toHaveBeenCalled()
        })

        it('should delete project if user is ADMIN', async () => {
            ; (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'admin-1', role: 'ADMIN' })
                ; (prisma.project.delete as jest.Mock).mockResolvedValue({ id: 'proj-1' })

            await deleteProject('proj-1')

            expect(prisma.project.delete).toHaveBeenCalledWith({ where: { id: 'proj-1' } })
            expect(logActivity).toHaveBeenCalledWith('DELETE', 'Project', 'proj-1', 'Deleted project')
            expect(revalidatePath).toHaveBeenCalledWith('/projects')
            expect(revalidatePath).toHaveBeenCalledWith('/')
        })
    })

    describe('updateProjectStatus', () => {
        it('should update the status of a project', async () => {
            ; (prisma.project.update as jest.Mock).mockResolvedValue({ id: 'proj-1' })

            await updateProjectStatus('proj-1', 'completed')

            expect(prisma.project.update).toHaveBeenCalledWith({
                where: { id: 'proj-1' },
                data: { status: 'completed' }
            })
            expect(logActivity).toHaveBeenCalledWith('UPDATE', 'Project', 'proj-1', 'Updated status to: completed')
            expect(revalidatePath).toHaveBeenCalledWith('/projects')
        })
    })

    describe('updateProject', () => {
        it('should update a project with all fields', async () => {
            const formData = new FormData()
            formData.append('name', 'Updated Project')
            formData.append('description', 'Updated description')
            formData.append('startDate', '2025-01-02')
            formData.append('endDate', '2025-11-30')
            formData.append('status', 'archived')

                ; (prisma.project.update as jest.Mock).mockResolvedValue({ id: 'proj-1' })

            await updateProject('proj-1', formData)

            expect(prisma.project.update).toHaveBeenCalledWith({
                where: { id: 'proj-1' },
                data: expect.objectContaining({
                    name: 'Updated Project',
                    description: 'Updated description',
                    startDate: new Date('2025-01-02'),
                    endDate: new Date('2025-11-30'),
                    status: 'archived',
                    updatedById: 'user-1'
                })
            })
            expect(logActivity).toHaveBeenCalledWith('UPDATE', 'Project', 'proj-1', 'Updated project: Updated Project')
            expect(revalidatePath).toHaveBeenCalledWith('/projects')
            expect(revalidatePath).toHaveBeenCalledWith('/projects/proj-1')
        })

        it('should update a project without an endDate if not provided', async () => {
            const formData = new FormData()
            formData.append('name', 'P3')
            formData.append('description', 'D3')
            formData.append('startDate', '2025-01-01')
            formData.append('status', 'active')

                ; (prisma.project.update as jest.Mock).mockResolvedValue({ id: 'proj-1' })

            await updateProject('proj-1', formData)

            expect(prisma.project.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    endDate: null
                })
            }))
        })
    })
})
