import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  CanvasElement,
  ConnectorType,
  DragState,
  Point,
  ResizeHandle,
  ShapeType,
  ToolType,
} from '../types';
import {
  generateConnectorPath,
  getClosestAnchor,
  getElementAnchor,
  getElementBounds,
  getMultiElementBounds,
  isElementInBox,
  isPointInElement,
  pointsToSvgPath,
  screenToWorld,
  worldToScreen,
} from '../utils/geometry';

interface CanvasProps {
  elements: CanvasElement[];
  onElementsChange: (elements: CanvasElement[]) => void;
  onCommitElements: (elements: CanvasElement[]) => void;
  selectedIds: string[];
  onSelectElements: (ids: string[]) => void;
  currentTool: ToolType;
  selectedShape: ShapeType;
  stickyColor: string;
  gridType: 'dots' | 'lines' | 'none';
  camera: Camera;
  onCameraChange: (camera: Camera) => void;
  onToolReset?: () => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  elements,
  onElementsChange,
  onCommitElements,
  selectedIds,
  onSelectElements,
  currentTool,
  selectedShape,
  stickyColor,
  gridType,
  camera,
  onCameraChange,
  onToolReset,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<{ id: string; anchor: 'top' | 'right' | 'bottom' | 'left' } | null>(null);
  const [tempConnectorEnd, setTempConnectorEnd] = useState<Point | null>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Keyboard space detection for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !editingId && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [editingId]);

  // Wheel zoom centered on cursor
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const nextZoom = Math.min(Math.max(camera.zoom * zoomFactor, 0.1), 5);

    const nextX = mouseX - (mouseX - camera.x) * (nextZoom / camera.zoom);
    const nextY = mouseY - (mouseY - camera.y) * (nextZoom / camera.zoom);

    onCameraChange({
      x: nextX,
      y: nextY,
      zoom: nextZoom,
    });
  };

  // Helper to sync connectors attached to moving elements
  const updateAttachedConnectors = (currentElements: CanvasElement[], movedElementIds: Set<string>): CanvasElement[] => {
    const elMap = new Map<string, CanvasElement>(currentElements.map((el) => [el.id, el]));

    return currentElements.map((el) => {
      if (el.type !== 'connector') return el;
      let newStart = { ...el.startPoint };
      let newEnd = { ...el.endPoint };

      if (el.startElementId && elMap.has(el.startElementId) && movedElementIds.has(el.startElementId)) {
        const startTarget = elMap.get(el.startElementId)!;
        newStart = getElementAnchor(startTarget, el.startAnchor || 'center');
      }

      if (el.endElementId && elMap.has(el.endElementId) && movedElementIds.has(el.endElementId)) {
        const endTarget = elMap.get(el.endElementId)!;
        newEnd = getElementAnchor(endTarget, el.endAnchor || 'center');
      }

      return {
        ...el,
        startPoint: newStart,
        endPoint: newEnd,
      };
    });
  };

  // Mouse Down
  const handleMouseDown = (e: React.MouseEvent) => {
    if (editingId) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldPt = screenToWorld({ x: screenX, y: screenY }, camera);

    // Pan canvas with space, middle button, or hand tool
    if (isSpacePressed || e.button === 1 || currentTool === 'hand') {
      setDragState({
        type: 'pan',
        startX: screenX,
        startY: screenY,
        currentX: screenX,
        currentY: screenY,
      });
      return;
    }

    if (e.button !== 0) return; // Only primary button for drawing/selecting

    // Eraser tool
    if (currentTool === 'eraser') {
      const hit = elements.slice().reverse().find((el) => isPointInElement(worldPt, el));
      if (hit) {
        const next = elements.filter((el) => el.id !== hit.id);
        onCommitElements(next);
      }
      return;
    }

    // Freehand Pen Tool
    if (currentTool === 'pen') {
      const newPen: CanvasElement = {
        id: `pen-${Date.now()}`,
        type: 'pen',
        x: worldPt.x,
        y: worldPt.y,
        width: 1,
        height: 1,
        points: [worldPt],
        strokeColor: '#0f172a',
        strokeWidth: 3,
        zIndex: elements.length + 1,
      };

      onElementsChange([...elements, newPen]);
      setDragState({
        type: 'draw',
        startX: worldPt.x,
        startY: worldPt.y,
        currentX: worldPt.x,
        currentY: worldPt.y,
        activeConnectorId: newPen.id,
      });
      return;
    }

    // Sticky Note creation tool
    if (currentTool === 'sticky') {
      const newSticky: CanvasElement = {
        id: `sticky-${Date.now()}`,
        type: 'sticky',
        x: worldPt.x - 90,
        y: worldPt.y - 70,
        width: 180,
        height: 140,
        text: '双击编辑便签',
        color: stickyColor,
        textColor: '#1e293b',
        fontSize: 14,
        textAlign: 'center',
        zIndex: elements.length + 1,
      };
      const next = [...elements, newSticky];
      onCommitElements(next);
      onSelectElements([newSticky.id]);
      onToolReset?.();
      return;
    }

    // Shape creation tool
    if (currentTool === 'shape') {
      const newShape: CanvasElement = {
        id: `shape-${Date.now()}`,
        type: 'shape',
        shapeType: selectedShape,
        x: worldPt.x - 80,
        y: worldPt.y - 50,
        width: 160,
        height: 100,
        fillColor: '#ffffff',
        strokeColor: '#0f172a',
        strokeWidth: 2,
        strokeStyle: 'solid',
        text: '',
        textColor: '#1e293b',
        fontSize: 14,
        textAlign: 'center',
        zIndex: elements.length + 1,
      };
      const next = [...elements, newShape];
      onCommitElements(next);
      onSelectElements([newShape.id]);
      onToolReset?.();
      return;
    }

    // Text tool
    if (currentTool === 'text') {
      const newText: CanvasElement = {
        id: `text-${Date.now()}`,
        type: 'text',
        x: worldPt.x,
        y: worldPt.y,
        width: 200,
        height: 40,
        text: '双击输入文字',
        textColor: '#0f172a',
        fontSize: 18,
        fontWeight: 'normal',
        textAlign: 'left',
        zIndex: elements.length + 1,
      };
      const next = [...elements, newText];
      onCommitElements(next);
      onSelectElements([newText.id]);
      setEditingId(newText.id);
      setEditingText('双击输入文字');
      onToolReset?.();
      return;
    }

    // Frame tool
    if (currentTool === 'frame') {
      const newFrame: CanvasElement = {
        id: `frame-${Date.now()}`,
        type: 'frame',
        x: worldPt.x - 250,
        y: worldPt.y - 180,
        width: 500,
        height: 360,
        title: '新建分区',
        fillColor: '#f8fafc',
        strokeColor: '#cbd5e1',
        zIndex: 0,
      };
      const next = [newFrame, ...elements]; // Place frames in background
      onCommitElements(next);
      onSelectElements([newFrame.id]);
      onToolReset?.();
      return;
    }

    // Connector tool
    if (currentTool === 'connector') {
      const hit = elements.slice().reverse().find((el) => isPointInElement(worldPt, el));
      if (hit) {
        const closest = getClosestAnchor(hit, worldPt);
        setConnectingFrom({ id: hit.id, anchor: closest.anchor });
        setTempConnectorEnd(worldPt);
      } else {
        // Free connector
        const newConn: CanvasElement = {
          id: `conn-${Date.now()}`,
          type: 'connector',
          connectorType: 'straight',
          x: worldPt.x,
          y: worldPt.y,
          width: 10,
          height: 10,
          startPoint: worldPt,
          endPoint: worldPt,
          strokeColor: '#64748b',
          strokeWidth: 2,
          strokeStyle: 'solid',
          endArrow: true,
          zIndex: elements.length + 1,
        };
        onElementsChange([...elements, newConn]);
        setDragState({
          type: 'connect',
          startX: worldPt.x,
          startY: worldPt.y,
          currentX: worldPt.x,
          currentY: worldPt.y,
          activeConnectorId: newConn.id,
        });
      }
      return;
    }

    // Select Tool: Hit test top-most element
    const hitElement = elements
      .slice()
      .reverse()
      .find((el) => isPointInElement(worldPt, el));

    if (hitElement) {
      if (e.shiftKey) {
        // Toggle selection
        if (selectedIds.includes(hitElement.id)) {
          onSelectElements(selectedIds.filter((id) => id !== hitElement.id));
        } else {
          onSelectElements([...selectedIds, hitElement.id]);
        }
      } else {
        if (!selectedIds.includes(hitElement.id)) {
          onSelectElements([hitElement.id]);
        }
      }

      // Prepare moving elements
      const targetIds = selectedIds.includes(hitElement.id) ? selectedIds : [hitElement.id];
      const initialMap = new Map<string, CanvasElement>();
      elements.forEach((el) => {
        if (targetIds.includes(el.id)) {
          initialMap.set(el.id, { ...el });
        }
      });

      setDragState({
        type: 'move',
        startX: worldPt.x,
        startY: worldPt.y,
        currentX: worldPt.x,
        currentY: worldPt.y,
        initialElements: initialMap,
      });
    } else {
      // Clicked on blank canvas
      if (!e.shiftKey) {
        onSelectElements([]);
      }
      // Start box-select marquee
      setDragState({
        type: 'box-select',
        startX: worldPt.x,
        startY: worldPt.y,
        currentX: worldPt.x,
        currentY: worldPt.y,
      });
    }
  };

  // Mouse Move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldPt = screenToWorld({ x: screenX, y: screenY }, camera);

    // Hover detection for ports and connectors
    if (!dragState) {
      const hit = elements.slice().reverse().find((el) => isPointInElement(worldPt, el));
      setHoveredElementId(hit ? hit.id : null);
    }

    // Connector drag from port
    if (connectingFrom) {
      setTempConnectorEnd(worldPt);
      return;
    }

    if (!dragState) return;

    // Canvas panning
    if (dragState.type === 'pan') {
      const dx = screenX - dragState.currentX;
      const dy = screenY - dragState.currentY;
      onCameraChange({
        ...camera,
        x: camera.x + dx,
        y: camera.y + dy,
      });
      setDragState({
        ...dragState,
        currentX: screenX,
        currentY: screenY,
      });
      return;
    }

    // Freehand drawing
    if (dragState.type === 'draw' && dragState.activeConnectorId) {
      onElementsChange(
        elements.map((el) => {
          if (el.id === dragState.activeConnectorId && el.type === 'pen') {
            return {
              ...el,
              points: [...el.points, worldPt],
            };
          }
          return el;
        })
      );
      return;
    }

    // Moving elements
    if (dragState.type === 'move' && dragState.initialElements) {
      const dx = worldPt.x - dragState.startX;
      const dy = worldPt.y - dragState.startY;
      const movedIds = new Set<string>(dragState.initialElements.keys());

      let updated = elements.map((el) => {
        const init = dragState.initialElements?.get(el.id);
        if (init) {
          if (init.type === 'connector') {
            return {
              ...init,
              startPoint: { x: init.startPoint.x + dx, y: init.startPoint.y + dy },
              endPoint: { x: init.endPoint.x + dx, y: init.endPoint.y + dy },
            };
          }
          return {
            ...init,
            x: init.x + dx,
            y: init.y + dy,
          };
        }
        return el;
      });

      // Also adjust connected arrows
      updated = updateAttachedConnectors(updated, movedIds);
      onElementsChange(updated);
      return;
    }

    // Resizing element
    if (dragState.type === 'resize' && dragState.handle && dragState.initialElements) {
      const targetId = selectedIds[0];
      const initial = dragState.initialElements.get(targetId);
      if (!initial) return;

      const dx = worldPt.x - dragState.startX;
      const dy = worldPt.y - dragState.startY;
      const handle = dragState.handle;

      let newX = initial.x;
      let newY = initial.y;
      let newW = initial.width;
      let newH = initial.height;

      if (handle.includes('e')) newW = Math.max(initial.width + dx, 30);
      if (handle.includes('s')) newH = Math.max(initial.height + dy, 30);
      if (handle.includes('w')) {
        const potentialW = initial.width - dx;
        if (potentialW >= 30) {
          newW = potentialW;
          newX = initial.x + dx;
        }
      }
      if (handle.includes('n')) {
        const potentialH = initial.height - dy;
        if (potentialH >= 30) {
          newH = potentialH;
          newY = initial.y + dy;
        }
      }

      let updated = elements.map((el) =>
        el.id === targetId ? ({ ...el, x: newX, y: newY, width: newW, height: newH } as CanvasElement) : el
      );

      updated = updateAttachedConnectors(updated, new Set([targetId]));
      onElementsChange(updated);
      return;
    }

    // Connector drawing in progress
    if (dragState.type === 'connect' && dragState.activeConnectorId) {
      onElementsChange(
        elements.map((el) =>
          el.id === dragState.activeConnectorId && el.type === 'connector'
            ? { ...el, endPoint: worldPt }
            : el
        )
      );
      return;
    }

    // Box select marquee
    if (dragState.type === 'box-select') {
      setDragState({
        ...dragState,
        currentX: worldPt.x,
        currentY: worldPt.y,
      });

      const box = {
        x: Math.min(dragState.startX, worldPt.x),
        y: Math.min(dragState.startY, worldPt.y),
        width: Math.abs(worldPt.x - dragState.startX),
        height: Math.abs(worldPt.y - dragState.startY),
      };

      const matchedIds = elements.filter((el) => isElementInBox(el, box)).map((el) => el.id);
      onSelectElements(matchedIds);
    }
  };

  // Mouse Up
  const handleMouseUp = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const worldPt = screenToWorld({ x: e.clientX - rect.left, y: e.clientY - rect.top }, camera);

    // Finish connector drag from port
    if (connectingFrom && tempConnectorEnd) {
      const hit = elements.slice().reverse().find((el) => el.id !== connectingFrom.id && isPointInElement(worldPt, el));
      const startEl = elements.find((el) => el.id === connectingFrom.id);

      if (startEl) {
        const startPt = getElementAnchor(startEl, connectingFrom.anchor);
        let endPt = worldPt;
        let endAnchor: 'top' | 'right' | 'bottom' | 'left' = 'center' as any;
        let endElementId: string | undefined = undefined;

        if (hit) {
          const closest = getClosestAnchor(hit, worldPt);
          endPt = closest.point;
          endAnchor = closest.anchor;
          endElementId = hit.id;
        }

        const newConn: CanvasElement = {
          id: `conn-${Date.now()}`,
          type: 'connector',
          connectorType: 'straight',
          x: Math.min(startPt.x, endPt.x),
          y: Math.min(startPt.y, endPt.y),
          width: Math.abs(endPt.x - startPt.x),
          height: Math.abs(endPt.y - startPt.y),
          startPoint: startPt,
          endPoint: endPt,
          startElementId: connectingFrom.id,
          endElementId,
          startAnchor: connectingFrom.anchor,
          endAnchor,
          strokeColor: '#64748b',
          strokeWidth: 2,
          strokeStyle: 'solid',
          endArrow: true,
          zIndex: elements.length + 1,
        };

        const next = [...elements, newConn];
        onCommitElements(next);
        onSelectElements([newConn.id]);
      }

      setConnectingFrom(null);
      setTempConnectorEnd(null);
      return;
    }

    if (dragState) {
      if (dragState.type === 'move' || dragState.type === 'resize' || dragState.type === 'draw' || dragState.type === 'connect') {
        onCommitElements(elements);
      }
      setDragState(null);
    }
  };

  // Start resize handle drag
  const handleResizeStart = (e: React.MouseEvent, handle: ResizeHandle) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const worldPt = screenToWorld({ x: e.clientX - rect.left, y: e.clientY - rect.top }, camera);

    const initialMap = new Map<string, CanvasElement>();
    elements.forEach((el) => {
      if (selectedIds.includes(el.id)) {
        initialMap.set(el.id, { ...el });
      }
    });

    setDragState({
      type: 'resize',
      handle,
      startX: worldPt.x,
      startY: worldPt.y,
      currentX: worldPt.x,
      currentY: worldPt.y,
      initialElements: initialMap,
    });
  };

  // Start connector drag directly from port dot
  const handlePortMouseDown = (e: React.MouseEvent, elId: string, anchor: 'top' | 'right' | 'bottom' | 'left') => {
    e.stopPropagation();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const worldPt = screenToWorld({ x: e.clientX - rect.left, y: e.clientY - rect.top }, camera);

    setConnectingFrom({ id: elId, anchor });
    setTempConnectorEnd(worldPt);
  };

  // Inline double click editing
  const handleDoubleClick = (e: React.MouseEvent, el: CanvasElement) => {
    e.stopPropagation();
    setEditingId(el.id);
    if ('text' in el && el.text !== undefined) {
      setEditingText(el.text);
    } else if (el.type === 'frame') {
      setEditingText(el.title);
    } else {
      setEditingText('');
    }
  };

  const handleFinishEditing = () => {
    if (!editingId) return;
    const updated = elements.map((el) => {
      if (el.id === editingId) {
        if (el.type === 'frame') return { ...el, title: editingText };
        if ('text' in el) return { ...el, text: editingText };
      }
      return el;
    });
    onCommitElements(updated);
    setEditingId(null);
    setEditingText('');
  };

  // Compute selection bounds
  const selectedElements = elements.filter((el) => selectedIds.includes(el.id));
  const selectionBounds = getMultiElementBounds(selectedElements);

  const touchStateRef = useRef<{
    isPinching: boolean;
    lastDist: number;
    lastMid: Point;
  } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (editingId) return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const mid = {
        x: (t1.clientX + t2.clientX) / 2 - rect.left,
        y: (t1.clientY + t2.clientY) / 2 - rect.top,
      };
      touchStateRef.current = {
        isPinching: true,
        lastDist: dist,
        lastMid: mid,
      };
      setDragState(null);
      return;
    }

    if (e.touches.length === 1) {
      touchStateRef.current = null;
      const t = e.touches[0];
      handleMouseDown({
        clientX: t.clientX,
        clientY: t.clientY,
        button: 0,
        shiftKey: false,
      } as any);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    if (e.touches.length === 2 && touchStateRef.current?.isPinching) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const mid = {
        x: (t1.clientX + t2.clientX) / 2 - rect.left,
        y: (t1.clientY + t2.clientY) / 2 - rect.top,
      };

      const last = touchStateRef.current;
      if (last && last.lastDist > 0) {
        const scale = dist / last.lastDist;
        const newZoom = Math.min(Math.max(camera.zoom * scale, 0.1), 5);
        const dx = mid.x - last.lastMid.x;
        const dy = mid.y - last.lastMid.y;

        const newX = mid.x - (mid.x - camera.x) * (newZoom / camera.zoom) + dx;
        const newY = mid.y - (mid.y - camera.y) * (newZoom / camera.zoom) + dy;

        onCameraChange({
          x: newX,
          y: newY,
          zoom: newZoom,
        });

        touchStateRef.current.lastDist = dist;
        touchStateRef.current.lastMid = mid;
      }
      return;
    }

    if (e.touches.length === 1 && !touchStateRef.current?.isPinching) {
      const t = e.touches[0];
      handleMouseMove({
        clientX: t.clientX,
        clientY: t.clientY,
      } as any);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStateRef.current?.isPinching) {
      if (e.touches.length < 2) {
        touchStateRef.current = null;
      }
      return;
    }
    const t = e.changedTouches[0];
    if (t) {
      handleMouseUp({
        clientX: t.clientX,
        clientY: t.clientY,
      } as any);
    }
  };

  // Background pattern calculation
  const gridStyle = {
    backgroundPosition: `${camera.x}px ${camera.y}px`,
    backgroundSize: `${30 * camera.zoom}px ${30 * camera.zoom}px`,
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={gridStyle}
      className={`relative w-full h-full overflow-hidden select-none outline-none touch-none ${
        isSpacePressed || currentTool === 'hand'
          ? 'cursor-grab active:cursor-grabbing'
          : currentTool === 'pen'
          ? 'cursor-crosshair'
          : currentTool === 'eraser'
          ? 'cursor-pointer'
          : 'cursor-default'
      } ${
        gridType === 'dots'
          ? 'canvas-grid-dots bg-[#fafafa]'
          : gridType === 'lines'
          ? 'canvas-grid-lines bg-[#ffffff]'
          : 'bg-[#ffffff]'
      }`}
    >
      {/* SVG Canvas for Elements */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <defs>
          <marker
            id="arrow-end"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b" />
          </marker>
        </defs>

        {/* Render elements sorted by zIndex */}
        {elements
          .slice()
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((el) => {
            const isSelected = selectedIds.includes(el.id);

            // Frame element
            if (el.type === 'frame') {
              return (
                <g key={el.id} id={el.id} onDoubleClick={(e) => handleDoubleClick(e, el)} className="pointer-events-auto">
                  <rect
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height}
                    rx={12}
                    fill={el.fillColor}
                    stroke={isSelected ? '#3b82f6' : el.strokeColor}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    className="transition-colors"
                  />
                  {/* Frame header bar */}
                  <rect
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={36}
                    rx={12}
                    fill={el.strokeColor}
                    fillOpacity={0.15}
                  />
                  <text
                    x={el.x + 14}
                    y={el.y + 23}
                    fontFamily="system-ui, sans-serif"
                    fontSize={13}
                    fontWeight="bold"
                    fill="#334155"
                  >
                    {el.title}
                  </text>
                </g>
              );
            }

            // Sticky Note
            if (el.type === 'sticky') {
              return (
                <g
                  key={el.id}
                  id={el.id}
                  onDoubleClick={(e) => handleDoubleClick(e, el)}
                  className="pointer-events-auto cursor-pointer"
                  filter="drop-shadow(0 4px 6px rgba(0,0,0,0.06))"
                >
                  <rect
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height}
                    rx={8}
                    fill={el.color}
                    stroke={isSelected ? '#2563eb' : 'rgba(0,0,0,0.06)'}
                    strokeWidth={isSelected ? 2 : 1}
                  />
                  {editingId !== el.id && (
                    <foreignObject
                      x={el.x + 10}
                      y={el.y + 10}
                      width={el.width - 20}
                      height={el.height - 20}
                      className="pointer-events-none"
                    >
                      <div
                        style={{
                          fontSize: `${el.fontSize}px`,
                          color: el.textColor,
                          textAlign: el.textAlign,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent:
                            el.textAlign === 'center'
                              ? 'center'
                              : el.textAlign === 'right'
                              ? 'flex-end'
                              : 'flex-start',
                          height: '100%',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                          lineHeight: '1.4',
                          fontWeight: 500,
                        }}
                      >
                        {el.text}
                      </div>
                    </foreignObject>
                  )}
                </g>
              );
            }

            // Shape element
            if (el.type === 'shape') {
              const strokeDash = el.strokeStyle === 'dashed' ? '6,4' : undefined;
              let shapeElement: React.ReactNode = null;

              if (el.shapeType === 'rectangle') {
                shapeElement = (
                  <rect
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height}
                    rx={4}
                    fill={el.fillColor}
                    stroke={isSelected ? '#3b82f6' : el.strokeColor}
                    strokeWidth={isSelected ? el.strokeWidth + 1 : el.strokeWidth}
                    strokeDasharray={strokeDash}
                  />
                );
              } else if (el.shapeType === 'rounded-rectangle') {
                shapeElement = (
                  <rect
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height}
                    rx={18}
                    fill={el.fillColor}
                    stroke={isSelected ? '#3b82f6' : el.strokeColor}
                    strokeWidth={isSelected ? el.strokeWidth + 1 : el.strokeWidth}
                    strokeDasharray={strokeDash}
                  />
                );
              } else if (el.shapeType === 'circle') {
                const rx = el.width / 2;
                const ry = el.height / 2;
                shapeElement = (
                  <ellipse
                    cx={el.x + rx}
                    cy={el.y + ry}
                    rx={rx}
                    ry={ry}
                    fill={el.fillColor}
                    stroke={isSelected ? '#3b82f6' : el.strokeColor}
                    strokeWidth={isSelected ? el.strokeWidth + 1 : el.strokeWidth}
                    strokeDasharray={strokeDash}
                  />
                );
              } else if (el.shapeType === 'diamond') {
                const midX = el.x + el.width / 2;
                const midY = el.y + el.height / 2;
                shapeElement = (
                  <polygon
                    points={`${midX},${el.y} ${el.x + el.width},${midY} ${midX},${el.y + el.height} ${el.x},${midY}`}
                    fill={el.fillColor}
                    stroke={isSelected ? '#3b82f6' : el.strokeColor}
                    strokeWidth={isSelected ? el.strokeWidth + 1 : el.strokeWidth}
                    strokeDasharray={strokeDash}
                  />
                );
              } else if (el.shapeType === 'triangle') {
                const midX = el.x + el.width / 2;
                shapeElement = (
                  <polygon
                    points={`${midX},${el.y} ${el.x + el.width},${el.y + el.height} ${el.x},${el.y + el.height}`}
                    fill={el.fillColor}
                    stroke={isSelected ? '#3b82f6' : el.strokeColor}
                    strokeWidth={isSelected ? el.strokeWidth + 1 : el.strokeWidth}
                    strokeDasharray={strokeDash}
                  />
                );
              } else if (el.shapeType === 'star') {
                const cx = el.x + el.width / 2;
                const cy = el.y + el.height / 2;
                const outerR = Math.min(el.width, el.height) / 2;
                const innerR = outerR * 0.45;
                let pts = '';
                for (let i = 0; i < 10; i++) {
                  const r = i % 2 === 0 ? outerR : innerR;
                  const angle = (i * Math.PI) / 5 - Math.PI / 2;
                  pts += `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)} `;
                }
                shapeElement = (
                  <polygon
                    points={pts.trim()}
                    fill={el.fillColor}
                    stroke={isSelected ? '#3b82f6' : el.strokeColor}
                    strokeWidth={isSelected ? el.strokeWidth + 1 : el.strokeWidth}
                    strokeDasharray={strokeDash}
                  />
                );
              }

              return (
                <g key={el.id} id={el.id} onDoubleClick={(e) => handleDoubleClick(e, el)} className="pointer-events-auto cursor-pointer">
                  {shapeElement}
                  {el.text && editingId !== el.id && (
                    <foreignObject
                      x={el.x + 8}
                      y={el.y + 8}
                      width={el.width - 16}
                      height={el.height - 16}
                      className="pointer-events-none"
                    >
                      <div
                        style={{
                          fontSize: `${el.fontSize || 14}px`,
                          color: el.textColor || '#1e293b',
                          textAlign: el.textAlign || 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent:
                            el.textAlign === 'left'
                              ? 'flex-start'
                              : el.textAlign === 'right'
                              ? 'flex-end'
                              : 'center',
                          height: '100%',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                          lineHeight: '1.3',
                          fontWeight: 500,
                        }}
                      >
                        {el.text}
                      </div>
                    </foreignObject>
                  )}
                </g>
              );
            }

            // Free Floating Text
            if (el.type === 'text') {
              return (
                <g key={el.id} id={el.id} onDoubleClick={(e) => handleDoubleClick(e, el)} className="pointer-events-auto cursor-pointer">
                  {editingId !== el.id && (
                    <foreignObject x={el.x} y={el.y} width={el.width} height={el.height}>
                      <div
                        style={{
                          fontSize: `${el.fontSize}px`,
                          fontWeight: el.fontWeight,
                          color: el.textColor,
                          textAlign: el.textAlign,
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                          lineHeight: '1.4',
                        }}
                      >
                        {el.text}
                      </div>
                    </foreignObject>
                  )}
                </g>
              );
            }

            // Freehand Pen Drawing
            if (el.type === 'pen') {
              const d = pointsToSvgPath(el.points);
              return (
                <path
                  key={el.id}
                  d={d}
                  fill="none"
                  stroke={isSelected ? '#3b82f6' : el.strokeColor}
                  strokeWidth={el.strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="pointer-events-auto cursor-pointer"
                />
              );
            }

            // Connector / Arrow
            if (el.type === 'connector') {
              const d = generateConnectorPath(el.startPoint, el.endPoint, el.connectorType);
              const strokeDash = el.strokeStyle === 'dashed' ? '6,4' : undefined;

              return (
                <g key={el.id} id={el.id} onDoubleClick={(e) => handleDoubleClick(e, el)} className="pointer-events-auto cursor-pointer">
                  <path
                    d={d}
                    fill="none"
                    stroke={isSelected ? '#3b82f6' : el.strokeColor}
                    strokeWidth={isSelected ? el.strokeWidth + 1 : el.strokeWidth}
                    strokeDasharray={strokeDash}
                    markerEnd={el.endArrow ? 'url(#arrow-end)' : undefined}
                  />
                  {/* Connector text label */}
                  {el.text && editingId !== el.id && (
                    <text
                      x={(el.startPoint.x + el.endPoint.x) / 2}
                      y={(el.startPoint.y + el.endPoint.y) / 2 - 8}
                      fontFamily="system-ui, sans-serif"
                      fontSize={12}
                      fill="#475569"
                      textAnchor="middle"
                      className="bg-white"
                    >
                      {el.text}
                    </text>
                  )}
                </g>
              );
            }

            return null;
          })}

        {/* Active temporary connector being dragged */}
        {connectingFrom && tempConnectorEnd && (
          <path
            d={generateConnectorPath(
              getElementAnchor(
                elements.find((el) => el.id === connectingFrom.id)!,
                connectingFrom.anchor
              ),
              tempConnectorEnd,
              'straight'
            )}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="4,4"
            markerEnd="url(#arrow-end)"
          />
        )}

        {/* Hover Port Dots (top, right, bottom, left) */}
        {hoveredElementId && !dragState && currentTool === 'select' && (
          (() => {
            const hoveredEl = elements.find((el) => el.id === hoveredElementId);
            if (!hoveredEl || hoveredEl.type === 'pen' || hoveredEl.type === 'connector') return null;

            const anchors: Array<'top' | 'right' | 'bottom' | 'left'> = ['top', 'right', 'bottom', 'left'];
            return (
              <g className="pointer-events-auto">
                {anchors.map((anchor) => {
                  const pt = getElementAnchor(hoveredEl, anchor);
                  return (
                    <circle
                      key={anchor}
                      cx={pt.x}
                      cy={pt.y}
                      r={4.5}
                      fill="#ffffff"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      className="cursor-crosshair hover:scale-125 transition-transform"
                      onMouseDown={(e) => handlePortMouseDown(e, hoveredEl.id, anchor)}
                    />
                  );
                })}
              </g>
            );
          })()
        )}

        {/* Selection Bounding Box & 8 Resize Handles */}
        {selectionBounds && selectedIds.length > 0 && (
          <g className="pointer-events-auto">
            <rect
              x={selectionBounds.x}
              y={selectionBounds.y}
              width={selectionBounds.width}
              height={selectionBounds.height}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={1.5}
              strokeDasharray="4,4"
              className="pointer-events-none"
            />

            {/* Render 8 Handles if exactly 1 element or resizing allowed */}
            {(['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as ResizeHandle[]).map((handle) => {
              let hx = selectionBounds.x;
              let hy = selectionBounds.y;

              if (handle.includes('e')) hx += selectionBounds.width;
              else if (!handle.includes('w')) hx += selectionBounds.width / 2;

              if (handle.includes('s')) hy += selectionBounds.height;
              else if (!handle.includes('n')) hy += selectionBounds.height / 2;

              let cursor = 'default';
              if (handle === 'nw' || handle === 'se') cursor = 'nwse-resize';
              if (handle === 'ne' || handle === 'sw') cursor = 'nesw-resize';
              if (handle === 'n' || handle === 's') cursor = 'ns-resize';
              if (handle === 'e' || handle === 'w') cursor = 'ew-resize';

              return (
                <rect
                  key={handle}
                  x={hx - 4.5}
                  y={hy - 4.5}
                  width={9}
                  height={9}
                  fill="#ffffff"
                  stroke="#2563eb"
                  strokeWidth={1.8}
                  rx={2}
                  style={{ cursor }}
                  onMouseDown={(e) => handleResizeStart(e, handle)}
                />
              );
            })}
          </g>
        )}

        {/* Box-selection Marquee */}
        {dragState?.type === 'box-select' && (
          <rect
            x={Math.min(dragState.startX, dragState.currentX)}
            y={Math.min(dragState.startY, dragState.currentY)}
            width={Math.abs(dragState.currentX - dragState.startX)}
            height={Math.abs(dragState.currentY - dragState.startY)}
            fill="rgba(59, 130, 246, 0.12)"
            stroke="#3b82f6"
            strokeWidth={1}
            strokeDasharray="3,3"
          />
        )}
      </svg>

      {/* HTML Overlay for inline Text Editing */}
      {editingId && (
        (() => {
          const el = elements.find((item) => item.id === editingId);
          if (!el) return null;

          const screenPos = worldToScreen({ x: el.x, y: el.y }, camera);
          const screenW = el.width * camera.zoom;
          const screenH = el.height * camera.zoom;

          return (
            <div
              className="absolute z-50 pointer-events-auto"
              style={{
                left: `${screenPos.x}px`,
                top: `${screenPos.y}px`,
                width: `${screenW}px`,
                height: `${screenH}px`,
              }}
            >
              <textarea
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onBlur={handleFinishEditing}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') handleFinishEditing();
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleFinishEditing();
                }}
                autoFocus
                style={{
                  fontSize: `${('fontSize' in el ? (el.fontSize ?? 14) : 14) * camera.zoom}px`,
                  textAlign: 'textAlign' in el ? (el.textAlign as any) : 'center',
                  color: 'textColor' in el ? el.textColor : '#1e293b',
                }}
                className="w-full h-full bg-white/95 rounded-lg p-2 outline-none border-2 border-blue-500 shadow-xl resize-none font-sans"
              />
            </div>
          );
        })()
      )}
    </div>
  );
};
