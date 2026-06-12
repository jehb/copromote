import { NextRequest, NextResponse } from 'next/server'
import { decrypt, updateSession } from './lib/session'

export async function proxy(request: NextRequest) {
    const getRedirectUrl = (path: string) => {
        const url = request.nextUrl.clone()
        url.pathname = path
        const hostHeader = request.headers.get('x-forwarded-host') || request.headers.get('host')
        if (hostHeader) {
            const tmpUrl = new URL(`http://${hostHeader}`)
            url.hostname = tmpUrl.hostname
            url.port = tmpUrl.port
        }
        const forwardedProto = request.headers.get('x-forwarded-proto')
        if (forwardedProto) {
            url.protocol = forwardedProto + ':'
        }
        return url
    }

    const currentUser = request.cookies.get('session')?.value
    const payload = currentUser ? await decrypt(currentUser) : null
    const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/verify-magic-link')

    // If no session or invalid session, enforce login page
    if (!payload) {
        if (!isAuthPage) {
            const response = NextResponse.redirect(getRedirectUrl('/login'))
            if (currentUser) {
                // If there was a cookie but it was invalid, clear it
                response.cookies.delete('session')
            }
            return response
        }
        // If they are already on auth page, let them proceed. Just clear invalid cookie if present.
        if (currentUser) {
            const response = NextResponse.next()
            response.cookies.delete('session')
            return response
        }
        return NextResponse.next()
    }

    // From this point, payload is guaranteed to be valid
    const pathname = request.nextUrl.pathname

    // 1. Check if session requires 2FA
    if (payload.pending2fa) {
        if (pathname !== '/verify-2fa' && pathname !== '/logout') {
            return NextResponse.redirect(getRedirectUrl('/verify-2fa'))
        }
        return NextResponse.next()
    }

    // 2. Prevent accessing /verify-2fa if session is fully authenticated
    if (pathname === '/verify-2fa') {
        return NextResponse.redirect(getRedirectUrl('/'))
    }

    // 3. Check password change requirement
    if (payload.mustChangePassword) {
        if (
            !pathname.startsWith('/change-password') &&
            !pathname.startsWith('/logout')
        ) {
            return NextResponse.redirect(getRedirectUrl('/change-password'))
        }
    } else {
        // If they don't need to change password, prevent accessing login/auth pages
        if (isAuthPage) {
            return NextResponse.redirect(getRedirectUrl('/'))
        }
    }

    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - manifest.json (PWA manifest)
         * - icons (PWA icons)
         * - docs (documentation)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons|docs).*)',
    ],
}
