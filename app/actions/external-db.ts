'use server'

import sql from 'mssql'
import { getConfig } from './settings'

export interface Product {
    id: string
    name: string
    price: number
    stock: number
    category: string
    description: string
}

async function getDBConfig() {
    const url = await getConfig('EXTERNAL_DB_URL')
    const user = await getConfig('EXTERNAL_DB_USER')
    const password = await getConfig('EXTERNAL_DB_PASSWORD')
    const type = await getConfig('EXTERNAL_DB_TYPE')
    const database = await getConfig('EXTERNAL_DB_NAME')

    if (!url || type !== 'mssql') return null

    // Simple parsing of jdbc-style URL or just use as is if it's a server name
    // Format expected: server,port
    const server = url.split('://')[1]?.split(':')[0] || url

    return {
        user: user || '',
        password: password || '',
        server,
        database: database || 'ProductsDB', // Fallback to ProductsDB if not set
        options: {
            encrypt: true, // Required for Azure
            trustServerCertificate: false
        }
    }
}

export async function testExternalConnection() {
    const config = await getDBConfig()
    if (!config) return { success: false, message: 'Invalid MSSQL configuration.' }

    try {
        const pool = await sql.connect(config)
        await pool.request().query('SELECT 1')
        await pool.close()
        return { success: true, message: 'Successfully connected to Azure MSSQL.' }
    } catch (error: any) {
        console.error('DB Connection error:', error)
        return { success: false, message: `Connection failed: ${error.message}` }
    }
}

export async function getExternalProducts(
    page: number = 1,
    pageSize: number = 10,
    search: string = ''
): Promise<{ products: Product[], totalCount: number }> {
    const config = await getDBConfig()
    if (!config) return { products: [], totalCount: 0 }

    try {
        const pool = await sql.connect(config)
        const request = pool.request()

        // Base query - adapting to legacy schema (positems)
        // F01: ID, F02: Name, F140: Price, F19: Stock, F1022: Category, F1023: Description
        let query = 'SELECT F01 as id, F02 as name, F140 as price, F19 as stock, F1022 as category, F1023 as description FROM positems'
        let countQuery = 'SELECT COUNT(*) as count FROM positems'

        // Add filtering if search is provided
        if (search) {
            request.input('search', sql.NVarChar, `%${search}%`)
            const whereClause = ' WHERE F02 LIKE @search OR F1023 LIKE @search OR F1022 LIKE @search'
            query += whereClause
            countQuery += whereClause
        }

        // Add pagination
        // MSSQL requires ORDER BY for OFFSET/FETCH
        query += ' ORDER BY F02 ASC OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY'

        const offset = (page - 1) * pageSize
        request.input('offset', sql.Int, offset)
        request.input('pageSize', sql.Int, pageSize)

        // Execute queries
        console.log('Executing Product Query:', query)
        console.log('Executing Count Query:', countQuery)
        console.log('Search Param:', search)

        const [productsResult, countResult] = await Promise.all([
            request.query(query),
            pool.request().input('search', sql.NVarChar, `%${search}%`).query(countQuery) // Re-bind input for separate request
        ])

        console.log('Products Found:', productsResult.recordset.length)
        console.log('Total Count Found:', countResult.recordset[0].count)

        await pool.close()

        const products = productsResult.recordset.map(row => ({
            id: String(row.id),
            name: row.name || 'Unknown Product',
            price: Number(row.price) || 0,
            stock: Number(row.stock) || 0,
            category: row.category || 'Uncategorized',
            description: row.description || ''
        }))

        const totalCount = countResult.recordset[0].count

        return { products, totalCount }
    } catch (error) {
        console.error('Failed to fetch external products:', error)
        // Return a mock error product if connection fails
        return {
            products: [{
                id: 'ERR',
                name: 'Connection Error',
                price: 0,
                stock: 0,
                category: 'System',
                description: 'Please check your database settings and connection.'
            }],
            totalCount: 0
        }
    }
}
