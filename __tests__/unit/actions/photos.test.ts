import { getPhotos, uploadPhoto, deletePhoto } from '@/app/actions/photos'
import * as immichActions from '@/app/actions/immich'

jest.mock('@/app/actions/immich', () => ({
    initImmich: jest.fn().mockResolvedValue(true),
    getImmichAssets: jest.fn().mockResolvedValue([]),
    getImmichTags: jest.fn().mockResolvedValue([]),
    uploadImmichAsset: jest.fn().mockResolvedValue({ id: 'immich-1' }),
    deleteImmichAsset: jest.fn().mockResolvedValue({}),
}))
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { promises as fs, existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

jest.mock('@/lib/db', () => ({
    prisma: {
        photo: {
            findMany: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
            findUnique: jest.fn(),
        },
        photoCategory: {
            findMany: jest.fn(),
            upsert: jest.fn(),
        },
        tag: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        config: {
            findUnique: jest.fn()
        }
    },
}))

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

jest.mock('fs', () => ({
    promises: {
        mkdir: jest.fn(),
        writeFile: jest.fn(),
        unlink: jest.fn(),
    },
    existsSync: jest.fn(),
}))

jest.mock('path', () => ({
    join: jest.fn((...args) => args.join('/')),
}))

jest.mock('crypto', () => ({
    randomUUID: jest.fn(),
}))

// Mock File API for Node.js environment
class MockFile {
    name: string
    size: number
    type: string
    content: string

    constructor(parts: any[], name: string, options?: any) {
        this.name = name
        this.size = parts.join('').length
        this.type = options?.type || ''
        this.content = parts.join('')
    }

    async arrayBuffer() {
        return new TextEncoder().encode(this.content).buffer
    }
}
global.File = MockFile as any

jest.mock('@/app/actions/settings', () => ({
    getConfig: jest.fn().mockImplementation((key) => {
        if (key === 'immichUrl') return 'http://test.immich'
        if (key === 'immichApiKey') return 'test-key'
        return null
    }),
    updateConfig: jest.fn()
}))

describe('Photos Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.spyOn(console, 'log').mockImplementation(() => { })
        jest.spyOn(console, 'error').mockImplementation(() => { })

            // Default mocks
            ; (randomUUID as jest.Mock).mockReturnValue('1234-abcd')
            ; (existsSync as jest.Mock).mockReturnValue(true) // directory exists by default
    })

    describe('getPhotos', () => {
        it('should fetch all photos if no tag provided', async () => {
            const mockAssets = [{ id: '1', originalFileName: 'test.jpg', fileCreatedAt: new Date().toISOString() }]
            const mockTags = [{ id: 'tag1', name: 'Vacation', color: '#ff0000' }]

                ; (immichActions.getImmichAssets as jest.Mock).mockResolvedValue(mockAssets)
                ; (immichActions.getImmichTags as jest.Mock).mockResolvedValue(mockTags)

            const result = await getPhotos()

            expect(result).toHaveLength(1)
            expect(result[0].id).toBe('1')
            expect(result[0].name).toBe('test.jpg')
            expect(immichActions.getImmichAssets).toHaveBeenCalledWith(undefined)
        })

        it('should fetch photos filtered by tag', async () => {
            const mockAssets = [{ id: '1', originalFileName: 'test.jpg', fileCreatedAt: new Date().toISOString() }]
            const mockTags = [{ id: 'tag1', name: 'Vacation', color: '#ff0000' }]

                ; (immichActions.getImmichAssets as jest.Mock).mockResolvedValue(mockAssets)
                ; (immichActions.getImmichTags as jest.Mock).mockResolvedValue(mockTags)

            // categoryId is now ignored, so we pass undefined for it to test the second arg
            const result = await getPhotos('tag1')

            expect(result).toHaveLength(1)
            expect(immichActions.getImmichAssets).toHaveBeenCalledWith('tag1')
        })
    })



    describe('uploadPhoto', () => {
        it('should throw error if file is missing', async () => {
            const formData = { get: jest.fn().mockReturnValue(null) } as unknown as FormData

            await expect(uploadPhoto(formData)).rejects.toThrow('No file uploaded.')
        })

        it('should upload photo successfully', async () => {
            const mockFile = {
                name: 'test.jpg',
                size: 1024,
                type: 'image/jpeg',
                arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(10))
            }
            const formData = {
                get: jest.fn((key) => {
                    if (key === 'file') return mockFile
                    if (key === 'tagIds') return 'tag1,tag2'
                    return null
                })
            } as unknown as FormData

            await uploadPhoto(formData)

            expect(immichActions.uploadImmichAsset).toHaveBeenCalledWith(mockFile, ['tag1', 'tag2'])
            expect(revalidatePath).toHaveBeenCalledWith('/gallery')
        })
    })

    describe('deletePhoto', () => {
        it('should call deleteImmichAsset and revalidate', async () => {
            await deletePhoto('p1')

            expect(immichActions.deleteImmichAsset).toHaveBeenCalledWith('p1')
            expect(revalidatePath).toHaveBeenCalledWith('/gallery')
        })
    })
})
