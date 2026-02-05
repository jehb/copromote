'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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
            tags: true,
            assets: true,
            photos: {
                include: {
                    category: true,
                    tags: true
                }
            },
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
    const content = formData.get('content') as string
    const platform = formData.get('platform') as string
    const status = formData.get('status') as string || 'draft'
    const scheduledDateStr = formData.get('scheduledDate') as string
    const scheduledDate = scheduledDateStr ? new Date(scheduledDateStr) : null
    const promotionPeriodId = formData.get('promotionPeriodId') as string
    const reviewerId = formData.get('reviewerId') as string
    const eventId = formData.get('eventId') as string
    const tagNames = (formData.get('tags') as string || '').split(',').map(t => t.trim()).filter(Boolean)
    const photoIds = (formData.get('photoIds') as string || '').split(',').map(t => t.trim()).filter(Boolean)

    // Handle tags: create if not exists
    const tagsConnect = []
    for (const tagName of tagNames) {
        let tag = await prisma.tag.findUnique({ where: { name: tagName } })
        if (!tag) {
            tag = await prisma.tag.create({ data: { name: tagName } })
        }
        tagsConnect.push({ id: tag.id })
    }

    const post = await prisma.socialPost.create({
        data: {
            content,
            platform,
            status,
            scheduledDate,
            tags: {
                connect: tagsConnect
            },
            photos: {
                connect: photoIds.map(id => ({ id }))
            },
            promotionPeriod: (promotionPeriodId && promotionPeriodId !== 'unlinked') ? { connect: { id: promotionPeriodId } } : undefined,
            reviewer: (reviewerId && reviewerId !== 'none') ? { connect: { id: reviewerId } } : undefined,
            event: (eventId && eventId !== 'none') ? { connect: { id: eventId } } : undefined
        }
    })

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

    const content = formData.get('content') as string
    const platform = formData.get('platform') as string
    const scheduledDateStr = formData.get('scheduledDate') as string
    const scheduledDate = scheduledDateStr ? new Date(scheduledDateStr) : null
    const status = formData.get('status') as string
    const promotionPeriodId = formData.get('promotionPeriodId') as string
    const reviewerIdInput = formData.get('reviewerId') as string
    const reviewerId = (reviewerIdInput && reviewerIdInput !== 'none') ? reviewerIdInput : null
    const eventIdInput = formData.get('eventId') as string
    const eventId = (eventIdInput && eventIdInput !== 'none') ? eventIdInput : null
    const tagNames = (formData.get('tags') as string || '').split(',').map(t => t.trim()).filter(Boolean)
    const photoIds = (formData.get('photoIds') as string || '').split(',').map(t => t.trim()).filter(Boolean)

    // Handle tags
    const tagsConnect = []
    for (const tagName of tagNames) {
        let tag = await prisma.tag.findUnique({ where: { name: tagName } })
        if (!tag) {
            tag = await prisma.tag.create({ data: { name: tagName } })
        }
        tagsConnect.push({ id: tag.id })
    }

    await prisma.socialPost.update({
        where: { id },
        data: {
            content,
            platform,
            scheduledDate,
            status,
            tags: {
                set: [], // Clear existing relations
                connect: tagsConnect
            },
            photos: {
                set: [], // Clear existing relations
                connect: photoIds.map(id => ({ id }))
            },
            promotionPeriodId: (promotionPeriodId && promotionPeriodId !== 'unlinked') ? promotionPeriodId : null,
            reviewerId,
            eventId
        }
    })

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
    await prisma.socialPost.delete({ where: { id } })
    revalidatePath('/social')
}

export async function getSocialPost(id: string) {
    return await prisma.socialPost.findUnique({
        where: { id },
        include: {
            tags: true,
            assets: true,
            photos: {
                include: {
                    category: true,
                    tags: true
                }
            },
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
