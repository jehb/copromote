// Define variables for mocks
import {
    getSecurityLogs,
    logSecurityEvent
} from '@/app/actions/admin-logs'
import { getCalendarEvents } from '@/app/actions/calendar'
import { createAsset, deleteAsset } from '@/app/actions/assets'
import { uploadPhoto, deletePhoto, getPhotos, getPhotoCategories, createPhotoCategory } from '@/app/actions/photos'
import { getConfig, updateConfig } from '@/app/actions/settings'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import * as immichActions from '@/app/actions/immich'
import fs from 'fs'

// Mock next/cache
jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

// Settings module is explicitly tested and does not need mocking

jest.mock('@/app/actions/immich', () => ({
    initImmich: jest.fn().mockResolvedValue(true),
    uploadImmichAsset: jest.fn().mockResolvedValue({ id: 'immich-1' }),
    deleteImmichAsset: jest.fn().mockResolvedValue({}),
}))

// Mock fs fully
jest.mock('fs', () => ({
    promises: {
        writeFile: jest.fn(),
        unlink: jest.fn(),
        mkdir: jest.fn(),
    },
    existsSync: jest.fn(),
}))

// Headers mock is in jest.setup.ts
const mockHeaders = headers as unknown as jest.Mock

describe('Miscellaneous Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
            ; (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined)
            ; (fs.promises.unlink as jest.Mock).mockResolvedValue(undefined)
            ; (fs.promises.mkdir as jest.Mock).mockResolvedValue(undefined)
            ; (fs.existsSync as jest.Mock).mockReturnValue(true)
    })

    describe('Admin Logs', () => {
        it('should fetch security logs', async () => {
            const mockLogs = [{ id: '1', action: 'LOGIN', ipAddress: '127.0.0.1' }]
                ; (prisma.securityLog.findMany as jest.Mock).mockResolvedValue(mockLogs)

            const result = await getSecurityLogs()

            expect(result).toEqual(mockLogs)
            expect(prisma.securityLog.findMany).toHaveBeenCalledWith({
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { username: true, email: true } } },
                take: 100
            })
        })

        it('should log security event', async () => {
            // action, details, userId
            await logSecurityEvent('LOGIN', 'details', 'user-1')

            expect(prisma.securityLog.create).toHaveBeenCalledWith({
                data: {
                    action: 'LOGIN',
                    details: 'details',
                    userId: 'user-1',
                    ipAddress: 'Unknown IP',
                    userAgent: 'Unknown User Agent'
                }
            })
        })
    })

    describe('Calendar', () => {
        it('should fetch calendar events', async () => {
            const mockDate = new Date()
            const mockEvents = [{ id: '1', title: 'Meeting', date: mockDate, projectId: 'p1' }]
                ; (prisma.calendarEvent.findMany as jest.Mock).mockResolvedValue(mockEvents)
                // Mock other findMany to return empty array to avoid undefined errors if any
                ; (prisma.project.findMany as jest.Mock).mockResolvedValue([])
                ; (prisma.promotionPeriod.findMany as jest.Mock).mockResolvedValue([])
                ; (prisma.event.findMany as jest.Mock).mockResolvedValue([])
                ; (prisma.socialPost.findMany as jest.Mock).mockResolvedValue([])

            const result = await getCalendarEvents()

            expect(result).toContainEqual(expect.objectContaining({
                id: '1',
                title: 'Meeting',
                type: 'event',
                date: mockDate,
                projectId: 'p1'
            }))
        })
    })

    describe('Assets', () => {
        it('should create asset', async () => {
            const formData = new FormData()
            formData.append('name', 'File')
            formData.append('url', '/file.pdf')
            formData.append('type', 'PDF')
            formData.append('projectId', 'p1')

                ; (prisma.asset.create as jest.Mock).mockResolvedValue({ id: '1' })

            await createAsset(formData)

            expect(prisma.asset.create).toHaveBeenCalledWith({
                data: {
                    name: 'File',
                    type: 'PDF',
                    url: '/file.pdf',
                    projectId: 'p1'
                }
            })
            expect(revalidatePath).toHaveBeenCalledWith('/projects/p1')
        })

        it('should delete asset', async () => {
            await deleteAsset('1', 'p1')

            expect(prisma.asset.delete).toHaveBeenCalledWith({
                where: { id: '1' }
            })
            expect(revalidatePath).toHaveBeenCalledWith('/projects/p1')
        })
    })

    describe('Photos', () => {
        it('should upload photo', async () => {
            const file = new File(['test'], 'test.png', { type: 'image/png' })
            file.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(8))

            const formData = new FormData()
            formData.append('file', file)
            formData.append('categoryId', 'c1')

            await uploadPhoto(formData)

            expect(immichActions.uploadImmichAsset).toHaveBeenCalled()
        })

        it('should delete photo', async () => {
            await deletePhoto('p1')

            expect(immichActions.deleteImmichAsset).toHaveBeenCalledWith('p1')
        })
    })

    describe('Settings', () => {
        it('should get config', async () => {
            const mockConfig = { key: 'value', value: 'val' }
                ; (prisma.config.findUnique as jest.Mock).mockResolvedValue(mockConfig)

            const result = await getConfig('value')

            expect(result).toEqual(mockConfig.value)
        })

        it('should update config', async () => {
            await updateConfig('key', 'val')
            expect(prisma.config.upsert).toHaveBeenCalledWith({
                where: { key: 'key' },
                update: { value: 'val' },
                create: { key: 'key', value: 'val' }
            })
            expect(revalidatePath).toHaveBeenCalledWith('/admin/settings')
        })
    })
})
