import { prisma } from '@/lib/prisma';
import { getSavedAssets, createSavedAsset, updateSavedAsset, deleteSavedAsset } from '@/app/actions/saved-assets';
import { revalidatePath } from 'next/cache';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        savedAsset: {
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    },
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

describe('Saved Assets Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    describe('getSavedAssets', () => {
        it('should return saved assets list', async () => {
            const mockAssets = [
                { id: '1', name: 'Asset 1', category: 'Logos' },
                { id: '2', name: 'Asset 2', category: 'Backgrounds' },
            ];
            (prisma.savedAsset.findMany as jest.Mock).mockResolvedValue(mockAssets);

            const result = await getSavedAssets();

            expect(result).toEqual(mockAssets);
            expect(prisma.savedAsset.findMany).toHaveBeenCalledWith({
                orderBy: [{ category: 'asc' }, { createdAt: 'desc' }],
            });
        });

        it('should return empty array on failure', async () => {
            (prisma.savedAsset.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'));

            const result = await getSavedAssets();

            expect(result).toEqual([]);
        });
    });

    describe('createSavedAsset', () => {
        it('should create saved asset successfully', async () => {
            const mockData = { name: 'Test', category: 'General', elements: [], canvasSize: { w: 100, h: 100 }, canvasBg: '#fff' };
            const mockAsset = { id: '1', ...mockData };
            (prisma.savedAsset.create as jest.Mock).mockResolvedValue(mockAsset);

            const result = await createSavedAsset(mockData);

            expect(result).toEqual({ success: true, data: mockAsset });
            expect(prisma.savedAsset.create).toHaveBeenCalledWith({
                data: mockData,
            });
            expect(revalidatePath).toHaveBeenCalledWith('/asset-editor');
        });

        it('should handle creation failure', async () => {
            const mockData = { name: 'Test', category: 'General', elements: [], canvasSize: { w: 100, h: 100 }, canvasBg: '#fff' };
            (prisma.savedAsset.create as jest.Mock).mockRejectedValue(new Error('DB Error'));

            const result = await createSavedAsset(mockData);

            expect(result).toEqual({ success: false, error: 'Failed to create saved asset: Error: DB Error' });
        });
    });

    describe('updateSavedAsset', () => {
        it('should update saved asset successfully', async () => {
            const mockData = { name: 'Test New' };
            const mockAsset = { id: '1', name: 'Test New', category: 'General' };
            (prisma.savedAsset.update as jest.Mock).mockResolvedValue(mockAsset);

            const result = await updateSavedAsset('1', mockData);

            expect(result).toEqual({ success: true, data: mockAsset });
            expect(prisma.savedAsset.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: { ...mockData, canvasSize: undefined, elements: undefined },
            });
            expect(revalidatePath).toHaveBeenCalledWith('/asset-editor');
        });

        it('should handle update failure', async () => {
            const mockData = { name: 'Test New' };
            (prisma.savedAsset.update as jest.Mock).mockRejectedValue(new Error('DB Error'));

            const result = await updateSavedAsset('1', mockData);

            expect(result).toEqual({ success: false, error: 'Failed to update saved asset' });
        });
    });

    describe('deleteSavedAsset', () => {
        it('should delete saved asset successfully', async () => {
            (prisma.savedAsset.delete as jest.Mock).mockResolvedValue({ id: '1' });

            const result = await deleteSavedAsset('1');

            expect(result).toEqual({ success: true });
            expect(prisma.savedAsset.delete).toHaveBeenCalledWith({ where: { id: '1' } });
            expect(revalidatePath).toHaveBeenCalledWith('/asset-editor');
        });

        it('should handle delete failure', async () => {
            (prisma.savedAsset.delete as jest.Mock).mockRejectedValue(new Error('DB Error'));

            const result = await deleteSavedAsset('1');

            expect(result).toEqual({ success: false, error: 'Failed to delete saved asset' });
        });
    });
});
