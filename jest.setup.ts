import '@testing-library/jest-dom'

// Set environment variables for tests
process.env.JWT_SECRET_KEY = 'test-secret-key-for-jest'

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

// Mock bcrypt to avoid native module missing error in tests
jest.mock('bcrypt', () => ({
    compare: jest.fn().mockResolvedValue(true),
    hash: jest.fn().mockResolvedValue('hashed_password')
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
        json: jest.fn((data: any, options?: { status?: number, headers?: any }) => ({
            json: async () => data,
            status: options?.status || 200,
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

// GLOBAL PRISMA MOCK
const mockPrisma = {
    user: {
        findUnique: jest.fn().mockResolvedValue({ id: 'mock_user_id', role: 'ADMIN' }),
        findFirst: jest.fn().mockResolvedValue({ id: 'mock_user_id' }),
        create: jest.fn().mockResolvedValue({ id: 'mock_user_id' }),
        update: jest.fn().mockResolvedValue({ id: 'mock_user_id' }),
        delete: jest.fn().mockResolvedValue({ id: 'mock_user_id' }),
        findMany: jest.fn().mockResolvedValue([]),
    },
    event: {
        findUnique: jest.fn().mockResolvedValue({ id: 'mock_event_id' }),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'mock_event_id' }),
        update: jest.fn().mockResolvedValue({ id: 'mock_event_id' }),
        delete: jest.fn().mockResolvedValue({ id: 'mock_event_id' }),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    task: {
        findUnique: jest.fn().mockResolvedValue({ id: 'mock_task_id' }),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'mock_task_id' }),
        update: jest.fn().mockResolvedValue({ id: 'mock_task_id' }),
        delete: jest.fn().mockResolvedValue({ id: 'mock_task_id' }),
        count: jest.fn().mockResolvedValue(0),
    },
    project: {
        findUnique: jest.fn().mockResolvedValue({ id: 'mock_project_id' }),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'mock_project_id' }),
        update: jest.fn().mockResolvedValue({ id: 'mock_project_id' }),
        delete: jest.fn().mockResolvedValue({ id: 'mock_project_id' }),
    },
    organization: {
        findUnique: jest.fn().mockResolvedValue({ id: 'mock_org_id' }),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'mock_org_id' }),
        update: jest.fn().mockResolvedValue({ id: 'mock_org_id' }),
        delete: jest.fn().mockResolvedValue({ id: 'mock_org_id' }),
    },
    contact: {
        findUnique: jest.fn().mockResolvedValue({ id: 'mock_contact_id' }),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'mock_contact_id' }),
        update: jest.fn().mockResolvedValue({ id: 'mock_contact_id' }),
        delete: jest.fn().mockResolvedValue({ id: 'mock_contact_id' }),
    },
    securityLog: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'mock_security_log_id' }),
    },
    calendarEvent: {
        findMany: jest.fn().mockResolvedValue([]),
    },
    location: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'mock_location_id' }),
    },
    activityLog: {
        create: jest.fn().mockResolvedValue({ id: 'mock_log_id' }),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue({ id: 'mock_log_id' }),
    },
    hyperlink: {
        findMany: jest.fn().mockResolvedValue([]),
    },
    promotionPeriod: {
        create: jest.fn().mockResolvedValue({ id: 'mock_promo_id' }),
        findMany: jest.fn().mockResolvedValue([]),
    },
    photo: {
        create: jest.fn().mockResolvedValue({ id: 'mock_photo_id' }),
        findUnique: jest.fn().mockResolvedValue({ id: 'mock_photo_id' }),
        delete: jest.fn().mockResolvedValue({ id: 'mock_photo_id' }),
        findMany: jest.fn().mockResolvedValue([]),
    },
    socialPost: {
        findMany: jest.fn().mockResolvedValue([]),
    },
    asset: {
        create: jest.fn().mockResolvedValue({ id: 'mock_asset_id' }),
        delete: jest.fn().mockResolvedValue({ id: 'mock_asset_id' }),
    },
    photoCategory: {
        findMany: jest.fn().mockResolvedValue([]),
        upsert: jest.fn().mockResolvedValue({ id: 'mock_cat_id' }),
    },
    tag: {
        findUnique: jest.fn().mockResolvedValue({ id: 'mock_tag_id' }),
        create: jest.fn().mockResolvedValue({ id: 'mock_tag_id' }),
    },
    theme: {
        findMany: jest.fn().mockResolvedValue([]),
    },
    config: {
        findUnique: jest.fn().mockResolvedValue({ key: 'mock_key', value: 'mock_value' }),
        upsert: jest.fn().mockResolvedValue({ key: 'mock_key', value: 'mock_value' }),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
}

jest.mock('@/lib/db', () => ({
    prisma: mockPrisma,
}))

jest.mock('@/lib/prisma', () => ({
    prisma: mockPrisma,
}))

jest.mock('fs', () => ({
    existsSync: jest.fn(),
    promises: {
        writeFile: jest.fn(),
        unlink: jest.fn(),
        mkdir: jest.fn(),
    }
}))

jest.mock('fs/promises', () => ({
    writeFile: jest.fn(),
    unlink: jest.fn(),
    mkdir: jest.fn(),
}))

// Mock @immich/sdk directly so it doesn't fail import maps setup
jest.mock('@immich/sdk', () => ({
    init: jest.fn(),
    deleteAssets: jest.fn().mockResolvedValue({}),
    uploadAsset: jest.fn().mockResolvedValue({ id: 'immich-1' }),
    getAllTags: jest.fn().mockResolvedValue({}),
    createTag: jest.fn().mockResolvedValue({ id: 'tag-1' }),
    bulkTagAssets: jest.fn().mockResolvedValue({}),
    searchAssets: jest.fn().mockResolvedValue({ assets: { items: [] } })
}))


