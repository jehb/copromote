import { NextRequest, NextResponse } from 'next/server'
import { decrypt, updateSession } from './lib/session'

export async function proxy(request: NextRequest) {
    const currentUser = request.cookies.get('session')?.value

    // If trying to access protected routes
    if (
        !currentUser &&
        !request.nextUrl.pathname.startsWith('/login')
    ) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // If user is logged in
    if (currentUser) {
        const payload = await decrypt(currentUser)

        // Invalid session -> redirect to login
        if (!payload && !request.nextUrl.pathname.startsWith('/login')) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        // Force password change logic
        if (payload?.mustChangePassword) {
            // Allow access to change-password and logout
            if (
                !request.nextUrl.pathname.startsWith('/change-password') &&
                !request.nextUrl.pathname.startsWith('/logout')
            ) {
                return NextResponse.redirect(new URL('/change-password', request.url))
            }
        } else {
            // If NOT forced to change password, but trying to access login or change-password (when not needed)
            // Redirect to home (except if they explicitly went to change-password via profile - logic can be refined)
            if (request.nextUrl.pathname.startsWith('/login')) {
                return NextResponse.redirect(new URL('/', request.url))
            }
        }

        // Refresh session if needed
        return await updateSession(request)
    }

    return NextResponse.next()
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
