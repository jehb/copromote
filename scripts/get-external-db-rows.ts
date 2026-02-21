import sql from 'mssql';
import { prisma } from '../lib/db';

async function getConfig(key: string) {
    const config = await prisma.config.findUnique({
        where: { key }
    });
    return config?.value?.trim() || null;
}

async function getDBConfig() {
    const url = await getConfig('EXTERNAL_DB_URL');
    const user = await getConfig('EXTERNAL_DB_USER');
    const password = await getConfig('EXTERNAL_DB_PASSWORD');
    const type = await getConfig('EXTERNAL_DB_TYPE');
    const database = await getConfig('EXTERNAL_DB_NAME');

    if (!url || type !== 'mssql') {
        console.error('Missing config:', { url, type });
        return null;
    }

    const server = url.split('://')[1]?.split(':')[0] || url;

    return {
        user: user || '',
        password: password || '',
        server,
        database: database || 'ProductsDB',
        options: {
            encrypt: true,
            trustServerCertificate: true
        }
    };
}

async function getRows() {
    try {
        const config = await getDBConfig();
        if (!config) {
            console.error('No configuration found.');
            return;
        }

        const pool = await sql.connect(config);

        // Fetch 10 random rows using ORDER BY NEWID()
        const result = await pool.request().query("SELECT TOP 10 * FROM positems ORDER BY NEWID()");

        console.log(JSON.stringify(result.recordset, null, 2));

        await pool.close();
    } catch (err) {
        console.error('Error fetching rows:', err);
    }
}

getRows();
