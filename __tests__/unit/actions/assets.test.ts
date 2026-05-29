import { createAsset, deleteAsset } from '@/app/actions/assets'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

jest.mock('@/lib/db', () => ({
    prisma: {
        asset: {
            create: jest.fn(),
            delete: jest.fn(),
        }
    }
}))

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn()
}))

describe('Assets Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('createAsset', () => {
        it('should create an asset and revalidate the project path', async () => {
            const mockFormData = new FormData()
            mockFormData.append('name', 'Test Asset')
            mockFormData.append('type', 'image/png')
            mockFormData.append('url', 'https://example.com/asset.png')
            mockFormData.append('projectId', 'proj-123')

                ; (prisma.asset.create as jest.Mock).mockResolvedValue({ id: 'a1' })

            await createAsset(mockFormData)

            expect(prisma.asset.create).toHaveBeenCalledWith({
                data: {
                    name: 'Test Asset',
                    type: 'image/png',
                    url: 'https://example.com/asset.png',
                    projectId: 'proj-123'
                }
            })
            expect(revalidatePath).toHaveBeenCalledWith('/projects/proj-123')
        })
    })

    describe('deleteAsset', () => {
        it('should delete an asset and revalidate the project path', async () => {
            ; (prisma.asset.delete as jest.Mock).mockResolvedValue({ id: 'a1' })

            await deleteAsset('a1', 'proj-123')

            expect(prisma.asset.delete).toHaveBeenCalledWith({
                where: { id: 'a1' }
            })
            expect(revalidatePath).toHaveBeenCalledWith('/projects/proj-123')
        })
    })
})
