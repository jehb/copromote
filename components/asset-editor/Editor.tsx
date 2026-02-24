'use client';

import React, { useState, useCallback, useRef } from 'react';
import { SidebarTab, EditorElement } from './types';
import Sidebar from './Sidebar';
import SidePanel from './SidePanel';
import TopToolbar from './TopToolbar';
import Workspace from './Workspace';
import Header from './Header';
import { createAssetTemplate } from '@/app/actions/asset-templates';
import { createSavedAsset } from '@/app/actions/saved-assets';
import { uploadPhoto } from '@/app/actions/photos';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

export default function Editor({ photos = [] }: { photos?: any[] }) {
    // Global State
    const [activeTab, setActiveTab] = useState<SidebarTab | null>('shapes');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [croppingId, setCroppingId] = useState<string | null>(null);
    const [canvasBg, setCanvasBg] = useState<string>('#ffffff');
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

    // History & Elements Data Structure (Undo/Redo implementation)
    const [history, setHistory] = useState<EditorElement[][]>([[]]);
    const [historyStep, setHistoryStep] = useState<number>(0);
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);

    // Save Asset State
    const [isSavingAssetDialog, setIsSavingAssetDialog] = useState(false);
    const [assetName, setAssetName] = useState('');
    const [assetCategory, setAssetCategory] = useState('');
    const [isSavingAsset, setIsSavingAsset] = useState(false);

    // Stage ref for exports
    const stageRef = useRef<any>(null);

    // Derived current elements
    const elements = history[historyStep] || [];

    // Core state updater
    const updateHistory = useCallback((newElements: EditorElement[]) => {
        // Slice history up to current step (discards future redos if we branch)
        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(newElements);
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
    }, [history, historyStep]);

    const selectedElements = elements.filter((el) => selectedIds.includes(el.id));
    // Provide a single selected element backward compatibility for Toolbar
    const selectedElement = selectedElements.length === 1 ? selectedElements[0] : undefined;

    // --- Actions --- //

    const undo = () => {
        if (historyStep > 0) {
            setHistoryStep(historyStep - 1);
            setSelectedIds([]);
        }
    };

    const redo = () => {
        if (historyStep < history.length - 1) {
            setHistoryStep(historyStep + 1);
            setSelectedIds([]);
        }
    };

    const downloadImage = () => {
        if (!stageRef.current) return;
        // Temporarily deselect to hide transformer
        setSelectedIds([]);
        // Add minimal delay to let React re-render without transformer
        setTimeout(() => {
            const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 });
            const link = document.createElement('a');
            link.download = 'copromote-asset.png';
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }, 50);
    };

    const downloadJson = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(elements));
        const link = document.createElement('a');
        link.setAttribute("href", dataStr);
        link.setAttribute("download", "copromote-asset.json");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadHtml = () => {
        if (!stageRef.current) return;

        // Helper to map element properties to CSS styles
        const buildStyles = (el: EditorElement) => {
            const isCentered = ['circle', 'star', 'polygon', 'ring'].includes(el.type);

            // For ring, use outerRadius * 2 if possible
            let w = el.width || 0;
            let h = el.height || 0;
            if (el.type === 'ring') {
                w = (el.outerRadius || 50) * 2;
                h = w;
            }

            const left = isCentered ? el.x - w / 2 : el.x;
            const top = isCentered ? el.y - h / 2 : el.y;

            const styles: Record<string, string | number> = {
                position: 'absolute',
                left: `${left}px`,
                top: `${top}px`,
                width: `${w}px`,
                height: `${h}px`,
                opacity: el.opacity ?? 1,
            };

            if (el.rotation) {
                styles.transform = `rotate(${el.rotation}deg)`;
                styles['transform-origin'] = isCentered ? 'center center' : 'top left';
            }

            if (el.shadowColor) {
                styles.filter = `drop-shadow(${el.shadowOffsetX || 0}px ${el.shadowOffsetY || 0}px ${el.shadowBlur || 0}px ${el.shadowColor})`;
            }

            return Object.entries(styles).map(([k, v]) => `${k.replace(/([A-Z])/g, "-$1").toLowerCase()}:${v}`).join(';');
        };

        const renderElement = (el: EditorElement): string => {
            const styleArgs = buildStyles(el);

            switch (el.type) {
                case 'rect':
                    return `<div style="${styleArgs}; background-color: ${el.fill || 'transparent'}; border: ${el.strokeWidth || 0}px solid ${el.stroke || 'transparent'}; border-radius: ${el.cornerRadius || 0}px; box-sizing: border-box;"></div>`;
                case 'circle':
                    return `<div style="${styleArgs}; background-color: ${el.fill || 'transparent'}; border: ${el.strokeWidth || 0}px solid ${el.stroke || 'transparent'}; border-radius: 50%; box-sizing: border-box;"></div>`;
                case 'text':
                    let textHtml = (el.text || '').replace(/\n/g, '<br/>');
                    if (el.isList) {
                        textHtml = `<ul>${(el.text || '').split('\n').map(item => `<li>${item.replace(/^•\s*/, '')}</li>`).join('')}</ul>`;
                    }
                    return `<div style="${styleArgs}; color: ${el.fill || '#000'}; font-family: ${el.fontFamily || 'sans-serif'}; font-size: ${el.fontSize || 16}px; text-align: ${el.align || 'left'}; font-weight: ${el.fontStyle?.includes('bold') ? 'bold' : 'normal'}; font-style: ${el.fontStyle?.includes('italic') ? 'italic' : 'normal'}; text-decoration: ${el.fontStyle?.includes('underline') ? 'underline' : 'none'};">${textHtml}</div>`;
                case 'image':
                    return `<img src="${el.src}" style="${styleArgs}; object-fit: contain; filter: blur(${el.blurRadius || 0}px) brightness(${1 + (el.brightness || 0)});" />`;
                case 'group':
                    return `<div style="${styleArgs}">${(el.children || []).map(child => renderElement({ ...child, x: child.x + el.x, y: child.y + el.y })).join('\n')}</div>`;
                case 'path':
                case 'icon':
                    // scaleX/Y for icon based on 24px viewBox
                    const scaleX = (el.width || 100) / 24;
                    const scaleY = (el.height || 100) / 24;
                    const transformStr = el.type === 'icon' ? `scale(${scaleX}, ${scaleY})` : '';
                    return `<svg style="${styleArgs}; overflow: visible;"><g transform="${transformStr}"><path d="${el.iconPath}" fill="${el.fill || '#000'}" /></g></svg>`;
                case 'line':
                    if (!el.points) return '';
                    return `<svg style="${styleArgs}; overflow: visible;"><line x1="${el.points[0]}" y1="${el.points[1]}" x2="${el.points[2]}" y2="${el.points[3]}" stroke="${el.stroke || '#000'}" stroke-width="${el.strokeWidth || 1}" /></svg>`;
                case 'arrow':
                    if (!el.points) return '';
                    // Crude arrow wrapper (doesn't draw the head perfectly in standard SVG without marker config)
                    return `<svg style="${styleArgs}; overflow: visible;"><line x1="${el.points[0]}" y1="${el.points[1]}" x2="${el.points[2]}" y2="${el.points[3]}" stroke="${el.stroke || '#000'}" stroke-width="${el.strokeWidth || 1}" /></svg>`;
                case 'star': {
                    const w = el.width || 100;
                    const numPoints = 5;
                    const outerRadius = w / 2;
                    const innerRadius = w / 4;
                    let path = "";
                    for (let i = 0; i < numPoints * 2; i++) {
                        const radius = i % 2 === 0 ? outerRadius : innerRadius;
                        const angle = (i * Math.PI) / numPoints - Math.PI / 2;
                        const px = outerRadius + radius * Math.cos(angle);
                        const py = outerRadius + radius * Math.sin(angle);
                        path += `${i === 0 ? 'M' : 'L'} ${px} ${py} `;
                    }
                    path += 'Z';
                    return `<svg style="${styleArgs}; overflow: visible;" viewBox="0 0 ${w} ${w}"><path d="${path}" fill="${el.fill || 'transparent'}" stroke="${el.stroke || 'transparent'}" stroke-width="${el.strokeWidth || 0}" /></svg>`;
                }
                case 'polygon': {
                    const w = el.width || 100;
                    const sides = el.sides || 3;
                    const radius = w / 2;
                    let path = "";
                    for (let i = 0; i < sides; i++) {
                        const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
                        const px = radius + radius * Math.cos(angle);
                        const py = radius + radius * Math.sin(angle);
                        path += `${i === 0 ? 'M' : 'L'} ${px} ${py} `;
                    }
                    path += 'Z';
                    return `<svg style="${styleArgs}; overflow: visible;" viewBox="0 0 ${w} ${w}"><path d="${path}" fill="${el.fill || 'transparent'}" stroke="${el.stroke || 'transparent'}" stroke-width="${el.strokeWidth || 0}" /></svg>`;
                }
                case 'ring': {
                    const outerRadius = el.outerRadius || 50;
                    const innerRadius = el.innerRadius || 30;
                    const w = outerRadius * 2;
                    const cx = outerRadius;
                    const cy = outerRadius;
                    const path = `M ${cx} ${cy - outerRadius} A ${outerRadius} ${outerRadius} 0 1 1 ${cx} ${cy + outerRadius} A ${outerRadius} ${outerRadius} 0 1 1 ${cx} ${cy - outerRadius} Z M ${cx} ${cy - innerRadius} A ${innerRadius} ${innerRadius} 0 1 0 ${cx} ${cy + innerRadius} A ${innerRadius} ${innerRadius} 0 1 0 ${cx} ${cy - innerRadius} Z`;
                    return `<svg style="${styleArgs}; overflow: visible;" viewBox="0 0 ${w} ${w}"><path d="${path}" fill="${el.fill || 'transparent'}" fill-rule="evenodd" stroke="${el.stroke || 'transparent'}" stroke-width="${el.strokeWidth || 0}" /></svg>`;
                }
                default:
                    return '';
            }
        };

        const htmlElements = elements.map(renderElement).join('\n        ');

        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Co+promote Asset Preview</title>
    <style>
        body, html { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #f3f4f6; font-family: sans-serif; }
        .canvas-container { 
            position: relative; 
            width: ${canvasSize.width}px; 
            height: ${canvasSize.height}px; 
            background-color: ${canvasBg};
            box-shadow: 0 10px 25px rgba(0,0,0,0.1); 
            overflow: hidden;
        }
        ul { margin: 0; padding-left: 1.5rem; }
    </style>
</head>
<body>
    <div class="canvas-container">
        ${htmlElements}
    </div>
</body>
</html>
        `;

        const dataStr = "data:text/html;charset=utf-8," + encodeURIComponent(htmlContent.trim());
        const link = document.createElement('a');
        link.setAttribute("href", dataStr);
        link.setAttribute("download", "copromote-asset.html");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const saveAsTemplate = async () => {
        if (!stageRef.current) return;

        const templateName = prompt('Enter a name for this template:');
        if (!templateName || templateName.trim() === '') return;

        setIsSavingTemplate(true);
        try {
            // Deselect to hide transformer for preview image
            const prevSelected = [...selectedIds];
            setSelectedIds([]);

            // Wait for React to re-render without transformer
            await new Promise(resolve => setTimeout(resolve, 50));

            // Generate a smaller preview image
            const previewImage = stageRef.current.toDataURL({ pixelRatio: 0.5 });

            // Restore selection
            setSelectedIds(prevSelected);

            const result = await createAssetTemplate({
                name: templateName.trim(),
                elements,
                canvasSize,
                canvasBg,
                previewImage,
            });

            if (result.success) {
                alert('Template saved successfully!');
            } else {
                alert('Failed to save template.');
            }
        } catch (error) {
            console.error('Error saving template:', error);
            alert('An error occurred while saving.');
        } finally {
            setIsSavingTemplate(false);
        }
    };

    const saveAsAsset = async () => {
        if (!stageRef.current) return;
        if (!assetName.trim() || !assetCategory.trim()) return;

        setIsSavingAsset(true);
        try {
            // Deselect to hide transformer for preview image
            const prevSelected = [...selectedIds];
            setSelectedIds([]);

            // Wait for React to re-render without transformer
            await new Promise(resolve => setTimeout(resolve, 50));

            // Generate a smaller preview image
            const previewImage = stageRef.current.toDataURL({ pixelRatio: 0.5 });

            // Restore selection
            setSelectedIds(prevSelected);

            const result = await createSavedAsset({
                name: assetName.trim(),
                category: assetCategory.trim(),
                elements,
                canvasSize,
                canvasBg,
                previewImage,
            });

            if (result.success) {
                alert('Asset saved successfully!');
                setIsSavingAssetDialog(false);
                setAssetName('');
                setAssetCategory('');
            } else {
                alert('Failed to save asset.');
            }
        } catch (error) {
            console.error('Error saving asset:', error);
            alert('An error occurred while saving.');
        } finally {
            setIsSavingAsset(false);
        }
    };

    const updateSelectedElement = (newProps: Partial<EditorElement>) => {
        if (selectedIds.length === 0) return;
        const newElements = elements.map((el) => (selectedIds.includes(el.id) ? { ...el, ...newProps } : el));
        updateHistory(newElements);
    };

    const deleteSelected = () => {
        if (selectedIds.length === 0) return;
        const newElements = elements.filter((el) => !selectedIds.includes(el.id));
        updateHistory(newElements);
        setSelectedIds([]);
    };

    const duplicateSelected = () => {
        if (selectedIds.length === 0) return;
        const toAdd: EditorElement[] = [];
        const newSelection: string[] = [];

        selectedElements.forEach(el => {
            const newId = `${el.type}-${Date.now()}-${Math.random()}`;
            toAdd.push({
                ...el,
                id: newId,
                x: el.x + 20,
                y: el.y + 20,
            });
            newSelection.push(newId);
        });

        updateHistory([...elements, ...toAdd]);
        setSelectedIds(newSelection);
    };

    // Layering is currently simplified for multi-select (only moves first selected)
    const bringForward = () => {
        if (selectedIds.length === 0) return;
        const idToMove = selectedIds[0];
        const currentIndex = elements.findIndex((el) => el.id === idToMove);
        if (currentIndex >= elements.length - 1 || currentIndex === -1) return;
        const newElements = [...elements];
        const [removed] = newElements.splice(currentIndex, 1);
        newElements.splice(currentIndex + 1, 0, removed);
        updateHistory(newElements);
    };

    const sendBackward = () => {
        if (selectedIds.length === 0) return;
        const idToMove = selectedIds[0];
        const currentIndex = elements.findIndex((el) => el.id === idToMove);
        if (currentIndex <= 0) return;
        const newElements = [...elements];
        const [removed] = newElements.splice(currentIndex, 1);
        newElements.splice(currentIndex - 1, 0, removed);
        updateHistory(newElements);
    };

    const groupSelected = () => {
        if (selectedIds.length < 2) return;
        const newGroupId = `group-${Date.now()}`;
        const remainingElements = elements.filter(el => !selectedIds.includes(el.id));
        const groupedElements = elements.filter(el => selectedIds.includes(el.id));

        const newGroupElement: EditorElement = {
            id: newGroupId,
            type: 'group',
            x: 0,
            y: 0,
            children: groupedElements,
        };
        updateHistory([...remainingElements, newGroupElement]);
        setSelectedIds([newGroupId]);
    };

    const ungroupSelected = () => {
        if (selectedIds.length !== 1) return;
        const groupElement = elements.find(el => el.id === selectedIds[0]);
        if (!groupElement || groupElement.type !== 'group' || !groupElement.children) return;

        const remainingElements = elements.filter(el => el.id !== groupElement.id);
        const extractedChildren = groupElement.children.map(child => ({
            ...child,
            x: child.x + (groupElement.x || 0),
            y: child.y + (groupElement.y || 0),
            // We ignore scale translation for now as MVP
        }));

        updateHistory([...remainingElements, ...extractedChildren]);
        setSelectedIds(extractedChildren.map(c => c.id));
    };

    // --- Add Element Handlers --- //

    const onAddText = (text: string, fontSize: number, fontFamily: string) => {
        const newElement: EditorElement = {
            id: `text-${Date.now()}`,
            type: 'text',
            x: 50,
            y: 50,
            text,
            fontSize,
            fontFamily,
            fill: '#000000',
        };
        updateHistory([...elements, newElement]);
    };

    const onAddRect = () => {
        const newElement: EditorElement = {
            id: `rect-${Date.now()}`,
            type: 'rect',
            x: 100,
            y: 100,
            width: 100,
            height: 100,
            fill: '#00D2FF',
        };
        updateHistory([...elements, newElement]);
    };

    const onAddCircle = () => {
        const newElement: EditorElement = {
            id: `circle-${Date.now()}`,
            type: 'circle',
            x: 150,
            y: 150,
            width: 100,
            height: 100,
            fill: '#FF6464',
        };
        updateHistory([...elements, newElement]);
    };

    const onAddStar = () => {
        const newElement: EditorElement = {
            id: `star-${Date.now()}`,
            type: 'star',
            x: 100,
            y: 100,
            width: 100,
            height: 100,
            fill: '#FFD700',
        };
        updateHistory([...elements, newElement]);
    };

    const onAddPolygon = (sides: number) => {
        const newElement: EditorElement = {
            id: `polygon-${Date.now()}`,
            type: 'polygon',
            sides,
            x: 100,
            y: 100,
            width: 100,
            height: 100,
            fill: sides === 3 ? '#FF6B6B' : '#4ECDC4',
        };
        updateHistory([...elements, newElement]);
    };

    const onAddRing = () => {
        const newElement: EditorElement = {
            id: `ring-${Date.now()}`,
            type: 'ring',
            x: 100,
            y: 100,
            width: 100,
            height: 100,
            innerRadius: 30,
            outerRadius: 50,
            fill: '#9B59B6',
        };
        updateHistory([...elements, newElement]);
    };

    const onAddLine = () => {
        const newElement: EditorElement = {
            id: `line-${Date.now()}`,
            type: 'line',
            x: 100,
            y: 100,
            points: [0, 0, 100, 0],
            stroke: '#2C3E50',
            strokeWidth: 5,
        };
        updateHistory([...elements, newElement]);
    };

    const onAddArrow = () => {
        const newElement: EditorElement = {
            id: `arrow-${Date.now()}`,
            type: 'arrow',
            x: 100,
            y: 100,
            points: [0, 0, 100, 0],
            stroke: '#E74C3C',
            strokeWidth: 5,
        };
        updateHistory([...elements, newElement]);
    };

    const onAddPath = (path: string) => {
        const newElement: EditorElement = {
            id: `path-${Date.now()}`,
            type: 'path',
            x: 100,
            y: 100,
            iconPath: path,
            fill: '#34495E',
        };
        updateHistory([...elements, newElement]);
    };

    const onAddIcon = (iconPath: string) => {
        const newElement: EditorElement = {
            id: `icon-${Date.now()}`,
            type: 'icon',
            x: 200,
            y: 200,
            width: 100,
            height: 100,
            fill: '#475569', // text-neutral-600
            iconPath,
        };
        updateHistory([...elements, newElement]);
        setSelectedIds([newElement.id]);
    };

    const onImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Save to Immich in the background
        try {
            const formData = new FormData();
            formData.append('file', file);
            await uploadPhoto(formData);
        } catch (error) {
            console.error('Failed to upload image to Immich:', error);
            // We continue to load the image into canvas even if the Immich background upload fails
        }

        const reader = new FileReader();
        reader.onload = () => {
            const newElement: EditorElement = {
                id: `image-${Date.now()}`,
                type: 'image',
                x: 100,
                y: 100,
                width: 200,
                height: 200,
                src: reader.result as string,
            };
            updateHistory([...elements, newElement]);
        };
        reader.readAsDataURL(file);
    };

    // Keyboard Shortcuts (Delete)
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Backspace' || e.key === 'Delete') {
                // Ensure we aren't typing in an input field before deleting shape
                const isTyping = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName);
                if (!isTyping && selectedIds.length > 0) {
                    deleteSelected();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIds, deleteSelected]);


    return (
        <div className="flex flex-col w-full h-full bg-neutral-100 overflow-hidden text-black font-sans">
            <Header
                canUndo={historyStep > 0}
                canRedo={historyStep < history.length - 1}
                onUndo={undo}
                onRedo={redo}
                onDownloadImage={downloadImage}
                onSaveAssetDialog={() => setIsSavingAssetDialog(true)}
                onDownloadHtml={downloadHtml}
                onSaveTemplate={saveAsTemplate}
            />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                <SidePanel
                    activeTab={activeTab}
                    onAddText={onAddText}
                    onAddRect={onAddRect}
                    onAddCircle={onAddCircle}
                    onAddStar={onAddStar}
                    onAddPolygon={onAddPolygon}
                    onAddRing={onAddRing}
                    onAddLine={onAddLine}
                    onAddArrow={onAddArrow}
                    onAddPath={onAddPath}
                    onAddIcon={onAddIcon}
                    onImageUpload={onImageUpload}
                    canvasBg={canvasBg}
                    setCanvasBg={setCanvasBg}
                    canvasSize={canvasSize}
                    setCanvasSize={setCanvasSize}
                    elements={elements}
                    setElements={updateHistory}
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
                    photos={photos}
                />

                <div className="flex-1 flex flex-col h-full bg-neutral-200">
                    <TopToolbar
                        selectedElements={selectedElements}
                        updateSelectedElement={updateSelectedElement}
                        deleteSelected={deleteSelected}
                        duplicateSelected={duplicateSelected}
                        bringForward={bringForward}
                        sendBackward={sendBackward}
                        groupSelected={groupSelected}
                        ungroupSelected={ungroupSelected}
                        onCrop={setCroppingId}
                    />

                    <Workspace
                        elements={elements}
                        setElements={updateHistory}
                        selectedIds={selectedIds}
                        setSelectedIds={setSelectedIds}
                        croppingId={croppingId}
                        setCroppingId={setCroppingId}
                        canvasBg={canvasBg}
                        canvasSize={canvasSize}
                        onHistoryChange={updateHistory}
                        stageRef={stageRef}
                    />
                </div>
            </div>

            <Dialog open={isSavingAssetDialog} onOpenChange={setIsSavingAssetDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Save Asset</DialogTitle>
                        <DialogDescription>
                            Enter a name and category to save this asset.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-neutral-700">Name</label>
                            <input
                                value={assetName}
                                onChange={(e) => setAssetName(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                                placeholder="Asset Name"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-neutral-700">Category</label>
                            <input
                                value={assetCategory}
                                onChange={(e) => setAssetCategory(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                                placeholder="e.g. Backgrounds, Logos, etc."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <button
                            onClick={() => setIsSavingAssetDialog(false)}
                            className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={saveAsAsset}
                            disabled={isSavingAsset || !assetName.trim()}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors disabled:opacity-50"
                        >
                            {isSavingAsset ? 'Saving...' : 'Save'}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
