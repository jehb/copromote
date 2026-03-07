import { PrismaClient } from '@prisma/client'
// @ts-ignore
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Test seed WITH BCRYPT starting...')
    const hash = await bcrypt.hash('test', 10)
    console.log('Hash created:', hash)
    const count = await prisma.user.count()
    console.log('User count:', count)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
