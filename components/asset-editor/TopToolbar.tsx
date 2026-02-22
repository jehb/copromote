import React from 'react';
import { EditorElement } from './types';
import { Trash2, Copy, BringToFront, SendToBack, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline } from 'lucide-react';

interface TopToolbarProps {
    selectedElement?: EditorElement;
    updateSelectedElement: (newProps: Partial<EditorElement>) => void;
    deleteSelected: () => void;
    duplicateSelected: () => void;
    bringForward: () => void;
    sendBackward: () => void;
}

export default function TopToolbar({
    selectedElement,
    updateSelectedElement,
    deleteSelected,
    duplicateSelected,
    bringForward,
    sendBackward
}: TopToolbarProps) {
    if (!selectedElement) {
        return (
            <div className="h-14 bg-white border-b flex items-center px-4 w-full shadow-sm shrink-0">
                <span className="text-sm text-neutral-400 italic">Select an element to edit properties</span>
            </div>
        );
    }

    const { type } = selectedElement;

    return (
        <div className="h-14 bg-white border-b flex items-center px-4 w-full shadow-sm gap-4 overflow-x-auto whitespace-nowrap scrollbar-hide shrink-0">

            {(type === 'rect' || type === 'circle' || type === 'text') && (
                <div className="flex items-center gap-2 border-r pr-4 border-neutral-200">
                    <span className="text-xs text-neutral-500 font-medium">Fill:</span>
                    <input
                        type="color"
                        value={selectedElement.fill || '#000000'}
                        onChange={(e) => updateSelectedElement({ fill: e.target.value })}
                        className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                    />
                </div>
            )}

            {(type === 'rect' || type === 'circle' || type === 'text') && (
                <div className="flex items-center gap-2 border-r pr-4 border-neutral-200">
                    <span className="text-xs text-neutral-500 font-medium">Border:</span>
                    <input
                        type="color"
                        value={selectedElement.stroke || '#000000'}
                        onChange={(e) => updateSelectedElement({ stroke: e.target.value })}
                        className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                    />
                    <input
                        type="number"
                        value={selectedElement.strokeWidth || 0}
                        onChange={(e) => updateSelectedElement({ strokeWidth: Number(e.target.value) })}
                        className="w-12 h-8 text-sm p-1 border rounded-md bg-neutral-50"
                        min={0}
                        max={100}
                        title="Border Width"
                    />
                </div>
            )}

            {type === 'text' && (
                <div className="flex items-center gap-2 border-r pr-4 border-neutral-200">
                    <span className="text-xs text-neutral-500 font-medium">Font:</span>
                    <select
                        value={selectedElement.fontFamily || 'Arial'}
                        onChange={(e) => updateSelectedElement({ fontFamily: e.target.value })}
                        className="h-8 text-sm border rounded-md bg-neutral-50 px-2 max-w-28 truncate"
                    >
                        {['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Impact'].map(font => (
                            <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                        ))}
                    </select>

                    <span className="text-xs text-neutral-500 font-medium ml-2">Size:</span>
                    <input
                        type="number"
                        value={selectedElement.fontSize || 24}
                        onChange={(e) => updateSelectedElement({ fontSize: Number(e.target.value) })}
                        className="w-16 h-8 text-sm p-1 border rounded-md bg-neutral-50"
                        min={8}
                        max={400}
                    />

                    <div className="flex bg-neutral-100 rounded-md p-0.5 ml-2 border border-neutral-200">
                        <button
                            className={`p-1.5 rounded transition-colors ${selectedElement.fontStyle?.includes('bold') ? 'bg-white shadow-sm' : 'hover:bg-white'} text-neutral-700`}
                            onClick={() => {
                                const current = selectedElement.fontStyle || '';
                                const isBold = current.includes('bold');
                                const newStyle = isBold ? current.replace('bold', '').trim() : `${current} bold`.trim();
                                updateSelectedElement({ fontStyle: newStyle });
                            }}
                        ><Bold size={14} /></button>
                        <button
                            className={`p-1.5 rounded transition-colors ${selectedElement.fontStyle?.includes('italic') ? 'bg-white shadow-sm' : 'hover:bg-white'} text-neutral-700`}
                            onClick={() => {
                                const current = selectedElement.fontStyle || '';
                                const isItalic = current.includes('italic');
                                const newStyle = isItalic ? current.replace('italic', '').trim() : `${current} italic`.trim();
                                updateSelectedElement({ fontStyle: newStyle });
                            }}
                        ><Italic size={14} /></button>
                        <button
                            className={`p-1.5 rounded transition-colors ${selectedElement.fontStyle?.includes('underline') ? 'bg-white shadow-sm' : 'hover:bg-white'} text-neutral-700`}
                            onClick={() => {
                                const current = selectedElement.fontStyle || '';
                                const isUnderline = current.includes('underline');
                                const newStyle = isUnderline ? current.replace('underline', '').trim() : `${current} underline`.trim();
                                updateSelectedElement({ fontStyle: newStyle });
                            }}
                        ><Underline size={14} /></button>
                    </div>
                </div>
            )}

            {type === 'image' && (
                <div className="flex items-center gap-4 border-r pr-4 border-neutral-200">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500 font-medium">Blur:</span>
                        <input
                            type="range"
                            min="0"
                            max="40"
                            step="1"
                            value={selectedElement.blurRadius || 0}
                            onChange={(e) => updateSelectedElement({ blurRadius: parseFloat(e.target.value) })}
                            className="w-20 accent-blue-600"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500 font-medium">Bright:</span>
                        <input
                            type="range"
                            min="-1"
                            max="1"
                            step="0.1"
                            value={selectedElement.brightness || 0}
                            onChange={(e) => updateSelectedElement({ brightness: parseFloat(e.target.value) })}
                            className="w-20 accent-blue-600"
                        />
                    </div>
                </div>
            )}

            <div className="flex items-center gap-2 border-r pr-4 border-neutral-200">
                <span className="text-xs text-neutral-500 font-medium">Opacity:</span>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={selectedElement.opacity !== undefined ? selectedElement.opacity : 1}
                    onChange={(e) => updateSelectedElement({ opacity: parseFloat(e.target.value) })}
                    className="w-24 accent-blue-600"
                />
            </div>

            <div className="flex-1"></div>

            {/* Universal Actions */}
            <div className="flex items-center gap-2">
                <button
                    onClick={bringForward}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-md transition-colors"
                >
                    <BringToFront size={14} />
                    Forward
                </button>
                <button
                    onClick={sendBackward}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-md transition-colors"
                >
                    <SendToBack size={14} />
                    Backward
                </button>
                <div className="w-px h-6 bg-neutral-200 mx-1"></div>
                <button
                    onClick={duplicateSelected}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-md transition-colors"
                >
                    <Copy size={14} />
                    Duplicate
                </button>
                <button
                    onClick={deleteSelected}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                    <Trash2 size={14} />
                    Delete
                </button>
            </div>
        </div>
    );
}
