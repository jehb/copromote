import { format, toZonedTime } from 'date-fns-tz'

/**
 * Formats a date using UTC as the reference timezone to avoid off-by-one errors 
 * when displaying date-only fields stored as UTC midnight.
 */
export function formatDateUTC(date: Date | string | null | undefined, formatStr: string): string {
    if (!date) return ''
    const d = typeof date === 'string' ? new Date(date) : date
    // Use 'UTC' for date-only fields to ensure consistency regardless of local timezone
    return format(toZonedTime(d, 'UTC'), formatStr, { timeZone: 'UTC' })
}

/**
 * Compares two dates based on their UTC day, month, and year.
 */
export function isSameDayUTC(date1: Date | string | null | undefined, date2: Date | string | null | undefined): boolean {
    if (!date1 || !date2) return false

    const d1 = typeof date1 === 'string' ? new Date(date1) : date1
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2

    return (
        d1.getUTCFullYear() === d2.getUTCFullYear() &&
        d1.getUTCMonth() === d2.getUTCMonth() &&
        d1.getUTCDate() === d2.getUTCDate()
    )
}
