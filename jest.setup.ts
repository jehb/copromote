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
