import {
    getSocialPosts,
    createSocialPost,
    updateSocialPost,
    deleteSocialPost,
    getSocialPost,
    addAssetToSocialPost,
    deleteSocialPostAsset
} from '@/app/actions/social'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logActivity } from '@/app/actions/activity-logs'

jest.mock('@/lib/db', () => ({
    prisma: {
        socialPost: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        task: {
            findFirst: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
        },
        asset: {
            create: jest.fn(),
            delete: jest.fn(),
            deleteMany: jest.fn(),
        }
    },
}))

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

jest.mock('next/navigation', () => ({
    redirect: jest.fn(),
}))

jest.mock('@/app/actions/activity-logs', () => ({
    logActivity: jest.fn(),
}))

jest.mock('@/app/actions/postiz', () => ({
    syncPostToPostiz: jest.fn(),
    deletePostFromPostiz: jest.fn(),
}))

describe('Social Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('getSocialPosts', () => {
        it('should fetch all social posts with default empty filters', async () => {
            const mockPosts = [{ id: '1', platform: 'twitter' }]
                ; (prisma.socialPost.findMany as jest.Mock).mockResolvedValue(mockPosts)

            const result = await getSocialPosts()

            expect(result).toEqual(mockPosts)
            expect(prisma.socialPost.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: { deletedAt: null },
                orderBy: { scheduledDate: 'asc' },
            }))
        })

        it('should apply specific filters correctly', async () => {
            await getSocialPosts({
                platform: 'facebook',
                status: 'draft',
                promotionPeriodId: 'promo-1',
                eventId: 'event-1',
                startDate: '2025-01-01',
                endDate: '2025-01-31'
            })

            expect(prisma.socialPost.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: {
                    deletedAt: null,
                    platform: 'facebook',
                    status: 'draft',
                    promotionPeriodId: 'promo-1',
                    eventId: 'event-1',
                    scheduledDate: {
                        gte: new Date('2025-01-01'),
                        lte: new Date('2025-01-31')
                    }
                }
            }))
        })

        it('should handle "all" and "none" filter values correctly', async () => {
            await getSocialPosts({
                platform: 'all',
                status: 'all',
                promotionPeriodId: 'none',
                eventId: 'none'
            })

            expect(prisma.socialPost.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: {
                    deletedAt: null,
                    promotionPeriodId: null,
                    eventId: null
                }
            }))
        })
    })

    describe('getSocialPost', () => {
        it('should fetch a single social post by id', async () => {
            const mockPost = { id: 'post-1', platform: 'twitter' }
                ; (prisma.socialPost.findFirst as jest.Mock).mockResolvedValue(mockPost)

            const result = await getSocialPost('post-1')

            expect(result).toEqual(mockPost)
            expect(prisma.socialPost.findFirst).toHaveBeenCalledWith({
                where: { id: 'post-1', deletedAt: null },
                include: expect.any(Object)
            })
        })
    })

    describe('syncReviewerTask (via create/update)', () => {
        it('should create a new task if reviewer has posts to review but no existing task', async () => {
            const formData = new FormData()
            formData.append('content', 'Test post')
            formData.append('platform', 'twitter')
            formData.append('status', 'ready-for-review')
            formData.append('reviewerId', 'reviewer-1')

                ; (prisma.socialPost.create as jest.Mock).mockResolvedValue({ id: 'post-1', platform: 'twitter' })
                ; (prisma.socialPost.findMany as jest.Mock).mockResolvedValue([{ id: 'post-1', scheduledDate: new Date('2025-01-01'), platform: 'twitter' }])
                ; (prisma.task.findFirst as jest.Mock).mockResolvedValue(null)
                ; (redirect as unknown as jest.Mock).mockImplementation(() => { throw new Error('NEXT_REDIRECT') })

            await expect(createSocialPost(formData)).rejects.toThrow('NEXT_REDIRECT')

            expect(prisma.task.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    assigneeId: 'reviewer-1',
                    status: 'todo'
                })
            }))
        })

        it('should update existing task if reviewer has posts to review', async () => {
            const formData = new FormData()
            formData.append('content', 'Test post')
            formData.append('platform', 'twitter')
            formData.append('status', 'ready-for-review')
            formData.append('reviewerId', 'reviewer-1')

                ; (prisma.socialPost.create as jest.Mock).mockResolvedValue({ id: 'post-1', platform: 'twitter' })
                ; (prisma.socialPost.findMany as jest.Mock).mockResolvedValue([{ id: 'post-1', scheduledDate: null, platform: 'twitter' }])
                ; (prisma.task.findFirst as jest.Mock).mockResolvedValue({ id: 'task-1' })
                ; (redirect as unknown as jest.Mock).mockImplementation(() => { throw new Error('NEXT_REDIRECT') })

            await expect(createSocialPost(formData)).rejects.toThrow('NEXT_REDIRECT')

            expect(prisma.task.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'task-1' },
                data: expect.objectContaining({ status: 'todo' })
            }))
        })

        it('should mark existing task as done if reviewer has no posts to review', async () => {
            // Need to trigger syncReviewerTask with 0 posts.
            // When updating a post to 'published', the reviewer might have 0 posts left.
            const formData = new FormData()
            formData.append('id', 'post-1')
            formData.append('content', 'Test post')
            formData.append('platform', 'twitter')
            formData.append('status', 'published')
            formData.append('reviewerId', 'reviewer-1')

                ; (prisma.socialPost.findUnique as jest.Mock).mockResolvedValue({ id: 'post-1', reviewerId: 'reviewer-1', status: 'ready-for-review' })
                ; (prisma.socialPost.update as jest.Mock).mockResolvedValue({ id: 'post-1' })
                ; (prisma.socialPost.findMany as jest.Mock).mockResolvedValue([]) // No more posts to review
                ; (prisma.task.findFirst as jest.Mock).mockResolvedValue({ id: 'task-1' })
                ; (redirect as unknown as jest.Mock).mockImplementation(() => { throw new Error('NEXT_REDIRECT') })

            await expect(updateSocialPost(formData)).rejects.toThrow('NEXT_REDIRECT')

            expect(prisma.task.update).toHaveBeenCalledWith({
                where: { id: 'task-1' },
                data: { status: 'done' }
            })
        })
    })

    describe('createSocialPost', () => {
        it('should create a social post with tags, photos, and relations', async () => {
            const formData = new FormData()
            formData.append('content', 'Test post')
            formData.append('platform', 'twitter')
            formData.append('scheduledDate', '2025-01-01')
            formData.append('promotionPeriodId', 'promo-1')
            formData.append('eventId', 'event-1')
                ; (prisma.socialPost.create as jest.Mock).mockResolvedValue({ id: 'post-1' })
                ; (redirect as unknown as jest.Mock).mockImplementation(() => { throw new Error('NEXT_REDIRECT') })

            await expect(createSocialPost(formData)).rejects.toThrow('NEXT_REDIRECT')

            expect(prisma.socialPost.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    content: 'Test post',
                    platform: 'twitter',
                    status: 'draft',
                    scheduledDate: new Date('2025-01-01'),
                    promotionPeriod: { connect: { id: 'promo-1' } },
                    event: { connect: { id: 'event-1' } },
                    assets: undefined
                }),
                include: { assets: true }
            })
            expect(logActivity).toHaveBeenCalledWith('CREATE', 'SocialPost', 'post-1', 'Created twitter post')
            expect(redirect).toHaveBeenCalledWith('/social/post-1')
        })

        it('should handle unlinked promotionPeriodId and none eventId/reviewerId', async () => {
            const formData = new FormData()
            formData.append('content', 'Test')
            formData.append('platform', 'facebook')
            formData.append('promotionPeriodId', 'unlinked')
            formData.append('eventId', 'none')
            formData.append('reviewerId', 'none')

                ; (prisma.socialPost.create as jest.Mock).mockResolvedValue({ id: 'post-1' })
                ; (redirect as unknown as jest.Mock).mockImplementation(() => { throw new Error('NEXT_REDIRECT') })

            await expect(createSocialPost(formData)).rejects.toThrow('NEXT_REDIRECT')

            expect(prisma.socialPost.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    promotionPeriod: undefined,
                    event: undefined,
                    reviewer: undefined
                })
            }))
        })
    })

    describe('updateSocialPost', () => {
        it('should update a social post and handle reviewer sync when reviewer changes', async () => {
            const formData = new FormData()
            formData.append('id', 'post-1')
            formData.append('content', 'Updated content')
            formData.append('platform', 'twitter')
            formData.append('status', 'draft')
            formData.append('reviewerId', 'reviewer-2')

            const oldPost = { id: 'post-1', reviewerId: 'reviewer-1', status: 'ready-for-review' }
                ; (prisma.socialPost.findUnique as jest.Mock).mockResolvedValue(oldPost)
                ; (prisma.socialPost.update as jest.Mock).mockResolvedValue({ id: 'post-1' })
                ; (redirect as unknown as jest.Mock).mockImplementation(() => { throw new Error('NEXT_REDIRECT') })

            await expect(updateSocialPost(formData)).rejects.toThrow('NEXT_REDIRECT')

            expect(prisma.socialPost.update).toHaveBeenCalledWith({
                where: { id: 'post-1' },
                data: expect.objectContaining({
                    content: 'Updated content',
                    platform: 'twitter',
                    status: 'draft',
                    reviewerId: 'reviewer-2',
                    assets: undefined
                }),
                include: { assets: true }
            })
            expect(logActivity).toHaveBeenCalledWith('UPDATE', 'SocialPost', 'post-1', 'Updated twitter post')
            expect(revalidatePath).toHaveBeenCalledWith('/social')
            expect(revalidatePath).toHaveBeenCalledWith('/calendar')
            expect(redirect).toHaveBeenCalledWith('/social/post-1')
            // syncReviewerTask called twice: for old reviewer and new reviewer
            expect(prisma.socialPost.findMany).toHaveBeenCalledTimes(2)
        })

        it('should update without reviewer task sync if reviewer and status are unchanged', async () => {
            const formData = new FormData()
            formData.append('id', 'post-1')
            formData.append('content', 'Updated')
            formData.append('status', 'draft')

                ; (prisma.socialPost.findUnique as jest.Mock).mockResolvedValue({ id: 'post-1', status: 'draft', reviewerId: null })
                ; (prisma.socialPost.update as jest.Mock).mockResolvedValue({ id: 'post-1' })
                ; (redirect as unknown as jest.Mock).mockImplementation(() => { throw new Error('NEXT_REDIRECT') })

            await expect(updateSocialPost(formData)).rejects.toThrow('NEXT_REDIRECT')

            expect(prisma.socialPost.findMany).not.toHaveBeenCalled() // syncReviewerTask not called
        })

        it('should set promotionPeriodId and eventId to null if "unlinked" or "none"', async () => {
            const formData = new FormData()
            formData.append('id', 'post-1')
            formData.append('content', 'Updated')
            formData.append('promotionPeriodId', 'unlinked')
            formData.append('eventId', 'none')

                ; (prisma.socialPost.findUnique as jest.Mock).mockResolvedValue({ id: 'post-1' })
                ; (prisma.socialPost.update as jest.Mock).mockResolvedValue({ id: 'post-1' })
                ; (redirect as unknown as jest.Mock).mockImplementation(() => { throw new Error('NEXT_REDIRECT') })

            await expect(updateSocialPost(formData)).rejects.toThrow('NEXT_REDIRECT')

            expect(prisma.socialPost.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    promotionPeriodId: null,
                    eventId: null
                })
            }))
        })
    })

    describe('deleteSocialPost', () => {
        it('should delete a social post', async () => {
            ; (prisma.socialPost.findFirst as jest.Mock).mockResolvedValue({ id: 'post-1' })
            ; (prisma.socialPost.update as jest.Mock).mockResolvedValue({ id: 'post-1' })

            await deleteSocialPost('post-1')

            expect(prisma.socialPost.update).toHaveBeenCalledWith({
                where: { id: 'post-1' },
                data: expect.objectContaining({
                    deletedAt: expect.any(Date),
                })
            })
            expect(logActivity).toHaveBeenCalledWith('DELETE', 'SocialPost', 'post-1', 'Soft deleted social post')
            expect(revalidatePath).toHaveBeenCalledWith('/social')
        })
    })

    describe('addAssetToSocialPost', () => {
        it('should add an asset', async () => {
            const formData = new FormData()
            formData.append('name', 'Asset 1')
            formData.append('type', 'image')
            formData.append('url', 'http://url.com')
            formData.append('socialPostId', 'post-1')

                ; (prisma.asset.create as jest.Mock).mockResolvedValue({ id: 'asset-1' })

            await addAssetToSocialPost(formData)

            expect(prisma.asset.create).toHaveBeenCalledWith({
                data: {
                    name: 'Asset 1',
                    type: 'image',
                    url: 'http://url.com',
                    socialPostId: 'post-1'
                }
            })
            expect(revalidatePath).toHaveBeenCalledWith('/social/post-1')
        })
    })

    describe('deleteSocialPostAsset', () => {
        it('should delete an asset', async () => {
            ; (prisma.asset.delete as jest.Mock).mockResolvedValue({ id: 'asset-1' })

            await deleteSocialPostAsset('asset-1', 'post-1')

            expect(prisma.asset.delete).toHaveBeenCalledWith({ where: { id: 'asset-1' } })
            expect(revalidatePath).toHaveBeenCalledWith('/social/post-1')
        })
    })
})
