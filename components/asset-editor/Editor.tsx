'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Transformer } from 'react-konva';
import { Type, Square, Pointer } from 'lucide-react';

type ElementType = 'text' | 'rect' | 'image';

interface EditorElement {
    id: string;
    type: ElementType;
    x: number;
    y: number;
    width?: number;
    height?: number;
    fill?: string;
    text?: string;
    fontSize?: number;
}

export default function Editor() {
    const [elements, setElements] = useState<EditorElement[]>([]);
    const [selectedId, selectShape] = useState<string | null>(null);

    const stageRef = useRef<any>(null);
    const layerRef = useRef<any>(null);

    const checkDeselect = (e: any) => {
        // deselect when clicked on empty area
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            selectShape(null);
        }
    };

    const addText = () => {
        const newElement: EditorElement = {
            id: `text-${Date.now()}`,
            type: 'text',
            x: 50,
            y: 50,
            text: 'Double click to edit',
            fontSize: 24,
            fill: 'black',
        };
        setElements([...elements, newElement]);
    };

    const addRect = () => {
        const newElement: EditorElement = {
            id: `rect-${Date.now()}`,
            type: 'rect',
            x: 100,
            y: 100,
            width: 100,
            height: 100,
            fill: '#00D2FF',
        };
        setElements([...elements, newElement]);
    };

    const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            setContainerSize({
                width: containerRef.current.offsetWidth,
                height: containerRef.current.offsetHeight,
            });
        }
        const handleResize = () => {
            if (containerRef.current) {
                setContainerSize({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight,
                });
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="flex w-full h-full bg-neutral-100 overflow-hidden text-black">
            {/* Sidebar Tool Panel */}
            <div className="w-16 md:w-20 bg-white border-r flex flex-col items-center py-4 gap-4 z-10 shadow-sm">
                <button
                    onClick={() => selectShape(null)}
                    className={`p-3 rounded-xl hover:bg-neutral-100 transition-colors ${selectedId === null ? 'bg-neutral-100 text-blue-600' : 'text-neutral-500'}`}
                    title="Select"
                >
                    <Pointer className="w-6 h-6" />
                </button>
                <button
                    onClick={addText}
                    className="p-3 rounded-xl text-neutral-500 hover:bg-neutral-100 hover:text-blue-600 transition-colors"
                    title="Add Text"
                >
                    <Type className="w-6 h-6" />
                </button>
                <button
                    onClick={addRect}
                    className="p-3 rounded-xl text-neutral-500 hover:bg-neutral-100 hover:text-blue-600 transition-colors"
                    title="Add Rectangle"
                >
                    <Square className="w-6 h-6" />
                </button>
                {/* Further tools like Image could go here */}
            </div>

            {/* Canvas Workspace */}
            <div className="flex-1 relative flex items-center justify-center p-8 overflow-hidden bg-neutral-100" ref={containerRef}>
                <div className="bg-white shadow-xl relative" style={{ width: containerSize.width * 0.8, height: containerSize.height * 0.8 }}>
                    <Stage
                        width={containerSize.width * 0.8}
                        height={containerSize.height * 0.8}
                        onMouseDown={checkDeselect}
                        onTouchStart={checkDeselect}
                        ref={stageRef}
                    >
                        <Layer ref={layerRef}>
                            {elements.map((el, i) => {
                                const isSelected = el.id === selectedId;
                                const onChange = (newAttrs: EditorElement) => {
                                    const recs = elements.slice();
                                    recs[i] = newAttrs;
                                    setElements(recs);
                                };

                                const onDragEnd = (e: any) => {
                                    onChange({
                                        ...el,
                                        x: e.target.x(),
                                        y: e.target.y(),
                                    });
                                };

                                const onTransformEnd = (e: any) => {
                                    const node = e.target;
                                    const scaleX = node.scaleX();
                                    const scaleY = node.scaleY();
                                    node.scaleX(1);
                                    node.scaleY(1);
                                    onChange({
                                        ...el,
                                        x: node.x(),
                                        y: node.y(),
                                        width: Math.max(5, node.width() * scaleX),
                                        height: Math.max(node.height() * scaleY),
                                    });
                                };

                                if (el.type === 'rect') {
                                    return (
                                        <Rect
                                            key={el.id}
                                            {...el}
                                            draggable
                                            onClick={() => selectShape(el.id)}
                                            onTap={() => selectShape(el.id)}
                                            onDragEnd={onDragEnd}
                                            onTransformEnd={onTransformEnd}
                                            name={el.id}
                                        />
                                    );
                                }
                                if (el.type === 'text') {
                                    return (
                                        <Text
                                            key={el.id}
                                            {...el}
                                            draggable
                                            onClick={() => selectShape(el.id)}
                                            onTap={() => selectShape(el.id)}
                                            onDragEnd={onDragEnd}
                                            onTransformEnd={onTransformEnd}
                                            name={el.id}
                                        />
                                    );
                                }
                                return null;
                            })}

                            {selectedId && (
                                <TransformerComponent selectedId={selectedId} stageRef={stageRef} />
                            )}
                        </Layer>
                    </Stage>
                </div>
            </div>
        </div>
    );
}

const TransformerComponent = ({ selectedId, stageRef }: { selectedId: string; stageRef: React.RefObject<any> }) => {
    const trRef = useRef<any>(null);
    useEffect(() => {
        if (stageRef.current && trRef.current) {
            const selectedNode = stageRef.current.findOne(`.${selectedId}`);
            if (selectedNode) {
                trRef.current.nodes([selectedNode]);
                trRef.current.getLayer().batchDraw();
            }
        }
    }, [selectedId, stageRef]);

    return (
        <Transformer
            ref={trRef}
            boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) {
                    return oldBox;
                }
                return newBox;
            }}
        />
    );
};
