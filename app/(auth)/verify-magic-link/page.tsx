import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/session'
import { cookies } from 'next/headers'
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
        undefined,
        undefined
    )

    redirect('/')
}
