import { getSecurityLogs, logSecurityEvent } from '@/app/actions/admin-logs'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

jest.mock('@/lib/prisma', () => ({
    prisma: {
        securityLog: {
            findMany: jest.fn(),
            create: jest.fn(),
        },
    },
}))

jest.mock('next/headers', () => ({
    headers: jest.fn(),
}))

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

describe('Admin Logs Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.spyOn(console, 'error').mockImplementation(() => { })
    })

    describe('getSecurityLogs', () => {
        it('should fetch logs successfully', async () => {
            const mockLogs = [{ id: '1', action: 'LOGIN' }]
                ; (prisma.securityLog.findMany as jest.Mock).mockResolvedValue(mockLogs)

            const result = await getSecurityLogs()

            expect(result).toEqual(mockLogs)
            expect(prisma.securityLog.findMany).toHaveBeenCalledWith({
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { username: true, email: true } } },
                take: 100,
            })
        })

        it('should handle errors when fetching logs', async () => {
            ; (prisma.securityLog.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'))

            const result = await getSecurityLogs()

            expect(result).toEqual([])
            expect(console.error).toHaveBeenCalledWith('Failed to fetch logs:', expect.any(Error))
        })
    })

    describe('logSecurityEvent', () => {
        it('should log an event with provided IP and user agent', async () => {
            const mockHeaders = new Map()
                ; (headers as jest.Mock).mockResolvedValue(mockHeaders)

            await logSecurityEvent('TEST_ACTION', 'details', 'user1', '1.1.1.1', 'CustomAgent')

            expect(prisma.securityLog.create).toHaveBeenCalledWith({
                data: {
                    action: 'TEST_ACTION',
                    details: 'details',
                    userId: 'user1',
                    ipAddress: '1.1.1.1',
                    userAgent: 'CustomAgent',
                }
            })
            expect(revalidatePath).toHaveBeenCalledWith('/admin/logs')
        })

        it('should auto-detect IP from x-forwarded-for header', async () => {
            const mockHeaders = new Map([
                ['x-forwarded-for', '2.2.2.2, 3.3.3.3'],
                ['user-agent', 'HeaderAgent']
            ])
                ; (headers as jest.Mock).mockResolvedValue({
                    get: (key: string) => mockHeaders.get(key)
                })

            await logSecurityEvent('TEST_ACTION')

            expect(prisma.securityLog.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    ipAddress: '2.2.2.2',
                    userAgent: 'HeaderAgent',
                })
            }))
        })

        it('should auto-detect IP from x-real-ip header if x-forwarded-for is missing', async () => {
            const mockHeaders = new Map([
                ['x-real-ip', '4.4.4.4'],
            ])
                ; (headers as jest.Mock).mockResolvedValue({
                    get: (key: string) => mockHeaders.get(key)
                })

            await logSecurityEvent('TEST_ACTION')

            expect(prisma.securityLog.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    ipAddress: '4.4.4.4',
                    userAgent: 'Unknown User Agent',
                })
            }))
        })

        it('should use default values if headers are missing', async () => {
            const mockHeaders = new Map()
                ; (headers as jest.Mock).mockResolvedValue({
                    get: (key: string) => mockHeaders.get(key)
                })

            await logSecurityEvent('TEST_ACTION', undefined, undefined, undefined, 'System')

            expect(prisma.securityLog.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    ipAddress: 'Unknown IP',
                    userAgent: 'Unknown User Agent',
                })
            }))
        })

        it('should log error if creation fails', async () => {
            ; (headers as jest.Mock).mockResolvedValue({
                get: () => null
            })
                ; (prisma.securityLog.create as jest.Mock).mockRejectedValue(new Error('Creation failed'))

            await logSecurityEvent('TEST_ACTION')

            expect(console.error).toHaveBeenCalledWith('Failed to log security event:', expect.any(Error))
            expect(revalidatePath).not.toHaveBeenCalled()
        })
    })
})
