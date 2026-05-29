'use server'
import { getSession } from '@/lib/session'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/user-util'

export async function getRoles() {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    return await prisma.role.findMany({
        orderBy: {
            createdAt: 'asc'
        }
    })
}

export async function createRole(formData: FormData) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const user = await getCurrentUser()
    if (user?.role !== 'ADMIN') {
        return { success: false, message: 'Unauthorized' }
    }

    const name = formData.get('name') as string
    const description = formData.get('description') as string

    if (!name) {
        return { success: false, message: 'Role name is required' }
    }

    // Role names should be uppercase to match current convention
    const normalizedName = name.toUpperCase().trim()

    try {
        const existing = await prisma.role.findUnique({
            where: { name: normalizedName }
        })

        if (existing) {
            return { success: false, message: 'A role with this name already exists' }
        }

        await prisma.role.create({
            data: {
                name: normalizedName,
                description,
                isSystem: false // Custom roles are not system roles by default
            }
        })

        revalidatePath('/admin/permissions')
        revalidatePath('/admin/users')
        return { success: true }
    } catch (error) {
        console.error('Failed to create role:', error)
        return { success: false, message: 'Failed to create role' }
    }
}

export async function deleteRole(name: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const user = await getCurrentUser()
    if (user?.role !== 'ADMIN') {
        return { success: false, message: 'Unauthorized' }
    }

    try {
        const role = await prisma.role.findUnique({
            where: { name }
        })

        if (!role) {
            return { success: false, message: 'Role not found' }
        }

        if (role.isSystem) {
            return { success: false, message: 'Cannot delete system roles' }
        }

        // Check if any users are assigned to this role
        const usersWithRole = await prisma.user.count({
            where: { role: name }
        })

        if (usersWithRole > 0) {
            return { success: false, message: `Cannot delete role. It is currently assigned to ${usersWithRole} users.` }
        }

        // Delete the role. The RolePermission records will be cascade deleted
        await prisma.role.delete({
            where: { name }
        })

        revalidatePath('/admin/permissions')
        revalidatePath('/admin/users')
        return { success: true }
    } catch (error) {
        console.error('Failed to delete role:', error)
        return { success: false, message: 'Failed to delete role' }
    }
}
