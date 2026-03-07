
import { PrismaClient } from '@prisma/client'
import sql from 'mssql'

const prisma = new PrismaClient()

async function getConfig(key: string) {
    const config = await prisma.config.findUnique({
        where: { key }
    })
    return config?.value?.trim() || null
}

async function debugConnection() {
    console.log('Reading configuration...')
    const url = await getConfig('EXTERNAL_DB_URL')
    const user = await getConfig('EXTERNAL_DB_USER')
    const password = await getConfig('EXTERNAL_DB_PASSWORD')
    const type = await getConfig('EXTERNAL_DB_TYPE')
    const databaseName = await getConfig('EXTERNAL_DB_NAME')

    console.log('Raw Config:', {
        url,
        user,
        password: password ? '******' : null,
        type,
        databaseName
    })

    if (!url || type !== 'mssql') {
        console.log('Skipping MSSQL test: URL missing or type not mssql')
        return
    }

    const server = url.split('://')[1]?.split(':')[0] || url
    const database = databaseName || 'ProductsDB'

    const config = {
        user: user || '',
        password: password || '',
        server,
        database,
        options: {
            encrypt: true,
            trustServerCertificate: false // Change to true if testing with self-signed
        }
    }

    console.log('Resolved Connection Config:', {
        ...config,
        password: '******'
    })

    try {
        console.log('Attempting connection...')
        const pool = await sql.connect(config)
        console.log('Connection successful!')

        console.log('Testing pagination...')

        // Page 1
        console.log('Fetching Page 1 (size 2)...')
        try {
            const p1 = await pool.request()
                .input('offset', sql.Int, 0)
                .input('pageSize', sql.Int, 2)
                .query('SELECT F01, F02 FROM positems ORDER BY F02 ASC OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY')

            console.log('Page 1 items:', p1.recordset.map((r: any) => r.F02))
        } catch (err: any) {
            console.error('Page 1 fetch failed:', err.message)
        }

        // Page 2
        console.log('Fetching Page 2 (size 2)...')
        try {
            const p2 = await pool.request()
                .input('offset', sql.Int, 2)
                .input('pageSize', sql.Int, 2)
                .query('SELECT F01, F02 FROM positems ORDER BY F02 ASC OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY')

            console.log('Page 2 items:', p2.recordset.map((r: any) => r.F02))
        } catch (err: any) {
            console.error('Page 2 fetch failed:', err.message)
        }

        // Total Count
        try {
            const count = await pool.request().query('SELECT COUNT(*) as count FROM positems')
            console.log('Total items:', count.recordset[0].count)
        } catch (err: any) {
            console.error('Count fetch failed:', err.message)
        }

        await pool.close()
    } catch (error: any) {
        console.error('Connection Failed!')
        console.error('Error Name:', error.name)
        console.error('Error Message:', error.message)
        console.error('Error Code:', error.code)
        if (error.originalError) {
            console.error('Original Error:', error.originalError.message)
        }
    } finally {
        await prisma.$disconnect()
    }
}

debugConnection()
