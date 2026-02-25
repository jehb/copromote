'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logActivity } from '@/app/actions/activity-logs'
import { syncPostToPostiz, deletePostFromPostiz } from './postiz'

export async function getSocialPosts(filters: {
    platform?: string,
    status?: string,
    startDate?: string,
    endDate?: string,
    promotionPeriodId?: string,
    eventId?: string
} = {}) {
    const { platform, status, startDate, endDate, promotionPeriodId, eventId } = filters

    const where: any = {}
    if (platform && platform !== 'all') where.platform = platform
    if (status && status !== 'all') where.status = status

    if (promotionPeriodId === 'none') {
        where.promotionPeriodId = null
    } else if (promotionPeriodId && promotionPeriodId !== 'all') {
        where.promotionPeriodId = promotionPeriodId
    }

    if (eventId === 'none') {
        where.eventId = null
    } else if (eventId && eventId !== 'all') {
        where.eventId = eventId
    }

    if (startDate || endDate) {
        where.scheduledDate = {}
        if (startDate) where.scheduledDate.gte = new Date(startDate)
        if (endDate) where.scheduledDate.lte = new Date(endDate)
    }

    return await prisma.socialPost.findMany({
        where,
        orderBy: { scheduledDate: 'asc' },
        include: {
            assets: true,
            promotionPeriod: true,
            reviewer: true,
            event: true
        }
    })
}

async function syncReviewerTask(reviewerId: string | null) {
    if (!reviewerId) return

    // Get all posts in review for this user
    const postsInReview = await prisma.socialPost.findMany({
        where: {
            reviewerId,
            status: 'ready-for-review'
        }
    })

    const taskTitle = "Review Social Media"

    if (postsInReview.length > 0) {
        // Construct description
        const descriptionLines = postsInReview.map(post => {
            const dateStr = post.scheduledDate ? new Date(post.scheduledDate).toLocaleDateString() : 'Unscheduled'
            return `- **${dateStr}** - [${post.platform} Review](/social/${post.id})`
        })
        const description = "Please review the following social media posts:\n\n" + descriptionLines.join('\n')

        // Upsert the task
        const existingTask = await prisma.task.findFirst({
            where: {
                assigneeId: reviewerId,
                title: taskTitle,
                status: {
                    in: ['todo', 'in-progress']
                }
            }
        })

        if (existingTask) {
            await prisma.task.update({
                where: { id: existingTask.id },
                data: {
                    description,
                    status: 'todo' // Move back to Todo if new reviews are added
                }
            })
        } else {
            await prisma.task.create({
                data: {
                    title: taskTitle,
                    description,
                    status: 'todo',
                    assigneeId: reviewerId
                }
            })
        }
    } else {
        // No posts left to review, find and mark existing task as done
        const existingTask = await prisma.task.findFirst({
            where: {
                assigneeId: reviewerId,
                title: taskTitle,
                status: {
                    in: ['todo', 'in-progress']
                }
            }
        })

        if (existingTask) {
            await prisma.task.update({
                where: { id: existingTask.id },
                data: { status: 'done' }
            })
        }
    }

    revalidatePath('/tasks')
}

export async function createSocialPost(formData: FormData) {
    const sanitizeId = (id: FormDataEntryValue | null) => {
        if (!id || typeof id !== 'string') return null;
        const cleanId = id.trim();
        if (['none', 'unlinked', 'null', 'undefined', ''].includes(cleanId)) return null;
        return cleanId;
    };

    const content = formData.get('content') as string
    const platform = formData.get('platform') as string
    const status = formData.get('status') as string || 'draft'
    const scheduledDateStr = formData.get('scheduledDate') as string
    const scheduledDate = (scheduledDateStr && scheduledDateStr.trim() !== '' && scheduledDateStr !== 'null') ? new Date(scheduledDateStr) : null

    const promotionPeriodId = sanitizeId(formData.get('promotionPeriodId'))
    const reviewerId = sanitizeId(formData.get('reviewerId'))
    const eventId = sanitizeId(formData.get('eventId'))

    const assetsDataStr = formData.get('assetsData') as string
    let assetsData: any[] = []
    if (assetsDataStr) {
        try {
            assetsData = JSON.parse(assetsDataStr)
        } catch (e) { }
    }

    const post = await prisma.socialPost.create({
        data: {
            content,
            platform,
            status,
            scheduledDate,
            promotionPeriod: promotionPeriodId ? { connect: { id: promotionPeriodId } } : undefined,
            reviewer: reviewerId ? { connect: { id: reviewerId } } : undefined,
            event: eventId ? { connect: { id: eventId } } : undefined,
            assets: assetsData.length > 0 ? {
                create: assetsData.map(photo => ({
                    name: photo.name || 'Image',
                    type: photo.type || 'image',
                    url: photo.url
                }))
            } : undefined
        },
        include: {
            assets: true
        }
    })

    await logActivity('CREATE', 'SocialPost', post.id, `Created ${platform} post`)

    let postizIdResult: string | null = null
    if (status === 'scheduled' || status === 'published' || status === 'draft') {
        postizIdResult = await syncPostToPostiz({
            platforms: [platform],
            content,
            scheduledDate,
            status,
            assets: post.assets
        })

        if (postizIdResult) {
            await prisma.socialPost.update({
                where: { id: post.id },
                data: { postizId: postizIdResult }
            })
        }
    }

    if (status === 'ready-for-review' && reviewerId && reviewerId !== 'none') {
        await syncReviewerTask(reviewerId)
    }

    revalidatePath('/social')
    redirect(`/social/${post.id}`)
}

export async function updateSocialPost(formData: FormData) {
    const id = formData.get('id') as string

    // Get existing post to check for reviewer changes
    const oldPost = await prisma.socialPost.findUnique({
        where: { id }
    })

    const sanitizeId = (val: FormDataEntryValue | null) => {
        if (!val || typeof val !== 'string') return null;
        const cleanVal = val.trim();
        if (['none', 'unlinked', 'null', 'undefined', ''].includes(cleanVal)) return null;
        return cleanVal;
    };

    const content = formData.get('content') as string
    const platform = formData.get('platform') as string
    const scheduledDateStr = formData.get('scheduledDate') as string
    const scheduledDate = (scheduledDateStr && scheduledDateStr.trim() !== '' && scheduledDateStr !== 'null') ? new Date(scheduledDateStr) : null
    const status = formData.get('status') as string
    const promotionPeriodId = sanitizeId(formData.get('promotionPeriodId'))
    const reviewerId = sanitizeId(formData.get('reviewerId'))
    const eventId = sanitizeId(formData.get('eventId'))

    const assetsDataStr = formData.get('assetsData') as string
    let assetsData: any[] = []
    if (assetsDataStr) {
        try {
            assetsData = JSON.parse(assetsDataStr)
        } catch (e) { }
    }

    // Delete old postiz post to re-create it (Postiz API does not easily support updating posts directly yet)
    if (oldPost?.postizId) {
        await deletePostFromPostiz(oldPost.postizId)
    }

    await prisma.asset.deleteMany({ where: { socialPostId: id } })

    const updatedPost = await prisma.socialPost.update({
        where: { id },
        data: {
            content,
            platform,
            scheduledDate,
            status,
            postizId: null, // temporarily null, logic updates it below
            promotionPeriodId,
            reviewerId,
            eventId,
            assets: assetsData.length > 0 ? {
                create: assetsData.map(photo => ({
                    name: photo.name || 'Image',
                    type: photo.type || 'image',
                    url: photo.url
                }))
            } : undefined
        },
        include: {
            assets: true
        }
    })

    let postizIdResult: string | null = null
    if (status === 'scheduled' || status === 'published' || status === 'draft') {
        postizIdResult = await syncPostToPostiz({
            platforms: [platform],
            content,
            scheduledDate,
            status,
            assets: updatedPost.assets
        })
    }

    if (postizIdResult) {
        await prisma.socialPost.update({
            where: { id },
            data: { postizId: postizIdResult }
        })
    }

    await logActivity('UPDATE', 'SocialPost', id, `Updated ${platform} post`)

    // Sync tasks for relevant reviewers
    if (oldPost?.reviewerId) {
        await syncReviewerTask(oldPost.reviewerId)
    }
    if (reviewerId && reviewerId !== oldPost?.reviewerId) {
        await syncReviewerTask(reviewerId)
    } else if (reviewerId && status !== oldPost?.status) {
        // Status changed but reviewer stayed the same
        await syncReviewerTask(reviewerId)
    }

    revalidatePath('/social')
    revalidatePath(`/social/${id}`)
    revalidatePath('/calendar')
    redirect(`/social/${id}`)
}

export async function deleteSocialPost(id: string) {
    const post = await prisma.socialPost.findUnique({ where: { id } })
    if (post?.postizId) {
        await deletePostFromPostiz(post.postizId)
    }

    await prisma.socialPost.delete({ where: { id } })
    await logActivity('DELETE', 'SocialPost', id, 'Deleted social post')
    revalidatePath('/social')
}

export async function getSocialPost(id: string) {
    return await prisma.socialPost.findUnique({
        where: { id },
        include: {
            assets: true,
            promotionPeriod: true,
            reviewer: true,
            event: true
        }
    })
}

export async function addAssetToSocialPost(formData: FormData) {
    const name = formData.get('name') as string
    const type = formData.get('type') as string
    const url = formData.get('url') as string
    const socialPostId = formData.get('socialPostId') as string

    await prisma.asset.create({
        data: {
            name,
            type,
            url,
            socialPostId
        }
    })

    revalidatePath(`/social/${socialPostId}`)
}

export async function deleteSocialPostAsset(id: string, socialPostId: string) {
    await prisma.asset.delete({ where: { id } })
    revalidatePath(`/social/${socialPostId}`)
}
