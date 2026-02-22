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
}

export default function SidePanel({
    activeTab,
    onAddText,
    onAddRect,
    onAddCircle,
    onImageUpload,
    canvasBg,
    setCanvasBg
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

                {['templates', 'layers', 'resize'].includes(activeTab) && (
                    <div className="flex items-center justify-center h-full text-neutral-400 text-sm">
                        Implementation coming soon.
                    </div>
                )}
            </div>
        </div>
    );
}
