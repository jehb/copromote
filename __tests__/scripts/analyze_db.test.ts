const mockDisconnect = jest.fn().mockResolvedValue(undefined);
const mockCount = jest.fn();
const mockGroupBy = jest.fn();

jest.mock('@prisma/client', () => {
    return {
        PrismaClient: jest.fn().mockImplementation(() => {
            const models = [
                'project', 'asset', 'calendarEvent', 'promotionPeriod', 'socialPost',
                'user', 'event', 'task', 'contact', 'organization', 'emailPlan', 'emailItem'
            ];

            const client: any = {
                $disconnect: mockDisconnect,
                task: { groupBy: mockGroupBy },
                project: { groupBy: mockGroupBy }
            };

            models.forEach(model => {
                client[model] = { ...client[model], count: mockCount };
            });

            return client;
        }),
    };
});

describe('analyze_db script', () => {
    let originalConsoleLog: any;
    let originalConsoleError: any;

    beforeEach(() => {
        originalConsoleLog = console.log;
        originalConsoleError = console.error;
        console.log = jest.fn();
        console.error = jest.fn();
        jest.clearAllMocks();
    });

    afterEach(() => {
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        jest.resetModules();
    });

    it('should catch and log errors during model counting', async () => {
        mockCount.mockRejectedValueOnce(new Error('Simulated count error'));
        mockCount.mockResolvedValue(5);
        mockGroupBy.mockResolvedValue([]);

        require('../../analyze_db.ts');

        // Wait for promise chain to resolve
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(console.error).toHaveBeenCalledWith('Error counting project:', 'Simulated count error');
        expect(console.log).toHaveBeenCalledWith('DB_ANALYSIS_RESULT:', expect.any(String));
        expect(mockDisconnect).toHaveBeenCalled();
    });

    it('should catch errors during groupBy operations without crashing', async () => {
        mockCount.mockResolvedValue(5);
        mockGroupBy.mockRejectedValueOnce(new Error('Simulated groupBy error'));

        require('../../analyze_db.ts');

        // Wait for promise chain to resolve
        await new Promise(resolve => setTimeout(resolve, 100));

        // Script should finish successfully even if groupBy fails
        expect(console.log).toHaveBeenCalledWith('DB_ANALYSIS_RESULT:', expect.any(String));
        expect(mockDisconnect).toHaveBeenCalled();
    });
});
