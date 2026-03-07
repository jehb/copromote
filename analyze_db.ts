import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const models = [
        'project', 'asset', 'calendarEvent', 'promotionPeriod', 'socialPost',
        'user', 'event', 'task', 'contact', 'organization', 'emailPlan', 'emailItem'
    ];

    const results: Record<string, any> = {};
    for (const model of models) {
        try {
            // @ts-ignore
            if (prisma[model]) {
                // @ts-ignore
                results[model] = await prisma[model].count();
            }
        } catch (e: any) {
            console.error(`Error counting ${model}:`, e.message);
        }
    }

    try {
        results.tasksByStatus = await prisma.task.groupBy({
            by: ['status'], _count: true
        });
        results.projectsByStatus = await prisma.project.groupBy({
            by: ['status'], _count: true
        });
    } catch (e) { }

    console.log("DB_ANALYSIS_RESULT:", JSON.stringify(results));
}
main().finally(() => prisma.$disconnect());
