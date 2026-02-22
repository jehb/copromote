import React, { useEffect, useState } from 'react';
import { EditorElement } from './types';
import { getAssetTemplates, deleteAssetTemplate } from '@/app/actions/asset-templates';

interface TemplatesTabProps {
    setElements: (elements: EditorElement[]) => void;
    setCanvasBg: (bg: string) => void;
    setCanvasSize: (size: { width: number, height: number }) => void;
}

export default function TemplatesTab({ setElements, setCanvasBg, setCanvasSize }: TemplatesTabProps) {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const data = await getAssetTemplates();
            setTemplates(data);
        } catch (error) {
            console.error('Failed to load templates:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTemplates();
    }, []);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this template?')) {
            const result = await deleteAssetTemplate(id);
            if (result.success) {
                loadTemplates();
            } else {
                alert('Failed to delete template.');
            }
        }
    };

    const handleLoadTemplate = (template: any) => {
        if (template.canvasSize) {
            setCanvasSize(template.canvasSize as { width: number, height: number });
        }
        if (template.canvasBg) {
            setCanvasBg(template.canvasBg);
        }
        if (template.elements) {
            setElements(template.elements as EditorElement[]);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {loading ? (
                <div className="flex justify-center p-4">
                    <span className="text-sm text-neutral-500">Loading templates...</span>
                </div>
            ) : templates.length === 0 ? (
                <div className="flex justify-center p-4">
                    <span className="text-sm text-neutral-500">No templates found.</span>
                </div>
            ) : (
                templates.map((template) => (
                    <div key={template.id} className="relative group">
                        <button
                            onClick={() => handleLoadTemplate(template)}
                            className="w-full aspect-video bg-neutral-100 rounded-lg border hover:border-blue-500 overflow-hidden relative transition-colors flex items-center justify-center p-2"
                        >
                            {template.previewImage ? (
                                <img
                                    src={template.previewImage}
                                    alt={template.name}
                                    className="object-contain w-full h-full"
                                />
                            ) : (
                                <div className="text-sm text-neutral-400">No Preview</div>
                            )}
                        </button>
                        <div className="flex justify-between items-center mt-2 px-1">
                            <span className="text-sm font-medium text-neutral-700 truncate" title={template.name}>
                                {template.name}
                            </span>
                            <button
                                onClick={(e) => handleDelete(e, template.id)}
                                className="p-1 text-neutral-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                title="Delete Template"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18" />
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))
            )}

            {/* Keeping some of the original custom templates for demonstration / default utility */}
            <div className="mt-6 border-t pt-4">
                <h3 className="text-xs font-semibold text-neutral-500 uppercase mb-4 tracking-wider">Default Examples</h3>
                <div className="flex flex-col gap-4">
                    <button
                        onClick={() => {
                            setCanvasSize({ width: 800, height: 600 });
                            setCanvasBg('#ffffff');
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
                            setCanvasSize({ width: 800, height: 600 });
                            setCanvasBg('#ffffff');
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
            </div>
        </div>
    );
}

