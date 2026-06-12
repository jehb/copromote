
import { login, changePassword, logout } from '@/app/actions/auth'
import { prisma } from '@/lib/prisma'
import { verifyPassword, hashPassword } from '@/lib/auth'
import { encrypt, getSession } from '@/lib/session'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { logSecurityEvent } from '@/app/actions/admin-logs'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        whitelistedIp: {
            count: jest.fn().mockResolvedValue(1),
            findUnique: jest.fn().mockResolvedValue({ ipAddress: '127.0.0.1' }),
        },
        twoFactorChallenge: {
            upsert: jest.fn(),
        },
    },
}))

jest.mock('@/lib/auth', () => ({
    verifyPassword: jest.fn(),
    hashPassword: jest.fn(),
}))

jest.mock('@/lib/session', () => ({
    encrypt: jest.fn(),
    getSession: jest.fn(),
}))

jest.mock('@/app/actions/admin-logs', () => ({
    logSecurityEvent: jest.fn(),
}))

// cookies() and redirect() are already mocked in jest.setup.ts
// but we might need to spy on their implementations or return values

describe('Auth Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('login', () => {
        it('should login successfully', async () => {
            const formData = new FormData()
            formData.append('username', 'user')
            formData.append('password', 'password')

            const mockUser = {
                id: '1',
                username: 'user',
                password: 'hashed_password',
                mustChangePassword: false,
            }

                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
                ; (verifyPassword as jest.Mock).mockResolvedValue(true)
                ; (encrypt as jest.Mock).mockResolvedValue('session_token')

            await login({}, formData)

            expect(encrypt).toHaveBeenCalled()
            const cookieStore = await cookies()
            expect(cookieStore.set).toHaveBeenCalledWith(
                'session',
                'session_token',
                expect.any(Object)
            )
            expect(redirect).toHaveBeenCalledWith('/')
        })

        it('should fail with invalid credentials', async () => {
            const formData = new FormData()
            formData.append('username', 'user')
            formData.append('password', 'wrong')

                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1', password: 'hash' })
                ; (verifyPassword as jest.Mock).mockResolvedValue(false)

            const result = await login({}, formData)

            expect(result).toEqual({ message: 'Invalid username or password' })
            expect(logSecurityEvent).toHaveBeenCalledWith(
                'FAILED_LOGIN',
                expect.stringContaining('Failed login'),
                '1',
                undefined,
                undefined
            )
        })
    })

    describe('changePassword', () => {
        it('should change password successfully', async () => {
            const formData = new FormData()
            formData.append('currentPassword', 'old')
            formData.append('newPassword', 'newpass123')
            formData.append('confirmPassword', 'newpass123')

                ; (getSession as jest.Mock).mockResolvedValue({ id: '1' })
                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1', password: 'old_hash' })
                ; (verifyPassword as jest.Mock).mockResolvedValue(true)
                ; (hashPassword as jest.Mock).mockResolvedValue('new_hash')
                ; (prisma.user.update as jest.Mock).mockResolvedValue({
                    id: '1',
                    username: 'user',
                    mustChangePassword: false
                })
                ; (encrypt as jest.Mock).mockResolvedValue('new_session_token')

            await changePassword({}, formData)

            expect(prisma.user.update).toHaveBeenCalled()
            expect(redirect).toHaveBeenCalledWith('/')
        })
    })

    describe('logout', () => {
        it('should logout and redirect', async () => {
            ; (getSession as jest.Mock).mockResolvedValue({ id: '1' })

            await logout()

            const cookieStore = await cookies()
            expect(cookieStore.delete).toHaveBeenCalledWith('session')
            expect(redirect).toHaveBeenCalledWith('/login')
        })
    })
})
