'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logActivity } from '@/app/actions/activity-logs'

export async function getOrganizations() {
    return await prisma.organization.findMany({
        include: {
            primaryContact: true,
            _count: {
                select: { contacts: true }
            }
        },
        orderBy: { name: 'asc' }
    })
}

export async function getOrganization(id: string) {
    return await prisma.organization.findUnique({
        where: { id },
        include: {
            primaryContact: true,
            contacts: true
        }
    })
}

export async function createOrganization(formData: FormData) {
    const name = formData.get('name') as string
    const category = formData.get('category') as string
    const description = formData.get('description') as string
    const website = formData.get('website') as string
    const primaryContactId = formData.get('primaryContactId') as string

    const org = await prisma.organization.create({
        data: {
            name,
            category,
            description,
            website,
            primaryContactId: (primaryContactId && primaryContactId !== 'none') ? primaryContactId : null
        }
    })

    await logActivity('CREATE', 'Organization', org.id, `Created organization: ${name}`)

    revalidatePath('/organizations')
    redirect('/organizations')
}

export async function updateOrganization(formData: FormData) {
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const category = formData.get('category') as string
    const description = formData.get('description') as string
    const website = formData.get('website') as string
    const primaryContactId = formData.get('primaryContactId') as string

    await prisma.organization.update({
        where: { id },
        data: {
            name,
            category,
            description,
            website,
            primaryContactId: (primaryContactId && primaryContactId !== 'none') ? primaryContactId : null
        }
    })

    await logActivity('UPDATE', 'Organization', id, `Updated organization: ${name}`)

    revalidatePath('/organizations')
    revalidatePath(`/organizations/${id}`)
    redirect('/organizations')
}

export async function deleteOrganization(id: string) {
    await prisma.organization.delete({
        where: { id }
    })
    await logActivity('DELETE', 'Organization', id, 'Deleted organization')
    revalidatePath('/organizations')
    redirect('/organizations')
}
