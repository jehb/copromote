const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mockPrisma = {
    socialPost: {
        upsert: async (args: any) => {
            await delay(10); // Simulate network/DB latency of 10ms per query
            return { id: args.where.id };
        }
    }
};

async function run() {
    console.log("Creating mock data...");
    const mockData = Array.from({ length: 100 }).map((_, i) => ({
        ID: `post-${i}`,
        Content: `Benchmark Post Content ${i}`,
        Platform: 'Twitter',
        'Scheduled Date': new Date().toISOString(),
        Status: 'draft'
    }));

    console.log("Starting sequential run...");
    const startSequential = Date.now();
    let countSeq = 0;
    for (const row of mockData) {
        await mockPrisma.socialPost.upsert({
            where: { id: row.ID || '' },
            update: {},
            create: {}
        });
        countSeq++;
    }
    const endSequential = Date.now();
    console.log(`Sequential Run completed. Processed ${countSeq} items in ${endSequential - startSequential} ms.`);

    console.log("Starting Parallel run...");
    const startParallel = Date.now();
    const promises = mockData.map(row => mockPrisma.socialPost.upsert({
        where: { id: row.ID || '' },
        update: {},
        create: {}
    }));
    await Promise.all(promises);
    const endParallel = Date.now();
    console.log(`Parallel Run completed. Processed ${mockData.length} items in ${endParallel - startParallel} ms.`);

    console.log(`Improvement: ${(endSequential - startSequential) - (endParallel - startParallel)} ms`);
}

run().catch(console.error);
