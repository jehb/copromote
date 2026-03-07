import sql from 'mssql';
import { prisma } from '../../lib/db';

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

async function getColumns() {
    try {
        const config = await getDBConfig();
        if (!config) {
            console.error('No configuration found.');
            return;
        }

        console.log('Connecting to', config.server, config.database, '...');
        const pool = await sql.connect(config);

        console.log('Fetching columns for positems...');
        const result = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'positems'");

        console.log('\n--- Columns in `positems` ---');
        result.recordset.forEach(row => {
            console.log(`${row.COLUMN_NAME} (${row.DATA_TYPE})`);
        });

        await pool.close();
    } catch (err) {
        console.error('Error fetching columns:', err);
    }
}

getColumns();
