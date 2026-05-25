import { updateColorPalette, createColorPalette, getColorPalettes, deleteColorPalette } from '@/app/actions/color-palettes';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

jest.mock('@/lib/prisma', () => ({
    prisma: {
        colorPalette: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findMany: jest.fn(),
        }
    }
}));

jest.mock('@/lib/session', () => ({
    getSession: jest.fn(),
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

describe('color-palettes actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getColorPalettes', () => {
        it('should return palettes successfully', async () => {
            (getSession as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } });
            (prisma.colorPalette.findMany as jest.Mock).mockResolvedValue([
                { id: '1', name: 'Palette 1', colors: '["#000"]' }
            ]);

            const result = await getColorPalettes();

            expect(result.success).toBe(true);
            expect(result.data).toEqual([{ id: '1', name: 'Palette 1', colors: '["#000"]' }]);
            expect(prisma.colorPalette.findMany).toHaveBeenCalledWith({
                orderBy: { name: 'asc' }
            });
        });

        it('should throw an error if unauthorized', async () => {
            (getSession as jest.Mock).mockResolvedValue(null);

            await expect(getColorPalettes()).rejects.toThrow("Unauthorized");
            expect(prisma.colorPalette.findMany).not.toHaveBeenCalled();
        });

        it('should handle errors thrown during fetch', async () => {
            (getSession as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } });
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            (prisma.colorPalette.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'));

            const result = await getColorPalettes();

            expect(result.success).toBe(false);
            expect(result.error).toBe('Failed to fetch color palettes');
            expect(consoleSpy).toHaveBeenCalledWith('Error fetching color palettes:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });

    describe('createColorPalette', () => {
        it('should create successfully when no name collision exists', async () => {
            (getSession as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } });

            (prisma.colorPalette.findUnique as jest.Mock).mockResolvedValue(null);

            (prisma.colorPalette.create as jest.Mock).mockResolvedValue({
                id: 'new-id',
                name: 'new-name',
                colors: JSON.stringify(['#fff'])
            });

            const result = await createColorPalette({
                name: 'new-name',
                colors: ['#fff']
            });

            expect(result.success).toBe(true);
            expect(result.data).toEqual({
                id: 'new-id',
                name: 'new-name',
                colors: '["#fff"]'
            });
            expect(prisma.colorPalette.findUnique).toHaveBeenCalledWith({
                where: { name: 'new-name' }
            });
            expect(prisma.colorPalette.create).toHaveBeenCalledWith({
                data: {
                    name: 'new-name',
                    colors: JSON.stringify(['#fff'])
                }
            });
            expect(revalidatePath).toHaveBeenCalledWith('/admin/color-palettes');
        });

        it('should return error if name collision exists', async () => {
            (getSession as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } });

            (prisma.colorPalette.findUnique as jest.Mock).mockResolvedValue({
                id: 'existing-id',
                name: 'duplicate-name',
            });

            const result = await createColorPalette({
                name: 'duplicate-name',
                colors: ['#fff']
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('A palette with this name already exists');
            expect(prisma.colorPalette.create).not.toHaveBeenCalled();
            expect(prisma.colorPalette.findUnique).toHaveBeenCalledWith({
                where: { name: 'duplicate-name' }
            });
        });

        it('should throw an error if unauthorized', async () => {
            (getSession as jest.Mock).mockResolvedValue(null);

            await expect(createColorPalette({
                name: 'duplicate-name',
                colors: ['#fff']
            })).rejects.toThrow("Unauthorized");
            expect(prisma.colorPalette.create).not.toHaveBeenCalled();
            expect(prisma.colorPalette.findUnique).not.toHaveBeenCalled();
        });

        it('should handle errors thrown during creation', async () => {
            (getSession as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } });
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            (prisma.colorPalette.findUnique as jest.Mock).mockResolvedValue(null);
            (prisma.colorPalette.create as jest.Mock).mockRejectedValue(new Error('DB Error'));

            const result = await createColorPalette({
                name: 'new-name',
                colors: ['#fff']
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Failed to create color palette');
            expect(consoleSpy).toHaveBeenCalledWith('Error creating color palette:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });

    describe('updateColorPalette', () => {
        it('should update successfully when no name collision exists', async () => {
            (getSession as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } });

            (prisma.colorPalette.findFirst as jest.Mock).mockResolvedValue(null);

            (prisma.colorPalette.update as jest.Mock).mockResolvedValue({
                id: 'current-id',
                name: 'new-name',
                colors: JSON.stringify(['#fff'])
            });

            const result = await updateColorPalette('current-id', {
                name: 'new-name',
                colors: ['#fff']
            });

            expect(result.success).toBe(true);
            expect(result.data).toEqual({
                id: 'current-id',
                name: 'new-name',
                colors: '["#fff"]'
            });
            expect(prisma.colorPalette.findFirst).toHaveBeenCalledWith({
                where: {
                    name: 'new-name',
                    id: { not: 'current-id' }
                }
            });
            expect(prisma.colorPalette.update).toHaveBeenCalledWith({
                where: { id: 'current-id' },
                data: {
                    name: 'new-name',
                    colors: JSON.stringify(['#fff'])
                }
            });
            expect(revalidatePath).toHaveBeenCalledWith('/admin/color-palettes');
        });

        it('should return error if name collision exists', async () => {
            (getSession as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } });

            (prisma.colorPalette.findFirst as jest.Mock).mockResolvedValue({
                id: 'existing-id',
                name: 'duplicate-name',
            });

            const result = await updateColorPalette('current-id', {
                name: 'duplicate-name',
                colors: ['#fff']
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('A palette with this name already exists');
            expect(prisma.colorPalette.update).not.toHaveBeenCalled();
            expect(prisma.colorPalette.findFirst).toHaveBeenCalledWith({
                where: {
                    name: 'duplicate-name',
                    id: { not: 'current-id' }
                }
            });
        });

        it('should throw an error if unauthorized', async () => {
            (getSession as jest.Mock).mockResolvedValue(null);

            await expect(updateColorPalette('current-id', {
                name: 'duplicate-name',
                colors: ['#fff']
            })).rejects.toThrow("Unauthorized");
            expect(prisma.colorPalette.update).not.toHaveBeenCalled();
            expect(prisma.colorPalette.findFirst).not.toHaveBeenCalled();
        });

        it('should handle errors thrown during update', async () => {
            (getSession as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } });
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            (prisma.colorPalette.findFirst as jest.Mock).mockResolvedValue(null);
            (prisma.colorPalette.update as jest.Mock).mockRejectedValue(new Error('DB Error'));

            const result = await updateColorPalette('current-id', {
                name: 'new-name',
                colors: ['#fff']
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Failed to update color palette');
            expect(consoleSpy).toHaveBeenCalledWith('Error updating color palette:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });

    describe('deleteColorPalette', () => {
        it('should delete successfully', async () => {
            (getSession as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } });

            (prisma.colorPalette.delete as jest.Mock).mockResolvedValue({
                id: 'current-id',
            });

            const result = await deleteColorPalette('current-id');

            expect(result.success).toBe(true);
            expect(prisma.colorPalette.delete).toHaveBeenCalledWith({
                where: { id: 'current-id' }
            });
            expect(revalidatePath).toHaveBeenCalledWith('/admin/color-palettes');
        });

        it('should throw an error if unauthorized', async () => {
            (getSession as jest.Mock).mockResolvedValue(null);

            await expect(deleteColorPalette('current-id')).rejects.toThrow("Unauthorized");
            expect(prisma.colorPalette.delete).not.toHaveBeenCalled();
        });

        it('should handle errors thrown during deletion', async () => {
            (getSession as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } });
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            (prisma.colorPalette.delete as jest.Mock).mockRejectedValue(new Error('DB Error'));

            const result = await deleteColorPalette('current-id');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Failed to delete color palette');
            expect(consoleSpy).toHaveBeenCalledWith('Error deleting color palette:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });
});
