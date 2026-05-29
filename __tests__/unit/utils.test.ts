import { cn } from '@/lib/utils'

describe('Utils', () => {
    describe('cn (className merger)', () => {
        it('should merge class names correctly', () => {
            expect(cn('foo', 'bar')).toBe('foo bar')
        })

        it('should handle conditional classes', () => {
            expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
        })

        it('should handle undefined and null', () => {
            expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
        })

        it('should merge tailwind classes with conflicts', () => {
            // tailwind-merge should keep the last conflicting class
            expect(cn('p-4', 'p-8')).toBe('p-8')
        })

        it('should handle empty input', () => {
            expect(cn()).toBe('')
        })

        it('should handle array of classes', () => {
            expect(cn(['foo', 'bar'])).toBe('foo bar')
        })
    })
})
