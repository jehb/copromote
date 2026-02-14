import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter() {
        return {
            push: jest.fn(),
            replace: jest.fn(),
            prefetch: jest.fn(),
            back: jest.fn(),
        }
    },
    useSearchParams() {
        return new URLSearchParams()
    },
    usePathname() {
        return '/'
    },
    redirect: jest.fn(),
    notFound: jest.fn(),
}))

// Mock IndexedDB for offline tests
global.indexedDB = {
    open: jest.fn(),
    deleteDatabase: jest.fn(),
} as any

// Mock crypto for UUID generation
global.crypto = {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(7),
} as any

// Polyfill TextEncoder/TextDecoder for Node environment (used by Jose/Next.js)
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

// Polyfill Request/Response for Next.js Server Actions
if (typeof global.Request === 'undefined') {
    global.Request = class Request {
        constructor(input: any, init: any) {
            this.input = input
            this.init = init
        }
    } as any

    global.Response = class Response {
        constructor(body: any, init: any) {
            this.body = body
            this.init = init
        }
    } as any

    global.Headers = class Headers extends Map { } as any
}

// Mock jose for JWT handling
jest.mock('jose', () => ({
    SignJWT: jest.fn().mockImplementation(() => ({
        setProtectedHeader: jest.fn().mockReturnThis(),
        setIssuedAt: jest.fn().mockReturnThis(),
        setExpirationTime: jest.fn().mockReturnThis(),
        sign: jest.fn().mockResolvedValue('mock_token'),
    })),
    jwtVerify: jest.fn().mockResolvedValue({
        payload: {
            id: 'mock_user_id',
            username: 'mock_user',
            email: 'mock@example.com',
            role: 'ADMIN',
        },
    }),
}))

// Mock next/headers
jest.mock('next/headers', () => ({
    cookies: jest.fn().mockResolvedValue({
        get: jest.fn().mockReturnValue({ value: 'mock_session_token' }),
        set: jest.fn(),
        delete: jest.fn(),
        has: jest.fn().mockReturnValue(true),
    }),
    headers: jest.fn().mockReturnValue(new Map()),
}))

// Mock next/server
jest.mock('next/server', () => {
    // We need to return a module object with named exports
    const NextResponse = {
        next: jest.fn().mockReturnValue({
            cookies: {
                set: jest.fn(),
                get: jest.fn(),
                delete: jest.fn(),
            },
        }),
        json: jest.fn((data: any) => ({
            json: async () => data,
        })),
    }

    return {
        NextResponse,
        NextRequest: jest.fn(),
    }
})

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
}

// Mock PointerEvent
if (!global.PointerEvent) {
    class PointerEvent extends MouseEvent {
        public height: number;
        public isPrimary: boolean;
        public pointerId: number;
        public pointerType: string;
        public pressure: number;
        public tangentialPressure: number;
        public tiltX: number;
        public tiltY: number;
        public twist: number;
        public width: number;

        constructor(type: string, params: PointerEventInit = {}) {
            super(type, params);
            this.pointerId = params.pointerId || 0;
            this.width = params.width || 0;
            this.height = params.height || 0;
            this.pressure = params.pressure || 0;
            this.tangentialPressure = params.tangentialPressure || 0;
            this.tiltX = params.tiltX || 0;
            this.tiltY = params.tiltY || 0;
            this.twist = params.twist || 0;
            this.pointerType = params.pointerType || "";
            this.isPrimary = params.isPrimary || false;
        }
    }
    global.PointerEvent = PointerEvent as any;
}

// Mock Element pointer capture methods
window.Element.prototype.hasPointerCapture = jest.fn(() => false)
window.Element.prototype.setPointerCapture = jest.fn()
window.Element.prototype.releasePointerCapture = jest.fn()
window.HTMLElement.prototype.scrollIntoView = jest.fn()

// Mock window.scrollTo
window.scrollTo = jest.fn()
