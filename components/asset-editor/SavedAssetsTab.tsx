import React, { useEffect, useState } from 'react';
import { EditorElement } from './types';
import { getSavedAssets, deleteSavedAsset } from '@/app/actions/saved-assets';

interface SavedAssetsTabProps {
    setElements: (elements: EditorElement[]) => void;
    setCanvasBg: (bg: string) => void;
    setCanvasSize: (size: { width: number, height: number }) => void;
}

export default function SavedAssetsTab({ setElements, setCanvasBg, setCanvasSize }: SavedAssetsTabProps) {
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadAssets = async () => {
        setLoading(true);
        try {
            const data = await getSavedAssets();
            setAssets(data);
        } catch (error) {
            console.error('Failed to load saved assets:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAssets();
    }, []);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this saved asset?')) {
            const result = await deleteSavedAsset(id);
            if (result.success) {
                loadAssets();
            } else {
                alert('Failed to delete asset.');
            }
        }
    };

    const handleLoadAsset = (asset: any) => {
        if (asset.canvasSize) {
            setCanvasSize(asset.canvasSize as { width: number, height: number });
        }
        if (asset.canvasBg) {
            setCanvasBg(asset.canvasBg);
        }
        if (asset.elements) {
            setElements(asset.elements as EditorElement[]);
        }
    };

    // Group assets by category
    const groupedAssets = assets.reduce((acc, asset: any) => {
        const category = asset.category || 'Uncategorized';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(asset);
        return acc;
    }, {} as Record<string, any[]>);

    return (
        <div className="flex flex-col gap-6">
            {loading ? (
                <div className="flex justify-center p-4">
                    <span className="text-sm text-neutral-500">Loading saved assets...</span>
                </div>
            ) : assets.length === 0 ? (
                <div className="flex justify-center p-4">
                    <span className="text-sm text-neutral-500">No saved assets found.</span>
                </div>
            ) : (
                Object.entries(groupedAssets).map(([category, items]) => (
                    <div key={category} className="flex flex-col gap-3">
                        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{category}</h3>
                        <div className="flex flex-col gap-4">
                            {(items as any[]).map((asset: any) => (
                                <div key={asset.id} className="relative group">
                                    <button
                                        onClick={() => handleLoadAsset(asset)}
                                        className="w-full aspect-video bg-neutral-100 rounded-lg border hover:border-blue-500 overflow-hidden relative transition-colors flex items-center justify-center p-2"
                                    >
                                        {asset.previewImage ? (
                                            <img
                                                src={asset.previewImage}
                                                alt={asset.name}
                                                className="object-contain w-full h-full"
                                            />
                                        ) : (
                                            <div className="text-sm text-neutral-400">No Preview</div>
                                        )}
                                    </button>
                                    <div className="flex justify-between items-center mt-2 px-1">
                                        <span className="text-sm font-medium text-neutral-700 truncate" title={asset.name}>
                                            {asset.name}
                                        </span>
                                        <button
                                            onClick={(e) => handleDelete(e, asset.id)}
                                            className="p-1 text-neutral-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete Asset"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 6h18" />
                                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
