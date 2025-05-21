
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { action: 'Start/Stop Timer', keys: ['Space'] },
  { action: 'Increase Time (+10s)', keys: ['L'] },
  { action: 'Decrease Time (-10s)', keys: ['J'] },
  { action: 'Toggle Timer Dragging', keys: ['D'] },
  { action: 'Toggle Theme', keys: ['T'] },
];

const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-pomo-background border-pomo-muted/30">
        <DialogHeader>
          <DialogTitle className="text-pomo-foreground">Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="rounded-lg overflow-hidden border border-pomo-muted/30 divide-y divide-pomo-muted/30">
            {shortcuts.map((shortcut, index) => (
              <div 
                key={index} 
                className={cn(
                  "grid grid-cols-[200px,1fr] text-sm text-pomo-foreground",
                  "hover:bg-pomo-muted/5"
                )}
              >
                <span className="px-4 py-3">{shortcut.action}</span>
                <div className="px-4 py-3 border-l border-pomo-muted/30">
                  {shortcut.keys.map((key) => (
                    <kbd
                      key={key}
                      className={cn(
                        'px-2 py-1 text-xs font-semibold text-pomo-foreground-muted rounded-md',
                        'bg-pomo-muted/20 border border-pomo-muted/50'
                      )}
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
          ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="text-pomo-foreground border-pomo-muted hover:bg-pomo-muted/20">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShortcutsModal;
