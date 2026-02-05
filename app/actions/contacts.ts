'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getContacts() {
    return await prisma.contact.findMany({
        include: {
            organization: true
        },
        orderBy: { lastName: 'asc' }
    })
}

export async function getContact(id: string) {
    return await prisma.contact.findUnique({
        where: { id },
        include: {
            organization: true,
            primaryFor: true
        }
    })
}

export async function createContact(formData: FormData) {
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const company = formData.get('company') as string
    const jobTitle = formData.get('jobTitle') as string
    const notes = formData.get('notes') as string
    const type = formData.get('type') as string
    const organizationId = formData.get('organizationId') as string

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
            organizationId: (organizationId && organizationId !== 'none') ? organizationId : null
        }
    })

    revalidatePath('/contacts')
    redirect('/contacts')
}

export async function updateContact(formData: FormData) {
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
            organizationId: (organizationId && organizationId !== 'none') ? organizationId : null
        }
    })

    revalidatePath('/contacts')
    revalidatePath(`/contacts/${id}`)
    redirect('/contacts')
}

export async function deleteContact(id: string) {
    await prisma.contact.delete({
        where: { id }
    })
    revalidatePath('/contacts')
    redirect('/contacts')
}

export async function linkContactToOrganization(contactId: string, organizationId: string) {
    await prisma.contact.update({
        where: { id: contactId },
        data: { organizationId }
    })

    revalidatePath(`/organizations/${organizationId}`)
    revalidatePath('/contacts')
}
