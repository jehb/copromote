'use client';

import React, { useState, useCallback, useRef } from 'react';
import { SidebarTab, EditorElement } from './types';
import Sidebar from './Sidebar';
import SidePanel from './SidePanel';
import TopToolbar from './TopToolbar';
import Workspace from './Workspace';
import Header from './Header';

export default function Editor() {
    // Global State
    const [activeTab, setActiveTab] = useState<SidebarTab | null>('shapes');
    const [selectedId, selectShape] = useState<string | null>(null);
    const [canvasBg, setCanvasBg] = useState<string>('#ffffff');

    // History & Elements Data Structure (Undo/Redo implementation)
    const [history, setHistory] = useState<EditorElement[][]>([[]]);
    const [historyStep, setHistoryStep] = useState<number>(0);

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

    // Derived selected element
    const selectedElement = elements.find((el) => el.id === selectedId);

    // --- Actions --- //

    const undo = () => {
        if (historyStep > 0) {
            setHistoryStep(historyStep - 1);
            selectShape(null);
        }
    };

    const redo = () => {
        if (historyStep < history.length - 1) {
            setHistoryStep(historyStep + 1);
            selectShape(null);
        }
    };

    const downloadImage = () => {
        if (!stageRef.current) return;
        // Temporarily deselect to hide transformer
        selectShape(null);
        // Add minimal delay to let React re-render without transformer
        setTimeout(() => {
            const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 });
            const link = document.createElement('a');
            link.download = 'promoty-asset.png';
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
        link.setAttribute("download", "promoty-asset.json");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const updateSelectedElement = (newProps: Partial<EditorElement>) => {
        if (!selectedId) return;
        const newElements = elements.map((el) => (el.id === selectedId ? { ...el, ...newProps } : el));
        updateHistory(newElements);
    };

    const deleteSelected = () => {
        if (!selectedId) return;
        const newElements = elements.filter((el) => el.id !== selectedId);
        updateHistory(newElements);
        selectShape(null);
    };

    const duplicateSelected = () => {
        if (!selectedElement) return;
        const newId = `${selectedElement.type}-${Date.now()}`;
        const newElement = {
            ...selectedElement,
            id: newId,
            x: selectedElement.x + 20,
            y: selectedElement.y + 20,
        };
        updateHistory([...elements, newElement]);
        selectShape(newId);
    };

    const bringForward = () => {
        if (!selectedId) return;
        const currentIndex = elements.findIndex((el) => el.id === selectedId);
        if (currentIndex === elements.length - 1) return; // Already at top
        const newElements = [...elements];
        const [removed] = newElements.splice(currentIndex, 1);
        newElements.splice(currentIndex + 1, 0, removed);
        updateHistory(newElements);
    };

    const sendBackward = () => {
        if (!selectedId) return;
        const currentIndex = elements.findIndex((el) => el.id === selectedId);
        if (currentIndex === 0) return; // Already at bottom
        const newElements = [...elements];
        const [removed] = newElements.splice(currentIndex, 1);
        newElements.splice(currentIndex - 1, 0, removed);
        updateHistory(newElements);
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

    const onImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

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
                if (!isTyping && selectedId) {
                    deleteSelected();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId, deleteSelected]);


    return (
        <div className="flex flex-col w-full h-full bg-neutral-100 overflow-hidden text-black font-sans">
            <Header
                canUndo={historyStep > 0}
                canRedo={historyStep < history.length - 1}
                onUndo={undo}
                onRedo={redo}
                onDownloadImage={downloadImage}
                onDownloadJson={downloadJson}
            />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                <SidePanel
                    activeTab={activeTab}
                    onAddText={onAddText}
                    onAddRect={onAddRect}
                    onAddCircle={onAddCircle}
                    onImageUpload={onImageUpload}
                    canvasBg={canvasBg}
                    setCanvasBg={setCanvasBg}
                />

                <div className="flex-1 flex flex-col h-full bg-neutral-200">
                    <TopToolbar
                        selectedElement={selectedElement}
                        updateSelectedElement={updateSelectedElement}
                        deleteSelected={deleteSelected}
                        duplicateSelected={duplicateSelected}
                        bringForward={bringForward}
                        sendBackward={sendBackward}
                    />

                    <Workspace
                        elements={elements}
                        setElements={updateHistory}
                        selectedId={selectedId}
                        selectShape={selectShape}
                        canvasBg={canvasBg}
                        onHistoryChange={updateHistory}
                        stageRef={stageRef}
                    />
                </div>
            </div>
        </div>
    );
}
