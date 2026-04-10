import { getWordPressConfig, saveWordPressConfig, testWordPressConnection, searchWordPressPosts, searchWordPressEvents } from '@/app/actions/wordpress'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

jest.mock('@/lib/prisma', () => ({
    prisma: {
        config: {
            findUnique: jest.fn(),
            upsert: jest.fn(),
        },
    },
}))

jest.mock('@/lib/session', () => ({
    getSession: jest.fn(),
}))

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

global.fetch = jest.fn()

describe('WordPress Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.spyOn(console, 'error').mockImplementation(() => { })
        jest.spyOn(console, 'log').mockImplementation(() => { })
        jest.spyOn(console, 'warn').mockImplementation(() => { })
            // Default authenticated session
            ; (getSession as jest.Mock).mockResolvedValue({ id: '1' })
    })

    describe('getWordPressConfig', () => {
        it('should throw Unauthorized if no session', async () => {
            ; (getSession as jest.Mock).mockResolvedValue(null)
            await expect(getWordPressConfig()).rejects.toThrow('Unauthorized')
        })

        it('should fetch and format config', async () => {
            process.env.WORDPRESS_URL = 'http://wp.com'
            process.env.WORDPRESS_USERNAME = 'admin'
            process.env.WORDPRESS_APP_PASSWORD = 'secret'

            const config = await getWordPressConfig()
            expect(config).toEqual({
                url: 'http://wp.com',
                username: 'admin',
                hasPassword: true,
            })
        })

        it('should handle missing configs', async () => {
            delete process.env.WORDPRESS_URL;
            delete process.env.WORDPRESS_USERNAME;
            delete process.env.WORDPRESS_APP_PASSWORD;

            const config = await getWordPressConfig()
            expect(config).toEqual({
                url: '',
                username: '',
                hasPassword: false,
            })
        })
    })

    describe('saveWordPressConfig', () => {
        it('should throw Unauthorized if no session', async () => {
            ; (getSession as jest.Mock).mockResolvedValue(null)
            await expect(saveWordPressConfig({ url: '', username: '' })).rejects.toThrow('Unauthorized')
        })

        it('should save config without password', async () => {
            await expect(saveWordPressConfig({ url: 'http://wp.com', username: 'admin' })).rejects.toThrow('WordPress configuration is now managed via environment variables')
        })

        it('should save config with password', async () => {
            await expect(saveWordPressConfig({ url: 'http://wp.com', username: 'admin', appPassword: 'new-password' })).rejects.toThrow('WordPress configuration is now managed via environment variables')
        })
    })

    describe('testWordPressConnection', () => {
        it('should throw Unauthorized if no session', async () => {
            ; (getSession as jest.Mock).mockResolvedValue(null)
            await expect(testWordPressConnection()).rejects.toThrow('Unauthorized')
        })

        it('should return error if missing configuration', async () => {
            delete process.env.WORDPRESS_URL;
            const result = await testWordPressConnection()
            expect(result.success).toBe(false)
            expect(result.message).toContain('Missing configuration')
        })

        it('should test connection successfully', async () => {
            process.env.WORDPRESS_URL = 'http://wp.com/' // Testing trailing slash removal
            process.env.WORDPRESS_USERNAME = 'admin'
            process.env.WORDPRESS_APP_PASSWORD = 'secret'

                ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ name: 'Admin', slug: 'admin' }),
                })

            const result = await testWordPressConnection()
            expect(result.success).toBe(true)
            expect(result.message).toContain('Connected as Admin (admin)')
            expect(global.fetch).toHaveBeenCalledWith(
                'http://wp.com/wp-json/wp/v2/users/me',
                expect.any(Object)
            )
        })

        it('should handle unauthorized or failed fetch', async () => {
            process.env.WORDPRESS_URL = 'http://wp.com/'
            process.env.WORDPRESS_USERNAME = 'admin'
            process.env.WORDPRESS_APP_PASSWORD = 'secret'

                ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                    ok: false,
                    status: 401,
                    statusText: 'Unauthorized',
                })

            const result = await testWordPressConnection()
            expect(result.success).toBe(false)
            expect(result.message).toContain('Failed: 401 Unauthorized')
        })

        it('should handle generic fetch errors', async () => {
            process.env.WORDPRESS_URL = 'http://wp.com/'
            process.env.WORDPRESS_USERNAME = 'admin'
            process.env.WORDPRESS_APP_PASSWORD = 'secret'

                ; (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

            const result = await testWordPressConnection()
            expect(result.success).toBe(false)
            expect(result.message).toContain('Connection error: Network error')
        })
    })

    describe('searchWordPressPosts', () => {
        it('should return empty if missing url or query', async () => {
            delete process.env.WORDPRESS_URL;
            expect(await searchWordPressPosts('test')).toEqual([])

            process.env.WORDPRESS_URL = 'http://wp.com'
            expect(await searchWordPressPosts('')).toEqual([])
        })

        it('should fetch and map posts', async () => {
            process.env.WORDPRESS_URL = 'http://wp.com'

                ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    json: async () => ([
                        { id: 1, title: { rendered: 'Post 1' }, link: 'http://wp.com/p1' }
                    ]),
                })

            const results = await searchWordPressPosts('test-query')
            expect(results).toHaveLength(1)
            expect(results[0]).toEqual({ id: 1, title: 'Post 1', url: 'http://wp.com/p1' })
            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('search=test-query'), expect.any(Object))
        })

        it('should handle fetch failure', async () => {
            process.env.WORDPRESS_URL = 'http://wp.com'
                ; (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false })

            expect(await searchWordPressPosts('test')).toEqual([])
        })

        it('should handle generic error', async () => {
            process.env.WORDPRESS_URL = 'http://wp.com'
                ; (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('fail'))

            expect(await searchWordPressPosts('test')).toEqual([])
        })
    })

    describe('searchWordPressEvents', () => {
        it('should return empty if missing url or query', async () => {
            delete process.env.WORDPRESS_URL;
            expect(await searchWordPressEvents('test')).toEqual([])
        })

        it('should fetch and map events', async () => {
            process.env.WORDPRESS_URL = 'http://wp.com'

                ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        events: [
                            { id: 1, title: 'Event 1', url: 'http://wp.com/e1', start_date: '2024-01-01', end_date: '2024-01-02' }
                        ],
                        total: 1
                    }),
                })

            const results = await searchWordPressEvents('test-query')
            expect(results).toHaveLength(1)
            expect(results[0].title).toBe('Event 1')
            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('tribe/events/v1/events'), expect.any(Object))
        })

        it('should handle validation issues in response structure', async () => {
            process.env.WORDPRESS_URL = 'http://wp.com'

                ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        // Missing events array
                        total: 0
                    }),
                })

            const results = await searchWordPressEvents('test')
            expect(results).toEqual([])
        })

        it('should handle fetch failure printing text response', async () => {
            process.env.WORDPRESS_URL = 'http://wp.com'
                ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                    ok: false,
                    status: 500,
                    statusText: 'Server Error',
                    text: async () => 'Raw error HTML'
                })

            expect(await searchWordPressEvents('test')).toEqual([])
        })

        it('should handle generic error', async () => {
            process.env.WORDPRESS_URL = 'http://wp.com'
                ; (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('fail'))

            expect(await searchWordPressEvents('test')).toEqual([])
        })
    })
})
