
import { getUsers, createUser, updateUser, deleteUser } from '@/app/actions/admin-users'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    },
}))

jest.mock('@/lib/auth', () => ({
    hashPassword: jest.fn(),
}))

jest.mock('@/app/actions/admin-logs', () => ({
    logSecurityEvent: jest.fn(),
}))

jest.mock('@/app/actions/activity-logs', () => ({
    logActivity: jest.fn(),
}))

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

describe('Admin Users Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('getUsers', () => {
        it('should fetch users', async () => {
            const mockUsers = [{ id: '1', username: 'test' }]
                ; (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers)

            const users = await getUsers()
            expect(users).toEqual(mockUsers)
        })

        it('should return empty array on error', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { })
                ; (prisma.user.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'))

            const users = await getUsers()
            expect(users).toEqual([])
            consoleSpy.mockRestore()
        })
    })

    describe('createUser', () => {
        it('should create a user successfully', async () => {
            const formData = new FormData()
            formData.append('name', 'Test User')
            formData.append('username', 'testuser')
            formData.append('email', 'test@example.com')
            formData.append('role', 'USER')

                ; (prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
                ; (hashPassword as jest.Mock).mockResolvedValue('hashed_pwd')
                ; (prisma.user.create as jest.Mock).mockResolvedValue({ id: '1', username: 'testuser' })

            const result = await createUser(formData)

            expect(result.success).toBe(true)
            expect(prisma.user.create).toHaveBeenCalled()
            expect(revalidatePath).toHaveBeenCalledWith('/admin/users')
        })

        it('should update user password if provided', async () => {
            const formData = new FormData()
            formData.append('id', '1')
            formData.append('name', 'Test User')
            formData.append('username', 'testuser')
            formData.append('email', 'test@example.com')
            formData.append('role', 'USER')
            formData.append('password', 'newpassword')

                ; (prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
                ; (hashPassword as jest.Mock).mockResolvedValue('hashed_new_password')
                ; (prisma.user.update as jest.Mock).mockResolvedValue({ id: '1' })

            const result = await updateUser(formData)

            expect(result.success).toBe(true)
            expect(hashPassword).toHaveBeenCalledWith('newpassword')
            expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    password: 'hashed_new_password'
                })
            }))
        })

        it('should NOT update password if not provided', async () => {
            const formData = new FormData()
            formData.append('id', '1')
            formData.append('name', 'Test User')
            formData.append('username', 'testuser')
            formData.append('email', 'test@example.com')
            formData.append('role', 'USER')
                // No password appended

                ; (prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
                ; (prisma.user.update as jest.Mock).mockResolvedValue({ id: '1' })

            const result = await updateUser(formData)

            expect(result.success).toBe(true)
            expect(hashPassword).not.toHaveBeenCalled()
            const updateCall = (prisma.user.update as jest.Mock).mock.calls[0][0]
            expect(updateCall.data).not.toHaveProperty('password')
        })

        it('should fail if username exists', async () => {
            const formData = new FormData()
            formData.append('name', 'Test User')
            formData.append('username', 'testuser')
            formData.append('email', 'test@example.com')

                ; (prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: '1' })

            const result = await createUser(formData)

            expect(result.success).toBe(false)
            expect(result.message).toContain('exists')
        })

        it('should fail validation', async () => {
            const formData = new FormData()
            // Missing required fields

            const result = await createUser(formData)
            expect(result.success).toBe(false)
        })
    })

    describe('deleteUser', () => {
        it('should delete a user', async () => {
            ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1', username: 'testuser' })
                ; (prisma.user.delete as jest.Mock).mockResolvedValue({ id: '1' })

            const result = await deleteUser('1')

            expect(result.success).toBe(true)
            expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: '1' } })
        })

        it('should fail to delete admin', async () => {
            ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1', username: 'admin' })

            const result = await deleteUser('1')

            expect(result.success).toBe(false)
            expect(result.message).toContain('Cannot delete')
            expect(prisma.user.delete).not.toHaveBeenCalled()
        })
    })
})
