'use server'

import { z } from 'zod'
import { verifyPassword, hashPassword } from '@/lib/auth'
import { encrypt, getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const LoginSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
})

const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

export async function login(prevState: any, formData: FormData) {
    const result = LoginSchema.safeParse(Object.fromEntries(formData))

    if (!result.success) {
        return {
            errors: result.error.flatten().fieldErrors,
            message: 'Invalid input',
        }
    }

    const { username, password } = result.data

    try {
        const user = await prisma.user.findUnique({
            where: { username },
        })

        if (!user || !(await verifyPassword(password, user.password))) {
            return {
                message: 'Invalid username or password',
            }
        }

        // Create session
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
        const session = await encrypt({
            id: user.id,
            username: user.username,
            mustChangePassword: user.mustChangePassword,
            expires,
        })

            // Set cookie
            ; (await cookies()).set('session', session, {
                expires,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
            })

    } catch (error: any) {
        console.error('Login error detailed:', error)
        return {
            message: `Error: ${error.message || JSON.stringify(error)}`,
        }
    }

    // Redirect happens outside try/catch to valid Next.js redirect behavior
    redirect('/')
}

export async function changePassword(prevState: any, formData: FormData) {
    const result = ChangePasswordSchema.safeParse(Object.fromEntries(formData))

    if (!result.success) {
        return {
            errors: result.error.flatten().fieldErrors,
            message: 'Invalid input',
        }
    }

    const { currentPassword, newPassword } = result.data
    const session = await getSession()

    if (!session) {
        redirect('/login')
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.id },
        })

        if (!user || !(await verifyPassword(currentPassword, user.password))) {
            return {
                errors: { currentPassword: ['Incorrect password'] },
                message: 'Invalid current password',
            }
        }

        // Update password
        const hashedPassword = await hashPassword(newPassword)
        const updatedUser = await prisma.user.update({
            where: { id: session.id },
            data: {
                password: hashedPassword,
                mustChangePassword: false,
            },
        })

        // Refresh session with new flag
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
        const newSession = await encrypt({
            id: updatedUser.id,
            username: updatedUser.username,
            mustChangePassword: false,
            expires,
        })

            ; (await cookies()).set('session', newSession, {
                expires,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
            })

    } catch (error) {
        console.error('Change password error:', error)
        return {
            message: 'Failed to update password',
        }
    }

    redirect('/')
}

export async function logout() {
    (await cookies()).delete('session')
    redirect('/login')
}
