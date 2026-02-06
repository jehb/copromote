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
