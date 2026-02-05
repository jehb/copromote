'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { randomUUID } from 'crypto'

export async function getPhotos(categoryId?: string, tagId?: string) {
    return await prisma.photo.findMany({
        where: {
            categoryId: categoryId === 'all' ? undefined : categoryId,
            tags: tagId ? { some: { id: tagId } } : undefined
        },
        include: {
            category: true,
            tags: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    })
}

export async function getPhotoCategories() {
    return await prisma.photoCategory.findMany({
        include: {
            _count: {
                select: { photos: true }
            }
        },
        orderBy: {
            name: 'asc'
        }
    })
}

export async function uploadPhoto(formData: FormData) {
    const file = formData.get('file') as File
    const name = formData.get('name') as string
    const categoryId = formData.get('categoryId') as string
    const tagNames = (formData.get('tags') as string || '')
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)

    console.log('--- SERVER ACTION: uploadPhoto ---')
    console.log('File Name:', file?.name)
    console.log('File Size:', file?.size)
    console.log('File Type:', file?.type)

    if (!file || file.size === 0) {
        throw new Error('No file uploaded.')
    }

    if (!categoryId) {
        throw new Error('Category is required.')
    }

    // Basic validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.')
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
        throw new Error('File size too large. Maximum size is 5MB.')
    }

    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const extension = file.name.split('.').pop()
    const fileName = `${randomUUID()}.${extension}`
    const filePath = join(uploadDir, fileName)
    const url = `/uploads/${fileName}`

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Handle tags: find or create
    const tagsConnect = []
    for (const tagName of tagNames) {
        let tag = await prisma.tag.findUnique({
            where: { name: tagName }
        })
        if (!tag) {
            tag = await prisma.tag.create({
                data: { name: tagName }
            })
        }
        tagsConnect.push({ id: tag.id })
    }

    await prisma.photo.create({
        data: {
            url,
            name: name || file.name,
            categoryId,
            tags: {
                connect: tagsConnect
            }
        }
    })

    revalidatePath('/gallery')
}

export async function deletePhoto(id: string) {
    const photo = await prisma.photo.findUnique({
        where: { id }
    })

    if (!photo) return

    // Delete file from disk
    const filePath = join(process.cwd(), 'public', photo.url)
    try {
        if (existsSync(filePath)) {
            await unlink(filePath)
        }
    } catch (err) {
        console.error('Failed to delete file from disk:', err)
    }

    await prisma.photo.delete({
        where: { id }
    })
    revalidatePath('/gallery')
}

export async function createPhotoCategory(name: string) {
    if (!name) throw new Error('Category name is required.')

    await prisma.photoCategory.upsert({
        where: { name },
        update: {},
        create: { name }
    })
    revalidatePath('/gallery')
}
