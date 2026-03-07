
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugAuth() {
    console.log('--- Debugging WordPress Auth ---')

    try {
        const urlConfig = await prisma.config.findUnique({ where: { key: 'WORDPRESS_URL' } })
        const usernameConfig = await prisma.config.findUnique({ where: { key: 'WORDPRESS_USERNAME' } })
        const passwordConfig = await prisma.config.findUnique({ where: { key: 'WORDPRESS_APP_PASSWORD' } })

        console.log('URL Config Found:', !!urlConfig)
        console.log('Username Config Found:', !!usernameConfig)
        console.log('Password Config Found:', !!passwordConfig)

        if (!urlConfig?.value) {
            console.error('Missing WordPress URL')
            return
        }

        const baseUrl = urlConfig.value.replace(/\/$/, '')
        const query = 'Weaver'
        const endpoint = `${baseUrl}/wp-json/tribe/events/v1/events?search=${encodeURIComponent(query)}&per_page=10`

        const headers: Record<string, string> = {}
        if (usernameConfig?.value && passwordConfig?.value) {
            const auth = Buffer.from(`${usernameConfig.value}:${passwordConfig.value}`).toString('base64')
            headers['Authorization'] = `Basic ${auth}`
            console.log('Auth Header set: YES')
        } else {
            console.log('Auth Header set: NO')
        }

        console.log(`Fetching: ${endpoint}`)
        const response = await fetch(endpoint, { headers })

        console.log(`Response Status: ${response.status}`)
        console.log(`Response headers:`, [...response.headers.entries()])

        const text = await response.text()
        console.log('Response Body Preview:', text.substring(0, 500))

        if (response.ok) {
            const data = JSON.parse(text)
            console.log('Total Events:', data.total)
            console.log('Events Array Length:', data.events?.length)
            if (data.events?.length > 0) {
                console.log('First Event Title:', data.events[0].title)
            }
        }

    } catch (e) {
        console.error('Error during debug:', e)
    } finally {
        await prisma.$disconnect()
    }
}

debugAuth()
