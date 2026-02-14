
import { hashPassword, verifyPassword } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hashed_password'),
    compare: jest.fn().mockResolvedValue(true),
}))

describe('Auth Utility', () => {
    describe('hashPassword', () => {
        it('should hash password', async () => {
            const password = 'password123'
            const hash = await hashPassword(password)
            expect(hash).toBe('hashed_password')
            expect(bcrypt.hash).toHaveBeenCalledWith(password, 10)
        })
    })

    describe('verifyPassword', () => {
        it('should verify correct password', async () => {
            const password = 'password123'
            const hash = 'hashed_password'
            const isValid = await verifyPassword(password, hash)
            expect(isValid).toBe(true)
            expect(bcrypt.compare).toHaveBeenCalledWith(password, hash)
        })

        it('should reject incorrect password', async () => {
            (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false)
            const isValid = await verifyPassword('wrong', 'hashed_password')
            expect(isValid).toBe(false)
        })
    })
})
