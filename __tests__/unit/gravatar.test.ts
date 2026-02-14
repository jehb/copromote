
import { getGravatarUrl } from '@/lib/gravatar'
import md5 from 'crypto-js/md5'

describe('Gravatar Utility', () => {
    it('should return empty string for empty email', () => {
        expect(getGravatarUrl('')).toBe('')
        // @ts-ignore
        expect(getGravatarUrl(null)).toBe('')
        // @ts-ignore
        expect(getGravatarUrl(undefined)).toBe('')
    })

    it('should generate correct gravatar url for valid email', () => {
        const email = 'test@example.com'
        const hash = md5(email).toString()
        const url = getGravatarUrl(email)

        expect(url).toBe(`https://www.gravatar.com/avatar/${hash}?s=200&d=mp`)
    })

    it('should trim and lowercase email before hashing', () => {
        const email = '  Test@Example.COM  '
        const cleanEmail = 'test@example.com'
        const hash = md5(cleanEmail).toString()
        const url = getGravatarUrl(email)

        expect(url).toBe(`https://www.gravatar.com/avatar/${hash}?s=200&d=mp`)
    })

    it('should support custom size', () => {
        const email = 'test@example.com'
        const hash = md5(email).toString()
        const url = getGravatarUrl(email, 40)

        expect(url).toBe(`https://www.gravatar.com/avatar/${hash}?s=40&d=mp`)
    })
})
