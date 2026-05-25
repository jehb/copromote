import { getRoles, createRole, deleteRole } from '@/app/actions/admin-roles'
import { getSession } from '@/lib/session'
import { getCurrentUser } from '@/lib/user-util'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

jest.mock('@/lib/session', () => ({
    getSession: jest.fn(),
}))

jest.mock('@/lib/user-util', () => ({
    getCurrentUser: jest.fn(),
}))

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

describe('admin-roles actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        // Initialize prisma models if missing
        if (!prisma.role) {
            ;(prisma as any).role = {}
        }
        if (!prisma.user) {
            ;(prisma as any).user = {}
        }
    })

    describe('getRoles', () => {
        it('throws Unauthorized if no session', async () => {
            ;(getSession as jest.Mock).mockResolvedValue(null)

            await expect(getRoles()).rejects.toThrow("Unauthorized")
        })

        it('returns roles sorted by createdAt if session exists', async () => {
            ;(getSession as jest.Mock).mockResolvedValue({ id: 'mock-session-id' })

            const mockRoles = [
                { id: '1', name: 'ADMIN', createdAt: new Date() },
                { id: '2', name: 'USER', createdAt: new Date() },
            ]
            ;(prisma.role as any).findMany = jest.fn().mockResolvedValue(mockRoles)

            const result = await getRoles()

            expect(result).toEqual(mockRoles)
            expect((prisma.role as any).findMany).toHaveBeenCalledWith({
                orderBy: {
                    createdAt: 'asc'
                }
            })
        })
    })

    describe('createRole', () => {
        it('throws Unauthorized if no session', async () => {
            ;(getSession as jest.Mock).mockResolvedValue(null)
            const formData = new FormData()

            await expect(createRole(formData)).rejects.toThrow("Unauthorized")
        })

        it('returns Unauthorized if user is not ADMIN', async () => {
            ;(getSession as jest.Mock).mockResolvedValue({ id: 'mock-session-id' })
            ;(getCurrentUser as jest.Mock).mockResolvedValue({ role: 'USER' })
            const formData = new FormData()

            const result = await createRole(formData)

            expect(result).toEqual({ success: false, message: 'Unauthorized' })
        })

        it('returns error if role name is missing', async () => {
            ;(getSession as jest.Mock).mockResolvedValue({ id: 'mock-session-id' })
            ;(getCurrentUser as jest.Mock).mockResolvedValue({ role: 'ADMIN' })
            const formData = new FormData()
            formData.append('description', 'test description')

            const result = await createRole(formData)

            expect(result).toEqual({ success: false, message: 'Role name is required' })
        })

        it('returns error if role already exists', async () => {
            ;(getSession as jest.Mock).mockResolvedValue({ id: 'mock-session-id' })
            ;(getCurrentUser as jest.Mock).mockResolvedValue({ role: 'ADMIN' })
            const formData = new FormData()
            formData.append('name', 'NEW_ROLE')

            ;(prisma.role as any).findUnique = jest.fn().mockResolvedValue({ name: 'NEW_ROLE' })

            const result = await createRole(formData)

            expect(result).toEqual({ success: false, message: 'A role with this name already exists' })
            expect((prisma.role as any).findUnique).toHaveBeenCalledWith({ where: { name: 'NEW_ROLE' } })
        })

        it('creates role successfully and revalidates paths', async () => {
            ;(getSession as jest.Mock).mockResolvedValue({ id: 'mock-session-id' })
            ;(getCurrentUser as jest.Mock).mockResolvedValue({ role: 'ADMIN' })
            const formData = new FormData()
            formData.append('name', '  new_role  ')
            formData.append('description', 'Test Description')

            ;(prisma.role as any).findUnique = jest.fn().mockResolvedValue(null)
            ;(prisma.role as any).create = jest.fn().mockResolvedValue({ name: 'NEW_ROLE' })

            const result = await createRole(formData)

            expect(result).toEqual({ success: true })
            expect((prisma.role as any).create).toHaveBeenCalledWith({
                data: {
                    name: 'NEW_ROLE',
                    description: 'Test Description',
                    isSystem: false
                }
            })
            expect(revalidatePath).toHaveBeenCalledWith('/admin/permissions')
            expect(revalidatePath).toHaveBeenCalledWith('/admin/users')
        })

        it('returns error on database failure', async () => {
            ;(getSession as jest.Mock).mockResolvedValue({ id: 'mock-session-id' })
            ;(getCurrentUser as jest.Mock).mockResolvedValue({ role: 'ADMIN' })
            const formData = new FormData()
            formData.append('name', 'TEST_ROLE')

            ;(prisma.role as any).findUnique = jest.fn().mockRejectedValue(new Error('DB Error'))

            // Suppress console.error in tests
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

            const result = await createRole(formData)

            expect(result).toEqual({ success: false, message: 'Failed to create role' })

            consoleSpy.mockRestore()
        })
    })

    describe('deleteRole', () => {
        it('throws Unauthorized if no session', async () => {
            ;(getSession as jest.Mock).mockResolvedValue(null)

            await expect(deleteRole('ROLE_NAME')).rejects.toThrow("Unauthorized")
        })

        it('returns Unauthorized if user is not ADMIN', async () => {
            ;(getSession as jest.Mock).mockResolvedValue({ id: 'mock-session-id' })
            ;(getCurrentUser as jest.Mock).mockResolvedValue({ role: 'USER' })

            const result = await deleteRole('ROLE_NAME')

            expect(result).toEqual({ success: false, message: 'Unauthorized' })
        })

        it('returns error if role not found', async () => {
            ;(getSession as jest.Mock).mockResolvedValue({ id: 'mock-session-id' })
            ;(getCurrentUser as jest.Mock).mockResolvedValue({ role: 'ADMIN' })

            ;(prisma.role as any).findUnique = jest.fn().mockResolvedValue(null)

            const result = await deleteRole('UNKNOWN_ROLE')

            expect(result).toEqual({ success: false, message: 'Role not found' })
        })

        it('returns error if role is a system role', async () => {
            ;(getSession as jest.Mock).mockResolvedValue({ id: 'mock-session-id' })
            ;(getCurrentUser as jest.Mock).mockResolvedValue({ role: 'ADMIN' })

            ;(prisma.role as any).findUnique = jest.fn().mockResolvedValue({ name: 'ADMIN', isSystem: true })

            const result = await deleteRole('ADMIN')

            expect(result).toEqual({ success: false, message: 'Cannot delete system roles' })
        })

        it('returns error if role is assigned to users', async () => {
            ;(getSession as jest.Mock).mockResolvedValue({ id: 'mock-session-id' })
            ;(getCurrentUser as jest.Mock).mockResolvedValue({ role: 'ADMIN' })

            ;(prisma.role as any).findUnique = jest.fn().mockResolvedValue({ name: 'MANAGER', isSystem: false })
            ;(prisma.user as any).count = jest.fn().mockResolvedValue(5)

            const result = await deleteRole('MANAGER')

            expect(result).toEqual({ success: false, message: 'Cannot delete role. It is currently assigned to 5 users.' })
        })

        it('deletes role successfully and revalidates paths', async () => {
            ;(getSession as jest.Mock).mockResolvedValue({ id: 'mock-session-id' })
            ;(getCurrentUser as jest.Mock).mockResolvedValue({ role: 'ADMIN' })

            ;(prisma.role as any).findUnique = jest.fn().mockResolvedValue({ name: 'MANAGER', isSystem: false })
            ;(prisma.user as any).count = jest.fn().mockResolvedValue(0)
            ;(prisma.role as any).delete = jest.fn().mockResolvedValue({ name: 'MANAGER' })

            const result = await deleteRole('MANAGER')

            expect(result).toEqual({ success: true })
            expect((prisma.role as any).delete).toHaveBeenCalledWith({ where: { name: 'MANAGER' } })
            expect(revalidatePath).toHaveBeenCalledWith('/admin/permissions')
            expect(revalidatePath).toHaveBeenCalledWith('/admin/users')
        })

        it('returns error on database failure', async () => {
            ;(getSession as jest.Mock).mockResolvedValue({ id: 'mock-session-id' })
            ;(getCurrentUser as jest.Mock).mockResolvedValue({ role: 'ADMIN' })

            ;(prisma.role as any).findUnique = jest.fn().mockRejectedValue(new Error('DB Error'))

            // Suppress console.error in tests
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

            const result = await deleteRole('TEST_ROLE')

            expect(result).toEqual({ success: false, message: 'Failed to delete role' })

            consoleSpy.mockRestore()
        })
    })
})
