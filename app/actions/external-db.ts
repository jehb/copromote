'use server'
import { getSession } from '@/lib/session'

import sql from 'mssql'

export interface Product {
    upc: string
    brand: string
    size: string
    department: string
    name: string
}

async function getDBConfig() {
    const url = process.env.EXTERNAL_DB_URL
    const user = process.env.EXTERNAL_DB_USER
    const password = process.env.EXTERNAL_DB_PASSWORD
    const type = process.env.EXTERNAL_DB_TYPE
    const database = process.env.EXTERNAL_DB_NAME

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
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
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
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const config = await getDBConfig()
    if (!config) return { products: [], totalCount: 0 }

    try {
        const pool = await sql.connect(config)
        const request = pool.request()

        // Base query - adapting to legacy schema (positems)
        // F01: upc, F155: brand, F22: size, F238: department, F29: name
        let query = 'SELECT F01 as upc, F155 as brand, F22 as size, F238 as department, F29 as name FROM positems'
        let countQuery = 'SELECT COUNT(*) as count FROM positems'

        // Add filtering if search is provided
        if (search) {
            request.input('search', sql.NVarChar, `%${search}%`)
            const whereClause = ' WHERE F29 LIKE @search OR F155 LIKE @search OR F01 LIKE @search OR F238 LIKE @search'
            query += whereClause
            countQuery += whereClause
        }

        // Add pagination
        // MSSQL requires ORDER BY for OFFSET/FETCH
        query += ' ORDER BY F29 ASC OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY'

        const offset = (page - 1) * pageSize
        request.input('offset', sql.Int, offset)
        request.input('pageSize', sql.Int, pageSize)

        // Execute queries
        const [productsResult, countResult] = await Promise.all([
            request.query(query),
            pool.request().input('search', sql.NVarChar, `%${search}%`).query(countQuery) // Re-bind input for separate request
        ])

        await pool.close()

        const products = productsResult.recordset.map(row => ({
            upc: String(row.upc || ''),
            brand: row.brand || '',
            size: row.size || '',
            department: row.department || '',
            name: row.name || 'Unknown Product'
        }))

        const totalCount = countResult.recordset[0].count

        return { products, totalCount }
    } catch (error) {
        console.error('Failed to fetch external products:', error)
        // Return a mock error product if connection fails
        return {
            products: [{
                upc: 'ERR',
                brand: 'System',
                size: '',
                department: 'Error',
                name: 'Connection Error'
            }],
            totalCount: 0
        }
    }
}

export async function getExternalProductByUPC(upc: string): Promise<Record<string, any> | null> {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const config = await getDBConfig()
    if (!config) return null

    try {
        const pool = await sql.connect(config)
        const request = pool.request()

        const query = 'SELECT * FROM positems WHERE F01 = @upc'
        request.input('upc', sql.NVarChar, upc)

        const result = await request.query(query)

        await pool.close()

        if (result.recordset.length === 0) {
            return null
        }

        return result.recordset[0]
    } catch (error) {
        console.error(`Failed to fetch external product for UPC ${upc}:`, error)
        return null
    }
}

export async function getExternalBrands(): Promise<string[]> {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const config = await getDBConfig()
    if (!config) return []

    try {
        const pool = await sql.connect(config)

        const query = 'SELECT DISTINCT F155 as brand FROM positems WHERE F155 IS NOT NULL AND F155 != \'\' ORDER BY F155'

        const result = await pool.request().query(query)

        await pool.close()

        return result.recordset.map(row => row.brand)
    } catch (error) {
        console.error('Failed to fetch external brands:', error)
        return []
    }
}

export async function getExternalProductsByBrand(brand: string): Promise<Product[]> {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const config = await getDBConfig()
    if (!config) return []

    try {
        const pool = await sql.connect(config)
        const request = pool.request()

        const query = 'SELECT F01 as upc, F155 as brand, F22 as size, F238 as department, F29 as name FROM positems WHERE F155 = @brand ORDER BY F29 ASC'
        request.input('brand', sql.NVarChar, brand)

        const result = await request.query(query)

        await pool.close()

        return result.recordset.map(row => ({
            upc: String(row.upc || ''),
            brand: row.brand || '',
            size: row.size || '',
            department: row.department || '',
            name: row.name || 'Unknown Product'
        }))
    } catch (error) {
        console.error(`Failed to fetch external products for brand ${brand}:`, error)
        return []
    }
}

export async function getExternalProductsByUPCs(upcs: string[]): Promise<Product[]> {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    if (!upcs.length) return []
    const config = await getDBConfig()
    if (!config) return []

    try {
        const pool = await sql.connect(config)
        const request = pool.request()

        const params = upcs.map((_, i) => `@upc${i}`).join(',')
        upcs.forEach((upc, i) => {
            request.input(`upc${i}`, sql.NVarChar, upc)
        })

        const query = `SELECT F01 as upc, F155 as brand, F22 as size, F238 as department, F29 as name FROM positems WHERE F01 IN (${params})`

        const result = await request.query(query)

        await pool.close()

        return result.recordset.map(row => ({
            upc: String(row.upc || ''),
            brand: row.brand || '',
            size: row.size || '',
            department: row.department || '',
            name: row.name || 'Unknown Product'
        }))
    } catch (error) {
        console.error('Failed to fetch external products by UPCs:', error)
        return []
    }
}
