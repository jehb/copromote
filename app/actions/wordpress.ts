'use server'

import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export async function getWordPressConfig() {
    const session = await verifySession()
    if (!session) throw new Error('Unauthorized')

    const url = await prisma.config.findUnique({ where: { key: 'WORDPRESS_URL' } })
    const username = await prisma.config.findUnique({ where: { key: 'WORDPRESS_USERNAME' } })
    // We don't return the password for security
    const hasPassword = await prisma.config.findUnique({ where: { key: 'WORDPRESS_APP_PASSWORD' } })

    return {
        url: url?.value || '',
        username: username?.value || '',
        hasPassword: !!hasPassword
    }
}

export async function saveWordPressConfig(data: { url: string, username: string, appPassword?: string }) {
    const session = await verifySession()
    if (!session) throw new Error('Unauthorized')

    await prisma.config.upsert({
        where: { key: 'WORDPRESS_URL' },
        update: { value: data.url },
        create: { key: 'WORDPRESS_URL', value: data.url }
    })

    await prisma.config.upsert({
        where: { key: 'WORDPRESS_USERNAME' },
        update: { value: data.username },
        create: { key: 'WORDPRESS_USERNAME', value: data.username }
    })

    if (data.appPassword && data.appPassword.trim() !== '') {
        await prisma.config.upsert({
            where: { key: 'WORDPRESS_APP_PASSWORD' },
            update: { value: data.appPassword },
            create: { key: 'WORDPRESS_APP_PASSWORD', value: data.appPassword }
        })
    }

    revalidatePath('/admin/settings')
    return { success: true }
}

export async function testWordPressConnection() {
    const session = await verifySession()
    if (!session) throw new Error('Unauthorized')

    const urlConfig = await prisma.config.findUnique({ where: { key: 'WORDPRESS_URL' } })
    const usernameConfig = await prisma.config.findUnique({ where: { key: 'WORDPRESS_USERNAME' } })
    const passwordConfig = await prisma.config.findUnique({ where: { key: 'WORDPRESS_APP_PASSWORD' } })

    if (!urlConfig?.value || !usernameConfig?.value || !passwordConfig?.value) {
        return { success: false, message: 'Missing configuration' }
    }

    try {
        // Ensure URL doesn't end with slash
        const baseUrl = urlConfig.value.replace(/\/$/, '')

        // Basic auth for WordPress Application Passwords
        const auth = Buffer.from(`${usernameConfig.value}:${passwordConfig.value}`).toString('base64')

        console.log(`Testing connection to: ${baseUrl}/wp-json/wp/v2/users/me`)

        const response = await fetch(`${baseUrl}/wp-json/wp/v2/users/me`, {
            headers: {
                'Authorization': `Basic ${auth}`
            }
        })

        if (!response.ok) {
            return { success: false, message: `Failed: ${response.status} ${response.statusText}` }
        }

        const data = await response.json()
        return { success: true, message: `Connected as ${data.name} (${data.slug})` }

    } catch (error: any) {
        console.error('Wordpress connection error:', error)
        return { success: false, message: `Connection error: ${error.message}` }
    }
}

export async function searchWordPressPosts(query: string) {
    const session = await verifySession()
    if (!session) throw new Error('Unauthorized')

    const urlConfig = await prisma.config.findUnique({ where: { key: 'WORDPRESS_URL' } })
    const usernameConfig = await prisma.config.findUnique({ where: { key: 'WORDPRESS_USERNAME' } })
    const passwordConfig = await prisma.config.findUnique({ where: { key: 'WORDPRESS_APP_PASSWORD' } })

    if (!urlConfig?.value || !query) return []

    try {
        const baseUrl = urlConfig.value.replace(/\/$/, '')
        let headers: HeadersInit = {}

        if (usernameConfig?.value && passwordConfig?.value) {
            const auth = Buffer.from(`${usernameConfig.value}:${passwordConfig.value}`).toString('base64')
            headers['Authorization'] = `Basic ${auth}`
        }

        const response = await fetch(`${baseUrl}/wp-json/wp/v2/posts?search=${encodeURIComponent(query)}&_fields=id,title,link&per_page=10`, {
            headers
        })

        if (!response.ok) return []

        const data = await response.json()
        return data.map((post: any) => ({
            id: post.id,
            title: post.title.rendered,
            url: post.link
        }))

    } catch (error) {
        console.error('WordPress search error:', error)
        return []
    }
}

export async function searchWordPressEvents(query: string) {
    const session = await verifySession()
    if (!session) throw new Error('Unauthorized')

    const urlConfig = await prisma.config.findUnique({ where: { key: 'WORDPRESS_URL' } })
    const usernameConfig = await prisma.config.findUnique({ where: { key: 'WORDPRESS_USERNAME' } })
    const passwordConfig = await prisma.config.findUnique({ where: { key: 'WORDPRESS_APP_PASSWORD' } })

    if (!urlConfig?.value || !query) return []

    try {
        const baseUrl = urlConfig.value.replace(/\/$/, '')
        let headers: HeadersInit = {}

        if (usernameConfig?.value && passwordConfig?.value) {
            const auth = Buffer.from(`${usernameConfig.value}:${passwordConfig.value}`).toString('base64')
            headers['Authorization'] = `Basic ${auth}`
        }

        // Search events using The Events Calendar REST API
        // Documentation: https://theeventscalendar.com/knowledgebase/introduction-to-the-events-calendar-rest-api/
        const searchUrl = `${baseUrl}/wp-json/tribe/events/v1/events?search=${encodeURIComponent(query)}&per_page=10`
        console.log(`[WordPress] Searching events: ${searchUrl}`)

        const response = await fetch(searchUrl, {
            headers
        })

        console.log(`[WordPress] Response status: ${response.status}`)

        if (!response.ok) {
            console.error(`[WordPress] Search failed: ${response.status} ${response.statusText}`)
            const errorText = await response.text()
            console.error(`[WordPress] Error body: ${errorText}`)
            return []
        }

        const data = await response.json()
        console.log(`[WordPress] Found ${data.total} events. Response keys: ${Object.keys(data).join(', ')}`)

        // The Events Calendar API returns { events: [], rest_url: ..., total: ... }
        if (!data.events || !Array.isArray(data.events)) {
            console.warn('[WordPress] No events array in response')
            return []
        }

        return data.events.map((event: any) => ({
            id: event.id,
            title: event.title,
            url: event.url,
            start_date: event.start_date,
            end_date: event.end_date
        }))

    } catch (error) {
        console.error('WordPress events search error:', error)
        return []
    }
}
