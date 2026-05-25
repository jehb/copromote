import { GET } from '@/app/api/debug-wp/route'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/user-util'

jest.mock('@/lib/prisma', () => ({
    prisma: {
        config: {
            findUnique: jest.fn(),
        },
    },
}))

jest.mock('@/lib/user-util', () => ({
    getCurrentUser: jest.fn(),
}))

global.fetch = jest.fn(() =>
    Promise.resolve({
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ some: 'data' })),
    })
) as jest.Mock

describe('GET /api/debug-wp', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('returns unauthorized if no user', async () => {
        ;(getCurrentUser as jest.Mock).mockResolvedValue(null)
        const req = new Request('http://localhost/api/debug-wp')
        const res = await GET(req) as any

        expect(res).toBeDefined()
        const data = await res.json()
        expect(data).toHaveProperty('error', 'Unauthorized')
        expect(res.status).toBe(401)
    })

    it('returns forbidden if user is not admin', async () => {
        ;(getCurrentUser as jest.Mock).mockResolvedValue({ id: '1', role: 'USER' })
        const req = new Request('http://localhost/api/debug-wp')
        const res = await GET(req) as any

        expect(res).toBeDefined()
        const data = await res.json()
        expect(data).toHaveProperty('error', 'Forbidden')
        expect(res.status).toBe(403)
    })

    it('does not leak config in response', async () => {
        ;(getCurrentUser as jest.Mock).mockResolvedValue({ id: '1', role: 'ADMIN' })
        ;(prisma.config.findUnique as jest.Mock).mockImplementation(({ where: { key } }) => {
            if (key === 'WORDPRESS_URL') return Promise.resolve({ value: 'https://example.com' })
            if (key === 'WORDPRESS_USERNAME') return Promise.resolve({ value: 'admin' })
            if (key === 'WORDPRESS_APP_PASSWORD') return Promise.resolve({ value: 'password' })
            return Promise.resolve(null)
        })

        const req = {
            url: 'http://localhost/api/debug-wp',
        } as unknown as Request

        const res = await GET(req) as any

        expect(res).toBeDefined()

        const data = await res.json()
        expect(data).not.toHaveProperty('config')
        expect(data).toHaveProperty('request')
        expect(data).toHaveProperty('response')
    })
})
