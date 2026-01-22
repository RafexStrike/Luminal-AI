import { useState, useCallback, useEffect } from 'react';

/**
 * Hook to manage RAG sidebar state (collapsed, width, etc.)
 * Keeps sidebar logic separate from ChatWindow
 * 
 * Resize behavior:
 * - Only resizes on explicit mouse-down + drag
 * - Stops immediately on mouse-up
 * - No hover-based resizing
 * - Width constrained to 200-600px
 */
export function useRagSidebarState(defaultWidth = 320) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const startResize = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  // Handle mouse move during resize - memoized with correct dependency
  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;

    const containerWidth = window.innerWidth;
    const minWidth = 200;
    const maxWidth = 600;

    // Calculate new width based on mouse position from right edge
    const newWidth = containerWidth - e.clientX;

    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setSidebarWidth(newWidth);
    }
  }, [isResizing]);

  const stopResize = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Attach global mouse listeners ONLY when isResizing is true
  useEffect(() => {
    if (!isResizing) return;

    // Add listeners to document for reliable tracking
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResize);

    // Cleanup: remove listeners when resize ends
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopResize);
    };
  }, [isResizing, handleMouseMove, stopResize]);

  return {
    isCollapsed,
    toggleCollapse,
    sidebarWidth,
    setSidebarWidth,
    isResizing,
    startResize,
    stopResize,
  };
}
