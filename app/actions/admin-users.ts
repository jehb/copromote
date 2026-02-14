'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { logSecurityEvent } from '@/app/actions/admin-logs'
import { logActivity } from '@/app/actions/activity-logs'
import { z } from 'zod'

const CreateUserSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    role: z.string().default('USER'),
})

import { Prisma } from '@prisma/client'

export async function getUsers() {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                role: true,
                avatar: true,
                createdAt: true,
                contactId: true,
                contact: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                },
                _count: {
                    select: {
                        events: true,
                        tasks: true
                    }
                }
            }
        })
        return users
    } catch (error) {
        console.error('Failed to fetch users:', error)
        return [] as Prisma.UserGetPayload<{
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                role: true,
                avatar: true,
                createdAt: true,
                contactId: true,
                contact: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                },
                _count: {
                    select: {
                        events: true,
                        tasks: true
                    }
                }
            }
        }>[]
    }
}



export async function createUser(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries())
    const result = CreateUserSchema.safeParse(rawData)

    if (!result.success) {
        return {
            success: false,
            message: result.error.errors?.[0]?.message || 'Validation failed'
        }
    }

    const { name, username, email, role } = result.data

    try {
        // Check availability
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ username }, { email }]
            }
        })

        if (existingUser) {
            return { success: false, message: 'Username or email already exists' }
        }

        // Default password logic
        const defaultPassword = 'Welcome1!'
        const hashedPassword = await hashPassword(defaultPassword)

        const user = await prisma.user.create({
            data: {
                name,
                username,
                email,
                role,
                password: hashedPassword,
                mustChangePassword: true, // Force change on first login
            }
        })

        await logSecurityEvent('CREATE_USER', `Created user ${username} with role ${role}`)
        await logActivity('CREATE', 'User', undefined, `Created user ${username} (${email}) with role ${role}`)
        revalidatePath('/admin/users')
        return { success: true, message: 'User created successfully' }

    } catch (error) {
        console.error('Create user error:', error)
        return { success: false, message: `Failed: ${(error as Error).message}` }
    }
}

const UpdateUserSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Name is required'),
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    role: z.string(),
    contactId: z.string().optional().nullable(),
})

export async function updateUser(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries())
    // Handle "none" or empty string for contactId
    if (rawData.contactId === 'none' || rawData.contactId === '') {
        rawData.contactId = null as any
    }

    const result = UpdateUserSchema.safeParse(rawData)

    if (!result.success) {
        return {
            success: false,
            message: result.error.errors?.[0]?.message || 'Validation failed'
        }
    }

    const { id, name, username, email, role, contactId } = result.data

    try {
        // Check availability (exclude current user)
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ username }, { email }],
                NOT: { id }
            }
        })

        if (existingUser) {
            return { success: false, message: 'Username or email already exists' }
        }

        // If linking a contact, check if it's already linked to another user
        if (contactId) {
            const existingContactLink = await prisma.user.findFirst({
                where: {
                    contactId,
                    NOT: { id }
                }
            })
            if (existingContactLink) {
                return { success: false, message: 'This contact is already linked to another user' }
            }
        }

        await prisma.user.update({
            where: { id },
            data: {
                name,
                username,
                email,
                role,
                contactId
            }
        })

        await logSecurityEvent('UPDATE_USER', `Updated user ${username}`, undefined, undefined, 'System')
        await logActivity('UPDATE', 'User', id, `Updated user ${username}. Contact ID: ${contactId || 'None'}`)
        revalidatePath('/admin/users')
        return { success: true, message: 'User updated successfully' }

    } catch (error) {
        console.error('Update user error:', error)
        return { success: false, message: `Failed: ${(error as Error).message}` }
    }
}

export async function deleteUser(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        if (!user) {
            return { success: false, message: 'User not found' }
        }

        if (user.username === 'admin') {
            await logSecurityEvent('DELETE_USER_ATTEMPT', `Attempted to delete protected admin user`, undefined, undefined, 'System')
            return { success: false, message: 'Cannot delete the main admin user.' }
        }

        await prisma.user.delete({
            where: { id: userId }
        })

        await logSecurityEvent('DELETE_USER', `Deleted user ${user.username}`, undefined, undefined, 'System')
        await logActivity('DELETE', 'User', userId, `Deleted user ${user.username}`)
        revalidatePath('/admin/users')
        return { success: true, message: 'User deleted successfully' }
    } catch (error) {
        console.error('Failed to delete user:', error)
        return { success: false, message: 'Failed to delete user' }
    }
}

// Add more actions like update role if needed
