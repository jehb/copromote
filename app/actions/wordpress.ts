'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export async function getWordPressConfig() {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const url = process.env.WORDPRESS_URL
    const username = process.env.WORDPRESS_USERNAME
    // We don't return the password for security
    const hasPassword = !!process.env.WORDPRESS_APP_PASSWORD

    return {
        url: url || '',
        username: username || '',
        hasPassword
    }
}

export async function saveWordPressConfig(data: { url: string, username: string, appPassword?: string }) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    throw new Error('WordPress configuration is now managed via environment variables')
}

export async function testWordPressConnection() {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const urlConfig = process.env.WORDPRESS_URL
    const usernameConfig = process.env.WORDPRESS_USERNAME
    const passwordConfig = process.env.WORDPRESS_APP_PASSWORD

    if (!urlConfig || !usernameConfig || !passwordConfig) {
        return { success: false, message: 'Missing configuration' }
    }

    try {
        // Ensure URL doesn't end with slash
        const baseUrl = urlConfig.replace(/\/$/, '')

        // Basic auth for WordPress Application Passwords
        const auth = Buffer.from(`${usernameConfig}:${passwordConfig}`).toString('base64')

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
        return { success: false, message: 'Connection failed due to an internal error' }
    }
}

export async function searchWordPressPosts(query: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const urlConfig = process.env.WORDPRESS_URL
    const usernameConfig = process.env.WORDPRESS_USERNAME
    const passwordConfig = process.env.WORDPRESS_APP_PASSWORD

    if (!urlConfig || !query) return []

    try {
        const baseUrl = urlConfig.replace(/\/$/, '')
        const headers: HeadersInit = {}

        if (usernameConfig && passwordConfig) {
            const auth = Buffer.from(`${usernameConfig}:${passwordConfig}`).toString('base64')
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
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const urlConfig = process.env.WORDPRESS_URL
    const usernameConfig = process.env.WORDPRESS_USERNAME
    const passwordConfig = process.env.WORDPRESS_APP_PASSWORD

    if (!urlConfig || !query) return []

    try {
        const baseUrl = urlConfig.replace(/\/$/, '')
        const headers: HeadersInit = {}

        if (usernameConfig && passwordConfig) {
            const auth = Buffer.from(`${usernameConfig}:${passwordConfig}`).toString('base64')
            headers['Authorization'] = `Basic ${auth}`
        }

        // Search events using The Events Calendar REST API
        // Documentation: https://theeventscalendar.com/knowledgebase/introduction-to-the-events-calendar-rest-api/
        const searchUrl = `${baseUrl}/wp-json/tribe/events/v1/events?search=${encodeURIComponent(query)}&per_page=10`

        const response = await fetch(searchUrl, {
            headers
        })

        if (!response.ok) {
            console.error(`[WordPress] Search failed: ${response.status} ${response.statusText}`)
            const errorText = await response.text()
            console.error(`[WordPress] Error body: ${errorText}`)
            return []
        }

        const data = await response.json()

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
