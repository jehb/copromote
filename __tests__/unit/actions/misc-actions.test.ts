
import {
    getSecurityLogs,
    logSecurityEvent
} from '@/app/actions/admin-logs'
import { getCalendarEvents } from '@/app/actions/calendar'
import { createAsset, deleteAsset } from '@/app/actions/assets'
import { uploadPhoto, deletePhoto, getPhotos, getPhotoCategories, createPhotoCategory } from '@/app/actions/photos'
import { getConfig, updateConfig } from '@/app/actions/settings'
import { prisma } from '@/lib/db' // or lib/prisma for admin-logs
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import * as fs from 'fs/promises'
import { existsSync } from 'fs'

// Mock dependencies
jest.mock('@/lib/db', () => ({
    prisma: {
        securityLog: {
            findMany: jest.fn(),
            create: jest.fn(),
        },
        project: { findMany: jest.fn() },
        calendarEvent: { findMany: jest.fn() },
        promotionPeriod: { findMany: jest.fn() },
        event: { findMany: jest.fn() },
        socialPost: { findMany: jest.fn() },
        asset: { create: jest.fn(), delete: jest.fn() },
        photo: { findMany: jest.fn(), create: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
        photoCategory: { findMany: jest.fn(), upsert: jest.fn() },
        tag: { findUnique: jest.fn(), create: jest.fn() },
        config: { findUnique: jest.fn(), upsert: jest.fn() }
    },
}))

// Mock @/lib/prisma for admin-logs if it uses a different import
jest.mock('@/lib/prisma', () => ({
    prisma: {
        securityLog: {
            findMany: jest.fn(),
            create: jest.fn(),
        },
    }
}))

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

jest.mock('fs/promises', () => ({
    writeFile: jest.fn(),
    unlink: jest.fn(),
    mkdir: jest.fn(),
}))

jest.mock('fs', () => ({
    existsSync: jest.fn(),
}))

// Headers mock is in jest.setup.ts, but we might need to cast it
const mockHeaders = headers as unknown as jest.Mock

describe('Miscellaneous Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('Admin Logs', () => {
        // admin-logs.ts imports prisma from '@/lib/prisma'
        const prismaLogs = require('@/lib/prisma').prisma

        it('should fetch security logs', async () => {
            const mockLogs = [{ id: '1', action: 'LOGIN' }]
            prismaLogs.securityLog.findMany.mockResolvedValue(mockLogs)
            const result = await getSecurityLogs()
            expect(result).toEqual(mockLogs)
        })

        it('should log security event', async () => {
            await logSecurityEvent('LOGIN', 'User logged in')
            expect(prismaLogs.securityLog.create).toHaveBeenCalled()
        })
    })

    describe('Calendar', () => {
        // calendar.ts imports prisma from '@/lib/db'

        it('should fetch calendar events', async () => {
            ; (prisma.project.findMany as jest.Mock).mockResolvedValue([{ id: 'p1', name: 'P1', startDate: new Date() }])
                ; (prisma.calendarEvent.findMany as jest.Mock).mockResolvedValue([])
                ; (prisma.promotionPeriod.findMany as jest.Mock).mockResolvedValue([])
                ; (prisma.event.findMany as jest.Mock).mockResolvedValue([])
                ; (prisma.socialPost.findMany as jest.Mock).mockResolvedValue([])

            const events = await getCalendarEvents()

            expect(events).toHaveLength(1)
            expect(events[0].title).toContain('P1')
        })
    })

    describe('Assets', () => {
        it('should create asset', async () => {
            const formData = new FormData()
            formData.append('name', 'A1')
            formData.append('projectId', 'p1')
            await createAsset(formData)
            expect(prisma.asset.create).toHaveBeenCalled()
        })

        it('should delete asset', async () => {
            await deleteAsset('a1', 'p1')
            expect(prisma.asset.delete).toHaveBeenCalledWith({ where: { id: 'a1' } })
        })
    })

    describe('Photos', () => {
        it('should upload photo', async () => {
            const file = new File(['content'], 'test.png', { type: 'image/png' })
            // Mock arrayBuffer since jsdom might not implementation it fully or correctly for all versions
            Object.defineProperty(file, 'arrayBuffer', {
                value: jest.fn().mockResolvedValue(new ArrayBuffer(8))
            })

            const formData = new FormData()
            formData.append('file', file)
            formData.append('categoryId', 'cat1')

                ; (fs.writeFile as jest.Mock).mockResolvedValue(undefined)
                ; (prisma.photo.create as jest.Mock).mockResolvedValue({ id: 'photo1' })

            await uploadPhoto(formData)

            expect(fs.writeFile).toHaveBeenCalled()
            expect(prisma.photo.create).toHaveBeenCalled()
        })

        it('should delete photo', async () => {
            ; (prisma.photo.findUnique as jest.Mock).mockResolvedValue({ id: 'p1', url: '/uploads/test.png' })
                ; (fs.unlink as jest.Mock).mockResolvedValue(undefined)
                ; (existsSync as jest.Mock).mockReturnValue(true)

            await deletePhoto('p1')

            expect(fs.unlink).toHaveBeenCalled()
            expect(prisma.photo.delete).toHaveBeenCalled()
        })
    })

    describe('Settings', () => {
        it('should get config', async () => {
            ; (prisma.config.findUnique as jest.Mock).mockResolvedValue({ key: 'k', value: 'v' })
            const val = await getConfig('k')
            expect(val).toBe('v')
        })

        it('should update config', async () => {
            await updateConfig('k', 'v')
            expect(prisma.config.upsert).toHaveBeenCalled()
        })
    })
})
