'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/app/actions/activity-logs'
import { getSession } from '@/lib/session'

export async function getTasks() {
    return await prisma.task.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            assignee: true,
            project: true
        }
    })
}

export async function createTask(formData: FormData) {
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const status = formData.get('status') as string || 'todo'
    const dueDateStr = formData.get('dueDate') as string
    const session = await getSession()

    // Verify user exists to prevent foreign key constraint errors
    let assigneeId = null
    if (session?.id) {
        const user = await prisma.user.findUnique({
            where: { id: session.id },
            select: { id: true }
        })
        if (user) {
            assigneeId = user.id
        }
    }

    await prisma.task.create({
        data: {
            title,
            description,
            status,
            dueDate: dueDateStr ? new Date(dueDateStr) : null,
            assigneeId,
            projectId: (formData.get('projectId') as string) || null
        }
    })

    await logActivity('CREATE', 'Task', undefined, `Created task: ${title}`)

    revalidatePath('/tasks')
}

export async function updateTask(id: string, formData: FormData) {
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const status = formData.get('status') as string
    const dueDateStr = formData.get('dueDate') as string
    const assigneeId = formData.get('assigneeId') as string

    await prisma.task.update({
        where: { id },
        data: {
            title,
            description,
            status,
            dueDate: dueDateStr ? new Date(dueDateStr) : null,
            assigneeId: assigneeId === 'none' ? null : assigneeId,
            projectId: formData.get('projectId') as string || null
        }
    })

    await logActivity('UPDATE', 'Task', id, `Updated task: ${title}`)

    revalidatePath('/tasks')
}

export async function updateTaskStatus(id: string, status: string) {
    await prisma.task.update({
        where: { id },
        data: { status }
    })
    await logActivity('UPDATE', 'Task', id, `Updated task status to: ${status}`)
    revalidatePath('/tasks')
}

export async function deleteTask(id: string) {
    await prisma.task.delete({
        where: { id }
    })
    await logActivity('DELETE', 'Task', id, `Deleted task`)
    revalidatePath('/tasks')
}
