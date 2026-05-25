import { deleteRole } from '@/app/actions/admin-roles'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/user-util'

jest.mock('@/lib/session', () => ({
    getSession: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
    prisma: {
        role: {
            findUnique: jest.fn(),
            delete: jest.fn(),
        },
        user: {
            count: jest.fn(),
        },
    },
}))

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

jest.mock('@/lib/user-util', () => ({
    getCurrentUser: jest.fn(),
}))

describe('admin-roles actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('deleteRole', () => {
        it('should return unauthorized if no session', async () => {
            ;(getSession as jest.Mock).mockResolvedValue(null)

            await expect(deleteRole('SOME_ROLE')).rejects.toThrow('Unauthorized')
        })

        it('should return unauthorized if user is not ADMIN', async () => {
            ;(getSession as jest.Mock).mockResolvedValue({ user: { id: '1' } })
            ;(getCurrentUser as jest.Mock).mockResolvedValue({ role: 'USER' })

            const result = await deleteRole('SOME_ROLE')

            expect(result.success).toBe(false)
            expect(result.message).toBe('Unauthorized')
        })

        it('should return error if role not found', async () => {
            ;(getSession as jest.Mock).mockResolvedValue({ user: { id: '1' } })
            ;(getCurrentUser as jest.Mock).mockResolvedValue({ role: 'ADMIN' })
            ;(prisma.role.findUnique as jest.Mock).mockResolvedValue(null)

            const result = await deleteRole('NONEXISTENT_ROLE')

            expect(result.success).toBe(false)
            expect(result.message).toBe('Role not found')
        })

        it('should not allow deleting a system role', async () => {
            ;(getSession as jest.Mock).mockResolvedValue({ user: { id: '1' } })
            ;(getCurrentUser as jest.Mock).mockResolvedValue({ role: 'ADMIN' })
            ;(prisma.role.findUnique as jest.Mock).mockResolvedValue({ name: 'SYSTEM_ROLE', isSystem: true })

            const result = await deleteRole('SYSTEM_ROLE')

            expect(result.success).toBe(false)
            expect(result.message).toBe('Cannot delete system roles')
            expect(prisma.role.delete).not.toHaveBeenCalled()
        })

        it('should not allow deleting a role that is assigned to users', async () => {
            ;(getSession as jest.Mock).mockResolvedValue({ user: { id: '1' } })
            ;(getCurrentUser as jest.Mock).mockResolvedValue({ role: 'ADMIN' })
            ;(prisma.role.findUnique as jest.Mock).mockResolvedValue({ name: 'ASSIGNED_ROLE', isSystem: false })
            ;(prisma.user.count as jest.Mock).mockResolvedValue(5)

            const result = await deleteRole('ASSIGNED_ROLE')

            expect(result.success).toBe(false)
            expect(result.message).toBe('Cannot delete role. It is currently assigned to 5 users.')
            expect(prisma.role.delete).not.toHaveBeenCalled()
        })

        it('should delete a role successfully', async () => {
            ;(getSession as jest.Mock).mockResolvedValue({ user: { id: '1' } })
            ;(getCurrentUser as jest.Mock).mockResolvedValue({ role: 'ADMIN' })
            ;(prisma.role.findUnique as jest.Mock).mockResolvedValue({ name: 'OBSOLETE_ROLE', isSystem: false })
            ;(prisma.user.count as jest.Mock).mockResolvedValue(0)
            ;(prisma.role.delete as jest.Mock).mockResolvedValue({ name: 'OBSOLETE_ROLE' })

            const result = await deleteRole('OBSOLETE_ROLE')

            expect(result.success).toBe(true)
            expect(prisma.role.delete).toHaveBeenCalledWith({ where: { name: 'OBSOLETE_ROLE' } })
            expect(revalidatePath).toHaveBeenCalledWith('/admin/permissions')
            expect(revalidatePath).toHaveBeenCalledWith('/admin/users')
        })

        it('should handle errors in deleteRole', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { })
            ;(getSession as jest.Mock).mockResolvedValue({ user: { id: '1' } })
            ;(getCurrentUser as jest.Mock).mockResolvedValue({ role: 'ADMIN' })
            ;(prisma.role.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'))

            const result = await deleteRole('SOME_ROLE')

            expect(result.success).toBe(false)
            expect(result.message).toBe('Failed to delete role')
            consoleSpy.mockRestore()
        })
    })
})
