import { prisma } from '@/lib/db'

describe('db.ts', () => {
    it('should export a prisma instance', () => {
        expect(prisma).toBeDefined()
    })
})
