'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { fromZonedTime } from 'date-fns-tz'

const TIMEZONE = 'America/New_York'

function parseDate(value: any) {
    if (!value) return null
    if (value instanceof Date) return value
    return fromZonedTime(value, TIMEZONE)
}

export async function importData(entity: string, data: any[]) {
    try {
        let count = 0

        switch (entity) {
            case 'contacts':
                for (const row of data) {
                    await prisma.contact.upsert({
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
                    count++
                }
                break

            case 'organizations':
                for (const row of data) {
                    await prisma.organization.upsert({
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
                    count++
                }
                break

            case 'projects':
                for (const row of data) {
                    await prisma.project.upsert({
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
                    count++
                }
                break

            case 'tasks':
                for (const row of data) {
                    await prisma.task.upsert({
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
                    count++
                }
                break

            case 'events':
                for (const row of data) {
                    // Try to find location by name given
                    let locationId = undefined
                    if (row.Location) {
                        const loc = await prisma.location.findUnique({
                            where: { name: row.Location }
                        })
                        if (loc) {
                            locationId = loc.id
                        } else {
                            // Create it? Let's create it to be safe
                            const newLoc = await prisma.location.create({
                                data: { name: row.Location }
                            })
                            locationId = newLoc.id
                        }
                    }

                    // Provide a default location if one wasn't found or created (schema requires it)
                    if (!locationId) {
                        // Find any location or create a default "TBD"
                        let defaultLoc = await prisma.location.findFirst()
                        if (!defaultLoc) {
                            defaultLoc = await prisma.location.create({ data: { name: 'TBD' } })
                        }
                        locationId = defaultLoc.id
                    }

                    await prisma.event.upsert({
                        where: { id: row.ID || '' },
                        update: {
                            title: row.Title,
                            description: row.Description,
                            startTime: parseDate(row['Start Time'] || row.Date) || new Date(),
                            endTime: parseDate(row['End Time'] || row.Date) || new Date(),
                            locationId
                        },
                        create: {
                            title: row.Title,
                            description: row.Description,
                            startTime: parseDate(row['Start Time'] || row.Date) || new Date(),
                            endTime: parseDate(row['End Time'] || row.Date) || new Date(Date.now() + 3600000), // Default 1 hour
                            locationId
                        }
                    })
                    count++
                }
                break

            case 'social-posts':
                for (const row of data) {
                    await prisma.socialPost.upsert({
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
                    count++
                }
                break

            case 'hyperlinks':
                for (const row of data) {
                    await prisma.hyperlink.upsert({
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
                    count++
                }
                break


            case 'promotions':
                for (const row of data) {
                    await prisma.promotionPeriod.upsert({
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
                    count++
                }
                break

            case 'color-palettes':
                for (const row of data) {
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

                    await prisma.colorPalette.upsert({
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
                    count++
                }
                break
        }

        revalidatePath('/admin/data')
        return { success: true, message: `Successfully processed ${count} records for ${entity}` }
    } catch (error) {
        console.error('Import error:', error)
        return { success: false, message: `Import failed: ${(error as Error).message}` }
    }
}
