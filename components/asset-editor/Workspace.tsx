import React, { useRef, useEffect, useState } from 'react';
import Konva from 'konva';
import { Stage, Layer, Rect, Text, Circle, Transformer, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { EditorElement } from './types';

interface WorkspaceProps {
    elements: EditorElement[];
    setElements: (elements: EditorElement[]) => void;
    selectedId: string | null;
    selectShape: (id: string | null) => void;
    canvasBg: string;
    canvasSize: { width: number; height: number };
    onHistoryChange: (newElements: EditorElement[]) => void;
    stageRef: React.RefObject<any>;
}

export default function Workspace({
    elements,
    setElements,
    selectedId,
    selectShape,
    canvasBg,
    canvasSize,
    onHistoryChange,
    stageRef
}: WorkspaceProps) {
    const layerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
    const [scale, setScale] = useState(1);

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

    const checkDeselect = (e: any) => {
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            selectShape(null);
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
                width: 800, // Fixed logical workspace size (A4 / 1080p equivalent) 
                height: 600,
                backgroundColor: canvasBg,
                transform: `scale(${Math.min((containerSize.width * 0.8) / 800, (containerSize.height * 0.8) / 600)})` // initial fit scale
            }}>
                <Stage
                    width={800}
                    height={600}
                    onMouseDown={checkDeselect}
                    onTouchStart={checkDeselect}
                    onWheel={handleWheel}
                    ref={stageRef}
                >
                    <Layer ref={layerRef}>
                        {elements.map((el, i) => {
                            const isSelected = el.id === selectedId;
                            // Helper to trigger history save on modify end
                            const handleModifyEnd = (newAttrs: EditorElement) => {
                                const newElements = elements.map(e => e.id === el.id ? newAttrs : e);
                                onHistoryChange(newElements);
                            };

                            const onDragEnd = (e: any) => {
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

                            const commonProps = {
                                key: el.id,
                                ...el,
                                draggable: true,
                                onClick: () => selectShape(el.id),
                                onTap: () => selectShape(el.id),
                                onDragEnd,
                                onTransformEnd,
                                name: el.id,
                                opacity: el.opacity ?? 1,
                            };

                            if (el.type === 'rect') return <Rect {...commonProps} />;
                            if (el.type === 'circle') return <Circle {...commonProps} radius={(el.width || 100) / 2} />;
                            if (el.type === 'text') return <Text {...commonProps} />;
                            if (el.type === 'image') return <UrlImage {...commonProps} onChange={handleModifyEnd} shapeProps={el} />;

                            return null;
                        })}

                        {selectedId && (
                            <TransformerComponent selectedId={selectedId} stageRef={stageRef} />
                        )}
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
                if (newBox.width < 5 || newBox.height < 5) return oldBox;
                return newBox;
            }}
        />
    );
};
