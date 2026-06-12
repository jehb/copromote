
import { encrypt, decrypt, getSession, getPending2faSession, updateSession, logout } from '@/lib/session'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { NextResponse } from 'next/server'

// Mocks are already set up in jest.setup.ts, but we might need to adjust return values 
// for specific tests.
const mockCookies = cookies as unknown as jest.Mock
const mockSignJWT = SignJWT as unknown as jest.Mock
const mockJwtVerify = jwtVerify as unknown as jest.Mock

describe('Session Utility', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('encrypt', () => {
        it('should encrypt payload', async () => {
            const payload = { id: '123' }
            const result = await encrypt(payload)
            expect(result).toBe('mock_token')
            expect(mockSignJWT).toHaveBeenCalledWith(payload)
        })
    })

    describe('decrypt', () => {
        it('should decrypt valid token', async () => {
            const input = 'valid_token'
            const result = await decrypt(input)

            expect(result).toEqual({
                id: 'mock_user_id',
                username: 'mock_user',
                email: 'mock@example.com',
                role: 'ADMIN',
            })
            expect(mockJwtVerify).toHaveBeenCalled()
        })

        it('should return null for invalid token', async () => {
            mockJwtVerify.mockRejectedValueOnce(new Error('Invalid token'))
            const result = await decrypt('invalid_token')
            expect(result).toBeNull()
        })
    })

    describe('getSession', () => {
        it('should return session if cookie exists', async () => {
            const session = await getSession()
            expect(session).toEqual({
                id: 'mock_user_id',
                username: 'mock_user',
                email: 'mock@example.com',
                role: 'ADMIN',
            })
        })

        it('should return null if no session cookie', async () => {
            // Override the default mock for this test
            mockCookies.mockResolvedValueOnce({
                get: jest.fn().mockReturnValue(undefined)
            })

            const session = await getSession()
            expect(session).toBeNull()
        })

        it('should return null if session is pending 2FA', async () => {
            // Decrypt mock returns pending2fa payload
            mockJwtVerify.mockResolvedValueOnce({
                payload: { id: 'mock_user_id', username: 'mock_user', pending2fa: true }
            })

            const session = await getSession()
            expect(session).toBeNull()
        })
    })

    describe('getPending2faSession', () => {
        it('should return session if pending 2FA', async () => {
            mockJwtVerify.mockResolvedValueOnce({
                payload: { id: 'mock_user_id', username: 'mock_user', pending2fa: true }
            })

            const session = await getPending2faSession()
            expect(session).toEqual({
                id: 'mock_user_id',
                username: 'mock_user',
                pending2fa: true
            })
        })

        it('should return null if session is NOT pending 2FA', async () => {
            mockJwtVerify.mockResolvedValueOnce({
                payload: { id: 'mock_user_id', username: 'mock_user' }
            })

            const session = await getPending2faSession()
            expect(session).toBeNull()
        })

        it('should return null if no session cookie exists', async () => {
            mockCookies.mockResolvedValueOnce({
                get: jest.fn().mockReturnValue(undefined)
            })

            const session = await getPending2faSession()
            expect(session).toBeNull()
        })
    })

    describe('logout', () => {
        it('should delete session cookie', async () => {
            await logout()
            const cookieStore = await cookies()
            expect(cookieStore.delete).toHaveBeenCalledWith('session')
        })
    })

    describe('updateSession', () => {
        it('should update session expiration', async () => {
            const request = {
                cookies: {
                    get: jest.fn().mockReturnValue({ value: 'valid_token' })
                }
            }

            const response = await updateSession(request)

            expect(response).toBeDefined()
            expect(response?.cookies.set).toHaveBeenCalled()

            const setCall = (response?.cookies.set as jest.Mock).mock.calls[0][0]
            expect(setCall.name).toBe('session')
            expect(setCall.expires).toBeDefined()
        })

        it('should return undefined if no session', async () => {
            const request = {
                cookies: {
                    get: jest.fn().mockReturnValue(undefined)
                }
            }

            const response = await updateSession(request)
            expect(response).toBeUndefined()
        })
    })
})
