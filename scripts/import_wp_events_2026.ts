import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find lisa.w
  const lisa = await prisma.user.findFirst({
    where: {
      OR: [
        { username: { contains: 'lisa.w' } },
        { email: { contains: 'lisa.w' } },
        { name: { contains: 'lisa.w' } }
      ]
    }
  });

  if (!lisa) {
    console.error("User 'lisa.w' not found in database.");
    process.exit(1);
  }

  console.log(`Found user ID ${lisa.id} for ${lisa.name}`);

  // Location handling (check for Carrboro, Raleigh, Hillsborough, Southern Village)
  const defaultLocationName = process.env.DEFAULT_LOCATION_NAME || "Community Market";
  let defaultLocation = await prisma.location.findFirst({ where: { name: defaultLocationName } });
  if (!defaultLocation) {
    defaultLocation = await prisma.location.create({ data: { name: defaultLocationName } });
  }

  // Location cache
  const locMap = new Map<string, string>();
  locMap.set("default", defaultLocation.id);

  async function getLocationId(categories: any[]): Promise<string> {
    const locNames = ["Carrboro", "Hillsborough", "Raleigh", "Southern Village", "Food House"];
    for (const cat of categories) {
      if (locNames.includes(cat.name)) {
        if (!locMap.has(cat.name)) {
          let loc = await prisma.location.findFirst({ where: { name: cat.name } });
          if (!loc) {
            loc = await prisma.location.create({ data: { name: cat.name } });
          }
          locMap.set(cat.name, loc.id);
        }
        return locMap.get(cat.name)!;
      }
    }
    return locMap.get("default")!;
  }

  // Fetch events from WP API
  let page = 1;
  let totalAdded = 0;
  let totalSkipped = 0;

  const baseUrl = process.env.WORDPRESS_URL;
  if (!baseUrl) {
    console.warn("WARNING: WORDPRESS_URL environment variable is not defined. Falling back to example.com placeholder URL.");
  }
  const wpBaseUrl = baseUrl || "https://example.com";

  while (true) {
    const url = `${wpBaseUrl.replace(/\/$/, '')}/wp-json/tribe/events/v1/events?start_date=2026-01-01&end_date=2026-12-31&page=${page}&per_page=50`;
    console.log(`Fetching page ${page}: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`Status ${response.status}: Reached end or error.`);
      break;
    }
    
    const data = await response.json();
    if (!data.events || data.events.length === 0) {
      break;
    }

    for (const ev of data.events) {
      const wpId = ev.id;
      // Deduplicate
      const existing = await prisma.event.findFirst({
        where: { wordpressId: wpId }
      });

      if (existing) {
        // console.log(`Skipping event ${wpId} - already exists.`);
        totalSkipped++;
        continue;
      }

      const locId = await getLocationId(ev.categories || []);

      // Create new
      await prisma.event.create({
        data: {
          title: ev.title.replace(/&#\d+;/g, '').replace(/&[a-z]+;/gi, ''),
          description: ev.description,
          startTime: new Date(ev.start_date),
          endTime: new Date(ev.end_date),
          wordpressId: wpId,
          wordpressUrl: ev.url,
          locationId: locId,
          primaryContactId: lisa.id,
          createdById: lisa.id,
          updatedById: lisa.id,
          status: 'SCHEDULED'
        }
      });
      totalAdded++;
    }

    if (data.next_rest_url) {
      page++;
    } else {
      break;
    }
  }

  console.log(`Finished processing. Added: ${totalAdded}, Skipped: ${totalSkipped}`);
}

main().catch(e => {
  console.error("Error running script:", e);
  process.exit(1);
}).finally(() => {
  prisma.$disconnect();
});
