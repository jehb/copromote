
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(request: Request) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q')
        const testNoAuth = searchParams.get('noauth') === 'true'

        const urlConfig = await prisma.config.findUnique({ where: { key: 'WORDPRESS_URL' } })
        const usernameConfig = await prisma.config.findUnique({ where: { key: 'WORDPRESS_USERNAME' } })
        const passwordConfig = await prisma.config.findUnique({ where: { key: 'WORDPRESS_APP_PASSWORD' } })

        if (!urlConfig?.value) {
            return NextResponse.json({ error: 'Missing WordPress URL' }, { status: 400 })
        }

        const baseUrl = urlConfig.value.replace(/\/$/, '')

        let endpoint = `${baseUrl}/wp-json/tribe/events/v1/events?per_page=5`
        if (query) {
            endpoint += `&search=${encodeURIComponent(query)}`
        }

        const headers: Record<string, string> = {}
        const hasAuth = !!(usernameConfig?.value && passwordConfig?.value)

        if (hasAuth && !testNoAuth) {
            const auth = Buffer.from(`${usernameConfig.value}:${passwordConfig.value}`).toString('base64')
            headers['Authorization'] = `Basic ${auth}`
        }

        console.log(`[DebugAPI] Fetching: ${endpoint}`)
        const response = await fetch(endpoint, { headers })

        const responseText = await response.text()
        let responseData
        try {
            responseData = JSON.parse(responseText)
        } catch {
            responseData = responseText
        }

        return NextResponse.json({
            request: {
                endpoint,
                query
            },
            response: {
                status: response.status,
                data: responseData
            }
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
