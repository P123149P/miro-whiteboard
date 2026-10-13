import { useCallback, useRef, useState } from 'react';
import { CanvasElement } from '../types';

export function useHistory(initialElements: CanvasElement[]) {
  const [elements, setElementsInternal] = useState<CanvasElement[]>(initialElements);
  const pastRef = useRef<CanvasElement[][]>([]);
  const futureRef = useRef<CanvasElement[][]>([]);

  const pushState = useCallback((newElements: CanvasElement[]) => {
    setElementsInternal((current) => {
      // Avoid pushing identical states
      if (JSON.stringify(current) === JSON.stringify(newElements)) {
        return current;
      }
      pastRef.current = [...pastRef.current.slice(-40), current];
      futureRef.current = [];
      return newElements;
    });
  }, []);

  const setElements = useCallback((updater: CanvasElement[] | ((prev: CanvasElement[]) => CanvasElement[])) => {
    setElementsInternal((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      pastRef.current = [...pastRef.current.slice(-40), current];
      futureRef.current = [];
      return next;
    });
  }, []);

  // For live changes (e.g. while dragging or resizing without polluting undo history)
  const setElementsTransient = useCallback((updater: CanvasElement[] | ((prev: CanvasElement[]) => CanvasElement[])) => {
    setElementsInternal(updater);
  }, []);

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    const previous = pastRef.current[pastRef.current.length - 1];
    pastRef.current = pastRef.current.slice(0, -1);

    setElementsInternal((current) => {
      futureRef.current = [current, ...futureRef.current];
      return previous;
    });
  }, []);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current[0];
    futureRef.current = futureRef.current.slice(1);

    setElementsInternal((current) => {
      pastRef.current = [...pastRef.current, current];
      return next;
    });
  }, []);

  const clearHistory = useCallback((newElements: CanvasElement[]) => {
    pastRef.current = [];
    futureRef.current = [];
    setElementsInternal(newElements);
  }, []);

  return {
    elements,
    setElements,
    setElementsTransient,
    pushState,
    undo,
    redo,
    clearHistory,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
  };
}
