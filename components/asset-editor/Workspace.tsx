import React, { useRef, useEffect, useState } from 'react';
import Konva from 'konva';
import { Stage, Layer, Rect, Text, TextPath, Circle, Transformer, Image as KonvaImage, Group as KonvaGroup, Line, Path } from 'react-konva';
import useImage from 'use-image';
import { EditorElement } from './types';

interface WorkspaceProps {
    elements: EditorElement[];
    setElements: (elements: EditorElement[]) => void;
    selectedIds: string[];
    setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
    croppingId?: string | null;
    setCroppingId?: (id: string | null) => void;
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
    croppingId,
    setCroppingId,
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

                                let newWidth = Math.max(5, node.width() * scaleX);
                                let newHeight = Math.max(5, node.height() * scaleY);

                                if (el.type === 'icon') {
                                    newWidth = Math.max(5, scaleX * 24);
                                    newHeight = Math.max(5, scaleY * 24);
                                }

                                handleModifyEnd({
                                    ...el,
                                    x: node.x(),
                                    y: node.y(),
                                    width: newWidth,
                                    height: newHeight,
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

                            const { key: _key, ...elWithoutKey } = (el as any);
                            const commonProps = {
                                ...elWithoutKey,
                                draggable: true,
                                onClick: handleSelect,
                                onTap: handleSelect,
                                onDragMove,
                                onDragEnd,
                                onTransformEnd,
                                name: el.id,
                                opacity: el.opacity ?? 1,
                                shadowColor: el.shadowColor || 'transparent',
                                shadowBlur: el.shadowBlur || 0,
                                shadowOffsetX: el.shadowOffsetX || 0,
                                shadowOffsetY: el.shadowOffsetY || 0,
                                shadowOpacity: el.shadowOpacity || 0,
                                stroke: el.stroke,
                                strokeWidth: el.strokeWidth || 0,
                            };

                            if (el.type === 'rect') return <Rect key={el.id} {...commonProps} cornerRadius={el.cornerRadius || 0} />;
                            if (el.type === 'circle') return <Circle key={el.id} {...commonProps} radius={(el.width || 100) / 2} />;
                            if (el.type === 'text') {
                                let displayText = el.text || '';
                                if (el.isList) {
                                    displayText = displayText.split('\n').map(line => `• ${line.replace(/^•\s*/, '')}`).join('\n');
                                }
                                if (el.isCurved) {
                                    const r = el.curveRadius || 150;
                                    const pathData = `M 0,${r} A ${r},${r} 0 0,1 ${r * 2},${r}`;
                                    return <TextPath key={el.id} {...commonProps} text={displayText} data={pathData} />;
                                }
                                return <Text key={el.id} {...commonProps} text={displayText} />;
                            }
                            if (el.type === 'image') return <UrlImage
                                key={el.id}
                                shapeProps={{ ...commonProps, ...el }}
                                onChange={handleModifyEnd}
                                onDblClick={() => {
                                    if (setCroppingId) setCroppingId(el.id);
                                }}
                            />;
                            if (el.type === 'icon' && el.iconPath) return <Path key={el.id} {...commonProps} data={el.iconPath} fill={el.fill} scaleX={((el.width || 100) / 24)} scaleY={((el.height || 100) / 24)} />;
                            if (el.type === 'group') return (
                                <KonvaGroup key={el.id} {...commonProps}>
                                    {el.children?.map((child, j) => {
                                        const { key: _childKey, ...childWithoutKey } = (child as any);
                                        const childProps = {
                                            ...childWithoutKey,
                                            opacity: child.opacity ?? 1,
                                            shadowColor: child.shadowColor || 'transparent',
                                            shadowBlur: child.shadowBlur || 0,
                                            shadowOffsetX: child.shadowOffsetX || 0,
                                            shadowOffsetY: child.shadowOffsetY || 0,
                                            shadowOpacity: child.shadowOpacity || 0,
                                            stroke: child.stroke,
                                            strokeWidth: child.strokeWidth || 0,
                                            // Children of groups are NOT directly draggable/selectable in this MVP
                                            // The whole group acts as one entity.
                                        };
                                        if (child.type === 'rect') return <Rect key={child.id} {...childProps} cornerRadius={child.cornerRadius || 0} />;
                                        if (child.type === 'circle') return <Circle key={child.id} {...childProps} radius={(child.width || 100) / 2} />;
                                        if (child.type === 'text') {
                                            let displayText = child.text || '';
                                            if (child.isList) {
                                                displayText = displayText.split('\n').map(line => `• ${line.replace(/^•\s*/, '')}`).join('\n');
                                            }
                                            if (child.isCurved) {
                                                const r = child.curveRadius || 150;
                                                const pathData = `M 0,${r} A ${r},${r} 0 0,1 ${r * 2},${r}`;
                                                return <TextPath key={child.id} {...childProps} text={displayText} data={pathData} />;
                                            }
                                            return <Text key={child.id} {...childProps} text={displayText} />;
                                        }
                                        if (child.type === 'image') return <UrlImage key={child.id} {...childProps} shapeProps={child} />;
                                        if (child.type === 'icon' && child.iconPath) return <Path key={child.id} {...childProps} data={child.iconPath} fill={child.fill} scaleX={((child.width || 100) / 24)} scaleY={((child.height || 100) / 24)} />;
                                        return null;
                                    })}
                                </KonvaGroup>
                            );

                            return null;
                        })}

                        {selectedIds.length > 0 && !croppingId && (
                            <TransformerComponent selectedIds={selectedIds} stageRef={stageRef} />
                        )}

                        {croppingId && (
                            <CropOverlay
                                element={elements.find(e => e.id === croppingId)}
                                onChange={(newAttrs: EditorElement) => {
                                    onHistoryChange(elements.map(e => e.id === croppingId ? newAttrs : e));
                                }}
                                onClose={() => { if (setCroppingId) setCroppingId(null); }}
                            />
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

    // Default crop to full bounding box
    const cropX = shapeProps.cropX || 0;
    const cropY = shapeProps.cropY || 0;
    const cropWidth = shapeProps.cropWidth || shapeProps.width || 200;
    const cropHeight = shapeProps.cropHeight || shapeProps.height || 200;

    return (
        <KonvaGroup
            x={shapeProps.x}
            y={shapeProps.y}
            width={shapeProps.width}
            height={shapeProps.height}
            rotation={shapeProps.rotation}
            scaleX={shapeProps.scaleX}
            scaleY={shapeProps.scaleY}
            draggable={shapeProps.draggable}
            onClick={shapeProps.onClick}
            onTap={shapeProps.onTap}
            onDragMove={shapeProps.onDragMove}
            onDragEnd={shapeProps.onDragEnd}
            onTransformEnd={shapeProps.onTransformEnd}
            name={shapeProps.name}
            clipX={cropX}
            clipY={cropY}
            clipWidth={cropWidth}
            clipHeight={cropHeight}
            onDblClick={shapeProps.onDblClick}
        >
            <KonvaImage
                x={0}
                y={0}
                image={image}
                ref={imageRef}
                width={shapeProps.width}
                height={shapeProps.height}
                filters={[Konva.Filters.Blur, Konva.Filters.Brighten]}
                blurRadius={shapeProps.blurRadius || 0}
                brightness={shapeProps.brightness || 0}
                opacity={shapeProps.opacity}
                shadowColor={shapeProps.shadowColor}
                shadowBlur={shapeProps.shadowBlur}
                shadowOffsetX={shapeProps.shadowOffsetX}
                shadowOffsetY={shapeProps.shadowOffsetY}
                shadowOpacity={shapeProps.shadowOpacity}
                stroke={shapeProps.stroke}
                strokeWidth={shapeProps.strokeWidth}
                {...rest}
            />
        </KonvaGroup>
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

const CropOverlay = ({ element, onChange, onClose }: any) => {
    const trRef = useRef<any>(null);
    const rectRef = useRef<any>(null);

    useEffect(() => {
        if (trRef.current && rectRef.current) {
            trRef.current.nodes([rectRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [element]);

    // Handle clicking outside to apply crop
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!element || element.type !== 'image') return null;

    const cropX = element.cropX || 0;
    const cropY = element.cropY || 0;
    const cropWidth = element.cropWidth || element.width || 200;
    const cropHeight = element.cropHeight || element.height || 200;

    return (
        <KonvaGroup>
            {/* Dark overlay backdrop to signify cropping */}
            <Rect
                x={-9999}
                y={-9999}
                width={19999}
                height={19999}
                fill="rgba(0,0,0,0.5)"
                onClick={onClose}
                onTap={onClose}
            />

            {/* The base image behind the crop window perfectly aligned */}
            <UrlImage shapeProps={{ ...element, opacity: 0.5, cropX: 0, cropY: 0, cropWidth: element.width, cropHeight: element.height }} />

            {/* The crop window itself */}
            <KonvaGroup clipX={cropX} clipY={cropY} clipWidth={cropWidth} clipHeight={cropHeight} x={element.x} y={element.y} rotation={element.rotation} scaleX={element.scaleX} scaleY={element.scaleY}>
                <UrlImage shapeProps={{ ...element, x: 0, y: 0, cropX: 0, cropY: 0, cropWidth: element.width, cropHeight: element.height }} />
            </KonvaGroup>

            <Rect
                ref={rectRef}
                x={element.x + cropX}
                y={element.y + cropY}
                width={cropWidth}
                height={cropHeight}
                rotation={element.rotation || 0}
                stroke="#00A1FF"
                strokeWidth={2}
                draggable
                onDragEnd={(e) => {
                    const node = e.target;
                    onChange({
                        ...element,
                        cropX: node.x() - element.x,
                        cropY: node.y() - element.y,
                    });
                }}
                onTransformEnd={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);

                    onChange({
                        ...element,
                        cropX: node.x() - element.x,
                        cropY: node.y() - element.y,
                        cropWidth: Math.max(5, node.width() * scaleX),
                        cropHeight: Math.max(5, node.height() * scaleY),
                    });
                }}
            />
            <Transformer
                ref={trRef}
                rotateEnabled={false}
                keepRatio={false}
                boundBoxFunc={(oldBox, newBox) => {
                    if (newBox.width < 5 || newBox.height < 5) return oldBox;
                    return newBox;
                }}
            />
        </KonvaGroup>
    );
};
