import React, { useRef } from 'react';
import { SidebarTab, EditorElement } from './types';
import TemplatesTab from './TemplatesTab';

interface SidePanelProps {
    activeTab: SidebarTab | null;
    onAddText: (text: string, fontSize: number, fontFamily: string) => void;
    onAddRect: () => void;
    onAddCircle: () => void;
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    canvasBg: string;
    setCanvasBg: (bg: string) => void;
    canvasSize: { width: number, height: number };
    setCanvasSize: (size: { width: number, height: number }) => void;
    onAddIcon: (iconPath: string) => void;
    elements: EditorElement[];
    setElements: (elements: EditorElement[]) => void;
    selectedIds: string[];
    setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
    photos?: any[];
}

export default function SidePanel({
    activeTab,
    onAddText,
    onAddRect,
    onAddCircle,
    onImageUpload,
    canvasBg,
    setCanvasBg,
    canvasSize,
    setCanvasSize,
    onAddIcon,
    elements,
    setElements,
    selectedIds,
    setSelectedIds,
    photos = []
}: SidePanelProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!activeTab) return null;

    return (
        <div className="w-72 bg-white border-r h-full flex flex-col z-10 shadow-sm flex-shrink-0 animate-in slide-in-from-left-8 duration-200">
            <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-neutral-800 capitalize">{activeTab}</h2>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
                {activeTab === 'text' && (
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => onAddText('Add a heading', 48, 'sans-serif')}
                            className="p-3 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-left transition-colors"
                        >
                            <span className="text-3xl font-bold text-neutral-800">Add a heading</span>
                        </button>
                        <button
                            onClick={() => onAddText('Add a subheading', 32, 'sans-serif')}
                            className="p-3 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-left transition-colors"
                        >
                            <span className="text-xl font-semibold text-neutral-700">Add a subheading</span>
                        </button>
                        <button
                            onClick={() => onAddText('Add a little bit of body text', 18, 'sans-serif')}
                            className="p-3 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-left transition-colors"
                        >
                            <span className="text-sm text-neutral-600">Add a little bit of body text</span>
                        </button>
                    </div>
                )}

                {activeTab === 'shapes' && (
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={onAddRect}
                            className="aspect-square bg-neutral-100 hover:bg-neutral-200 rounded-lg flex items-center justify-center transition-colors border border-neutral-200"
                        >
                            <div className="w-12 h-12 bg-neutral-400"></div>
                        </button>
                        <button
                            onClick={onAddCircle}
                            className="aspect-square bg-neutral-100 hover:bg-neutral-200 rounded-lg flex items-center justify-center transition-colors border border-neutral-200"
                        >
                            <div className="w-12 h-12 bg-neutral-400 rounded-full"></div>
                        </button>
                    </div>
                )}

                {activeTab === 'icons' && (
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={() => onAddIcon("M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z")}
                            className="aspect-square bg-neutral-100 hover:bg-neutral-200 rounded-lg flex items-center justify-center transition-colors border border-neutral-200"
                            title="Heart"
                        >
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className="text-neutral-600"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                        </button>
                        <button
                            onClick={() => onAddIcon("M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z")}
                            className="aspect-square bg-neutral-100 hover:bg-neutral-200 rounded-lg flex items-center justify-center transition-colors border border-neutral-200"
                            title="Star"
                        >
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className="text-neutral-600"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                        </button>
                        <button
                            onClick={() => onAddIcon("M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z")}
                            className="aspect-square bg-neutral-100 hover:bg-neutral-200 rounded-lg flex items-center justify-center transition-colors border border-neutral-200"
                            title="Cloud"
                        >
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className="text-neutral-600"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" /></svg>
                        </button>
                    </div>
                )}

                {activeTab === 'uploads' && (
                    <div className="flex flex-col gap-4">
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={(e) => {
                                onImageUpload(e);
                                if (fileInputRef.current) fileInputRef.current.value = ''; // reset
                            }}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                        >
                            Upload Media
                        </button>

                        <div className="w-full bg-neutral-200 h-px my-2" />
                        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Immich Gallery</h3>

                        <div className="grid grid-cols-2 gap-2">
                            {photos.length === 0 ? (
                                <div className="col-span-2 text-center text-sm text-neutral-500 py-4">
                                    No photos found in library.
                                </div>
                            ) : (
                                photos.map((photo) => (
                                    <button
                                        key={photo.id}
                                        onClick={() => {
                                            // Simulate a file upload event by fetching the blob from the proxy URL
                                            // OR we can just add a Konva Image element directly skipping FileReader

                                            // Since we already have a direct URL, it's cleaner to inject the element directly
                                            // But for MVP, let's keep it consistent with the existing `onImageUpload` signature 
                                            // by fetching and generating a Blob if possible, OR we refactor slightly.

                                            // Actually, `src` can just be the URL natively in use-image. Let's just create an element.
                                            const newElement = {
                                                id: `image-${Date.now()}-${photo.id}`,
                                                type: 'image' as const,
                                                x: 50,
                                                y: 50,
                                                width: 200,
                                                height: 200,
                                                src: photo.url, // "/api/immich/asset/[id]"
                                            };
                                            // Quick hack: we don't have direct access to append in SidePanel without bypassing `onImageUpload`. 
                                            // We do have `elements` and `setElements`. Just append it.
                                            setElements([...elements, newElement]);
                                        }}
                                        className="relative aspect-square rounded overflow-hidden group border border-neutral-200 hover:border-blue-500 transition-colors bg-neutral-100"
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={`${photo.url}?w=200&h=200&fit=crop`}
                                            alt={photo.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        />
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'background' && (
                    <div className="flex flex-col gap-2">
                        <label className="text-sm text-neutral-600 font-medium mb-2">Solid Color</label>
                        <div className="flex gap-2 flex-wrap">
                            {['#ffffff', '#000000', '#f87171', '#fb923c', '#fbbf24', '#a3e635', '#4ade80', '#34d399', '#2dd4bf', '#38bdf8', '#60a5fa', '#818cf8', '#a78bfa', '#e879f9', '#f472b6'].map(color => (
                                <button
                                    key={color}
                                    onClick={() => setCanvasBg(color)}
                                    className="w-8 h-8 rounded-full border border-neutral-200 hover:scale-110 transition-transform shadow-sm"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                        <div className="mt-4 flex flex-col gap-2">
                            <label className="text-sm text-neutral-600 font-medium">Custom Color</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={canvasBg}
                                    onChange={(e) => setCanvasBg(e.target.value)}
                                    className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                                />
                                <span className="text-sm text-neutral-700 uppercase font-mono">{canvasBg}</span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'templates' && (
                    <TemplatesTab
                        setElements={setElements}
                        setCanvasBg={setCanvasBg}
                        setCanvasSize={setCanvasSize}
                    />
                )}

                {activeTab === 'layers' && (
                    <div className="flex flex-col gap-2">
                        {elements.length === 0 ? (
                            <p className="text-sm text-neutral-500 italic">No elements on canvas.</p>
                        ) : (
                            [...elements].reverse().map((el, index) => {
                                // Calculate actual index in original array
                                const realIndex = elements.length - 1 - index;
                                const isSelected = selectedIds.includes(el.id);

                                const handleSelect = (e: React.MouseEvent) => {
                                    const metaPressed = e.shiftKey || e.ctrlKey || e.metaKey;
                                    if (metaPressed) {
                                        if (isSelected) {
                                            setSelectedIds(selectedIds.filter(id => id !== el.id));
                                        } else {
                                            setSelectedIds([...selectedIds, el.id]);
                                        }
                                    } else {
                                        setSelectedIds([el.id]);
                                    }
                                };

                                return (
                                    <div
                                        key={el.id}
                                        onClick={handleSelect}
                                        className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-neutral-200 bg-white hover:bg-neutral-50'}`}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-6 h-6 rounded bg-neutral-100 flex items-center justify-center shrink-0 border border-neutral-200">
                                                {el.type === 'rect' && <div className="w-3 h-3 bg-neutral-400" />}
                                                {el.type === 'circle' && <div className="w-3 h-3 bg-neutral-400 rounded-full" />}
                                                {el.type === 'image' && <span className="text-[10px] text-neutral-500 font-bold">IMG</span>}
                                                {el.type === 'text' && <span className="text-[10px] text-neutral-500 font-bold">T</span>}
                                            </div>
                                            <span className="text-xs font-medium text-neutral-700 truncate capitalize">
                                                {el.type} {el.text ? `"${el.text}"` : ''}
                                            </span>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setElements(elements.filter(e => e.id !== el.id));
                                                if (isSelected) setSelectedIds(selectedIds.filter(id => id !== el.id));
                                            }}
                                            className="p-1 text-neutral-400 hover:text-red-600 transition-colors"
                                            title="Delete Layer"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {activeTab === 'resize' && (
                    <div className="flex flex-col gap-6">
                        <div className="space-y-3">
                            <label className="text-sm text-neutral-600 font-medium">Custom Size (px)</label>
                            <div className="flex items-center gap-2">
                                <div className="flex flex-col gap-1 flex-1">
                                    <span className="text-xs text-neutral-400">Width</span>
                                    <input
                                        type="number"
                                        value={canvasSize.width}
                                        onChange={(e) => setCanvasSize({ ...canvasSize, width: Number(e.target.value) || 100 })}
                                        className="w-full h-9 px-2 text-sm border rounded focus:outline-none focus:border-blue-500"
                                        min={100}
                                    />
                                </div>
                                <span className="text-neutral-400 pt-4">×</span>
                                <div className="flex flex-col gap-1 flex-1">
                                    <span className="text-xs text-neutral-400">Height</span>
                                    <input
                                        type="number"
                                        value={canvasSize.height}
                                        onChange={(e) => setCanvasSize({ ...canvasSize, height: Number(e.target.value) || 100 })}
                                        className="w-full h-9 px-2 text-sm border rounded focus:outline-none focus:border-blue-500"
                                        min={100}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm text-neutral-600 font-medium">Presets</label>
                            <button
                                onClick={() => setCanvasSize({ width: 1080, height: 1080 })}
                                className="w-full p-2 text-left text-sm bg-neutral-50 hover:bg-neutral-100 rounded border border-neutral-200 transition-colors flex justify-between items-center"
                            >
                                <span>Instagram Post</span>
                                <span className="text-xs text-neutral-400">1080 × 1080</span>
                            </button>
                            <button
                                onClick={() => setCanvasSize({ width: 1920, height: 1080 })}
                                className="w-full p-2 text-left text-sm bg-neutral-50 hover:bg-neutral-100 rounded border border-neutral-200 transition-colors flex justify-between items-center"
                            >
                                <span>YouTube Thumbnail</span>
                                <span className="text-xs text-neutral-400">1920 × 1080</span>
                            </button>
                            <button
                                onClick={() => setCanvasSize({ width: 1080, height: 1920 })}
                                className="w-full p-2 text-left text-sm bg-neutral-50 hover:bg-neutral-100 rounded border border-neutral-200 transition-colors flex justify-between items-center"
                            >
                                <span>Story / Reel</span>
                                <span className="text-xs text-neutral-400">1080 × 1920</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
