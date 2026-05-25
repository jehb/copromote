import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const events = [
    {
        title: "Living History: From the Rock Wall",
        description: "Explore living history at our Carrboro store. Note: This event has been postponed and will be rescheduled.",
        startTime: new Date("2026-02-22T13:00:00-05:00"),
        endTime: new Date("2026-02-22T15:30:00-05:00"),
        locationName: "Weaver Street Market - Carrboro",
        status: "TENTATIVE" as const,
    },
    {
        title: "Raleigh Lunch & Learn: Getting to the Heart of Cardiovascular Disease",
        description: "A free lunch and learn event focusing on cardiovascular disease at the Raleigh location.",
        startTime: new Date("2026-02-26T11:00:00-05:00"),
        endTime: new Date("2026-02-26T12:00:00-05:00"),
        locationName: "Weaver Street Market - Raleigh",
        status: "SCHEDULED" as const,
    },
    {
        title: "Hillsborough Lunch & Learn: Getting to the Heart of Cardiovascular Disease",
        description: "A free lunch and learn event focusing on cardiovascular disease at the Hillsborough location.",
        startTime: new Date("2026-02-26T11:00:00-05:00"),
        endTime: new Date("2026-02-26T12:00:00-05:00"),
        locationName: "Weaver Street Market - Hillsborough",
        status: "SCHEDULED" as const,
    },
    {
        title: "Sourdough Bread Class",
        description: "Learn the art of sourdough bread making at our Raleigh store. Currently sold out.",
        startTime: new Date("2026-02-27T18:00:00-05:00"),
        endTime: new Date("2026-02-27T20:00:00-05:00"),
        locationName: "Weaver Street Market - Raleigh",
        status: "SCHEDULED" as const,
    },
    {
        title: "Vege-Palooza",
        description: "Free event featuring information on vegetarian and vegan products, plant-based recipes, and kids' activities.",
        startTime: new Date("2026-02-28T11:00:00-05:00"),
        endTime: new Date("2026-02-28T13:00:00-05:00"),
        locationName: "Weaver Street Market - Raleigh",
        status: "SCHEDULED" as const,
    },
    {
        title: "Sushi with Sujin",
        description: "Learn how to make sushi with Sujin.",
        startTime: new Date("2026-03-13T18:00:00-05:00"),
        endTime: new Date("2026-03-13T20:00:00-05:00"),
        locationName: "Weaver Street Market - Raleigh",
        status: "SCHEDULED" as const,
    },
    {
        title: "Farm to Fork Tour: Winter Shopping with the Chef",
        description: "Winter shopping tour with the chef at our Raleigh store.",
        startTime: new Date("2026-03-15T13:00:00-05:00"),
        endTime: new Date("2026-03-15T15:00:00-05:00"),
        locationName: "Weaver Street Market - Raleigh",
        status: "SCHEDULED" as const,
    },
    {
        title: "Breakfast for Dinner: Southern Biscuits and Gravy Class",
        description: "Join our Southern Biscuits and Gravy class for a fun breakfast-for-dinner experience.",
        startTime: new Date("2026-03-16T18:00:00-05:00"),
        endTime: new Date("2026-03-16T20:00:00-05:00"),
        locationName: "Weaver Street Market - Raleigh",
        status: "SCHEDULED" as const,
    }
];

async function main() {
    console.log("Seeding Weaver Street Market events...");

    const uniqueLocationNames = [...new Set(events.map(event => event.locationName))];

    console.log("Upserting locations...");
    const upsertedLocations = await Promise.all(
        uniqueLocationNames.map(name =>
            prisma.location.upsert({
                where: { name },
                update: {},
                create: { name }
            })
        )
    );

    const locationMap = new Map(upsertedLocations.map(loc => [loc.name, loc.id]));

    console.log("Creating events in bulk...");
    await prisma.event.createMany({
        data: events.map(event => ({
            title: event.title,
            description: event.description,
            startTime: event.startTime,
            endTime: event.endTime,
            status: event.status,
            locationId: locationMap.get(event.locationName)!
        }))
    });

    console.log(`Created ${events.length} events!`);
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
