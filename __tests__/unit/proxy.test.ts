import { NextRequest, NextResponse } from 'next/server'
import { proxy } from '@/proxy'
import { decrypt, updateSession } from '@/lib/session'

jest.mock('@/lib/session', () => ({
    decrypt: jest.fn(),
    updateSession: jest.fn(),
}))

// Mock NextResponse methods to inspect them
jest.mock('next/server', () => {
    const originalModule = jest.requireActual('next/server');
    return {
        ...originalModule,
        NextResponse: {
            next: jest.fn().mockImplementation(() => {
                return {
                    cookies: {
                        delete: jest.fn(),
                        set: jest.fn(),
                    }
                }
            }),
            redirect: jest.fn().mockImplementation((url) => {
                return {
                    url,
                    cookies: {
                        delete: jest.fn(),
                        set: jest.fn(),
                    }
                }
            }),
        },
    };
});

function createMockRequest(pathname: string, cookies: Record<string, string> = {}, headers: Record<string, string> = {}) {
    const urlStr = `http://localhost${pathname}`
    const nextUrl = new URL(urlStr) as any
    nextUrl.clone = () => new URL(urlStr)

    return {
        nextUrl,
        url: urlStr,
        cookies: {
            get: jest.fn((name) => (cookies[name] ? { value: cookies[name] } : undefined)),
        },
        headers: {
            get: jest.fn((name) => headers[name] || null),
        },
    } as unknown as NextRequest
}

describe('Proxy Middleware', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Unauthenticated Scenarios', () => {
        it('redirects to /login if no session exists and user is not on a login-related path', async () => {
            const req = createMockRequest('/dashboard')
            ;(decrypt as jest.Mock).mockResolvedValue(null)

            const response = await proxy(req)

            expect(NextResponse.redirect).toHaveBeenCalledWith(expect.any(URL))
            const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0] as URL
            expect(redirectUrl.pathname).toBe('/login')
        })

        it('lets the user proceed if they are on a login-related path without a session', async () => {
            const req = createMockRequest('/login')
            ;(decrypt as jest.Mock).mockResolvedValue(null)

            const response = await proxy(req)

            expect(NextResponse.next).toHaveBeenCalled()
            expect(NextResponse.redirect).not.toHaveBeenCalled()
        })

        it('clears an invalid session cookie and redirects to /login if on a protected route', async () => {
            const req = createMockRequest('/dashboard', { session: 'invalid_token' })
            ;(decrypt as jest.Mock).mockResolvedValue(null)

            const response = await proxy(req)

            expect(NextResponse.redirect).toHaveBeenCalled()
            expect(response.cookies.delete).toHaveBeenCalledWith('session')
        })

        it('clears an invalid session cookie and proceeds if on a login route', async () => {
            const req = createMockRequest('/login', { session: 'invalid_token' })
            ;(decrypt as jest.Mock).mockResolvedValue(null)

            const response = await proxy(req)

            expect(NextResponse.next).toHaveBeenCalled()
            expect(response.cookies.delete).toHaveBeenCalledWith('session')
        })
    });

    describe('Authenticated Scenarios', () => {
        it('redirects to /change-password if payload has mustChangePassword and user is not on /change-password or /logout', async () => {
            const req = createMockRequest('/dashboard', { session: 'valid_token' })
            ;(decrypt as jest.Mock).mockResolvedValue({ id: '1', mustChangePassword: true })

            const response = await proxy(req)

            expect(NextResponse.redirect).toHaveBeenCalledWith(expect.any(URL))
            const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0] as URL
            expect(redirectUrl.pathname).toBe('/change-password')
        })

        it('allows proceed if payload has mustChangePassword and user is on /change-password', async () => {
            const req = createMockRequest('/change-password', { session: 'valid_token' })
            ;(decrypt as jest.Mock).mockResolvedValue({ id: '1', mustChangePassword: true })
            ;(updateSession as jest.Mock).mockResolvedValue({ status: 200 }) // Dummy response

            const response = await proxy(req)

            expect(NextResponse.redirect).not.toHaveBeenCalled()
            expect(updateSession).toHaveBeenCalledWith(req)
            expect(response).toEqual({ status: 200 })
        })

        it('allows proceed if payload has mustChangePassword and user is on /logout', async () => {
            const req = createMockRequest('/logout', { session: 'valid_token' })
            ;(decrypt as jest.Mock).mockResolvedValue({ id: '1', mustChangePassword: true })
            ;(updateSession as jest.Mock).mockResolvedValue({ status: 200 })

            const response = await proxy(req)

            expect(NextResponse.redirect).not.toHaveBeenCalled()
            expect(updateSession).toHaveBeenCalledWith(req)
        })

        it('redirects an already logged-in user away from /login to /', async () => {
            const req = createMockRequest('/login', { session: 'valid_token' })
            ;(decrypt as jest.Mock).mockResolvedValue({ id: '1', mustChangePassword: false })

            const response = await proxy(req)

            expect(NextResponse.redirect).toHaveBeenCalledWith(expect.any(URL))
            const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0] as URL
            expect(redirectUrl.pathname).toBe('/')
        })

        it('lets a valid request through, triggering updateSession', async () => {
            const req = createMockRequest('/dashboard', { session: 'valid_token' })
            ;(decrypt as jest.Mock).mockResolvedValue({ id: '1', mustChangePassword: false })
            ;(updateSession as jest.Mock).mockResolvedValue({ updated: true }) // Dummy response

            const response = await proxy(req)

            expect(updateSession).toHaveBeenCalledWith(req)
            expect(response).toEqual({ updated: true })
        })
    });

    describe('getRedirectUrl behavior', () => {
        it('uses original url if no forwarded headers are present', async () => {
            const req = createMockRequest('/dashboard')
            ;(decrypt as jest.Mock).mockResolvedValue(null)

            await proxy(req)

            const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0] as URL
            expect(redirectUrl.hostname).toBe('localhost')
            expect(redirectUrl.protocol).toBe('http:')
            expect(redirectUrl.pathname).toBe('/login')
        })

        it('respects x-forwarded-host and x-forwarded-proto headers', async () => {
            const req = createMockRequest('/dashboard', {}, {
                'x-forwarded-host': 'example.com:8080',
                'x-forwarded-proto': 'https'
            })
            ;(decrypt as jest.Mock).mockResolvedValue(null)

            await proxy(req)

            const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0] as URL
            expect(redirectUrl.hostname).toBe('example.com')
            expect(redirectUrl.port).toBe('8080')
            expect(redirectUrl.protocol).toBe('https:')
            expect(redirectUrl.pathname).toBe('/login')
        })

        it('falls back to host header if x-forwarded-host is not present', async () => {
            const req = createMockRequest('/dashboard', {}, {
                'host': 'my-custom-domain.com:3000'
            })
            ;(decrypt as jest.Mock).mockResolvedValue(null)

            await proxy(req)

            const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0] as URL
            expect(redirectUrl.hostname).toBe('my-custom-domain.com')
            expect(redirectUrl.port).toBe('3000')
            expect(redirectUrl.protocol).toBe('http:')
            expect(redirectUrl.pathname).toBe('/login')
        })
    });
});
