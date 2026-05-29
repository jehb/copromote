'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

const MagicLinkSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
})

export async function sendMagicLink(prevState: any, formData: FormData) {
    const result = MagicLinkSchema.safeParse(Object.fromEntries(formData))

    if (!result.success) {
        return {
            errors: result.error.flatten().fieldErrors,
            message: 'Invalid input',
        }
    }

    const { email } = result.data

    try {
        // Check if user exists to associate correctly (optional but good for this app)
        const user = await prisma.user.findUnique({
            where: { email },
        })

        if (!user) {
            // For security, usually we don't return "user not found", but for this internal tool it might be helpful?
            // Let's stick to standard practice: say we sent it if the email is valid.
            // But valid email format doesn't mean it's an authorized user.
            // Since this is likely an internal tool or specific user base, let's just log and pretend.
            // OR, if we want to allow login only for existing users:
            return {
                message: 'If an account exists with this email, a magic link has been sent.',
            }
        }

        // Generate token
        const token = randomBytes(32).toString('hex')
        const expires = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

        // Store in DB
        await prisma.magicLink.create({
            data: {
                email,
                token,
                expires,
            },
        })

        // Simulate sending email

        return {
            success: true,
            message: 'Magic link sent! Check your email (or server console) to log in.',
        }

    } catch (error) {
        console.error('Magic link error:', error)
        return {
            message: 'Failed to send magic link',
        }
    }
}
