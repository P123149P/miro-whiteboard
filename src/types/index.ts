export type ToolType = 
  | 'select'
  | 'hand'
  | 'sticky'
  | 'shape'
  | 'text'
  | 'connector'
  | 'pen'
  | 'frame'
  | 'eraser';

export type ShapeType = 
  | 'rectangle'
  | 'rounded-rectangle'
  | 'circle'
  | 'diamond'
  | 'triangle'
  | 'star';

export type ConnectorType = 'straight' | 'curved' | 'orthogonal';

export interface Point {
  x: number;
  y: number;
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface BaseElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  zIndex: number;
  locked?: boolean;
}

export interface StickyElement extends BaseElement {
  type: 'sticky';
  text: string;
  color: string; // Pastel background
  textColor: string;
  fontSize: number;
  textAlign: 'left' | 'center' | 'right';
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: ShapeType;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed';
  text?: string;
  textColor?: string;
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right';
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  textColor: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  textAlign: 'left' | 'center' | 'right';
}

export interface PenElement extends BaseElement {
  type: 'pen';
  points: Point[];
  strokeColor: string;
  strokeWidth: number;
}

export interface ConnectorElement extends BaseElement {
  type: 'connector';
  connectorType: ConnectorType;
  startPoint: Point;
  endPoint: Point;
  startElementId?: string;
  endElementId?: string;
  startAnchor?: 'top' | 'right' | 'bottom' | 'left' | 'center';
  endAnchor?: 'top' | 'right' | 'bottom' | 'left' | 'center';
  strokeColor: string;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed';
  startArrow?: boolean;
  endArrow?: boolean;
  text?: string;
}

export interface FrameElement extends BaseElement {
  type: 'frame';
  title: string;
  fillColor: string;
  strokeColor: string;
}

export type CanvasElement = 
  | StickyElement 
  | ShapeElement 
  | TextElement 
  | PenElement 
  | ConnectorElement 
  | FrameElement;

export interface SelectionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ResizeHandle = 
  | 'nw' | 'n' | 'ne' 
  | 'e' 
  | 'se' | 's' | 'sw' 
  | 'w';

export interface DragState {
  type: 'pan' | 'select' | 'move' | 'resize' | 'draw' | 'connect' | 'box-select';
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  handle?: ResizeHandle;
  initialElements?: Map<string, CanvasElement>;
  activeConnectorId?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  elements: CanvasElement[];
}
