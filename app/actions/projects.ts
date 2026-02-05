'use server'

import { prisma } from '@/lib/db' // Ensure you have this configured
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getProjects() {
    return await prisma.project.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: {
                    assets: true,
                    tasks: true
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
    return await prisma.project.findUnique({
        where: { id },
        include: {
            assets: true,
            events: true,
            tasks: {
                orderBy: { createdAt: 'desc' },
                include: {
                    assignee: true
                }
            }
        }
    })
}

export async function createProject(formData: FormData) {
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const startDate = new Date(formData.get('startDate') as string)
    const endDateStr = formData.get('endDate') as string
    const endDate = endDateStr ? new Date(endDateStr) : null

    await prisma.project.create({
        data: {
            name,
            description,
            startDate,
            endDate,
            status: 'active'
        }
    })

    revalidatePath('/projects')
    revalidatePath('/')
    redirect('/projects')
}

export async function deleteProject(id: string) {
    await prisma.project.delete({ where: { id } })
    revalidatePath('/projects')
    revalidatePath('/')
}

export async function updateProjectStatus(id: string, status: string) {
    await prisma.project.update({
        where: { id },
        data: { status }
    })
    revalidatePath('/projects')
}

export async function updateProject(id: string, formData: FormData) {
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const startDate = new Date(formData.get('startDate') as string)
    const endDateStr = formData.get('endDate') as string
    const endDate = endDateStr ? new Date(endDateStr) : null
    const status = formData.get('status') as string

    await prisma.project.update({
        where: { id },
        data: {
            name,
            description,
            startDate,
            endDate,
            status
        }
    })

    revalidatePath('/projects')
    revalidatePath(`/projects/${id}`)
}
