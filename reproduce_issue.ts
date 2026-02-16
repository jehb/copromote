
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const contact = await prisma.contact.findFirst()
    if (!contact) {
        console.log('No contacts found. Please create a contact first.')
        return
    }
    console.log('Found contact:', contact.id)

    // Test 1: Invalid organizationId
    try {
        console.log('Testing invalid organizationId...')
        await prisma.contact.update({
            where: { id: contact.id },
            data: { organizationId: '00000000-0000-0000-0000-000000000000' }
        })
    } catch (e: any) {
        console.log('Error 1 Message:', e.message)
    }

    // Test 2: Invalid updatedById
    try {
        console.log('Testing invalid updatedById...')
        await prisma.contact.update({
            where: { id: contact.id },
            data: { updatedById: '00000000-0000-0000-0000-000000000000' }
        })
    } catch (e: any) {
        console.log('Error 2 Message:', e.message)
    }
}

main()
