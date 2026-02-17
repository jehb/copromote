import { formatDateUTC, isSameDayUTC } from '@/lib/date-utils'

describe('date-utils', () => {
    describe('formatDateUTC', () => {
        it('should format UTC midnight correctly regardless of local timezone', () => {
            // Feb 17 2026 00:00:00 UTC
            const date = new Date('2026-02-17T00:00:00Z')
            expect(formatDateUTC(date, 'yyyy-MM-dd')).toBe('2026-02-17')
        })

        it('should handle string inputs', () => {
            expect(formatDateUTC('2026-02-17T00:00:00Z', 'MMM d')).toBe('Feb 17')
        })

        it('should return empty string for null/undefined', () => {
            expect(formatDateUTC(null, 'yyyy-MM-dd')).toBe('')
            expect(formatDateUTC(undefined, 'yyyy-MM-dd')).toBe('')
        })
    })

    describe('isSameDayUTC', () => {
        it('should compare dates correctly in UTC', () => {
            const date1 = new Date('2026-02-17T00:00:00Z')
            const date2 = new Date('2026-02-17T23:59:59Z')
            const date3 = new Date('2026-02-18T00:00:00Z')

            expect(isSameDayUTC(date1, date2)).toBe(true)
            expect(isSameDayUTC(date1, date3)).toBe(false)
        })

        it('should handle mix of string and Date', () => {
            expect(isSameDayUTC('2026-02-17T00:00:00Z', new Date('2026-02-17T12:00:00Z'))).toBe(true)
        })
    })
})
