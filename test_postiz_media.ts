import { prisma } from './lib/db'
import { syncPostToPostiz } from './app/actions/postiz'

async function runTest() {
    try {
        console.log('1. Creating a mocked asset in Promoty DB...')
        const asset = await prisma.asset.create({
            data: {
                name: 'Postiz Sync Test Image',
                type: 'image',
                url: 'https://images.unsplash.com/photo-1634152962476-4b8a00e1915c?q=80&w=600&auto=format&fit=crop'
            }
        })
        console.log(`Created Asset ID: ${asset.id}`)

        const urlConfig = await prisma.config.findUnique({ where: { key: 'POSTIZ_URL' } })
        const keyConfig = await prisma.config.findUnique({ where: { key: 'POSTIZ_API_KEY' } })
        console.log(`DB POSTIZ_URL: ${urlConfig?.value ? 'exists' : 'missing'}`)
        console.log(`DB POSTIZ_API_KEY: ${keyConfig?.value ? 'exists' : 'missing'}`)

        console.log('2. Syncing post + asset to Postiz...')
        const postizId = await syncPostToPostiz({
            platforms: ['twitter'],
            content: `Automated test post directly from Promoty! 🚀 Testing media attachment capability.\n\nTimestamp: ${new Date().toISOString()}`,
            scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24), // schedule 1 day out
            status: 'scheduled',
            assets: [asset]
        })

        if (!postizId) {
            throw new Error('syncPostToPostiz returned null! Check your environment variables and logic.')
        }

        console.log(`Success! Postiz assigned remote ID: ${postizId}`)

        console.log('3. Storing it as a Scheduled SocialPost in Promoty DB')
        const post = await prisma.socialPost.create({
            data: {
                content: 'Automated test post directly from Promoty! 🚀',
                platform: 'twitter',
                status: 'scheduled',
                scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
                postizId: postizId,
                assets: {
                    connect: [{ id: asset.id }]
                }
            }
        })
        console.log(`Finished correctly! Linked Promoty Post ID: ${post.id}`)

    } catch (e) {
        console.error('Test script failed:', e)
    } finally {
        // Disconnect DB client 
        await prisma.$disconnect()
    }
}

runTest()
