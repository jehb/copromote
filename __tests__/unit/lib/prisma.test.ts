import { prisma } from '@/lib/prisma'

describe('prisma.ts', () => {
    it('should export a prisma instance', () => {
        expect(prisma).toBeDefined()
    })
})
