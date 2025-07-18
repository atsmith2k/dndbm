import { MapCommand, HistoryManager } from '@/types/commands';

export class MapHistoryManager implements HistoryManager {
  private history: MapCommand[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 100;

  executeCommand(command: MapCommand): void {
    // Remove any commands after current index (when undoing then doing new action)
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    // Execute the command
    command.execute();
    
    // Add to history
    this.history.push(command);
    this.currentIndex++;
    
    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  undo(): boolean {
    if (!this.canUndo()) return false;
    
    const command = this.history[this.currentIndex];
    command.undo();
    this.currentIndex--;
    
    return true;
  }

  redo(): boolean {
    if (!this.canRedo()) return false;
    
    this.currentIndex++;
    const command = this.history[this.currentIndex];
    command.execute();
    
    return true;
  }

  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  getHistory(): MapCommand[] {
    return [...this.history];
  }

  getHistoryIndex(): number {
    return this.currentIndex;
  }

  getLastCommand(): MapCommand | null {
    return this.history[this.currentIndex] || null;
  }

  getUndoDescription(): string | null {
    if (!this.canUndo()) return null;
    return this.history[this.currentIndex].description;
  }

  getRedoDescription(): string | null {
    if (!this.canRedo()) return null;
    return this.history[this.currentIndex + 1].description;
  }
}

// Singleton instance
export const historyManager = new MapHistoryManager();
