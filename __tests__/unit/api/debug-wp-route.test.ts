import { GET } from '@/app/api/debug-wp/route'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

jest.mock('@/lib/prisma', () => ({
    prisma: {
        config: {
            findUnique: jest.fn(),
        },
    },
}))

jest.mock('@/lib/session', () => ({
    getSession: jest.fn(),
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

    it('returns unauthorized if no session', async () => {
        ;(getSession as jest.Mock).mockResolvedValue(null)
        const req = new Request('http://localhost/api/debug-wp')
        const res = await GET(req) as any

        expect(res).toBeDefined()
        const data = await res.json()
        expect(data).toHaveProperty('error', 'Unauthorized')
    })

    it('does not leak config in response', async () => {
        ;(getSession as jest.Mock).mockResolvedValue({ user: { id: 1 } })
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
