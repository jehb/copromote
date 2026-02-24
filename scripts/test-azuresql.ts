import 'dotenv/config'
import sql from 'mssql'

async function testConnection() {
    console.log('Testing connection with current .env variables...')
    const url = process.env.EXTERNAL_DB_URL || ''
    const user = process.env.EXTERNAL_DB_USER || ''
    const password = process.env.EXTERNAL_DB_PASSWORD || ''
    const type = process.env.EXTERNAL_DB_TYPE || ''
    const database = process.env.EXTERNAL_DB_NAME || ''

    const server = url.split('://')[1]?.split(':')[0] || url

    console.log(`Server: ${server}`)
    console.log(`User: ${user}`)
    console.log(`Database: ${database}`)

    const config = {
        user,
        password,
        server,
        database,
        options: {
            encrypt: true,
            trustServerCertificate: false
        }
    }

    try {
        const pool = await sql.connect(config)
        await pool.request().query('SELECT 1 as result')
        await pool.close()
        console.log('✅ Connection successful with current user:', user)
    } catch (error: any) {
        console.error('❌ Connection failed with current user:', user)
        console.error(error.message)

        // If it failed, try with @server format as in JDBC string
        console.log('\nRetrying with weaveruser@wsm-prod...')
        const config2 = { ...config, user: 'weaveruser@wsm-prod' }
        try {
            const pool2 = await sql.connect(config2)
            await pool2.request().query('SELECT 1 as result')
            await pool2.close()
            console.log('✅ Connection successful with updated user: weaveruser@wsm-prod')
            console.log('\nYou should update .env EXTERNAL_DB_USER="weaveruser@wsm-prod"')
        } catch (err2: any) {
            console.error('❌ Connection failed with weaveruser@wsm-prod either.')
            console.error(err2.message)
        }
    }
}

testConnection()
