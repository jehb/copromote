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
        }

        revalidatePath('/admin/data')
        return { success: true, message: `Successfully processed ${count} records for ${entity}` }
    } catch (error) {
        console.error('Import error:', error)
        return { success: false, message: `Import failed: ${(error as Error).message}` }
    }
}
