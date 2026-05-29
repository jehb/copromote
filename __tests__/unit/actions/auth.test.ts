import { login, changePassword, logout } from '@/app/actions/auth'
import { prisma } from '@/lib/prisma'
import { verifyPassword, hashPassword } from '@/lib/auth'
import { encrypt, getSession } from '@/lib/session'
import { logSecurityEvent } from '@/app/actions/admin-logs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
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

jest.mock('next/headers', () => ({
    cookies: jest.fn().mockResolvedValue({
        set: jest.fn(),
        delete: jest.fn(),
    }),
}))

jest.mock('next/navigation', () => ({
    redirect: jest.fn(),
}))

describe('Auth Actions', () => {
    let mockCookies: any

    beforeEach(() => {
        jest.clearAllMocks()
        jest.spyOn(console, 'error').mockImplementation(() => { })

        mockCookies = {
            set: jest.fn(),
            delete: jest.fn(),
        }
            ; (cookies as jest.Mock).mockResolvedValue(mockCookies)
    })

    describe('login', () => {
        it('should return errors on validation failure', async () => {
            const formData = new FormData()
            const result = await login({}, formData)
            expect(result?.message).toBe('Invalid input')
            expect(result?.errors).toBeDefined()
        })

        it('should return error if user not found', async () => {
            const formData = new FormData()
            formData.append('username', 'testuser')
            formData.append('password', 'password123')

                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

            const result = await login({}, formData)
            expect(result?.message).toBe('Invalid username or password')
            expect(logSecurityEvent).toHaveBeenCalledWith(
                'FAILED_LOGIN',
                expect.any(String),
                undefined,
                undefined,
                undefined
            )
        })

        it('should return error if password verification fails', async () => {
            const formData = new FormData()
            formData.append('username', 'testuser')
            formData.append('password', 'wrongpass')

                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                    id: 'user1',
                    username: 'testuser',
                    password: 'hashed-password'
                })
                ; (verifyPassword as jest.Mock).mockResolvedValue(false)

            const result = await login({}, formData)
            expect(result?.message).toBe('Invalid username or password')
            expect(logSecurityEvent).toHaveBeenCalled()
        })

        it('should login successfully and set cookie', async () => {
            const formData = new FormData()
            formData.append('username', 'testuser')
            formData.append('password', 'correctpass')

                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                    id: 'user1',
                    username: 'testuser',
                    password: 'hashed-password',
                    mustChangePassword: false
                })
                ; (verifyPassword as jest.Mock).mockResolvedValue(true)
                ; (encrypt as jest.Mock).mockResolvedValue('encrypted-session')
                ; (redirect as unknown as jest.Mock).mockImplementation(() => { throw new Error('NEXT_REDIRECT') })

            await expect(login({}, formData)).rejects.toThrow('NEXT_REDIRECT')

            expect(encrypt).toHaveBeenCalledWith({
                id: 'user1',
                username: 'testuser',
                mustChangePassword: false,
                expires: expect.any(Date)
            })
            expect(mockCookies.set).toHaveBeenCalledWith('session', 'encrypted-session', expect.any(Object))
        })

        it('should handle errors gracefully', async () => {
            const formData = new FormData()
            formData.append('username', 'testuser')
            formData.append('password', 'correctpass')

                ; (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'))

            const result = await login({}, formData)
            expect(result?.message).toBe('An unexpected error occurred during login. Please try again later.')
        })
    })

    describe('changePassword', () => {
        it('should return errors on validation failure', async () => {
            const formData = new FormData()
            const result = await changePassword({}, formData)
            expect(result?.message).toBe('Invalid input')
            expect(result?.errors).toBeDefined()
        })

        it('should return error if passwords do not match', async () => {
            const formData = new FormData()
            formData.append('currentPassword', 'current123')
            formData.append('newPassword', 'newpass123')
            formData.append('confirmPassword', 'differentpass')

            const result = await changePassword({}, formData)
            expect(result?.message).toBe('Invalid input')
            expect(result?.errors?.confirmPassword).toContain("Passwords don't match")
        })

        it('should redirect to login if no session', async () => {
            const formData = new FormData()
            formData.append('currentPassword', 'current123')
            formData.append('newPassword', 'newpass123')
            formData.append('confirmPassword', 'newpass123')

                ; (getSession as jest.Mock).mockResolvedValue(null)
                ; (redirect as unknown as jest.Mock).mockImplementation(() => { throw new Error('NEXT_REDIRECT') })

            await expect(changePassword({}, formData)).rejects.toThrow('NEXT_REDIRECT')
            expect(redirect).toHaveBeenCalledWith('/login')
        })

        it('should return error if user not found', async () => {
            const formData = new FormData()
            formData.append('currentPassword', 'current123')
            formData.append('newPassword', 'newpass123')
            formData.append('confirmPassword', 'newpass123')

                ; (getSession as jest.Mock).mockResolvedValue({ id: 'user1' })
                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

            const result = await changePassword({}, formData)
            expect(result?.message).toBe('Invalid current password')
        })

        it('should return error if current password verification fails', async () => {
            const formData = new FormData()
            formData.append('currentPassword', 'wrongcurrent')
            formData.append('newPassword', 'newpass123')
            formData.append('confirmPassword', 'newpass123')

                ; (getSession as jest.Mock).mockResolvedValue({ id: 'user1' })
                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                    id: 'user1',
                    password: 'hashed-current'
                })
                ; (verifyPassword as jest.Mock).mockResolvedValue(false)

            const result = await changePassword({}, formData)
            expect(result?.message).toBe('Invalid current password')
        })

        it('should change password successfully', async () => {
            const formData = new FormData()
            formData.append('currentPassword', 'current123')
            formData.append('newPassword', 'newpass123')
            formData.append('confirmPassword', 'newpass123')

                ; (getSession as jest.Mock).mockResolvedValue({ id: 'user1' })
                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                    id: 'user1',
                    password: 'hashed-current'
                })
                ; (verifyPassword as jest.Mock).mockResolvedValue(true)
                ; (hashPassword as jest.Mock).mockResolvedValue('hashed-new')
                ; (prisma.user.update as jest.Mock).mockResolvedValue({
                    id: 'user1',
                    username: 'testuer',
                    mustChangePassword: false
                })
                ; (encrypt as jest.Mock).mockResolvedValue('new-encrypted-session')
                ; (redirect as unknown as jest.Mock).mockImplementation(() => { throw new Error('NEXT_REDIRECT_ROOT') })

            await expect(changePassword({}, formData)).rejects.toThrow('NEXT_REDIRECT_ROOT')

            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user1' },
                data: { password: 'hashed-new', mustChangePassword: false }
            })
            expect(encrypt).toHaveBeenCalledWith({
                id: 'user1',
                username: 'testuer',
                mustChangePassword: false,
                expires: expect.any(Date)
            })
            expect(mockCookies.set).toHaveBeenCalledWith('session', 'new-encrypted-session', expect.any(Object))
            expect(redirect).toHaveBeenCalledWith('/')
        })

        it('should handle errors gracefully', async () => {
            const formData = new FormData()
            formData.append('currentPassword', 'current123')
            formData.append('newPassword', 'newpass123')
            formData.append('confirmPassword', 'newpass123')

                ; (getSession as jest.Mock).mockResolvedValue({ id: 'user1' })
                ; (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Update Error'))

            const result = await changePassword({}, formData)
            expect(result?.message).toBe('Failed to update password')
        })
    })

    describe('logout', () => {
        it('should handle logout with active session', async () => {
            ; (getSession as jest.Mock).mockResolvedValue({ id: 'user1' })
                ; (redirect as unknown as jest.Mock).mockImplementation(() => { throw new Error('NEXT_REDIRECT') })

            await expect(logout()).rejects.toThrow('NEXT_REDIRECT')

            expect(logSecurityEvent).toHaveBeenCalledWith('LOGOUT', 'User logged out', 'user1', undefined, 'System')
            expect(mockCookies.delete).toHaveBeenCalledWith('session')
            expect(redirect).toHaveBeenCalledWith('/login')
        })

        it('should handle logout with no active session', async () => {
            ; (getSession as jest.Mock).mockResolvedValue(null)
                ; (redirect as unknown as jest.Mock).mockImplementation(() => { throw new Error('NEXT_REDIRECT') })

            await expect(logout()).rejects.toThrow('NEXT_REDIRECT')

            expect(logSecurityEvent).toHaveBeenCalledWith('LOGOUT', 'User logged out (session ID not found)', undefined, undefined, 'System')
            expect(mockCookies.delete).toHaveBeenCalledWith('session')
            expect(redirect).toHaveBeenCalledWith('/login')
        })
    })
})
