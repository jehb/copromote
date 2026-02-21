import sql from 'mssql'

async function test() {
    const config = {
        user: process.env.EXTERNAL_DB_USER,
        password: process.env.EXTERNAL_DB_PASSWORD,
        server: process.env.EXTERNAL_DB_URL ? process.env.EXTERNAL_DB_URL.split('://')[1]?.split(':')[0] : '',
        database: process.env.EXTERNAL_DB_NAME || 'ProductsDB',
        options: {
            encrypt: true,
            trustServerCertificate: false
        }
    }
    const pool = await sql.connect(config)
    const result = await pool.request().query('SELECT TOP 1 * FROM positems')
    console.log(Object.keys(result.recordset[0]))
    await pool.close()
}
test()
