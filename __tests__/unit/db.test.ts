
import { prisma } from '@/lib/db'

describe('DB Utility', () => {
    it('should export a prisma instance', () => {
        expect(prisma).toBeDefined()
    })

    // We can't easily test the singleton logic in JSDOM environment without
    // potentially messing up the global state for other tests,
    // but we can verify fundamental export.
})
