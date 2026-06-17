'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession, getPending2faSession, encrypt, encryptDeviceTrust } from '@/lib/session'
import { getCurrentUser } from '@/lib/user-util'
import { revalidatePath } from 'next/cache'
import { cookies, headers } from 'next/headers'
import { logSecurityEvent } from '@/app/actions/admin-logs'
import { redirect } from 'next/navigation'
import { sendEmail } from '@/lib/email'

const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/

const IpWhitelistSchema = z.object({
    ipAddress: z.string().refine(val => ipv4Regex.test(val) || ipv6Regex.test(val), {
        message: 'Please enter a valid IPv4 or IPv6 address'
    }),
    description: z.string().optional(),
})

// Helper to get requester IP
export async function getCurrentUserIp(): Promise<string> {
    const headerStore = await headers()
    const forwardedFor = headerStore.get('x-forwarded-for')
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim()
    }
    return headerStore.get('x-real-ip') || '127.0.0.1'
}

// 1. Get all whitelisted IPs (ADMIN only)
export async function getWhitelistedIps() {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')

    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
        throw new Error('Unauthorized: Admin access required')
    }

    return await prisma.whitelistedIp.findMany({
        orderBy: { createdAt: 'desc' },
    })
}

// 2. Add whitelisted IP (ADMIN only)
export async function addWhitelistedIp(prevState: any, formData: FormData) {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')

    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
        throw new Error('Unauthorized: Admin access required')
    }

    const rawIp = formData.get('ipAddress') as string
    const rawDesc = formData.get('description') as string

    const result = IpWhitelistSchema.safeParse({
        ipAddress: rawIp,
        description: rawDesc,
    })

    if (!result.success) {
        return {
            errors: result.error.flatten().fieldErrors,
            message: 'Invalid input',
        }
    }

    const { ipAddress, description } = result.data

    try {
        await prisma.whitelistedIp.create({
            data: {
                ipAddress,
                description,
            },
        })

        const myIp = await getCurrentUserIp()
        await logSecurityEvent(
            'IP_WHITELIST_ADD',
            `Whitelisted IP: "${ipAddress}" (${description || 'No description'})`,
            user.id,
            myIp
        )

        revalidatePath('/admin/security')
        return { success: true, message: 'IP address successfully whitelisted' }
    } catch (error: any) {
        if (error.code === 'P2002') {
            return {
                errors: { ipAddress: ['This IP address is already whitelisted'] },
                message: 'Duplicate IP address',
            }
        }
        return { message: 'Failed to whitelist IP address' }
    }
}

// 3. Delete whitelisted IP (ADMIN only)
export async function deleteWhitelistedIp(id: string) {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')

    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
        throw new Error('Unauthorized: Admin access required')
    }

    try {
        const deleted = await prisma.whitelistedIp.delete({
            where: { id },
        })

        const myIp = await getCurrentUserIp()
        await logSecurityEvent(
            'IP_WHITELIST_REMOVE',
            `Removed IP from whitelist: "${deleted.ipAddress}"`,
            user.id,
            myIp
        )

        revalidatePath('/admin/security')
        return { success: true }
    } catch (error) {
        console.error('Failed to delete whitelisted IP:', error)
        return { success: false, message: 'Failed to delete IP address' }
    }
}

// 4. Verify 2FA code (Pending session)
export async function verifyTwoFactorCode(
    prevState: any,
    formData: FormData
): Promise<{ message: string; errors?: Record<string, string[]> }> {
    const pendingSession = await getPending2faSession()
    if (!pendingSession) {
        return { message: 'Session expired or invalid. Please log in again.' }
    }

    const code = formData.get('code') as string
    if (!code || code.length !== 6) {
        return {
            errors: { code: ['Code must be exactly 6 digits'] },
            message: 'Invalid code format',
        }
    }

    try {
        const challenge = await prisma.twoFactorChallenge.findUnique({
            where: { userId: pendingSession.id },
            include: { user: true },
        })

        if (!challenge || challenge.code !== code || challenge.expiresAt < new Date()) {
            return { message: 'Invalid or expired verification code' }
        }

        // Clean up challenge
        await prisma.twoFactorChallenge.delete({
            where: { id: challenge.id },
        })

        // Promote pending session to standard 24h session
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
        const session = await encrypt({
            id: challenge.user.id,
            username: challenge.user.username,
            mustChangePassword: challenge.user.mustChangePassword,
            expires,
        })

        ; (await cookies()).set('session', session, {
            expires,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' && process.env.DISABLE_SECURE_COOKIES !== 'true',
            sameSite: 'lax',
            path: '/',
        })

        // Set trusted device cookie for 30 days
        const trustPayload = { userId: challenge.user.id }
        const trustToken = await encryptDeviceTrust(trustPayload)
        const trustExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

        ; (await cookies()).set('device_trust', trustToken, {
            expires: trustExpires,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' && process.env.DISABLE_SECURE_COOKIES !== 'true',
            sameSite: 'lax',
            path: '/',
        })

        const ipAddress = await getCurrentUserIp()
        await logSecurityEvent(
            'LOGIN_2FA_SUCCESS',
            `Successful login via 2FA. Username: "${challenge.user.username}"`,
            challenge.user.id,
            ipAddress
        )

    } catch (error) {
        console.error('2FA verification error:', error)
        return { message: 'An unexpected error occurred during verification' }
    }

    // Redirect to homepage
    redirect('/')
}

// 5. Get pending 2FA session details
export async function getPending2faSessionDetails() {
    const session = await getPending2faSession()
    if (!session) return null
    return {
        twoFactorExpiresAt: session.twoFactorExpiresAt || null,
        email: session.email || null,
    }
}

// 6. Resend 2FA code
export async function resendTwoFactorCode() {
    const pendingSession = await getPending2faSession()
    if (!pendingSession) {
        return { success: false, message: 'Session expired. Please log in again.' }
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: pendingSession.id }
        })

        if (!user) {
            return { success: false, message: 'User not found.' }
        }

        // Generate 2FA code
        const code = Math.floor(100000 + Math.random() * 900000).toString()
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

        await prisma.twoFactorChallenge.upsert({
            where: { userId: user.id },
            update: { code, expiresAt },
            create: { userId: user.id, code, expiresAt },
        })

        console.log(`\n========================================\n[2FA VERIFICATION CODE - RESENT]\nUser: ${user.username} (${user.email})\nCode: ${code}\nExpires: ${expiresAt.toLocaleTimeString()}\n========================================\n`)

        // Send 2FA email asynchronously
        sendEmail({
            to: user.email,
            subject: 'Your Co+promote Verification Code (Resent)',
            text: `Hello ${user.name || user.username},\n\nYour new 2FA verification code is: ${code}\n\nThis code will expire in 5 minutes.`,
            html: `<p>Hello ${user.name || user.username},</p><p>Your new 2FA verification code is: <strong style="font-size: 20px; font-family: monospace; letter-spacing: 2px;">${code}</strong></p><p>This code will expire in 5 minutes.</p>`
        }).catch(err => console.error('Failed to send 2FA email:', err))

        // Update session cookie with new expiration
        const expires = new Date(Date.now() + 15 * 60 * 1000)
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

        const ipAddress = await getCurrentUserIp()
        await logSecurityEvent(
            '2FA_RESENT',
            `2FA code resent for user "${user.username}" from IP ${ipAddress}`,
            user.id,
            ipAddress
        )

        return {
            success: true,
            message: 'Verification code resent successfully.',
            twoFactorExpiresAt: expiresAt.getTime()
        }
    } catch (error) {
        console.error('Failed to resend 2FA code:', error)
        return { success: false, message: 'Failed to resend verification code. Please try again.' }
    }
}

export async function addWhitelistedIpForm(formData: FormData): Promise<void> {
    await addWhitelistedIp(null, formData)
}

export async function deleteWhitelistedIpForm(id: string): Promise<void> {
    await deleteWhitelistedIp(id)
}
