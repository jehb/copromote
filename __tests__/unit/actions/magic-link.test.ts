import { sendMagicLink } from '@/app/actions/magic-link'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: { findUnique: jest.fn() },
        magicLink: { create: jest.fn() },
    },
}))

jest.mock('crypto', () => ({
    randomBytes: jest.fn().mockReturnValue({
        toString: jest.fn().mockReturnValue('mock-token'),
    }),
}))

describe('Magic Link Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        // Mock console.log to avoid cluttering test output
        jest.spyOn(console, 'log').mockImplementation(() => { })
        jest.spyOn(console, 'error').mockImplementation(() => { })
    })

    describe('sendMagicLink', () => {
        it('should return error if email is invalid', async () => {
            const formData = new FormData()
            formData.append('email', 'not-an-email')

            const result = await sendMagicLink(null, formData)

            expect(result.message).toBe('Invalid input')
            expect(result.errors).toBeDefined()
            expect(result.errors?.email).toContain('Please enter a valid email address')
        })

        it('should return silent success message if user not found', async () => {
            const formData = new FormData()
            formData.append('email', 'nonexistent@example.com')

                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

            const result = await sendMagicLink(null, formData)

            expect(result.message).toBe('If an account exists with this email, a magic link has been sent.')
            expect(prisma.magicLink.create).not.toHaveBeenCalled()
        })

        it('should create magic link and return success if user exists', async () => {
            const formData = new FormData()
            formData.append('email', 'existing@example.com')

                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                    id: '1',
                    email: 'existing@example.com',
                })
                ; (prisma.magicLink.create as jest.Mock).mockResolvedValue({})

            const result = await sendMagicLink(null, formData)

            expect(result.success).toBe(true)
            expect(result.message).toContain('Magic link sent!')

            expect(prisma.magicLink.create).toHaveBeenCalledWith({
                data: {
                    email: 'existing@example.com',
                    token: 'mock-token',
                    expires: expect.any(Date),
                },
            })
        })

        it('should handle errors gracefully', async () => {
            const formData = new FormData()
            formData.append('email', 'existing@example.com')

                ; (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'))

            const result = await sendMagicLink(null, formData)

            expect(result.message).toBe('Failed to send magic link')
        })
    })
})
