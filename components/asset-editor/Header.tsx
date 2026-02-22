import React from 'react';
import { Undo2, Redo2, Download, Code } from 'lucide-react';

interface HeaderProps {
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    onDownloadImage: () => void;
    onDownloadJson: () => void;
    onSaveTemplate: () => void;
}

export default function Header({
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onDownloadImage,
    onDownloadJson,
    onSaveTemplate
}: HeaderProps) {
    return (
        <header className="h-14 bg-white border-b flex items-center justify-between px-6 z-30 shadow-sm shrink-0">
            <div className="flex items-center gap-4">
                <h1 className="text-lg font-bold text-neutral-800 tracking-tight">Promoty Assets</h1>

                <div className="flex items-center gap-1 border-l pl-4 ml-2">
                    <button
                        onClick={onUndo}
                        disabled={!canUndo}
                        className="p-1.5 rounded-md text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        title="Undo"
                    >
                        <Undo2 size={18} />
                    </button>
                    <button
                        onClick={onRedo}
                        disabled={!canRedo}
                        className="p-1.5 rounded-md text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        title="Redo"
                    >
                        <Redo2 size={18} />
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={onDownloadJson}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                    <Code size={16} />
                    Export JSON
                </button>
                <button
                    onClick={onSaveTemplate}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                    <Download size={16} /> {/* Placeholder icon, could be Save */}
                    Save Template
                </button>
                <button
                    onClick={onDownloadImage}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Download size={16} />
                    Download
                </button>
            </div>
        </header>
    );
}
