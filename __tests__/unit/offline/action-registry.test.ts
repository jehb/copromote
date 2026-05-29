import { objectToFormData } from '@/lib/offline/action-registry'

describe('Action Registry Utils', () => {
    describe('objectToFormData', () => {
        it('should convert simple object to FormData', () => {
            const obj = { name: 'John', age: '30' }
            const formData = objectToFormData(obj)

            expect(formData.get('name')).toBe('John')
            expect(formData.get('age')).toBe('30')
        })

        it('should handle nested objects', () => {
            const obj = {
                user: {
                    name: 'John',
                    email: 'john@example.com'
                }
            }
            const formData = objectToFormData(obj)

            expect(formData.get('user')).toBe(JSON.stringify(obj.user))
        })

        it('should handle arrays', () => {
            const obj = {
                tags: ['tag1', 'tag2', 'tag3']
            }
            const formData = objectToFormData(obj)

            expect(formData.get('tags')).toBe(JSON.stringify(obj.tags))
        })

        it('should handle null and undefined values', () => {
            const obj = {
                name: 'John',
                middle: null,
                suffix: undefined
            }
            const formData = objectToFormData(obj)

            expect(formData.get('name')).toBe('John')
            expect(formData.get('middle')).toBe('null')
            expect(formData.has('suffix')).toBe(false)
        })

        it('should handle empty object', () => {
            const obj = {}
            const formData = objectToFormData(obj)

            expect(Array.from(formData.keys()).length).toBe(0)
        })

        it('should handle boolean values', () => {
            const obj = {
                active: true,
                deleted: false
            }
            const formData = objectToFormData(obj)

            expect(formData.get('active')).toBe('true')
            expect(formData.get('deleted')).toBe('false')
        })
    })
})
