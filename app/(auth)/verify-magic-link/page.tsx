import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/session'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { logSecurityEvent } from '@/app/actions/admin-logs'

export default async function VerifyMagicLinkPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { token } = await searchParams

    if (!token || Array.isArray(token)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Link</h1>
                    <p className="text-slate-600">The magic link is invalid or missing.</p>
                    <a href="/login" className="mt-6 inline-block text-blue-600 hover:underline">Back to Login</a>
                </div>
            </div>
        )
    }

    // Verify token
    const magicLink = await prisma.magicLink.findUnique({
        where: { token },
    })

    if (!magicLink || magicLink.expires < new Date() || magicLink.usedAt) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Link Expired or Invalid</h1>
                    <p className="text-slate-600">This magic link has expired or has already been used.</p>
                    <a href="/login" className="mt-6 inline-block text-blue-600 hover:underline">Back to Login</a>
                </div>
            </div>
        )
    }

    // Find user
    const user = await prisma.user.findUnique({
        where: { email: magicLink.email },
    })

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">User Not Found</h1>
                    <p className="text-slate-600">No user account is associated with this email address.</p>
                    <a href="/login" className="mt-6 inline-block text-blue-600 hover:underline">Back to Login</a>
                </div>
            </div>
        )
    }

    // Mark as used
    await prisma.magicLink.update({
        where: { id: magicLink.id },
        data: { usedAt: new Date() },
    })

    // Detect IP
    const headerStore = await headers()
    let ipAddress = '127.0.0.1'
    const forwardedFor = headerStore.get('x-forwarded-for')
    if (forwardedFor) {
        ipAddress = forwardedFor.split(',')[0].trim()
    } else {
        ipAddress = headerStore.get('x-real-ip') || '127.0.0.1'
    }

    // Check if there are any whitelisted IPs in the database
    const whitelistCount = await prisma.whitelistedIp.count()
    let requires2fa = false

    if (whitelistCount > 0) {
        const isWhitelisted = await prisma.whitelistedIp.findUnique({
            where: { ipAddress },
        })
        if (!isWhitelisted) {
            requires2fa = true
        }
    } else {
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

        // Create temporary 2FA session
        const expires = new Date(Date.now() + 15 * 60 * 1000) // 15 mins for 2FA verification
        const session = await encrypt({
            id: user.id,
            username: user.username,
            pending2fa: true,
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
            `2FA required for user "${user.username}" from IP ${ipAddress} (via Magic Link)`,
            user.id,
            ipAddress
        )

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
        `User logged in via Magic Link. Email: "${user.email}"`,
        user.id,
        ipAddress
    )

    redirect('/')
}
