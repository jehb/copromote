import * as dotenv from 'dotenv';
dotenv.config();
import * as immich from '@immich/sdk';

async function test() {
    try {
        immich.init({
            baseUrl: process.env.IMMICH_URL || '',
            apiKey: process.env.IMMICH_API_KEY || '',
        });

        const tags = await immich.getAllTags();
        console.log("tags type:", Array.isArray(tags));
        console.log("tags keys:", Object.keys(tags));
        console.log("tags data:", JSON.stringify(tags, null, 2));
    } catch (e: any) {
        console.error("error:", e);
    }
}
test();
