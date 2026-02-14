
import { getProjects, getProject, createProject, updateProject, updateProjectStatus, deleteProject } from '@/app/actions/projects'
import { prisma } from '@/lib/db'
import { logActivity } from '@/app/actions/activity-logs'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Mock dependencies
jest.mock('@/lib/db', () => ({
    prisma: {
        project: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    },
}))

jest.mock('@/app/actions/activity-logs', () => ({
    logActivity: jest.fn(),
}))

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

// redirect is mocked in jest.setup.ts

describe('Project Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('getProjects', () => {
        it('should fetch projects', async () => {
            const mockProjects = [{ id: '1', name: 'Project 1' }]
                ; (prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects)

            const projects = await getProjects()

            expect(projects).toEqual(mockProjects)
        })
    })

    describe('getProject', () => {
        it('should fetch single project', async () => {
            const mockProject = { id: '1', name: 'Project 1' }
                ; (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)

            const project = await getProject('1')

            expect(project).toEqual(mockProject)
        })
    })

    describe('createProject', () => {
        it('should create project and redirect', async () => {
            const formData = new FormData()
            formData.append('name', 'New Project')
            formData.append('description', 'Desc')
            formData.append('startDate', '2023-01-01')

            await createProject(formData)

            expect(prisma.project.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    name: 'New Project',
                    status: 'active',
                }),
            })
            expect(logActivity).toHaveBeenCalledWith('CREATE', 'Project', undefined, expect.any(String))
            expect(redirect).toHaveBeenCalledWith('/projects')
        })
    })

    describe('updateProject', () => {
        it('should update project', async () => {
            const formData = new FormData()
            formData.append('name', 'Updated Project')
            formData.append('status', 'completed')

            await updateProject('1', formData)

            expect(prisma.project.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: expect.objectContaining({
                    name: 'Updated Project',
                    status: 'completed',
                }),
            })
            expect(revalidatePath).toHaveBeenCalledWith('/projects')
            expect(revalidatePath).toHaveBeenCalledWith('/projects/1')
        })
    })

    describe('updateProjectStatus', () => {
        it('should update status', async () => {
            await updateProjectStatus('1', 'archived')

            expect(prisma.project.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: { status: 'archived' },
            })
        })
    })

    describe('deleteProject', () => {
        it('should delete project', async () => {
            await deleteProject('1')

            expect(prisma.project.delete).toHaveBeenCalledWith({
                where: { id: '1' },
            })
        })
    })
})
