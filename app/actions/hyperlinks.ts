'use server'

import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { logActivity } from './activity-logs'

export async function getHyperlinks() {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    // Optional: Add strict auth check if needed, depending on middleware
    return await prisma.hyperlink.findMany({
        orderBy: { createdAt: 'desc' }
    })
}

export async function createHyperlink(formData: FormData) {
    const session = await getSession()

    const title = formData.get('title') as string
    const url = formData.get('url') as string
    const description = formData.get('description') as string
    const icon = formData.get('icon') as string

    if (!title || !url) {
        throw new Error('Title and URL are required')
    }

    const hyperlink = await prisma.hyperlink.create({
        data: {
            title,
            url,
            description,
            icon,
        }
    })

    // logActivity handles user ID retrieval internally if not passed, but passing it explicitly if we have it is fine.
    // However, logActivity signature is (action, entityType, entityId, details) and it fetches session internally.
    await logActivity('CREATE', 'Hyperlink', hyperlink.id, `Created hyperlink: ${title}`)

    revalidatePath('/admin/hyperlinks')
    revalidatePath('/')
    return hyperlink
}

export async function deleteHyperlink(id: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    // We need to fetch the hyperlink before deleting to log its title
    const hyperlink = await prisma.hyperlink.findUnique({ where: { id } })

    if (hyperlink) {
        await prisma.hyperlink.delete({
            where: { id }
        })
        await logActivity('DELETE', 'Hyperlink', id, `Deleted hyperlink: ${hyperlink.title}`)
    }


    revalidatePath('/admin/hyperlinks')
    revalidatePath('/')
}

export async function updateHyperlink(id: string, formData: FormData) {
    const session = await getSession()

    const title = formData.get('title') as string
    const url = formData.get('url') as string
    const description = formData.get('description') as string
    const icon = formData.get('icon') as string

    if (!title || !url) {
        throw new Error('Title and URL are required')
    }

    const hyperlink = await prisma.hyperlink.update({
        where: { id },
        data: {
            title,
            url,
            description,
            icon,
        }
    })

    await logActivity('UPDATE', 'Hyperlink', hyperlink.id, `Updated hyperlink: ${title}`)

    revalidatePath('/admin/hyperlinks')
    revalidatePath('/')
    return hyperlink
}
