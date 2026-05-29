import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const models = [
        'project', 'asset', 'assetTemplate', 'savedAsset', 'calendarEvent',
        'promotionPeriod', 'socialPost', 'role', 'user', 'event', 'eventProduct',
        'eventSeries', 'task', 'location', 'config', 'contact', 'organization',
        'securityLog', 'activityLog', 'hyperlink', 'magicLink', 'emailPlan',
        'emailItem', 'rolePermission', 'emailItemPhoto', 'emailItemProduct', 'colorPalette'
    ];

    const results = {};
    for (const model of models) {
        try {
            if (prisma[model]) {
                results[model] = await prisma[model].count();
            }
        } catch (e) {
            console.error(`Error counting ${model}:`, e.message);
        }
    }

    try {
        results.tasksByStatus = await prisma.task.groupBy({
            by: ['status'],
            _count: true
        });
    } catch (e) { }

    try {
        results.projectsByStatus = await prisma.project.groupBy({
            by: ['status'],
            _count: true
        });
    } catch (e) { }

    console.log(JSON.stringify(results, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
