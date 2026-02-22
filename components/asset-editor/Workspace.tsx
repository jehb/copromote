import React, { useRef, useEffect, useState } from 'react';
import Konva from 'konva';
import { Stage, Layer, Rect, Text, Circle, Transformer, Image as KonvaImage, Group as KonvaGroup, Line } from 'react-konva';
import useImage from 'use-image';
import { EditorElement } from './types';

interface WorkspaceProps {
    elements: EditorElement[];
    setElements: (elements: EditorElement[]) => void;
    selectedIds: string[];
    setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
    canvasBg: string;
    canvasSize: { width: number; height: number };
    onHistoryChange: (newElements: EditorElement[]) => void;
    stageRef: React.RefObject<any>;
}

export default function Workspace({
    elements,
    setElements,
    selectedIds,
    setSelectedIds,
    canvasBg,
    canvasSize,
    onHistoryChange,
    stageRef
}: WorkspaceProps) {
    const layerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
    const [scale, setScale] = useState(1);
    const [selectionBox, setSelectionBox] = useState<{ visible: boolean, x1: number, y1: number, x2: number, y2: number }>({ visible: false, x1: 0, y1: 0, x2: 0, y2: 0 });
    const [guides, setGuides] = useState<{ type: 'v' | 'h', position: number }[]>([]);

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setContainerSize({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight,
                });
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    const onStageMouseDown = (e: any) => {
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            e.evt.preventDefault();
            const pos = e.target.getStage().getPointerPosition();
            const scaledPos = {
                x: (pos.x - stageRef.current.x()) / scale,
                y: (pos.y - stageRef.current.y()) / scale,
            };
            setSelectionBox({ visible: true, x1: scaledPos.x, y1: scaledPos.y, x2: scaledPos.x, y2: scaledPos.y });
            setSelectedIds([]);
        }
    };

    const onStageMouseMove = (e: any) => {
        if (!selectionBox.visible) return;
        e.evt.preventDefault();
        const pos = e.target.getStage().getPointerPosition();
        const scaledPos = {
            x: (pos.x - stageRef.current.x()) / scale,
            y: (pos.y - stageRef.current.y()) / scale,
        };
        setSelectionBox({ ...selectionBox, x2: scaledPos.x, y2: scaledPos.y });
    };

    const onStageMouseUp = (e: any) => {
        if (!selectionBox.visible) return;
        e.evt.preventDefault();
        setSelectionBox({ ...selectionBox, visible: false });

        const x1 = Math.min(selectionBox.x1, selectionBox.x2);
        const y1 = Math.min(selectionBox.y1, selectionBox.y2);
        const x2 = Math.max(selectionBox.x1, selectionBox.x2);
        const y2 = Math.max(selectionBox.y1, selectionBox.y2);

        // Filter elements by hit detection
        const layer = layerRef.current;
        if (!layer) return;

        const newSelectedIds: string[] = [];
        elements.forEach(el => {
            const node = layer.findOne(`.${el.id}`);
            if (node) {
                const box = node.getClientRect();
                const nodeX1 = (box.x - stageRef.current.x()) / scale;
                const nodeY1 = (box.y - stageRef.current.y()) / scale;
                const nodeX2 = nodeX1 + (box.width / scale);
                const nodeY2 = nodeY1 + (box.height / scale);

                const hasIntersect = !(nodeX2 < x1 || nodeY2 < y1 || nodeX1 > x2 || nodeY1 > y2);
                if (hasIntersect) {
                    newSelectedIds.push(el.id);
                }
            }
        });

        if (newSelectedIds.length > 0) {
            setSelectedIds(newSelectedIds);
        }
    };

    // Zooming logic (wheel)
    const handleWheel = (e: any) => {
        e.evt.preventDefault();
        const scaleBy = 1.05;
        const stage = stageRef.current;
        const oldScale = stage.scaleX();

        const pointer = stage.getPointerPosition();

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

        // limit scale
        const clampedScale = Math.max(0.1, Math.min(newScale, 5));

        setScale(clampedScale);
        stage.scale({ x: clampedScale, y: clampedScale });

        const newPos = {
            x: pointer.x - mousePointTo.x * clampedScale,
            y: pointer.y - mousePointTo.y * clampedScale,
        };
        stage.position(newPos);
        stage.batchDraw();
    };

    return (
        <div className="flex-1 relative flex items-center justify-center p-8 overflow-hidden bg-neutral-200" ref={containerRef}>
            <div className="shadow-2xl relative" style={{
                width: canvasSize.width,
                height: canvasSize.height,
                backgroundColor: canvasBg,
                transform: `scale(${Math.min((containerSize.width * 0.8) / canvasSize.width, (containerSize.height * 0.8) / canvasSize.height)})` // initial fit scale
            }}>
                <Stage
                    width={canvasSize.width}
                    height={canvasSize.height}
                    onMouseDown={onStageMouseDown}
                    onTouchStart={onStageMouseDown}
                    onMouseMove={onStageMouseMove}
                    onTouchMove={onStageMouseMove}
                    onMouseUp={onStageMouseUp}
                    onTouchEnd={onStageMouseUp}
                    onWheel={handleWheel}
                    ref={stageRef}
                >
                    <Layer ref={layerRef}>
                        {elements.map((el, i) => {
                            const isSelected = selectedIds.includes(el.id);
                            // Helper to trigger history save on modify end
                            const handleModifyEnd = (newAttrs: EditorElement) => {
                                const newElements = elements.map(e => e.id === el.id ? newAttrs : e);
                                onHistoryChange(newElements);
                            };

                            const onDragMove = (e: any) => {
                                const node = e.target;
                                const layer = layerRef.current;
                                if (!layer) return;

                                const box = node.getClientRect({ relativeTo: layer });
                                const SNAP_THRESHOLD = 5;

                                const verticalLines = [0, canvasSize.width / 2, canvasSize.width];
                                const horizontalLines = [0, canvasSize.height / 2, canvasSize.height];

                                const newGuides: { type: 'v' | 'h', position: number }[] = [];

                                let snappedX = false;
                                let snappedY = false;

                                const nodeCenterX = box.x + box.width / 2;
                                const nodeCenterY = box.y + box.height / 2;

                                verticalLines.forEach(line => {
                                    if (!snappedX && Math.abs(nodeCenterX - line) < SNAP_THRESHOLD) {
                                        node.x(node.x() - (nodeCenterX - line));
                                        newGuides.push({ type: 'v', position: line });
                                        snappedX = true;
                                    }
                                });

                                horizontalLines.forEach(line => {
                                    if (!snappedY && Math.abs(nodeCenterY - line) < SNAP_THRESHOLD) {
                                        node.y(node.y() - (nodeCenterY - line));
                                        newGuides.push({ type: 'h', position: line });
                                        snappedY = true;
                                    }
                                });

                                setGuides(newGuides);
                            };

                            const onDragEnd = (e: any) => {
                                setGuides([]);
                                handleModifyEnd({
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
                                handleModifyEnd({
                                    ...el,
                                    x: node.x(),
                                    y: node.y(),
                                    width: Math.max(5, node.width() * scaleX),
                                    height: Math.max(node.height() * scaleY),
                                    rotation: node.rotation()
                                });
                            };

                            const handleSelect = (e: any) => {
                                const id = el.id;
                                const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
                                const isSelected = selectedIds.includes(id);

                                if (!metaPressed && !isSelected) {
                                    // if no key pressed and the node is not selected
                                    // select just one
                                    setSelectedIds([id]);
                                } else if (metaPressed && isSelected) {
                                    // if we pressed keys and node was selected
                                    // we should remove it from selection:
                                    const rects = selectedIds.slice();
                                    rects.splice(rects.indexOf(id), 1);
                                    setSelectedIds(rects);
                                } else if (metaPressed && !isSelected) {
                                    // add the node into selection
                                    setSelectedIds([...selectedIds, id]);
                                }
                            };

                            const commonProps = {
                                key: el.id,
                                ...el,
                                draggable: true,
                                onClick: handleSelect,
                                onTap: handleSelect,
                                onDragMove,
                                onDragEnd,
                                onTransformEnd,
                                name: el.id,
                                opacity: el.opacity ?? 1,
                            };

                            if (el.type === 'rect') return <Rect {...commonProps} />;
                            if (el.type === 'circle') return <Circle {...commonProps} radius={(el.width || 100) / 2} />;
                            if (el.type === 'text') return <Text {...commonProps} />;
                            if (el.type === 'image') return <UrlImage {...commonProps} onChange={handleModifyEnd} shapeProps={el} />;
                            if (el.type === 'group') return (
                                <KonvaGroup {...commonProps}>
                                    {el.children?.map((child, j) => {
                                        const childProps = {
                                            ...child,
                                            key: child.id,
                                            opacity: child.opacity ?? 1,
                                            // Children of groups are NOT directly draggable/selectable in this MVP
                                            // The whole group acts as one entity.
                                        };
                                        if (child.type === 'rect') return <Rect {...childProps} />;
                                        if (child.type === 'circle') return <Circle {...childProps} radius={(child.width || 100) / 2} />;
                                        if (child.type === 'text') return <Text {...childProps} />;
                                        if (child.type === 'image') return <UrlImage {...childProps} shapeProps={child} />;
                                        return null;
                                    })}
                                </KonvaGroup>
                            );

                            return null;
                        })}

                        {selectedIds.length > 0 && (
                            <TransformerComponent selectedIds={selectedIds} stageRef={stageRef} />
                        )}

                        {selectionBox.visible && (
                            <Rect
                                x={Math.min(selectionBox.x1, selectionBox.x2)}
                                y={Math.min(selectionBox.y1, selectionBox.y2)}
                                width={Math.abs(selectionBox.x1 - selectionBox.x2)}
                                height={Math.abs(selectionBox.y1 - selectionBox.y2)}
                                fill="rgba(0, 161, 255, 0.3)"
                                stroke="rgba(0, 161, 255, 0.8)"
                                strokeWidth={1}
                                listening={false}
                            />
                        )}

                        {guides.map((guide, idx) => (
                            <Line
                                key={`guide-${idx}`}
                                points={guide.type === 'v' ? [guide.position, 0, guide.position, canvasSize.height] : [0, guide.position, canvasSize.width, guide.position]}
                                stroke="#f43f5e"
                                strokeWidth={1}
                                dash={[4, 4]}
                                listening={false}
                            />
                        ))}
                    </Layer>
                </Stage>
            </div>

            {/* Zoom overlay indicator */}
            <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded shadow-sm text-xs font-medium text-neutral-600">
                {Math.round(scale * 100)}%
            </div>
        </div>
    );
}

const UrlImage = (props: any) => {
    const { shapeProps, onChange, ...rest } = props;
    const [image] = useImage(shapeProps.src, 'anonymous');
    const imageRef = useRef<any>(null);

    useEffect(() => {
        if (image && imageRef.current) {
            // Re-cache when image or filter props change
            imageRef.current.cache();
        }
    }, [image, shapeProps.blurRadius, shapeProps.brightness, shapeProps.width, shapeProps.height]);

    return (
        <KonvaImage
            image={image}
            ref={imageRef}
            filters={[Konva.Filters.Blur, Konva.Filters.Brighten]}
            blurRadius={shapeProps.blurRadius || 0}
            brightness={shapeProps.brightness || 0}
            {...rest}
            {...shapeProps}
        />
    );
};

const TransformerComponent = ({ selectedIds, stageRef }: { selectedIds: string[]; stageRef: React.RefObject<any> }) => {
    const trRef = useRef<any>(null);
    useEffect(() => {
        if (stageRef.current && trRef.current) {
            const nodes = selectedIds
                .map((id) => stageRef.current.findOne(`.${id}`))
                .filter(Boolean); // Filter out any missing nodes

            trRef.current.nodes(nodes);
            trRef.current.getLayer().batchDraw();
        }
    }, [selectedIds, stageRef]);

    return (
        <Transformer
            ref={trRef}
            boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) return oldBox;
                return newBox;
            }}
        />
    );
};
