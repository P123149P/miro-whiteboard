import { Camera, CanvasElement, Point, SelectionBounds } from '../types';

export function screenToWorld(point: Point, camera: Camera): Point {
  return {
    x: (point.x - camera.x) / camera.zoom,
    y: (point.y - camera.y) / camera.zoom,
  };
}

export function worldToScreen(point: Point, camera: Camera): Point {
  return {
    x: point.x * camera.zoom + camera.x,
    y: point.y * camera.zoom + camera.y,
  };
}

export function getElementBounds(el: CanvasElement): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } {
  if (el.type === 'pen') {
    if (el.points.length === 0) {
      return { minX: el.x, minY: el.y, maxX: el.x, maxY: el.y, width: 0, height: 0 };
    }
    const xs = el.points.map((p) => p.x);
    const ys = el.points.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: Math.max(maxX - minX, 20),
      height: Math.max(maxY - minY, 20),
    };
  }

  if (el.type === 'connector') {
    const minX = Math.min(el.startPoint.x, el.endPoint.x);
    const maxX = Math.max(el.startPoint.x, el.endPoint.x);
    const minY = Math.min(el.startPoint.y, el.endPoint.y);
    const maxY = Math.max(el.startPoint.y, el.endPoint.y);
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: Math.max(maxX - minX, 10),
      height: Math.max(maxY - minY, 10),
    };
  }

  return {
    minX: el.x,
    minY: el.y,
    maxX: el.x + el.width,
    maxY: el.y + el.height,
    width: el.width,
    height: el.height,
  };
}

export function getMultiElementBounds(elements: CanvasElement[]): SelectionBounds | null {
  if (elements.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    const bounds = getElementBounds(el);
    minX = Math.min(minX, bounds.minX);
    minY = Math.min(minY, bounds.minY);
    maxX = Math.max(maxX, bounds.maxX);
    maxY = Math.max(maxY, bounds.maxY);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function isPointInElement(point: Point, el: CanvasElement): boolean {
  const bounds = getElementBounds(el);
  const padding = el.type === 'connector' || el.type === 'pen' ? 10 : 0;
  return (
    point.x >= bounds.minX - padding &&
    point.x <= bounds.maxX + padding &&
    point.y >= bounds.minY - padding &&
    point.y <= bounds.maxY + padding
  );
}

export function isElementInBox(el: CanvasElement, box: SelectionBounds): boolean {
  const bounds = getElementBounds(el);
  const boxMinX = Math.min(box.x, box.x + box.width);
  const boxMaxX = Math.max(box.x, box.x + box.width);
  const boxMinY = Math.min(box.y, box.y + box.height);
  const boxMaxY = Math.max(box.y, box.y + box.height);

  return (
    bounds.minX >= boxMinX &&
    bounds.maxX <= boxMaxX &&
    bounds.minY >= boxMinY &&
    bounds.maxY <= boxMaxY
  );
}

export function getElementAnchor(
  el: CanvasElement,
  anchor: 'top' | 'right' | 'bottom' | 'left' | 'center' = 'center'
): Point {
  const bounds = getElementBounds(el);
  const midX = bounds.minX + bounds.width / 2;
  const midY = bounds.minY + bounds.height / 2;

  switch (anchor) {
    case 'top':
      return { x: midX, y: bounds.minY };
    case 'right':
      return { x: bounds.maxX, y: midY };
    case 'bottom':
      return { x: midX, y: bounds.maxY };
    case 'left':
      return { x: bounds.minX, y: midY };
    case 'center':
    default:
      return { x: midX, y: midY };
  }
}

export function getClosestAnchor(
  el: CanvasElement,
  point: Point
): { anchor: 'top' | 'right' | 'bottom' | 'left'; point: Point } {
  const anchors: Array<'top' | 'right' | 'bottom' | 'left'> = ['top', 'right', 'bottom', 'left'];
  let closestAnchor: 'top' | 'right' | 'bottom' | 'left' = 'top';
  let minDistance = Infinity;

  for (const a of anchors) {
    const pt = getElementAnchor(el, a);
    const dist = Math.hypot(pt.x - point.x, pt.y - point.y);
    if (dist < minDistance) {
      minDistance = dist;
      closestAnchor = a;
    }
  }

  return {
    anchor: closestAnchor,
    point: getElementAnchor(el, closestAnchor),
  };
}

export function generateConnectorPath(
  start: Point,
  end: Point,
  type: 'straight' | 'curved' | 'orthogonal'
): string {
  if (type === 'straight') {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }

  if (type === 'curved') {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const cx1 = start.x + dx * 0.5;
    const cy1 = start.y;
    const cx2 = start.x + dx * 0.5;
    const cy2 = end.y;
    return `M ${start.x} ${start.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${end.x} ${end.y}`;
  }

  if (type === 'orthogonal') {
    const midX = (start.x + end.x) / 2;
    return `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
  }

  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
}

export function pointsToSvgPath(points: Point[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y} L ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1];
    const p2 = points[i];
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    path += ` Q ${p1.x} ${p1.y}, ${midX} ${midY}`;
  }
  const last = points[points.length - 1];
  path += ` L ${last.x} ${last.y}`;
  return path;
}
