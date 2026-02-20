import { getPhotos, getPhotoCategories, uploadPhoto, deletePhoto, createPhotoCategory } from '@/app/actions/photos'
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
        it('should fetch all photos if no category/tag provided', async () => {
            const mockPhotos = [{ id: '1', url: '/test.jpg' }]
                ; (prisma.photo.findMany as jest.Mock).mockResolvedValue(mockPhotos)

            const result = await getPhotos()

            expect(result).toEqual(mockPhotos)
            expect(prisma.photo.findMany).toHaveBeenCalledWith({
                where: { categoryId: undefined, tags: undefined },
                include: { category: true, tags: true },
                orderBy: { createdAt: 'desc' },
            })
        })

        it('should fetch photos filtered by category and tag', async () => {
            const mockPhotos = [{ id: '1', url: '/test.jpg' }]
                ; (prisma.photo.findMany as jest.Mock).mockResolvedValue(mockPhotos)

            const result = await getPhotos('cat1', 'tag1')

            expect(result).toEqual(mockPhotos)
            expect(prisma.photo.findMany).toHaveBeenCalledWith({
                where: { categoryId: 'cat1', tags: { some: { id: 'tag1' } } },
                include: { category: true, tags: true },
                orderBy: { createdAt: 'desc' },
            })
        })

        it('should handle "all" category specially', async () => {
            await getPhotos('all')
            expect(prisma.photo.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: { categoryId: undefined, tags: undefined }
            }))
        })
    })

    describe('getPhotoCategories', () => {
        it('should fetch categories with counts', async () => {
            const mockCats = [{ id: 'c1', name: 'Cat 1' }]
                ; (prisma.photoCategory.findMany as jest.Mock).mockResolvedValue(mockCats)

            const result = await getPhotoCategories()

            expect(result).toEqual(mockCats)
            expect(prisma.photoCategory.findMany).toHaveBeenCalledWith({
                include: { _count: { select: { photos: true } } },
                orderBy: { name: 'asc' },
            })
        })
    })

    describe('uploadPhoto', () => {
        it('should throw error if file is missing', async () => {
            const formData = { get: jest.fn().mockReturnValue(null) } as unknown as FormData

            await expect(uploadPhoto(formData)).rejects.toThrow('No file uploaded.')
        })

        it('should throw error if category is missing', async () => {
            const mockFile = { name: 'test.jpg', size: 1024, type: 'image/jpeg', arrayBuffer: jest.fn() }
            const formData = {
                get: jest.fn((key) => {
                    if (key === 'file') return mockFile
                    return null
                })
            } as unknown as FormData

            await expect(uploadPhoto(formData)).rejects.toThrow('Category is required.')
        })

        it('should throw error for invalid file type', async () => {
            const mockFile = { name: 'test.pdf', size: 1024, type: 'application/pdf', arrayBuffer: jest.fn() }
            const formData = {
                get: jest.fn((key) => {
                    if (key === 'file') return mockFile
                    if (key === 'categoryId') return 'c1'
                    return null
                })
            } as unknown as FormData

            await expect(uploadPhoto(formData)).rejects.toThrow('Invalid file type.')
        })

        it('should throw error for file too large', async () => {
            const mockFile = { name: 'large.jpg', size: 6 * 1024 * 1024, type: 'image/jpeg', arrayBuffer: jest.fn() }
            const formData = {
                get: jest.fn((key) => {
                    if (key === 'file') return mockFile
                    if (key === 'categoryId') return 'c1'
                    return null
                })
            } as unknown as FormData

            await expect(uploadPhoto(formData)).rejects.toThrow('File size too large.')
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
                    if (key === 'categoryId') return 'c1'
                    if (key === 'name') return 'My Photo'
                    if (key === 'tags') return 'tag1, tag2'
                    return null
                })
            } as unknown as FormData

                ; (existsSync as jest.Mock).mockReturnValue(false) // Trigger directory creation

                ; (prisma.tag.findUnique as jest.Mock)
                    .mockResolvedValueOnce(null) // tag1 doesn't exist
                    .mockResolvedValueOnce({ id: 't2', name: 'tag2' }) // tag2 exists

                ; (prisma.tag.create as jest.Mock).mockResolvedValue({ id: 't1', name: 'tag1' })

            await uploadPhoto(formData)

            expect(fs.mkdir).toHaveBeenCalled()
            expect(fs.writeFile).toHaveBeenCalled()

            expect(prisma.tag.findUnique).toHaveBeenCalledTimes(2)
            expect(prisma.tag.create).toHaveBeenCalledTimes(1)

            expect(prisma.photo.create).toHaveBeenCalledWith({
                data: {
                    url: '/uploads/1234-abcd.jpg',
                    name: 'My Photo',
                    categoryId: 'c1',
                    tags: { connect: [{ id: 't1' }, { id: 't2' }] }
                }
            })

            expect(revalidatePath).toHaveBeenCalledWith('/gallery')
        })
    })

    describe('deletePhoto', () => {
        it('should delete file and db record successfully', async () => {
            ; (prisma.photo.findUnique as jest.Mock).mockResolvedValue({ id: 'p1', url: '/uploads/test.jpg' })
                ; (existsSync as jest.Mock).mockReturnValue(true)

            await deletePhoto('p1')

            expect(fs.unlink).toHaveBeenCalledWith(expect.stringContaining('uploads/test.jpg'))
            expect(prisma.photo.delete).toHaveBeenCalledWith({ where: { id: 'p1' } })
            expect(revalidatePath).toHaveBeenCalledWith('/gallery')
        })

        it('should handle missing photo gracefully', async () => {
            ; (prisma.photo.findUnique as jest.Mock).mockResolvedValue(null)

            await deletePhoto('nonexistent')

            expect(fs.unlink).not.toHaveBeenCalled()
            expect(prisma.photo.delete).not.toHaveBeenCalled()
        })

        it('should proceed with db deletion even if file unlink fails', async () => {
            ; (prisma.photo.findUnique as jest.Mock).mockResolvedValue({ id: 'p1', url: '/uploads/test.jpg' })
                ; (existsSync as jest.Mock).mockReturnValue(true)
                ; (fs.unlink as jest.Mock).mockRejectedValue(new Error('Permission denied'))

            await deletePhoto('p1')

            expect(console.error).toHaveBeenCalledWith('Failed to delete file from disk:', expect.any(Error))
            expect(prisma.photo.delete).toHaveBeenCalledWith({ where: { id: 'p1' } })
            expect(revalidatePath).toHaveBeenCalledWith('/gallery')
        })
    })

    describe('createPhotoCategory', () => {
        it('should throw error if name missing', async () => {
            await expect(createPhotoCategory('')).rejects.toThrow('Category name is required.')
        })

        it('should upsert category', async () => {
            await createPhotoCategory('New Cat')

            expect(prisma.photoCategory.upsert).toHaveBeenCalledWith({
                where: { name: 'New Cat' },
                update: {},
                create: { name: 'New Cat' }
            })
            expect(revalidatePath).toHaveBeenCalledWith('/gallery')
        })
    })
})
