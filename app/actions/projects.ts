'use server'
import { getSession } from '@/lib/session'

import { prisma } from '@/lib/db' // Ensure you have this configured
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logActivity } from '@/app/actions/activity-logs'
import { getCurrentUserId, getCurrentUser } from '@/lib/user-util'

export async function getProjects() {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    return await prisma.project.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: {
                    assets: true,
                    tasks: true
                }
            },
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    username: true
                }
            },
            updatedBy: {
                select: {
                    id: true,
                    name: true,
                    username: true
                }
            },
            tasks: {
                select: {
                    status: true
                }
            }
        }
    })
}

export async function getProject(id: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    return await prisma.project.findFirst({
        where: { id, deletedAt: null },
        include: {
            assets: true,
            events: true,
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    username: true
                }
            },
            updatedBy: {
                select: {
                    id: true,
                    name: true,
                    username: true
                }
            },
            tasks: {
                where: { deletedAt: null },
                orderBy: { createdAt: 'desc' },
                include: {
                    assignee: true,
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            username: true
                        }
                    },
                    updatedBy: {
                        select: {
                            id: true,
                            name: true,
                            username: true
                        }
                    }
                }
            }
        }
    })
}

export async function createProject(formData: FormData) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const startDate = new Date(formData.get('startDate') as string)
    const endDateStr = formData.get('endDate') as string
    const endDate = endDateStr ? new Date(endDateStr) : null

    const userId = await getCurrentUserId()

    const project = await prisma.project.create({
        data: {
            name,
            description,
            startDate,
            endDate,
            status: 'Active',
            createdById: userId,
            updatedById: userId
        }
    })

    // Note: Project ID is not easily available here unless we capture the result.
    // However, since create returns the object, we should capture it.
    // But the original code didn't capture it.
    // I need to change: await prisma.project.create(...) -> const project = ...
    // But current chunk is:
    // })
    // So I can't easily change the variable assignment without a larger chunk.
    // I will use a larger chunk or accept undefined ID for now, or fetch it?
    // Actually, I can use a generic "Created project" log.
    // But better to capture it. I'll modify the `createProject` function logic if I can.
    // Let's just log without ID for now or refactor slightly.
    // I'll refactor slightly in a separate chunk or this one if I target more lines.
    // I'll stick to targeted logging for now.
    await logActivity('CREATE', 'Project', project.id, `Created project: ${name}`)

    revalidatePath('/projects')
    revalidatePath('/')
    redirect('/projects')
}

export async function deleteProject(id: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const user = await getCurrentUser()
    if (user?.role !== 'ADMIN') {
        throw new Error('Only admins can delete projects')
    }

    await prisma.project.update({
        where: { id },
        data: {
            deletedAt: new Date(),
            updatedById: user.id
        }
    })
    await logActivity('DELETE', 'Project', id, 'Soft deleted project')
    revalidatePath('/projects')
    revalidatePath('/')
}

export async function updateProjectStatus(id: string, status: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    await prisma.project.update({
        where: { id },
        data: { status }
    })
    await logActivity('UPDATE', 'Project', id, `Updated status to: ${status}`)
    revalidatePath('/projects')
}

export async function updateProject(id: string, formData: FormData) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const startDate = new Date(formData.get('startDate') as string)
    const endDateStr = formData.get('endDate') as string
    const endDate = endDateStr ? new Date(endDateStr) : null
    const status = formData.get('status') as string

    const userId = await getCurrentUserId()

    await prisma.project.update({
        where: { id },
        data: {
            name,
            description,
            startDate,
            endDate,
            status,
            updatedById: userId
        }
    })

    await logActivity('UPDATE', 'Project', id, `Updated project: ${name}`)

    revalidatePath('/projects')
    revalidatePath(`/projects/${id}`)
}
