'use server'
import { getSession } from '@/lib/session'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logActivity } from '@/app/actions/activity-logs'
import { getCurrentUserId, getCurrentUser } from '@/lib/user-util'

export async function getContacts() {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    return await prisma.contact.findMany({
        include: {
            organization: true,
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
        orderBy: { lastName: 'asc' }
    })
}

export async function getContact(id: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    return await prisma.contact.findUnique({
        where: { id },
        include: {
            organization: true,
            primaryFor: true,
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

export async function createContact(formData: FormData) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const company = formData.get('company') as string
    const jobTitle = formData.get('jobTitle') as string
    const notes = formData.get('notes') as string
    const type = formData.get('type') as string
    const organizationId = formData.get('organizationId') as string

    const user = await getCurrentUser()
    const userId = user?.id ?? null

    const contact = await prisma.contact.create({
        data: {
            firstName,
            lastName,
            email,
            phone,
            company,
            jobTitle,
            notes,
            type,
            organizationId: (organizationId && organizationId !== 'none') ? organizationId : null,
            createdById: userId,
            updatedById: userId
        }
    })

    await logActivity('CREATE', 'Contact', contact.id, `Created contact: ${firstName} ${lastName}`)

    revalidatePath('/contacts')
    redirect('/contacts')
}

export async function updateContact(formData: FormData) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const id = formData.get('id') as string
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const company = formData.get('company') as string
    const jobTitle = formData.get('jobTitle') as string
    const notes = formData.get('notes') as string
    const type = formData.get('type') as string
    const organizationId = formData.get('organizationId') as string

    // Get current state for diffing
    const currentContact = await prisma.contact.findUnique({
        where: { id }
    })

    const newOrganizationId = (organizationId && organizationId !== 'none') ? organizationId : null

    const user = await getCurrentUser()
    const userId = user?.id ?? null

    await prisma.contact.update({
        where: { id },
        data: {
            firstName,
            lastName,
            email,
            phone,
            company,
            jobTitle,
            notes,
            type,
            organizationId: newOrganizationId,
            updatedById: userId
        }
    })

    // Calculate diff
    const changes: Record<string, { from: any, to: any }> = {}
    if (currentContact) {
        if (currentContact.firstName !== firstName) changes.firstName = { from: currentContact.firstName, to: firstName }
        if (currentContact.lastName !== lastName) changes.lastName = { from: currentContact.lastName, to: lastName }
        if (currentContact.email !== email) changes.email = { from: currentContact.email, to: email }
        if (currentContact.phone !== phone) changes.phone = { from: currentContact.phone, to: phone }
        if (currentContact.company !== company) changes.company = { from: currentContact.company, to: company }
        if (currentContact.jobTitle !== jobTitle) changes.jobTitle = { from: currentContact.jobTitle, to: jobTitle }
        if (currentContact.notes !== notes) changes.notes = { from: currentContact.notes, to: notes }
        if (currentContact.type !== type) changes.type = { from: currentContact.type, to: type }
        if (currentContact.organizationId !== newOrganizationId) {
            changes.organizationId = {
                from: currentContact.organizationId,
                to: newOrganizationId
            }
        }
    }

    await logActivity('UPDATE', 'Contact', id, `Updated contact: ${firstName} ${lastName}`, changes)

    revalidatePath('/contacts')
    revalidatePath(`/contacts/${id}`)
    redirect('/contacts')
}

export async function deleteContact(id: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    await prisma.contact.delete({
        where: { id }
    })
    await logActivity('DELETE', 'Contact', id, 'Deleted contact')
    revalidatePath('/contacts')
    redirect('/contacts')
}

export async function linkContactToOrganization(contactId: string, organizationId: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    await prisma.contact.update({
        where: { id: contactId },
        data: { organizationId }

    })

    await logActivity('UPDATE', 'Contact', contactId, `Linked to organization: ${organizationId}`)

    revalidatePath(`/organizations/${organizationId}`)
    revalidatePath('/contacts')
}
