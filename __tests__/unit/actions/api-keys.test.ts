import { createApiKey, revokeApiKey, getApiKeys } from '@/app/actions/api-keys'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

jest.mock('@/lib/db', () => ({
  prisma: {
    apiKey: {
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    }
  }
}))
jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
}))
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

describe('api-keys actions', () => {
    beforeEach(() => { jest.clearAllMocks() })

    it('createApiKey throws if no session', async () => {
        (getSession as jest.Mock).mockResolvedValue(null)
        await expect(createApiKey('test')).rejects.toThrow('Unauthorized')
    })

    it('createApiKey works with session', async () => {
        (getSession as jest.Mock).mockResolvedValue({ id: 'u1' })
        ;(prisma.apiKey.create as jest.Mock).mockResolvedValue({})
        const res = await createApiKey('test')
        expect(res.success).toBe(true)
        expect(res.key).toMatch(/^promoty_/)
        expect(prisma.apiKey.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ name: 'test' }) }))
        expect(revalidatePath).toHaveBeenCalled()
    })

    it('revokeApiKey throws if no session', async () => {
        (getSession as jest.Mock).mockResolvedValue(null)
        await expect(revokeApiKey('k1')).rejects.toThrow('Unauthorized')
    })

    it('revokeApiKey works with session', async () => {
        (getSession as jest.Mock).mockResolvedValue({ id: 'u1' })
        const res = await revokeApiKey('k1')
        expect(res.success).toBe(true)
        expect(prisma.apiKey.delete).toHaveBeenCalledWith({ where: { id: 'k1' } })
    })

    it('getApiKeys returns empty if no session', async () => {
        (getSession as jest.Mock).mockResolvedValue(null)
        const res = await getApiKeys()
        expect(res).toEqual([])
    })

    it('getApiKeys works with session', async () => {
        (getSession as jest.Mock).mockResolvedValue({ id: 'u1' })
        ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([{ id: '1' }])
        const res = await getApiKeys()
        expect(res).toEqual([{ id: '1' }])
        expect(prisma.apiKey.findMany).toHaveBeenCalledWith({ where: { userId: 'u1' }, orderBy: { createdAt: 'desc' } })
    })
})
