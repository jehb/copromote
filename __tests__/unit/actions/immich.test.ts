import { getSession } from '@/lib/session'

jest.mock('@/lib/session', () => ({
    getSession: jest.fn()
}))

jest.mock('@immich/sdk', () => ({
    init: jest.fn()
}))

describe('initImmich', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        originalEnv = { ...process.env };
    })

    afterEach(() => {
        process.env = originalEnv;
    })

    it('should throw Unauthorized if session is not present', async () => {
        const { getSession } = require('@/lib/session');
        getSession.mockResolvedValue(null);
        const { initImmich } = await import('@/app/actions/immich');
        await expect(initImmich()).rejects.toThrow('Unauthorized');
    })

    it('should return true immediately if already initialized', async () => {
        const { getSession } = require('@/lib/session');
        getSession.mockResolvedValue({ user: { id: 1 } });
        process.env.IMMICH_URL = 'http://test.url';
        process.env.IMMICH_API_KEY = 'test-key';

        const { initImmich } = await import('@/app/actions/immich');
        const immich = require('@immich/sdk');

        // First call to initialize
        const res1 = await initImmich();
        expect(res1).toBe(true);
        expect(immich.init).toHaveBeenCalledTimes(1);

        // Second call should return true without calling immich.init again
        const res2 = await initImmich();
        expect(res2).toBe(true);
        expect(immich.init).toHaveBeenCalledTimes(1);
    })

    it('should return false if IMMICH_URL or IMMICH_API_KEY is missing', async () => {
        const { getSession } = require('@/lib/session');
        getSession.mockResolvedValue({ user: { id: 1 } });

        // Both missing
        process.env.IMMICH_URL = '';
        process.env.IMMICH_API_KEY = '';
        const { initImmich: initImmich1 } = await import('@/app/actions/immich');
        expect(await initImmich1()).toBe(false);

        jest.resetModules();

        // API key missing
        const { getSession: getSession2 } = require('@/lib/session');
        getSession2.mockResolvedValue({ user: { id: 1 } });
        process.env.IMMICH_URL = 'http://test.url';
        process.env.IMMICH_API_KEY = '';
        const { initImmich: initImmich2 } = await import('@/app/actions/immich');
        expect(await initImmich2()).toBe(false);

        jest.resetModules();

        // URL missing
        const { getSession: getSession3 } = require('@/lib/session');
        getSession3.mockResolvedValue({ user: { id: 1 } });
        process.env.IMMICH_URL = '';
        process.env.IMMICH_API_KEY = 'test-key';
        const { initImmich: initImmich3 } = await import('@/app/actions/immich');
        expect(await initImmich3()).toBe(false);
    })

    it('should append /api to URL if not present', async () => {
        const { getSession } = require('@/lib/session');
        getSession.mockResolvedValue({ user: { id: 1 } });
        process.env.IMMICH_URL = 'http://test.url';
        process.env.IMMICH_API_KEY = 'test-key';

        const { initImmich } = await import('@/app/actions/immich');
        const immich = require('@immich/sdk');
        await initImmich();

        expect(immich.init).toHaveBeenCalledWith({
            baseUrl: 'http://test.url/api',
            apiKey: 'test-key',
        });
    })

    it('should strip trailing slash and append /api if URL ends with slash', async () => {
        const { getSession } = require('@/lib/session');
        getSession.mockResolvedValue({ user: { id: 1 } });
        process.env.IMMICH_URL = 'http://test.url/';
        process.env.IMMICH_API_KEY = 'test-key';

        const { initImmich } = await import('@/app/actions/immich');
        const immich = require('@immich/sdk');
        await initImmich();

        expect(immich.init).toHaveBeenCalledWith({
            baseUrl: 'http://test.url/api',
            apiKey: 'test-key',
        });
    })

    it('should not modify URL if it already ends with /api', async () => {
        const { getSession } = require('@/lib/session');
        getSession.mockResolvedValue({ user: { id: 1 } });
        process.env.IMMICH_URL = 'http://test.url/api';
        process.env.IMMICH_API_KEY = 'test-key';

        const { initImmich } = await import('@/app/actions/immich');
        const immich = require('@immich/sdk');
        await initImmich();

        expect(immich.init).toHaveBeenCalledWith({
            baseUrl: 'http://test.url/api',
            apiKey: 'test-key',
        });
    })

    it('should not modify URL if it already ends with /api/', async () => {
        const { getSession } = require('@/lib/session');
        getSession.mockResolvedValue({ user: { id: 1 } });
        process.env.IMMICH_URL = 'http://test.url/api/';
        process.env.IMMICH_API_KEY = 'test-key';

        const { initImmich } = await import('@/app/actions/immich');
        const immich = require('@immich/sdk');
        await initImmich();

        expect(immich.init).toHaveBeenCalledWith({
            baseUrl: 'http://test.url/api/',
            apiKey: 'test-key',
        });
    })

    it('should return false if immich.init throws an error', async () => {
        const { getSession } = require('@/lib/session');
        getSession.mockResolvedValue({ user: { id: 1 } });
        process.env.IMMICH_URL = 'http://test.url';
        process.env.IMMICH_API_KEY = 'test-key';

        const immich = require('@immich/sdk');
        immich.init.mockImplementationOnce(() => {
            throw new Error('Init failed');
        });

        const { initImmich } = await import('@/app/actions/immich');
        const res = await initImmich();

        expect(res).toBe(false);
    })
})
