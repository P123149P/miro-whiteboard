import React, { useCallback, useEffect, useState } from 'react';
import { Camera, CanvasElement, ShapeType, ToolType } from './types';
import { useHistory } from './hooks/useHistory';
import { PRESET_TEMPLATES } from './utils/templates';
import { getMultiElementBounds } from './utils/geometry';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { TopBar } from './components/TopBar';
import { ContextToolbar } from './components/ContextToolbar';
import { ZoomControls } from './components/ZoomControls';
import { Minimap } from './components/Minimap';
import { TemplatesModal } from './components/TemplatesModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { MobileModal } from './components/MobileModal';

export const App: React.FC = () => {
  // Initialize with the Brainstorming template so user sees an active, gorgeous Miro board
  const {
    elements,
    setElements,
    setElementsTransient,
    pushState,
    undo,
    redo,
    clearHistory,
    canUndo,
    canRedo,
  } = useHistory(PRESET_TEMPLATES[0].elements);

  const [boardTitle, setBoardTitle] = useState('💡 2026 新产品构想与头脑风暴');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentTool, setCurrentTool] = useState<ToolType>('select');
  const [selectedShape, setSelectedShape] = useState<ShapeType>('rectangle');
  const [stickyColor, setStickyColor] = useState<string>('#fef08a');
  const [gridType, setGridType] = useState<'dots' | 'lines' | 'none'>('dots');
  const [showMinimap, setShowMinimap] = useState(false); // Default false on mobile to give maximum drawing space
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);

  const [camera, setCamera] = useState<Camera>({
    x: 40,
    y: 30,
    zoom: 1,
  });

  // Selected elements calculation
  const selectedElements = elements.filter((el) => selectedIds.includes(el.id));
  const selectionBounds = getMultiElementBounds(selectedElements);

  // Update properties of selected elements
  const handleUpdateElement = useCallback(
    (updater: (el: CanvasElement) => CanvasElement) => {
      const next = elements.map((el) => (selectedIds.includes(el.id) ? updater(el) : el));
      pushState(next);
    },
    [elements, selectedIds, pushState]
  );

  // Duplicate selected elements
  const handleDuplicate = useCallback(() => {
    if (selectedIds.length === 0) return;
    const maxZ = Math.max(...elements.map((el) => el.zIndex), 0);
    const newElements: CanvasElement[] = [];
    const newIds: string[] = [];

    elements.forEach((el) => {
      if (selectedIds.includes(el.id)) {
        const id = `${el.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        newIds.push(id);
        if (el.type === 'connector') {
          newElements.push({
            ...el,
            id,
            startPoint: { x: el.startPoint.x + 30, y: el.startPoint.y + 30 },
            endPoint: { x: el.endPoint.x + 30, y: el.endPoint.y + 30 },
            startElementId: undefined,
            endElementId: undefined,
            zIndex: maxZ + 1,
          });
        } else if (el.type === 'pen') {
          newElements.push({
            ...el,
            id,
            x: el.x + 30,
            y: el.y + 30,
            points: el.points.map((p) => ({ x: p.x + 30, y: p.y + 30 })),
            zIndex: maxZ + 1,
          });
        } else {
          newElements.push({
            ...el,
            id,
            x: el.x + 30,
            y: el.y + 30,
            zIndex: maxZ + 1,
          });
        }
      }
    });

    const next = [...elements, ...newElements];
    pushState(next);
    setSelectedIds(newIds);
  }, [elements, selectedIds, pushState]);

  // Delete selected elements
  const handleDelete = useCallback(() => {
    if (selectedIds.length === 0) return;
    const next = elements.filter((el) => !selectedIds.includes(el.id));
    pushState(next);
    setSelectedIds([]);
  }, [elements, selectedIds, pushState]);

  // Layer ordering
  const handleBringToFront = useCallback(() => {
    if (selectedIds.length === 0) return;
    const maxZ = Math.max(...elements.map((el) => el.zIndex), 0);
    const next = elements.map((el) => (selectedIds.includes(el.id) ? { ...el, zIndex: maxZ + 1 } : el));
    pushState(next);
  }, [elements, selectedIds, pushState]);

  const handleSendToBack = useCallback(() => {
    if (selectedIds.length === 0) return;
    const minZ = Math.min(...elements.map((el) => el.zIndex), 0);
    const next = elements.map((el) => (selectedIds.includes(el.id) ? { ...el, zIndex: minZ - 1 } : el));
    pushState(next);
  }, [elements, selectedIds, pushState]);

  // Fit all elements to screen
  const handleFitToContent = useCallback(() => {
    const bounds = getMultiElementBounds(elements);
    if (!bounds || bounds.width === 0 || bounds.height === 0) {
      setCamera({ x: 0, y: 0, zoom: 1 });
      return;
    }

    const padding = 120;
    const availableW = window.innerWidth - padding * 2;
    const availableH = window.innerHeight - padding * 2;

    const scaleX = availableW / bounds.width;
    const scaleY = availableH / bounds.height;
    const zoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.2), 1.5);

    const x = (window.innerWidth - bounds.width * zoom) / 2 - bounds.x * zoom;
    const y = (window.innerHeight - bounds.height * zoom) / 2 - bounds.y * zoom;

    setCamera({ x, y, zoom });
  }, [elements]);

  // Minimap click navigation
  const handleMinimapNavigate = (worldX: number, worldY: number) => {
    const screenCenterX = window.innerWidth / 2;
    const screenCenterY = window.innerHeight / 2;
    setCamera({
      ...camera,
      x: screenCenterX - worldX * camera.zoom,
      y: screenCenterY - worldY * camera.zoom,
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (isInput) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        handleDuplicate();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        setSelectedIds(elements.map((el) => el.id));
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDelete();
        return;
      }

      if (e.key === 'v' || e.key === 'V') setCurrentTool('select');
      if (e.key === 'h' || e.key === 'H') setCurrentTool('hand');
      if (e.key === 'n' || e.key === 'N') setCurrentTool('sticky');
      if (e.key === 's' || e.key === 'S' || e.key === 'r' || e.key === 'R') setCurrentTool('shape');
      if (e.key === 't' || e.key === 'T') setCurrentTool('text');
      if (e.key === 'a' || e.key === 'A') setCurrentTool('connector');
      if (e.key === 'p' || e.key === 'P') setCurrentTool('pen');
      if (e.key === 'f' || e.key === 'F') setCurrentTool('frame');
      if (e.key === 'e' || e.key === 'E') setCurrentTool('eraser');

      if (e.key === '0') {
        setCamera((c) => ({ ...c, zoom: 1 }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [elements, redo, undo, handleDuplicate, handleDelete]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-50 font-sans">
      {/* Top Navigation & Action Bar */}
      <TopBar
        boardTitle={boardTitle}
        onUpdateTitle={setBoardTitle}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        elements={elements}
        onImportElements={(imported) => {
          clearHistory(imported);
          setSelectedIds([]);
        }}
        onClearCanvas={() => {
          clearHistory([]);
          setSelectedIds([]);
        }}
        onOpenTemplates={() => setShowTemplatesModal(true)}
        onOpenShortcuts={() => setShowShortcutsModal(true)}
        onOpenMobile={() => setShowMobileModal(true)}
        gridType={gridType}
        onToggleGrid={setGridType}
      />

      {/* Miro-style Left Toolbar / Mobile Bottom Dock */}
      <Toolbar
        currentTool={currentTool}
        selectedShape={selectedShape}
        onSelectTool={setCurrentTool}
        onSelectShape={setSelectedShape}
        onOpenTemplates={() => setShowTemplatesModal(true)}
        stickyColor={stickyColor}
        onSelectStickyColor={setStickyColor}
      />

      {/* Floating Context Toolbar */}
      <ContextToolbar
        selectedElements={selectedElements}
        selectionBounds={selectionBounds}
        camera={camera}
        onUpdateElement={handleUpdateElement}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onBringToFront={handleBringToFront}
        onSendToBack={handleSendToBack}
      />

      {/* Main Infinite Canvas Engine */}
      <Canvas
        elements={elements}
        onElementsChange={setElementsTransient}
        onCommitElements={pushState}
        selectedIds={selectedIds}
        onSelectElements={setSelectedIds}
        currentTool={currentTool}
        selectedShape={selectedShape}
        stickyColor={stickyColor}
        gridType={gridType}
        camera={camera}
        onCameraChange={setCamera}
        onToolReset={() => setCurrentTool('select')}
      />

      {/* Bottom Right Zoom & Radar Controls */}
      <ZoomControls
        camera={camera}
        onZoomIn={() => setCamera((c) => ({ ...c, zoom: Math.min(c.zoom * 1.15, 5) }))}
        onZoomOut={() => setCamera((c) => ({ ...c, zoom: Math.max(c.zoom * 0.85, 0.1) }))}
        onResetZoom={() => setCamera((c) => ({ ...c, zoom: 1 }))}
        onFitToContent={handleFitToContent}
        showMinimap={showMinimap}
        onToggleMinimap={() => setShowMinimap(!showMinimap)}
      />

      {/* Minimap Radar */}
      {showMinimap && (
        <Minimap
          elements={elements}
          camera={camera}
          onNavigate={handleMinimapNavigate}
        />
      )}

      {/* Templates Modal */}
      <TemplatesModal
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        onSelectTemplate={(tplElements) => {
          clearHistory(tplElements);
          setSelectedIds([]);
        }}
      />

      {/* Shortcuts Guide Modal */}
      <ShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      {/* Mobile / Android Guide & QR Code Modal */}
      <MobileModal
        isOpen={showMobileModal}
        onClose={() => setShowMobileModal(false)}
      />
    </div>
  );
};

export default App;

