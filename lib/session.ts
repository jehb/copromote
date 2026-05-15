import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const SECRET_KEY = process.env.JWT_SECRET_KEY

if (!SECRET_KEY) {
    throw new Error('JWT_SECRET_KEY environment variable is not set')
}

const key = new TextEncoder().encode(SECRET_KEY)

export async function encrypt(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(key)
}

export async function decrypt(input: string): Promise<any> {
    try {
        const { payload } = await jwtVerify(input, key, {
            algorithms: ['HS256'],
        })
        return payload
    } catch (error) {
        return null
    }
}

export async function getSession() {
    const session = (await cookies()).get('session')?.value
    if (!session) return null
    return await decrypt(session)
}

export async function updateSession(request: any) {
    const session = request.cookies.get('session')?.value
    if (!session) return

    // Refresh session expiration
    const parsed = await decrypt(session)
    if (!parsed) return

    parsed.expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    // Create a new response passing the request to preserve the body/headers?
    // Actually, updateSession is called in middleware.
    // In middleware, we should return NextResponse.next() with cookies set.

    const res = NextResponse.next()
    res.cookies.set({
        name: 'session',
        value: await encrypt(parsed),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: parsed.expires,
    })
    return res
}

export async function logout() {
    (await cookies()).delete('session')
}

export const verifySession = getSession
