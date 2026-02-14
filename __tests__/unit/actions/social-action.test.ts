
import { getSocialPosts, createSocialPost, updateSocialPost, deleteSocialPost, addAssetToSocialPost, deleteSocialPostAsset } from '@/app/actions/social'
import { prisma } from '@/lib/db'
import { logActivity } from '@/app/actions/activity-logs'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Mock dependencies
jest.mock('@/lib/db', () => ({
    prisma: {
        socialPost: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        task: {
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        tag: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        asset: {
            create: jest.fn(),
            delete: jest.fn(),
        }
    },
}))

jest.mock('@/app/actions/activity-logs', () => ({
    logActivity: jest.fn(),
}))

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

// redirect is mocked in jest.setup.ts

describe('Social Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('getSocialPosts', () => {
        it('should fetch posts with filters', async () => {
            const mockPosts = [{ id: '1', platform: 'twitter' }]
                ; (prisma.socialPost.findMany as jest.Mock).mockResolvedValue(mockPosts)

            const result = await getSocialPosts({ platform: 'twitter' })

            expect(result).toEqual(mockPosts)
            expect(prisma.socialPost.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ platform: 'twitter' })
            }))
        })
    })

    describe('createSocialPost', () => {
        it('should create post and sync reviewer task', async () => {
            const formData = new FormData()
            formData.append('content', 'Hello')
            formData.append('platform', 'twitter')
            formData.append('status', 'ready-for-review')
            formData.append('reviewerId', 'user-1')
            formData.append('tags', 'news, update')

                ; (prisma.tag.findUnique as jest.Mock).mockResolvedValue(null)
                ; (prisma.tag.create as jest.Mock).mockResolvedValue({ id: 'tag-1' })
                ; (prisma.socialPost.create as jest.Mock).mockResolvedValue({ id: 'post-1', status: 'ready-for-review', reviewerId: 'user-1' })
                ; (prisma.socialPost.findMany as jest.Mock).mockResolvedValue([{ id: 'post-1', scheduledDate: new Date() }])
                ; (prisma.task.findFirst as jest.Mock).mockResolvedValue(null)

            await createSocialPost(formData)

            expect(prisma.socialPost.create).toHaveBeenCalled()
            // Should create tags
            expect(prisma.tag.create).toHaveBeenCalled()
            // Should create reviewer task
            expect(prisma.task.create).toHaveBeenCalled()
            expect(redirect).toHaveBeenCalledWith('/social/post-1')
        })
    })

    describe('updateSocialPost', () => {
        it('should update post and sync tasks', async () => {
            const formData = new FormData()
            formData.append('id', 'post-1')
            formData.append('content', 'Updated')
            formData.append('status', 'draft')

                // Mock old post
                ; (prisma.socialPost.findUnique as jest.Mock).mockResolvedValue({ id: 'post-1', reviewerId: 'user-1', status: 'ready-for-review' })
                ; (prisma.socialPost.findMany as jest.Mock).mockResolvedValue([]) // No more posts in review
                ; (prisma.task.findFirst as jest.Mock).mockResolvedValue({ id: 'task-1' })

            await updateSocialPost(formData)

            expect(prisma.socialPost.update).toHaveBeenCalled()
            // Should update task to done since no posts left
            expect(prisma.task.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'task-1' },
                data: { status: 'done' }
            }))
        })
    })

    describe('deleteSocialPost', () => {
        it('should delete post', async () => {
            await deleteSocialPost('post-1')
            expect(prisma.socialPost.delete).toHaveBeenCalledWith({ where: { id: 'post-1' } })
        })
    })

    describe('asset management', () => {
        it('should add asset', async () => {
            const formData = new FormData()
            formData.append('socialPostId', 'p1')
            formData.append('name', 'Img')

            await addAssetToSocialPost(formData)
            expect(prisma.asset.create).toHaveBeenCalled()
        })

        it('should delete asset', async () => {
            await deleteSocialPostAsset('a1', 'p1')
            expect(prisma.asset.delete).toHaveBeenCalled()
        })
    })
})
