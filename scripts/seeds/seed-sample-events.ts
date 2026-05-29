import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const events = [
    {
        title: "Living History: Local Stories & Legacy",
        description: "Explore living history at our West End store. Note: This event has been postponed and will be rescheduled.",
        startTime: new Date("2026-02-22T13:00:00-05:00"),
        endTime: new Date("2026-02-22T15:30:00-05:00"),
        locationName: "Community Market - West End",
        status: "TENTATIVE" as const,
    },
    {
        title: "Healthy Cooking Lunch & Learn",
        description: "A free lunch and learn event focusing on nutritious cooking at the Downtown location.",
        startTime: new Date("2026-02-26T11:00:00-05:00"),
        endTime: new Date("2026-02-26T12:00:00-05:00"),
        locationName: "Community Market - Downtown",
        status: "SCHEDULED" as const,
    },
    {
        title: "Community Wellness Discussion",
        description: "A free discussion on wellness and preventive health at the Northside location.",
        startTime: new Date("2026-02-26T11:00:00-05:00"),
        endTime: new Date("2026-02-26T12:00:00-05:00"),
        locationName: "Community Market - Northside",
        status: "SCHEDULED" as const,
    },
    {
        title: "Sourdough Bread Making Class",
        description: "Learn the art of sourdough bread making at our Downtown store. Currently sold out.",
        startTime: new Date("2026-02-27T18:00:00-05:00"),
        endTime: new Date("2026-02-27T20:00:00-05:00"),
        locationName: "Community Market - Downtown",
        status: "SCHEDULED" as const,
    },
    {
        title: "Fresh Spring Veggie Festival",
        description: "Free event featuring information on vegetarian and vegan products, plant-based recipes, and kids' activities.",
        startTime: new Date("2026-02-28T11:00:00-05:00"),
        endTime: new Date("2026-02-28T13:00:00-05:00"),
        locationName: "Community Market - Downtown",
        status: "SCHEDULED" as const,
    },
    {
        title: "Artisanal Sushi Making",
        description: "Learn how to make sushi with our resident chef.",
        startTime: new Date("2026-03-13T18:00:00-05:00"),
        endTime: new Date("2026-03-13T20:00:00-05:00"),
        locationName: "Community Market - Downtown",
        status: "SCHEDULED" as const,
    },
    {
        title: "Seasonal Sourcing Farm Tour",
        description: "Spring shopping tour with the head chef at our Downtown store.",
        startTime: new Date("2026-03-15T13:00:00-05:00"),
        endTime: new Date("2026-03-15T15:00:00-05:00"),
        locationName: "Community Market - Downtown",
        status: "SCHEDULED" as const,
    },
    {
        title: "Traditional Southern Biscuits and Gravy Class",
        description: "Join our Southern cooking class for a fun breakfast-for-dinner experience.",
        startTime: new Date("2026-03-16T18:00:00-05:00"),
        endTime: new Date("2026-03-16T20:00:00-05:00"),
        locationName: "Community Market - Downtown",
        status: "SCHEDULED" as const,
    }
];

async function main() {
    console.log("Seeding generic sample events...");

    for (const event of events) {
        // Upsert the location first
        const location = await prisma.location.upsert({
            where: { name: event.locationName },
            update: {},
            create: { name: event.locationName }
        });

        // Create the event
        await prisma.event.create({
            data: {
                title: event.title,
                description: event.description,
                startTime: event.startTime,
                endTime: event.endTime,
                status: event.status,
                locationId: location.id
            }
        });
        console.log(`Created event: ${event.title}`);
    }

    console.log("Seeding complete!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
