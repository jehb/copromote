
import { prisma } from '@/lib/prisma'

describe('Prisma Utility', () => {
    it('should export a prisma instance', () => {
        expect(prisma).toBeDefined()
    })
})
