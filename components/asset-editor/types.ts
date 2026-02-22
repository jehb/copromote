export type ElementType = 'text' | 'rect' | 'circle' | 'image' | 'group' | 'icon';

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
    isList?: boolean;
    isCurved?: boolean;
    curveRadius?: number;
    // Image specific
    src?: string;
    cropX?: number;
    cropY?: number;
    cropWidth?: number;
    cropHeight?: number;
    blurRadius?: number;
    brightness?: number;
    // Styling
    cornerRadius?: number;
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    shadowOpacity?: number;
    // Grouping
    children?: EditorElement[];
    // Vector Icons
    iconPath?: string;
}

export type SidebarTab = 'templates' | 'text' | 'shapes' | 'uploads' | 'background' | 'layers' | 'resize' | 'icons';
