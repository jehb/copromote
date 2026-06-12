import { getCurrentUserIp, getWhitelistedIps, addWhitelistedIp, deleteWhitelistedIp, verifyTwoFactorCode } from '@/app/actions/security-center'
import { prisma } from '@/lib/prisma'
import { getSession, getPending2faSession, encrypt } from '@/lib/session'
import { getCurrentUser } from '@/lib/user-util'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { logSecurityEvent } from '@/app/actions/admin-logs'

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        whitelistedIp: {
            findMany: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            findUnique: jest.fn(),
        },
        twoFactorChallenge: {
            findUnique: jest.fn(),
            delete: jest.fn(),
            upsert: jest.fn(),
        },
    },
}))

jest.mock('@/lib/session', () => ({
    getSession: jest.fn(),
    getPending2faSession: jest.fn(),
    encrypt: jest.fn(),
}))

jest.mock('@/lib/user-util', () => ({
    getCurrentUser: jest.fn(),
}))

jest.mock('@/app/actions/admin-logs', () => ({
    logSecurityEvent: jest.fn(),
}))

describe('Security Center Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('getCurrentUserIp', () => {
        it('should extract IP from x-forwarded-for header if present', async () => {
            const mockHeaders = {
                get: jest.fn().mockImplementation((key) => {
                    if (key === 'x-forwarded-for') return '192.168.1.1, 10.0.0.1'
                    return null
                })
            }
            ;(headers as jest.Mock).mockResolvedValue(mockHeaders)

            const ip = await getCurrentUserIp()
            expect(ip).toBe('192.168.1.1')
        })

        it('should fallback to x-real-ip if x-forwarded-for is missing', async () => {
            const mockHeaders = {
                get: jest.fn().mockImplementation((key) => {
                    if (key === 'x-real-ip') return '172.16.0.1'
                    return null
                })
            }
            ;(headers as jest.Mock).mockResolvedValue(mockHeaders)

            const ip = await getCurrentUserIp()
            expect(ip).toBe('172.16.0.1')
        })

        it('should default to localhost if no headers are present', async () => {
            const mockHeaders = {
                get: jest.fn().mockReturnValue(null)
            }
            ;(headers as jest.Mock).mockResolvedValue(mockHeaders)

            const ip = await getCurrentUserIp()
            expect(ip).toBe('127.0.0.1')
        })
    })

    describe('getWhitelistedIps', () => {
        it('should throw Error if user is not logged in', async () => {
            ;(getSession as jest.Mock).mockResolvedValue(null)

            await expect(getWhitelistedIps()).rejects.toThrow('Unauthorized')
        })

        it('should throw Error if user is not an Admin', async () => {
            ;(getSession as jest.Mock).mockResolvedValue({ id: '1' })
            ;(getCurrentUser as jest.Mock).mockResolvedValue({ id: '1', role: 'USER' })

            await expect(getWhitelistedIps()).rejects.toThrow('Unauthorized: Admin access required')
        })

        it('should return whitelisted IPs if user is Admin', async () => {
            ;(getSession as jest.Mock).mockResolvedValue({ id: '1' })
            ;(getCurrentUser as jest.Mock).mockResolvedValue({ id: '1', role: 'ADMIN' })
            const mockIps = [{ id: '1', ipAddress: '127.0.0.1', description: 'Local' }]
            ;(prisma.whitelistedIp.findMany as jest.Mock).mockResolvedValue(mockIps)

            const result = await getWhitelistedIps()
            expect(result).toEqual(mockIps)
            expect(prisma.whitelistedIp.findMany).toHaveBeenCalled()
        })
    })

    describe('addWhitelistedIp', () => {
        it('should throw Error if user is not Admin', async () => {
            ;(getSession as jest.Mock).mockResolvedValue({ id: '1' })
            ;(getCurrentUser as jest.Mock).mockResolvedValue({ id: '1', role: 'USER' })

            const formData = new FormData()
            formData.append('ipAddress', '192.168.1.1')

            await expect(addWhitelistedIp({}, formData)).rejects.toThrow('Unauthorized')
        })

        it('should fail with invalid IP format', async () => {
            ;(getSession as jest.Mock).mockResolvedValue({ id: '1' })
            ;(getCurrentUser as jest.Mock).mockResolvedValue({ id: '1', role: 'ADMIN' })

            const formData = new FormData()
            formData.append('ipAddress', 'invalid-ip')

            const result = await addWhitelistedIp({}, formData)
            expect(result.message).toBe('Invalid input')
            expect(result.errors?.ipAddress).toBeDefined()
        })

        it('should successfully add a valid IP and log security event', async () => {
            ;(getSession as jest.Mock).mockResolvedValue({ id: '1' })
            ;(getCurrentUser as jest.Mock).mockResolvedValue({ id: '1', role: 'ADMIN' })
            const mockHeaders = { get: jest.fn().mockReturnValue('127.0.0.1') }
            ;(headers as jest.Mock).mockResolvedValue(mockHeaders)

            const formData = new FormData()
            formData.append('ipAddress', '192.168.1.2')
            formData.append('description', 'Office network')

            ;(prisma.whitelistedIp.create as jest.Mock).mockResolvedValue({ id: '1' })

            const result = await addWhitelistedIp({}, formData)
            expect(result.success).toBe(true)
            expect(prisma.whitelistedIp.create).toHaveBeenCalledWith({
                data: {
                    ipAddress: '192.168.1.2',
                    description: 'Office network',
                }
            })
            expect(logSecurityEvent).toHaveBeenCalledWith(
                'IP_WHITELIST_ADD',
                expect.stringContaining('192.168.1.2'),
                '1',
                '127.0.0.1'
            )
        })
    })

    describe('deleteWhitelistedIp', () => {
        it('should successfully delete IP and log security event', async () => {
            ;(getSession as jest.Mock).mockResolvedValue({ id: '1' })
            ;(getCurrentUser as jest.Mock).mockResolvedValue({ id: '1', role: 'ADMIN' })
            const mockHeaders = { get: jest.fn().mockReturnValue('127.0.0.1') }
            ;(headers as jest.Mock).mockResolvedValue(mockHeaders)

            ;(prisma.whitelistedIp.delete as jest.Mock).mockResolvedValue({ id: 'ip-id', ipAddress: '192.168.1.2' })

            const result = await deleteWhitelistedIp('ip-id')
            expect(result.success).toBe(true)
            expect(prisma.whitelistedIp.delete).toHaveBeenCalledWith({
                where: { id: 'ip-id' }
            })
            expect(logSecurityEvent).toHaveBeenCalledWith(
                'IP_WHITELIST_REMOVE',
                expect.stringContaining('192.168.1.2'),
                '1',
                '127.0.0.1'
            )
        })
    })

    describe('verifyTwoFactorCode', () => {
        it('should fail if there is no pending 2FA session', async () => {
            ;(getPending2faSession as jest.Mock).mockResolvedValue(null)
            const formData = new FormData()
            formData.append('code', '123456')

            const result = await verifyTwoFactorCode({}, formData)
            expect(result.message).toBe('Session expired or invalid. Please log in again.')
        })

        it('should fail with invalid code length', async () => {
            ;(getPending2faSession as jest.Mock).mockResolvedValue({ id: 'user-id' })
            const formData = new FormData()
            formData.append('code', '123')

            const result = await verifyTwoFactorCode({}, formData)
            expect(result.message).toBe('Invalid code format')
        })

        it('should fail if code is incorrect', async () => {
            ;(getPending2faSession as jest.Mock).mockResolvedValue({ id: 'user-id' })
            const formData = new FormData()
            formData.append('code', '123456')

            ;(prisma.twoFactorChallenge.findUnique as jest.Mock).mockResolvedValue({
                id: 'challenge-id',
                code: '654321', // Different code
                expiresAt: new Date(Date.now() + 60000),
            })

            const result = await verifyTwoFactorCode({}, formData)
            expect(result.message).toBe('Invalid or expired verification code')
        })

        it('should fail if code has expired', async () => {
            ;(getPending2faSession as jest.Mock).mockResolvedValue({ id: 'user-id' })
            const formData = new FormData()
            formData.append('code', '123456')

            ;(prisma.twoFactorChallenge.findUnique as jest.Mock).mockResolvedValue({
                id: 'challenge-id',
                code: '123456',
                expiresAt: new Date(Date.now() - 60000), // In the past
            })

            const result = await verifyTwoFactorCode({}, formData)
            expect(result.message).toBe('Invalid or expired verification code')
        })

        it('should succeed, delete challenge, promote session, and redirect', async () => {
            ;(getPending2faSession as jest.Mock).mockResolvedValue({ id: 'user-id' })
            const mockHeaders = { get: jest.fn().mockReturnValue('127.0.0.1') }
            ;(headers as jest.Mock).mockResolvedValue(mockHeaders)

            const formData = new FormData()
            formData.append('code', '123456')

            const mockChallenge = {
                id: 'challenge-id',
                code: '123456',
                expiresAt: new Date(Date.now() + 60000),
                user: { id: 'user-id', username: 'admin', email: 'admin@example.com', mustChangePassword: false }
            }
            ;(prisma.twoFactorChallenge.findUnique as jest.Mock).mockResolvedValue(mockChallenge)
            ;(encrypt as jest.Mock).mockResolvedValue('new_session_token')

            await verifyTwoFactorCode({}, formData)

            expect(prisma.twoFactorChallenge.delete).toHaveBeenCalledWith({
                where: { id: 'challenge-id' }
            })
            expect(encrypt).toHaveBeenCalledWith(expect.objectContaining({
                id: 'user-id',
                username: 'admin',
            }))
            const cookieStore = await cookies()
            expect(cookieStore.set).toHaveBeenCalledWith(
                'session',
                'new_session_token',
                expect.any(Object)
            )
            expect(logSecurityEvent).toHaveBeenCalledWith(
                'LOGIN_2FA_SUCCESS',
                expect.stringContaining('admin'),
                'user-id',
                '127.0.0.1'
            )
            expect(redirect).toHaveBeenCalledWith('/')
        })
    })
})
