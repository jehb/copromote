'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { logSecurityEvent } from '@/app/actions/admin-logs'
import { z } from 'zod'

const CreateUserSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    role: z.string().default('USER'),
})

export async function getUsers() {
    try {
        return await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                role: true,
                avatar: true,
                createdAt: true,
                _count: {
                    select: {
                        events: true,
                        tasks: true
                    }
                }
            }
        })
    } catch (error) {
        console.error('Failed to fetch users:', error)
        return []
    }
}

export async function createUser(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries())
    const result = CreateUserSchema.safeParse(rawData)

    if (!result.success) {
        return {
            success: false,
            message: result.error.errors[0].message
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
        revalidatePath('/admin/users')
        return { success: true, message: 'User created successfully' }

    } catch (error) {
        console.error('Create user error:', error)
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
        revalidatePath('/admin/users')
        return { success: true, message: 'User deleted successfully' }
    } catch (error) {
        console.error('Failed to delete user:', error)
        return { success: false, message: 'Failed to delete user' }
    }
}

// Add more actions like update role if needed
