
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testSearch() {
    console.log('Starting search test (JS)...')

    // Direct database access to get config
    const urlConfig = await prisma.config.findUnique({ where: { key: 'WORDPRESS_URL' } })
    const usernameConfig = await prisma.config.findUnique({ where: { key: 'WORDPRESS_USERNAME' } })
    const passwordConfig = await prisma.config.findUnique({ where: { key: 'WORDPRESS_APP_PASSWORD' } })

    if (!urlConfig?.value) {
        console.error('No WordPress URL configured')
        await prisma.$disconnect()
        return
    }

    const query = 'Weaver'
    const baseUrl = urlConfig.value.replace(/\/$/, '')
    let headers = {}

    if (usernameConfig?.value && passwordConfig?.value) {
        const auth = Buffer.from(`${usernameConfig.value}:${passwordConfig.value}`).toString('base64')
        headers['Authorization'] = `Basic ${auth}`
    }

    const searchUrl = `${baseUrl}/wp-json/tribe/events/v1/events?search=${encodeURIComponent(query)}&per_page=10`
    console.log(`[Script] Searching events: ${searchUrl}`)

    try {
        const response = await fetch(searchUrl, { headers })
        console.log(`[Script] Response status: ${response.status}`)

        if (!response.ok) {
            console.error(`[Script] Request failed: ${response.status} ${response.statusText}`)
            const text = await response.text()
            console.error(`[Script] Response body: ${text}`)
            await prisma.$disconnect()
            return
        }

        const data = await response.json()
        console.log('[Script] Response data keys:', Object.keys(data))

        if (data.events) {
            console.log(`[Script] Found ${data.events.length} events`)
            data.events.forEach((e) => console.log(` - ${e.title} (${e.id})`))
        } else {
            console.log('[Script] "events" key missing in response')
            console.log(JSON.stringify(data, null, 2))
        }

    } catch (error) {
        console.error('[Script] Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

testSearch()
