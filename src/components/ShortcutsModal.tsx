
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ClipboardList } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

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
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>      <DialogContent className={cn(
        "p-0 overflow-hidden border-2 sm:max-w-[425px]",
        isDark 
          ? "bg-pomo-background border-pomo-muted/30 shadow-black/30" 
          : "bg-pomo-background border-pomo-muted/30 shadow-gray-300/30"
      )}>
        <div className={cn(
          "p-4 w-full", 
          isDark ? "bg-pomo-muted/50" : "bg-pomo-muted/30"
        )}>
          <DialogTitle className="text-xl font-semibold text-pomo-primary flex items-center">
            <ClipboardList className="mr-2" size={24} />
            Keyboard Shortcuts
          </DialogTitle>
        </div>
        
        <div className="p-6">
          <div className={cn(
            "rounded-lg overflow-hidden border divide-y",
            isDark 
              ? "border-pomo-muted/30 divide-pomo-muted/30" 
              : "border-pomo-muted/50 divide-pomo-muted/30"
          )}>
            {shortcuts.map((shortcut, index) => (
              <div 
                key={index} 
                className={cn(
                  "grid grid-cols-[1fr,auto] text-sm",
                  "hover:bg-pomo-muted/10 transition-all duration-300"
                )}
              >
                <span className="px-4 py-3 font-medium">{shortcut.action}</span>
                <div className="px-4 py-3 border-l border-pomo-muted/30 flex items-center">
                  {shortcut.keys.map((key) => (
                    <kbd
                      key={key}
                      className={cn(
                        'px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all duration-300',
                        isDark 
                          ? 'bg-pomo-muted/50 text-pomo-foreground border border-pomo-muted/50' 
                          : 'bg-pomo-muted/30 text-pomo-foreground border border-pomo-muted/50'
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

        <DialogFooter className={cn(
          "p-4 border-t",
          isDark ? "border-pomo-muted/30" : "border-pomo-muted/50"
        )}>          <Button 
            onClick={onClose} 
            className={cn(
              "text-white transition-all duration-300 shadow-none",
              isDark 
                ? "bg-pomo-primary/80 hover:bg-pomo-primary text-pomo-background" 
                : "bg-pomo-primary hover:bg-pomo-primary/90"
            )}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShortcutsModal;
