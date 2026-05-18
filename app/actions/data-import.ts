'use server'
import { getSession } from '@/lib/session'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { fromZonedTime } from 'date-fns-tz'

const TIMEZONE = 'America/New_York'

function parseDate(value: any) {
    if (!value) return null
    if (value instanceof Date) return value
    return fromZonedTime(value, TIMEZONE)
}

function chunkArray<T>(array: T[], size: number): T[][] {
    const chunked: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunked.push(array.slice(i, i + size));
    }
    return chunked;
}

export async function importData(entity: string, data: any[]) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    try {
        let count = 0

        switch (entity) {
            case 'contacts': {
                const chunks = chunkArray(data, 100);
                for (const chunk of chunks) {
                    await Promise.all(
                        chunk.map((row) =>
                            prisma.contact.upsert({
                                where: { id: row.ID || '' },
                                update: {
                                    firstName: row['First Name'],
                                    lastName: row['Last Name'],
                                    email: row.Email,
                                    phone: row.Phone,
                                    company: row.Company,
                                    jobTitle: row['Job Title'],
                                    type: row.Type || 'Contact',
                                    notes: row.Notes
                                },
                                create: {
                                    firstName: row['First Name'],
                                    lastName: row['Last Name'],
                                    email: row.Email,
                                    phone: row.Phone,
                                    company: row.Company,
                                    jobTitle: row['Job Title'],
                                    type: row.Type || 'Contact',
                                    notes: row.Notes
                                }
                            })
                        )
                    )
                    count += chunk.length
                }
                break
            }

            case 'organizations': {
                const chunks = chunkArray(data, 100);
                for (const chunk of chunks) {
                    await Promise.all(
                        chunk.map((row) =>
                            prisma.organization.upsert({
                                where: { id: row.ID || '' },
                                update: {
                                    name: row.Name,
                                    category: row.Category || 'Organization',
                                    description: row.Description,
                                    website: row.Website
                                },
                                create: {
                                    name: row.Name,
                                    category: row.Category || 'Organization',
                                    description: row.Description,
                                    website: row.Website
                                }
                            })
                        )
                    )
                    count += chunk.length
                }
                break
            }

            case 'projects': {
                // ⚡ Bolt: Performance optimization
                // Using Promise.all in chunks to execute DB operations concurrently avoiding N+1 sequential loops,
                // while preventing Prisma connection pool exhaustion on large imports.
                const chunks = chunkArray(data, 100);
                for (const chunk of chunks) {
                    await Promise.all(
                        chunk.map((row) =>
                            prisma.project.upsert({
                                where: { id: row.ID || '' },
                                update: {
                                    name: row.Name,
                                    description: row.Description,
                                    status: row.Status || 'active',
                                    startDate: parseDate(row['Start Date'] || row.StartDate) || new Date(),
                                    endDate: parseDate(row['End Date'] || row.EndDate)
                                },
                                create: {
                                    name: row.Name,
                                    description: row.Description,
                                    status: row.Status || 'active',
                                    startDate: parseDate(row['Start Date'] || row.StartDate) || new Date(),
                                    endDate: parseDate(row['End Date'] || row.EndDate)
                                }
                            })
                        )
                    )
                    count += chunk.length
                }
                break
            }

            case 'tasks': {
                const chunks = chunkArray(data, 100);
                for (const chunk of chunks) {
                    await Promise.all(
                        chunk.map((row) =>
                            prisma.task.upsert({
                                where: { id: row.ID || '' },
                                update: {
                                    title: row.Title,
                                    description: row.Description,
                                    status: row.Status || 'todo',
                                    dueDate: parseDate(row['Due Date'])
                                },
                                create: {
                                    title: row.Title,
                                    description: row.Description,
                                    status: row.Status || 'todo',
                                    dueDate: parseDate(row['Due Date'])
                                }
                            })
                        )
                    )
                    count += chunk.length
                }
                break
            }

            case 'events': {
                // Pre-fetch and cache locations to avoid N+1 query issue
                const uniqueLocationNames = [...new Set(data.map(row => row.Location).filter(Boolean))] as string[];
                const locationMap = new Map<string, string>();

                if (uniqueLocationNames.length > 0) {
                    const existingLocations = await prisma.location.findMany({
                        where: { name: { in: uniqueLocationNames } }
                    });

                    for (const loc of existingLocations) {
                        locationMap.set(loc.name, loc.id);
                    }

                    const missingLocationNames = uniqueLocationNames.filter(name => !locationMap.has(name));
                    if (missingLocationNames.length > 0) {
                        // Create missing locations
                        const newLocations = await Promise.all(
                            missingLocationNames.map(name => prisma.location.create({ data: { name } }))
                        );
                        for (const loc of newLocations) {
                            locationMap.set(loc.name, loc.id);
                        }
                    }
                }

                // Pre-fetch default location (TBD) if needed
                let defaultLocationId: string | undefined = undefined;

                const hasMissingLocations = data.some(row => !row.Location || !locationMap.has(row.Location));
                if (hasMissingLocations) {
                    let defaultLoc = await prisma.location.findFirst();
                    if (!defaultLoc) {
                        defaultLoc = await prisma.location.create({ data: { name: 'TBD' } });
                    }
                    defaultLocationId = defaultLoc.id;
                }

                const chunks = chunkArray(data, 100);
                for (const chunk of chunks) {
                    await Promise.all(
                        chunk.map((row) => {
                            let locationId = undefined;

                            if (row.Location) {
                                locationId = locationMap.get(row.Location);
                            }

                            // Provide a default location if one wasn't found or created (schema requires it)
                            if (!locationId) {
                                locationId = defaultLocationId;
                            }

                            return prisma.event.upsert({
                                where: { id: row.ID || '' },
                                update: {
                                    title: row.Title,
                                    description: row.Description,
                                    startTime: parseDate(row['Start Time'] || row.Date) || new Date(),
                                    endTime: parseDate(row['End Time'] || row.Date) || new Date(),
                                    locationId: locationId as string
                                },
                                create: {
                                    title: row.Title,
                                    description: row.Description,
                                    startTime: parseDate(row['Start Time'] || row.Date) || new Date(),
                                    endTime: parseDate(row['End Time'] || row.Date) || new Date(Date.now() + 3600000), // Default 1 hour
                                    locationId: locationId as string
                                }
                            });
                        })
                    );
                    count += chunk.length;
                }
                break;
            }

            case 'social-posts': {
                const chunks = chunkArray(data, 100);
                for (const chunk of chunks) {
                    const upsertPromises = chunk.map(row =>
                        prisma.socialPost.upsert({
                            where: { id: row.ID || '' },
                            update: {
                                content: row.Content,
                                platform: row.Platform || 'Twitter',
                                scheduledDate: parseDate(row['Scheduled Date']),
                                status: row.Status || 'draft'
                            },
                            create: {
                                content: row.Content,
                                platform: row.Platform || 'Twitter',
                                scheduledDate: parseDate(row['Scheduled Date']),
                                status: row.Status || 'draft'
                            }
                        })
                    )
                    await Promise.all(upsertPromises)
                    count += chunk.length
                }
                break
            }

            case 'hyperlinks': {
                const chunks = chunkArray(data, 100);
                for (const chunk of chunks) {
                    await Promise.all(
                        chunk.map((row) =>
                            prisma.hyperlink.upsert({
                                where: { id: row.ID || '' },
                                update: {
                                    title: row.Title,
                                    url: row.URL || row.Url,
                                    description: row.Description,
                                    icon: row.Icon
                                },
                                create: {
                                    title: row.Title,
                                    url: row.URL || row.Url,
                                    description: row.Description,
                                    icon: row.Icon
                                }
                            })
                        )
                    )
                    count += chunk.length
                }
                break
            }


            case 'promotions': {
                const chunks = chunkArray(data, 100);
                for (const chunk of chunks) {
                    await Promise.all(
                        chunk.map((row) =>
                            prisma.promotionPeriod.upsert({
                                where: { id: row.ID || '' },
                                update: {
                                    name: row.Name,
                                    startDate: parseDate(row['Start Date'] || row.StartDate) || new Date(),
                                    endDate: parseDate(row['End Date'] || row.EndDate) || new Date(),
                                    adLiveDate: parseDate(row['Ad Live Date']),
                                    adImageDeadline: parseDate(row['Ad Image Deadline']),
                                    adPublishingDeadline: parseDate(row['Ad Publishing Deadline'])
                                },
                                create: {
                                    name: row.Name,
                                    startDate: parseDate(row['Start Date'] || row.StartDate) || new Date(),
                                    endDate: parseDate(row['End Date'] || row.EndDate) || new Date(Date.now() + 86400000 * 7), // Default 1 week
                                    adLiveDate: parseDate(row['Ad Live Date']),
                                    adImageDeadline: parseDate(row['Ad Image Deadline']),
                                    adPublishingDeadline: parseDate(row['Ad Publishing Deadline'])
                                }
                            })
                        )
                    )
                    count += chunk.length
                }
                break
            }

            case 'color-palettes': {
                const chunks = chunkArray(data, 100);
                for (const chunk of chunks) {
                    await Promise.all(
                        chunk.map((row) => {
                            let colorsArray: string[] = []
                            const colorsInput = row.Colors

                            if (colorsInput) {
                                try {
                                    if (colorsInput.startsWith('[')) {
                                        colorsArray = JSON.parse(colorsInput)
                                    } else {
                                        colorsArray = colorsInput.split(',').map((c: string) => c.trim()).filter(Boolean)
                                    }
                                } catch (e) {
                                    console.error('Failed to parse colors for palette:', row.Name)
                                    colorsArray = []
                                }
                            }

                            return prisma.colorPalette.upsert({
                                where: { id: row.ID || '' },
                                update: {
                                    name: row.Name,
                                    colors: JSON.stringify(colorsArray) // Store as a serialized JSON string in Prisma Json field as designed
                                },
                                create: {
                                    name: row.Name,
                                    colors: JSON.stringify(colorsArray)
                                }
                            })
                        })
                    )
                    count += chunk.length
                }
                break
            }
        }

        revalidatePath('/admin/data')
        return { success: true, message: `Successfully processed ${count} records for ${entity}` }
    } catch (error) {
        console.error('Import error:', error)
        return { success: false, message: `Import failed: ${(error as Error).message}` }
    }
}
