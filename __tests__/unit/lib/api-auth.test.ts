import { validateApiKey } from '@/lib/api-auth'
import { prisma } from '@/lib/db'
import { NextRequest } from 'next/server'

jest.mock('@/lib/db', () => ({
    prisma: {
        apiKey: {
            findUnique: jest.fn(),
            update: jest.fn()
        }
    }
}))

describe('api-auth', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        // Mock the console.error to avoid noise in test output
        jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('returns error if missing api key', async () => {
        const req = {
            headers: {
                get: jest.fn().mockReturnValue(null)
            }
        } as unknown as NextRequest
        
        const result = await validateApiKey(req)
        
        expect(result).toEqual({ user: null, error: 'Missing or invalid Authorization header/API key' })
        expect(prisma.apiKey.findUnique).not.toHaveBeenCalled()
    })

    it('extracts api key from x-api-key header', async () => {
        const req = {
            headers: {
                get: jest.fn().mockImplementation((name) => name === 'x-api-key' ? 'test-key' : null)
            }
        } as unknown as NextRequest
        
        ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(null)
        
        await validateApiKey(req)
        
        expect(prisma.apiKey.findUnique).toHaveBeenCalledWith({
            where: { key: 'test-key' },
            include: { user: true }
        })
    })

    it('extracts api key from Authorization Bearer header', async () => {
        const req = {
            headers: {
                get: jest.fn().mockImplementation((name) => name === 'authorization' ? 'Bearer test-bearer-key' : null)
            }
        } as unknown as NextRequest
        
        ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(null)
        
        await validateApiKey(req)
        
        expect(prisma.apiKey.findUnique).toHaveBeenCalledWith({
            where: { key: 'test-bearer-key' },
            include: { user: true }
        })
    })

    it('returns error for invalid api key', async () => {
        const req = {
            headers: {
                get: jest.fn().mockImplementation((name) => name === 'x-api-key' ? 'invalid-key' : null)
            }
        } as unknown as NextRequest
        
        ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(null)
        
        const result = await validateApiKey(req)
        
        expect(result).toEqual({ user: null, error: 'Invalid API Key' })
    })

    it('returns error for expired api key', async () => {
        const req = {
            headers: {
                get: jest.fn().mockImplementation((name) => name === 'x-api-key' ? 'expired-key' : null)
            }
        } as unknown as NextRequest
        
        const pastDate = new Date()
        pastDate.setDate(pastDate.getDate() - 1)
        
        ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
            id: 'key-1',
            key: 'expired-key',
            expiresAt: pastDate,
            user: { id: 'user-1' }
        })
        
        const result = await validateApiKey(req)
        
        expect(result).toEqual({ user: null, error: 'API Key expired' })
    })

    it('returns user and updates lastUsedAt for valid api key', async () => {
        const req = {
            headers: {
                get: jest.fn().mockImplementation((name) => name === 'x-api-key' ? 'valid-key' : null)
            }
        } as unknown as NextRequest
        
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 1)
        
        const mockUser = { id: 'user-1', name: 'Test User' }
        ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
            id: 'key-1',
            key: 'valid-key',
            expiresAt: futureDate,
            user: mockUser
        })
        
        ;(prisma.apiKey.update as jest.Mock).mockResolvedValue({})
        
        const result = await validateApiKey(req)
        
        expect(result).toEqual({ user: mockUser, error: null })
        expect(prisma.apiKey.update).toHaveBeenCalledWith({
            where: { id: 'key-1' },
            data: { lastUsedAt: expect.any(Date) }
        })
    })

    it('returns Internal Server Error on db exception', async () => {
        const req = {
            headers: {
                get: jest.fn().mockImplementation((name) => name === 'x-api-key' ? 'valid-key' : null)
            }
        } as unknown as NextRequest
        
        ;(prisma.apiKey.findUnique as jest.Mock).mockRejectedValue(new Error('DB connection failed'))
        
        const result = await validateApiKey(req)
        
        expect(result).toEqual({ user: null, error: 'Internal Server Error' })
        expect(console.error).toHaveBeenCalled()
    })
    
    it('does not fail if update lastUsedAt throws', async () => {
        const req = {
            headers: {
                get: jest.fn().mockImplementation((name) => name === 'x-api-key' ? 'valid-key' : null)
            }
        } as unknown as NextRequest
        
        const mockUser = { id: 'user-1' }
        ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
            id: 'key-1',
            key: 'valid-key',
            user: mockUser
        })
        
        ;(prisma.apiKey.update as jest.Mock).mockRejectedValue(new Error('Update failed'))
        
        const result = await validateApiKey(req)
        
        expect(result).toEqual({ user: mockUser, error: null })
        // Since update is fire-and-forget, it might log later, but we ensure it doesn't break the auth flow
    })
})
