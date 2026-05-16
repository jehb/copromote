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
    const isLoginPage = request.nextUrl.pathname.startsWith('/login')

    // If no session or invalid session, enforce login page
    if (!payload) {
        if (!isLoginPage) {
            const response = NextResponse.redirect(getRedirectUrl('/login'))
            if (currentUser) {
                // If there was a cookie but it was invalid, clear it
                response.cookies.delete('session')
            }
            return response
        }
        // If they are already on login, let them proceed. Just clear invalid cookie if present.
        if (currentUser) {
            const response = NextResponse.next()
            response.cookies.delete('session')
            return response
        }
        return NextResponse.next()
    }

    // From this point, payload is guaranteed to be valid
    if (payload.mustChangePassword) {
        if (
            !request.nextUrl.pathname.startsWith('/change-password') &&
            !request.nextUrl.pathname.startsWith('/logout')
        ) {
            return NextResponse.redirect(getRedirectUrl('/change-password'))
        }
    } else {
        if (isLoginPage) {
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
