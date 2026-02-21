import { getConfig, updateConfig } from '@/app/actions/settings'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

jest.mock('@/lib/db', () => ({
    prisma: {
        config: {
            findUnique: jest.fn(),
            upsert: jest.fn(),
        }
    }
}))

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

describe('Settings Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('getConfig', () => {
        it('should return trimmed value if config exists', async () => {
            ; (prisma.config.findUnique as jest.Mock).mockResolvedValue({ key: 'TEST_KEY', value: ' test value ' })
            const result = await getConfig('TEST_KEY')
            expect(result).toBe('test value')
            expect(prisma.config.findUnique).toHaveBeenCalledWith({ where: { key: 'TEST_KEY' } })
        })

        it('should return null if config does not exist', async () => {
            ; (prisma.config.findUnique as jest.Mock).mockResolvedValue(null)
            const result = await getConfig('TEST_KEY')
            expect(result).toBeNull()
        })

        it('should return null if config value is null', async () => {
            ; (prisma.config.findUnique as jest.Mock).mockResolvedValue({ key: 'TEST_KEY', value: null })
            const result = await getConfig('TEST_KEY')
            expect(result).toBeNull()
        })
    })

    describe('updateConfig', () => {
        it('should upsert config and revalidate path', async () => {
            ; (prisma.config.upsert as jest.Mock).mockResolvedValue({})
            await updateConfig('TEST_KEY', 'new value')
            expect(prisma.config.upsert).toHaveBeenCalledWith({
                where: { key: 'TEST_KEY' },
                update: { value: 'new value' },
                create: { key: 'TEST_KEY', value: 'new value' }
            })
            expect(revalidatePath).toHaveBeenCalledWith('/admin/settings')
        })
    })
})
