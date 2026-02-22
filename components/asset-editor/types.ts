export type ElementType = 'text' | 'rect' | 'circle' | 'image';

export interface EditorElement {
    id: string;
    type: ElementType;
    x: number;
    y: number;
    width?: number;
    height?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
    rotation?: number;
    // Text specific
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    fontStyle?: string;
    align?: 'left' | 'center' | 'right';
    letterSpacing?: number;
    // Image specific
    src?: string;
    cropX?: number;
    cropY?: number;
    cropWidth?: number;
    cropHeight?: number;
    blurRadius?: number;
    brightness?: number;
}

export type SidebarTab = 'templates' | 'text' | 'shapes' | 'uploads' | 'background' | 'layers' | 'resize';
