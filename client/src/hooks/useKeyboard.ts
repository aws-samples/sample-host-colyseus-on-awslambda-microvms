import { useEffect } from 'react';
import { useInputStore } from '../stores/useInputStore';
import { useGameStore } from '../stores/useGameStore';

export function useKeyboard() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        useGameStore.getState().togglePause();
        return;
      }
      useInputStore.getState().keyDown(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      useInputStore.getState().keyUp(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
}
