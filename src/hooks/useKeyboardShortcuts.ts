import { useEffect } from 'react';
import { useBattleMapStore } from '@/store/battle-map-store';

export const useKeyboardShortcuts = () => {
  const { undo, redo, canUndo, canRedo, selectAll, clearSelection } = useBattleMapStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if we're in an input field
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }

      // Handle keyboard shortcuts
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'z':
            event.preventDefault();
            if (event.shiftKey) {
              // Ctrl+Shift+Z or Ctrl+Y for redo
              if (canRedo) {
                redo();
              }
            } else {
              // Ctrl+Z for undo
              if (canUndo) {
                undo();
              }
            }
            break;
          
          case 'y':
            // Ctrl+Y for redo (alternative to Ctrl+Shift+Z)
            event.preventDefault();
            if (canRedo) {
              redo();
            }
            break;

          case 'a':
            // Ctrl+A for select all
            event.preventDefault();
            selectAll();
            break;
        }
      }

      // Handle non-Ctrl keys
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          clearSelection();
          break;
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo, canUndo, canRedo, selectAll, clearSelection]);

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    selectAll,
    clearSelection
  };
};
