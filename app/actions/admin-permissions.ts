'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/user-util'
import { logActivity } from '@/app/actions/activity-logs'

// Fallback to console if no specific security log action exists
async function logSecurityEventFallback(action: string, details: string) {
    console.log(`[Security Event] ${action}: ${details}`)
}

export async function getRolePermissions() {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
        throw new Error('Unauthorized')
    }

    return await prisma.rolePermission.findMany({
        orderBy: [
            { role: 'asc' },
            { page: 'asc' }
        ]
    })
}

export async function updateRolePermission(role: string, page: string, isEnabled: boolean) {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
        throw new Error('Unauthorized')
    }

    if (role === 'ADMIN') {
        throw new Error('Cannot modify core ADMIN role permissions')
    }

    try {
        const permission = await prisma.rolePermission.upsert({
            where: {
                role_page: {
                    role,
                    page,
                },
            },
            update: {
                isEnabled,
            },
            create: {
                role,
                page,
                isEnabled,
            },
        })

        await logSecurityEventFallback('UPDATE_PERMISSION', `Updated permission for role ${role} on page ${page} to ${isEnabled}`)
        await logActivity('UPDATE', 'RolePermission', permission.id, `Updated permission for role ${role} on page ${page} to ${isEnabled}`)

        return { success: true, permission }
    } catch (error) {
        console.error('Failed to update permission:', error)
        return { success: false, error: 'Failed to update permission' }
    }
}

export async function checkPageAccess(page: string) {
    const user = await getCurrentUser()

    // Admins always have access to everything
    if (user?.role === 'ADMIN') {
        return true
    }

    // Default to USER role if no user (or handle appropriately based on your app's public page rules)
    const role = user?.role || 'USER'

    const permission = await prisma.rolePermission.findUnique({
        where: {
            role_page: {
                role,
                page,
            },
        },
    })

    // If no permission record exists, default to true or false depending on your preference.
    // Assuming default is true for existing pages until explicitly disabled.
    if (!permission) {
        return true
    }

    return permission.isEnabled
}

export async function getDisabledPages(role: string): Promise<string[]> {
    if (!role || role === 'ADMIN') {
        return []
    }

    const disabledPermissions = await prisma.rolePermission.findMany({
        where: {
            role,
            isEnabled: false,
        },
        select: {
            page: true
        }
    })

    return disabledPermissions.map((p: { page: string }) => p.page)
}
