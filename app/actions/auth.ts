'use server'

import { z } from 'zod'
import { SignJWT } from 'jose'
import { logSecurityEvent } from '@/app/actions/admin-logs'
import { verifyPassword, hashPassword } from '@/lib/auth'
import { encrypt, getSession, decrypt } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { sendEmail } from '@/lib/email'

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
            await logSecurityEvent(
                'FAILED_LOGIN',
                `Failed login attempt. Username: "${username}"`,
                user?.id,
                undefined,
                undefined // Let logSecurityEvent detect User Agent
            )
            return {
                message: 'Invalid username or password',
            }
        }

        // Detect IP
        const headerStore = await headers()
        let ipAddress = '127.0.0.1'
        const forwardedFor = headerStore.get('x-forwarded-for')
        if (forwardedFor) {
            ipAddress = forwardedFor.split(',')[0].trim()
        } else {
            ipAddress = headerStore.get('x-real-ip') || '127.0.0.1'
        }

        // Check if device is trusted
        const deviceTrustCookie = (await cookies()).get('device_trust')?.value
        let deviceTrusted = false
        if (deviceTrustCookie) {
            const decryptedTrust = await decrypt(deviceTrustCookie)
            if (decryptedTrust && decryptedTrust.userId === user.id) {
                deviceTrusted = true
            }
        }

        // Check if there are any whitelisted IPs in the database
        const whitelistCount = await prisma.whitelistedIp.count()
        let requires2fa = false

        if (whitelistCount > 0) {
            const isWhitelisted = await prisma.whitelistedIp.findUnique({
                where: { ipAddress },
            })
            if (!isWhitelisted && !deviceTrusted) {
                requires2fa = true
            }
        } else if (!deviceTrusted) {
            requires2fa = true
        }

        if (requires2fa) {
            // Generate 2FA code
            const code = Math.floor(100000 + Math.random() * 900000).toString()
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

            await prisma.twoFactorChallenge.upsert({
                where: { userId: user.id },
                update: { code, expiresAt },
                create: { userId: user.id, code, expiresAt },
            })

            console.log(`\n========================================\n[2FA VERIFICATION CODE]\nUser: ${user.username} (${user.email})\nCode: ${code}\nExpires: ${expiresAt.toLocaleTimeString()}\n========================================\n`)

            // Send 2FA email asynchronously
            sendEmail({
                to: user.email,
                subject: 'Your Co+promote Verification Code',
                text: `Hello ${user.name || user.username},\n\nYour 2FA verification code is: ${code}\n\nThis code will expire in 5 minutes.`,
                html: `<p>Hello ${user.name || user.username},</p><p>Your 2FA verification code is: <strong style="font-size: 20px; font-family: monospace; letter-spacing: 2px;">${code}</strong></p><p>This code will expire in 5 minutes.</p>`
            }).catch(err => console.error('Failed to send 2FA email:', err))

            // Create temporary 2FA session
            const expires = new Date(Date.now() + 15 * 60 * 1000) // 15 mins for 2FA verification
            const session = await encrypt({
                id: user.id,
                username: user.username,
                email: user.email,
                pending2fa: true,
                twoFactorExpiresAt: expiresAt.getTime(),
                expires,
            })

            ; (await cookies()).set('session', session, {
                expires,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production' && process.env.DISABLE_SECURE_COOKIES !== 'true',
                sameSite: 'lax',
                path: '/',
            })

            await logSecurityEvent(
                '2FA_REQUIRED',
                `2FA required for user "${user.username}" from IP ${ipAddress}`,
                user.id,
                ipAddress
            )

            // Redirect to 2FA page
            redirect('/verify-2fa')
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
                secure: process.env.NODE_ENV === 'production' && process.env.DISABLE_SECURE_COOKIES !== 'true',
                sameSite: 'lax',
                path: '/',
            })

        await logSecurityEvent(
            'LOGIN',
            `User logged in. Username: "${username}"`,
            user.id,
            ipAddress
        )

    } catch (error: any) {
        if (error && error.digest?.startsWith('NEXT_REDIRECT')) {
            throw error
        }
        console.error('Login error detailed:', error)
        return {
            message: 'An unexpected error occurred during login. Please try again later.',
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
                secure: process.env.NODE_ENV === 'production' && process.env.DISABLE_SECURE_COOKIES !== 'true',
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
    const session = await getSession()
    if (session?.id) {
        await logSecurityEvent('LOGOUT', 'User logged out', session.id, undefined, 'System')
    } else {
        await logSecurityEvent('LOGOUT', 'User logged out (session ID not found)', undefined, undefined, 'System')
    }

    (await cookies()).delete('session')
    redirect('/login')
}
