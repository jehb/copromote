import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Finding and deleting duplicate events...");

    // Find duplicates using database grouping
    const duplicatesGrouped = await prisma.event.groupBy({
        by: ['title', 'startTime', 'locationId'],
        _count: {
            id: true
        },
        having: {
            id: {
                _count: {
                    gt: 1
                }
            }
        }
    });

    if (duplicatesGrouped.length === 0) {
        console.log("No duplicate events found.");
        return;
    }

    const duplicateIds: string[] = [];

    // For each group of duplicates, fetch the records and keep the oldest one
    for (const group of duplicatesGrouped) {
        const eventsInGroup = await prisma.event.findMany({
            where: {
                title: group.title,
                startTime: group.startTime,
                locationId: group.locationId
            },
            orderBy: {
                createdAt: 'asc'
            },
            select: {
                id: true,
                title: true
            }
        });

        // Skip the first (oldest) event, mark the rest for deletion
        for (let i = 1; i < eventsInGroup.length; i++) {
            const event = eventsInGroup[i];
            duplicateIds.push(event.id);
            console.log(`Found duplicate: ${event.title}`);
        }
    }

    if (duplicateIds.length > 0) {
        console.log(`Deleting ${duplicateIds.length} duplicate events...`);
        const deleteResult = await prisma.event.deleteMany({
            where: {
                id: {
                    in: duplicateIds
                }
            }
        });
        console.log(`Deleted ${deleteResult.count} events.`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
