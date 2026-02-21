'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logActivity } from '@/app/actions/activity-logs'
import { getCurrentUserId } from '@/lib/user-util'

export async function getOrganizations() {
    return await prisma.organization.findMany({
        include: {
            primaryContact: true,
            _count: {
                select: { contacts: true }
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
            contacts: true,
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
    })
}

export async function createOrganization(formData: FormData) {
    const name = formData.get('name') as string
    const category = formData.get('category') as string
    const description = formData.get('description') as string
    const website = formData.get('website') as string
    const primaryContactId = formData.get('primaryContactId') as string
    const externalBrand = formData.get('externalBrand') as string

    const org = await prisma.organization.create({
        data: {
            name,
            category,
            description,
            website,
            externalBrand: (externalBrand && externalBrand !== 'none') ? externalBrand : null,
            primaryContactId: (primaryContactId && primaryContactId !== 'none') ? primaryContactId : null,
            createdById: await getCurrentUserId(),
            updatedById: await getCurrentUserId()
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
    const externalBrand = formData.get('externalBrand') as string

    // Get current state for diffing
    const currentOrg = await prisma.organization.findUnique({
        where: { id },
        include: { primaryContact: true }
    })

    const newPrimaryContactId = (primaryContactId && primaryContactId !== 'none') ? primaryContactId : null

    await prisma.organization.update({
        where: { id },
        data: {
            name,
            category,
            description,
            website,
            externalBrand: (externalBrand && externalBrand !== 'none') ? externalBrand : null,
            primaryContactId: newPrimaryContactId,
            updatedById: await getCurrentUserId()
        }
    })

    // Calculate diff
    const changes: Record<string, { from: any, to: any }> = {}
    if (currentOrg) {
        if (currentOrg.name !== name) changes.name = { from: currentOrg.name, to: name }
        if (currentOrg.category !== category) changes.category = { from: currentOrg.category, to: category }
        if (currentOrg.description !== description) changes.description = { from: currentOrg.description, to: description }
        if (currentOrg.website !== website) changes.website = { from: currentOrg.website, to: website }
        if (currentOrg.externalBrand !== externalBrand) changes.externalBrand = { from: currentOrg.externalBrand, to: externalBrand }
        if (currentOrg.primaryContactId !== newPrimaryContactId) {
            changes.primaryContact = {
                from: currentOrg.primaryContactId,
                to: newPrimaryContactId
            }
        }
    }

    await logActivity('UPDATE', 'Organization', id, `Updated organization: ${name}`, changes)

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
