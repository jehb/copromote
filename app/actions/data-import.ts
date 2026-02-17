'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

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
                            startDate: new Date(row['Start Date'] || Date.now()),
                            endDate: row['End Date'] ? new Date(row['End Date']) : null
                        },
                        create: {
                            name: row.Name,
                            description: row.Description,
                            status: row.Status || 'active',
                            startDate: new Date(row['Start Date'] || Date.now()),
                            endDate: row['End Date'] ? new Date(row['End Date']) : null
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
                            dueDate: row['Due Date'] ? new Date(row['Due Date']) : null
                        },
                        create: {
                            title: row.Title,
                            description: row.Description,
                            status: row.Status || 'todo',
                            dueDate: row['Due Date'] ? new Date(row['Due Date']) : null
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
                            startTime: new Date(row['Start Time'] || row.Date || Date.now()),
                            endTime: new Date(row['End Time'] || row.Date || Date.now()),
                            locationId
                        },
                        create: {
                            title: row.Title,
                            description: row.Description,
                            startTime: new Date(row['Start Time'] || row.Date || Date.now()),
                            endTime: new Date(row['End Time'] || row.Date || new Date(Date.now() + 3600000)), // Default 1 hour
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
                            scheduledDate: row['Scheduled Date'] ? new Date(row['Scheduled Date']) : null,
                            status: row.Status || 'draft'
                        },
                        create: {
                            content: row.Content,
                            platform: row.Platform || 'Twitter',
                            scheduledDate: row['Scheduled Date'] ? new Date(row['Scheduled Date']) : null,
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
                            startDate: new Date(row['Start Date'] || row.StartDate || Date.now()),
                            endDate: new Date(row['End Date'] || row.EndDate || Date.now())
                        },
                        create: {
                            name: row.Name,
                            startDate: new Date(row['Start Date'] || row.StartDate || Date.now()),
                            endDate: new Date(row['End Date'] || row.EndDate || new Date(Date.now() + 86400000 * 7)) // Default 1 week
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
