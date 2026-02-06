import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prismaClient_v3: PrismaClient }

export const prisma =
    globalForPrisma.prismaClient_v3 ||
    new PrismaClient({
        log: ['query'],
    })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaClient_v3 = prisma
