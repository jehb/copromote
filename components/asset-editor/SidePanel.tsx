import React, { useRef } from 'react';
import { SidebarTab, EditorElement } from './types';

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
    elements: EditorElement[];
    setElements: (elements: EditorElement[]) => void;
    selectedIds: string[];
    setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
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
    elements,
    setElements,
    selectedIds,
    setSelectedIds
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
                        <div className="text-center text-sm text-neutral-500 mt-4">
                            Images will appear on canvas.
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
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={() => {
                                setElements([
                                    { id: `rect-${Date.now()}`, type: 'rect', x: 50, y: 50, width: 700, height: 500, fill: '#f3f4f6' },
                                    { id: `text-${Date.now() + 1}`, type: 'text', x: 100, y: 100, text: 'Hello World', fontSize: 64, fontFamily: 'Arial', fill: '#111827', fontStyle: 'bold' }
                                ]);
                            }}
                            className="w-full aspect-video bg-neutral-100 rounded-lg border hover:border-blue-500 overflow-hidden relative group transition-colors"
                        >
                            <div className="absolute inset-0 flex items-center justify-center p-4">
                                <span className="text-2xl font-bold text-neutral-800">Hello World</span>
                            </div>
                        </button>

                        <button
                            onClick={() => {
                                setElements([
                                    { id: `circle-${Date.now()}`, type: 'circle', x: 400, y: 300, width: 400, height: 400, fill: '#3b82f6' },
                                    { id: `text-${Date.now() + 1}`, type: 'text', x: 250, y: 280, text: 'Modern Design', fontSize: 48, fontFamily: 'Georgia', fill: '#ffffff' }
                                ]);
                            }}
                            className="w-full aspect-video bg-blue-500 rounded-lg border hover:border-blue-700 overflow-hidden relative group transition-colors"
                        >
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xl font-serif text-white">Modern Design</span>
                            </div>
                        </button>
                    </div>
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
