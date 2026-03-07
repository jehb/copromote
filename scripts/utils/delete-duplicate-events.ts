import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Finding and deleting duplicate events...");

    const allEvents = await prisma.event.findMany({
        orderBy: {
            createdAt: 'asc'
        }
    });

    const seenEvents = new Set();
    const duplicateIds = [];

    for (const event of allEvents) {
        // A duplicate is an event with the same title, start time, and location
        const uniqueKey = `${event.title}-${event.startTime.toISOString()}-${event.locationId}`;

        if (seenEvents.has(uniqueKey)) {
            duplicateIds.push(event.id);
            console.log(`Found duplicate: ${event.title}`);
        } else {
            seenEvents.add(uniqueKey);
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
    } else {
        console.log("No duplicate events found.");
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
