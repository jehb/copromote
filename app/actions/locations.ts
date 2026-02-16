'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/app/actions/activity-logs'

export async function getLocations() {
    return await prisma.location.findMany({
        orderBy: { name: 'asc' },
        include: {
            _count: {
                select: { events: true }
            }
        }
    })
}

export async function createLocation(formData: FormData) {
    const name = formData.get('name') as string

    if (!name) {
        throw new Error('Name is required')
    }

    try {
        const location = await prisma.location.create({
            data: {
                name,
            }
        })

        await logActivity('CREATE', 'Location', location.id, `Created location: ${name}`)
        revalidatePath('/admin/locations')
        revalidatePath('/events/new')
        return { success: true, location }
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { success: false, message: 'Location with this name already exists' }
        }
        return { success: false, message: 'Failed to create location' }
    }
}

export async function updateLocation(id: string, formData: FormData) {
    const name = formData.get('name') as string

    if (!name) {
        throw new Error('Name is required')
    }

    try {
        const location = await prisma.location.update({
            where: { id },
            data: {
                name,
            }
        })

        await logActivity('UPDATE', 'Location', id, `Updated location: ${name}`)
        revalidatePath('/admin/locations')
        revalidatePath('/events/new')
        return { success: true, location }
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { success: false, message: 'Location with this name already exists' }
        }
        return { success: false, message: 'Failed to update location' }
    }
}

export async function deleteLocation(id: string) {
    try {
        // Check if location is in use
        const location = await prisma.location.findUnique({
            where: { id },
            include: { _count: { select: { events: true } } }
        })

        if (!location) {
            return { success: false, message: 'Location not found' }
        }

        if (location._count.events > 0) {
            return { success: false, message: `Cannot delete location. It is used by ${location._count.events} events.` }
        }

        await prisma.location.delete({
            where: { id }
        })

        await logActivity('DELETE', 'Location', id, `Deleted location: ${location.name}`)
        revalidatePath('/admin/locations')
        revalidatePath('/events/new')
        return { success: true }
    } catch (error) {
        return { success: false, message: 'Failed to delete location' }
    }
}
