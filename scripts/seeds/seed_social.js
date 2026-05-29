const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding social posts...')

    const promotions = await prisma.promotionPeriod.findMany({
        orderBy: { startDate: 'asc' }
    })

    if (promotions.length === 0) {
        console.log('No promotions found. Please seed promotions first.')
        return
    }

    const posts = [
        {
            platform: 'Instagram',
            content: 'Check out our Owner Weekly Rewards! Exclusive discounts for our community owners. #CommunityCoop #Coop #OwnerRewards',
            offset: 0
        },
        {
            platform: 'Facebook',
            content: 'New exclusive coupons are here for our Owners! Check your email for this week\'s savings. Not an owner yet? Join us today! #CoopMarket #Coupons #Community',
            offset: 1
        },
        {
            platform: 'Twitter',
            content: 'Fresh seasonal produce just arrived! 🍓🥦 Don\'t miss out on our seasonal specials. #FreshLocal #CoopMarket',
            offset: 2
        },
        {
            platform: 'LinkedIn',
            content: 'We are proud to support our local farmers. Read more about our seasonal sourcing initiatives in our latest newsletter. #Sustainability #LocalEconomy #Coop',
            offset: 3
        }
    ]

    for (const promo of promotions) {
        // Create 2-3 posts for each promotion
        for (let i = 0; i < 3; i++) {
            const postTemplate = posts[(i + Math.floor(Math.random() * posts.length)) % posts.length]

            // Schedule date relative to promotion start
            const scheduledDate = new Date(promo.startDate)
            scheduledDate.setDate(scheduledDate.getDate() + postTemplate.offset + i)

            await prisma.socialPost.create({
                data: {
                    content: `${postTemplate.content} (Promo: ${promo.name})`,
                    platform: postTemplate.platform,
                    scheduledDate: scheduledDate,
                    status: 'scheduled',
                    promotionPeriodId: promo.id,
                    tags: {
                        connectOrCreate: [
                            { where: { name: 'CoopMarket' }, create: { name: 'CoopMarket' } },
                            { where: { name: 'Promo' }, create: { name: 'Promo' } }
                        ]
                    }
                }
            })
        }
    }

    console.log('Social posts seeded successfully.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
