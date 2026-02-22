import { PrismaClient } from '@prisma/client'

async function runTest() {
    console.log("Starting script...")
    const prisma = new PrismaClient()
    const urlConfig = await prisma.config.findUnique({ where: { key: 'IMMICH_URL' } })
    const keyConfig = await prisma.config.findUnique({ where: { key: 'IMMICH_API_KEY' } })

    if (!urlConfig || !keyConfig) throw new Error("Missing config")

    const url = urlConfig.value
    const apiKey = keyConfig.value

    console.log("Config loaded. Fetching assets...")

    // Direct fetch to avoid SDK issues
    const res = await fetch(`${url}/api/search/metadata`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'x-api-key': apiKey
        },
        body: JSON.stringify({
            createdBefore: new Date().toISOString()
        })
    })

    const data = await res.json()
    console.log("Total assets:", data.assets.items.length)
    if (data.assets.items.length > 0) {
        console.log("First asset id:", data.assets.items[0].id)
        console.log("First asset tags:", data.assets.items[0].tags)

        // Find banner-test
        const bannerAsset = data.assets.items.find((a: any) => a.originalFileName.includes('banner-test'))
        if (bannerAsset) {
            console.log("Banner-test asset:", bannerAsset.id, "tags:", bannerAsset.tags)

            // Try tagging it manually
            console.log("Fetching tags...")
            const tagsRes = await fetch(`${url}/api/tags`, { headers: { 'Accept': 'application/json', 'x-api-key': apiKey } })
            const tags = await tagsRes.json()
            console.log("Available tags:", tags.map((t: any) => t.name))

            const promoTag = tags.find((t: any) => t.name === 'Promotional' || t.name === 'Banner')
            if (promoTag) {
                console.log("Found tag:", promoTag.name, promoTag.id)
                console.log("Attempting to tag asset...")
                const tagRes = await fetch(`${url}/api/tags/bulk-assets`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'x-api-key': apiKey
                    },
                    body: JSON.stringify({
                        assetIds: [bannerAsset.id],
                        tagIds: [promoTag.id]
                    })
                })
                console.log("Tag response status:", tagRes.status)
                console.log("Tag response text:", await tagRes.text())
            }
        }
    }

    await prisma.$disconnect()
}

runTest().catch(console.error)
