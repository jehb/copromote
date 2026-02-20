import { fromZonedTime, formatInTimeZone } from 'date-fns-tz'

const TIMEZONE = 'America/New_York'
const DATE_FORMAT = "yyyy-MM-dd'T'HH:mm:ssXXX"

function test() {
    console.log('--- Timezone Logic Verification ---')

    // 1. Parsing Logic (Import)
    const dateStr = '2026-02-20 09:00:00'
    const parsed = fromZonedTime(dateStr, TIMEZONE)
    console.log(`Input String (NY): ${dateStr}`)
    console.log(`Parsed Date (UTC): ${parsed.toISOString()}`)

    // Expected: 2026-02-20 09:00:00 NY is UTC 14:00:00 (NY is UTC-5 in Feb)
    const expectedUTC = '2026-02-20T14:00:00.000Z'
    if (parsed.toISOString() === expectedUTC) {
        console.log('✅ Parsing correctness verified.')
    } else {
        console.log(`❌ Parsing mismatch! Expected ${expectedUTC}`)
    }

    // 2. Formatting Logic (Export)
    const utcDate = new Date('2026-02-20T14:00:00.000Z')
    const formatted = formatInTimeZone(utcDate, TIMEZONE, DATE_FORMAT)
    console.log(`Input Date (UTC): ${utcDate.toISOString()}`)
    console.log(`Formatted String (NY): ${formatted}`)

    const expectedFormatted = '2026-02-20T09:00:00-05:00'
    if (formatted === expectedFormatted) {
        console.log('✅ Formatting correctness verified.')
    } else {
        console.log(`❌ Formatting mismatch! Expected ${expectedFormatted}`)
    }
}

test()
