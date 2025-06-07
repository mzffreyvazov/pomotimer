import React, { useState } from 'react';
import { Button } from './ui/button';
import { Play, Pause, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications, NotificationSoundOption } from '@/contexts/NotificationContext';
import { NOTIFICATION_SOUNDS } from '@/lib/notificationSounds';

const NotificationSoundControl: React.FC = () => {
  const { 
    settings,
    updateSettings,
    previewNotificationSound,
    toggleSoundPreview,
    isNotificationSoundPlaying
  } = useNotifications();
  
  const { 
    notificationSound, 
    soundNotificationsEnabled 
  } = settings;
  
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleSoundSelection = (e: React.MouseEvent, soundId: NotificationSoundOption) => {
    e.stopPropagation(); // Prevent panel toggle
    
    // Stop any currently playing preview sound
    if (isNotificationSoundPlaying) {
      toggleSoundPreview(notificationSound);
    }
    
    updateSettings({ notificationSound: soundId });
  };

  // Classes for sound buttons based on theme and state
  const getSoundButtonClass = (soundId: string) => {
    const isSelected = notificationSound === soundId;
    
    if (isSelected) {
      return isDark
        ? 'bg-pomo-primary/20 text-pomo-primary border-pomo-primary/30 cursor-pointer sound-button-selected'
        : 'bg-pomo-primary/20 text-pomo-primary border-pomo-primary/30 cursor-pointer sound-button-selected';
    } else {
      return isDark
        ? 'bg-pomo-muted/30 text-pomo-secondary border-pomo-muted/50 cursor-pointer sound-button-normal'
        : 'bg-pomo-muted/50 text-pomo-foreground border-pomo-muted/50 cursor-pointer sound-button-normal';
    }
  };

  // Only show if sound notifications are enabled
  if (!soundNotificationsEnabled) {
    return null;
  }

  return (
    <div 
      className={cn(
        "sound-control mt-3 rounded-xl animate-fade-in cursor-pointer hover:bg-pomo-muted/20", // Always allow hover effect and cursor pointer
        isExpanded ? "p-4" : "py-3 px-4",
        "transition-all duration-500 ease-in-out"
      )}
      onClick={() => setIsExpanded(!isExpanded)} // Toggle expansion on click
    >
      <div className="flex justify-between items-center h-7">
        <div className="flex items-center gap-0.5">
          <h3 className="text-sm font-medium">Alarm</h3>
          <span className="text-xs text-pomo-secondary ml-2 px-2 py-0.5 rounded-full bg-pomo-muted/50 font-poppins font-semibold">            
            {notificationSound === 'none' ? 'None Selected' : NOTIFICATION_SOUNDS.find(s => s.id === notificationSound)?.name}
          </span>
          {/* Chevron button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "h-6 w-6 p-0 ml-2 text-pomo-secondary rounded-full hover:bg-pomo-muted/50" // No rounded-full, no hover background
            )}
            title={isExpanded ? "Collapse" : "Expand"}
            onClick={(e) => { // Allow clicking icon itself to toggle, stop propagation
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            <ChevronDown size={16} className={cn("transition-transform duration-300", isExpanded ? "rotate-0" : "-rotate-90")} />
          </Button>
        </div>
        <div className="unified-volume-container relative h-7 flex items-center justify-center" onClick={(e) => e.stopPropagation()}> {/* Stop propagation */}
          {notificationSound !== 'none' ? (
            <div className="flex items-center rounded-lg px-2 py-1 bg-transparent transition-all duration-200 absolute right-0">
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-7 w-7 p-0 mr-1 bg-transparent hover:bg-transparent", // Base style, ensure transparent bg on hover
                  isNotificationSoundPlaying 
                    ? "text-pomo-primary hover:text-pomo-primary" // When playing: text is primary, hover text is primary
                    : "text-pomo-secondary hover:text-pomo-foreground" // When not playing: text is secondary, hover text is foreground
                )}
                onClick={(e) => {
                  e.stopPropagation(); // Stop propagation
                  toggleSoundPreview(notificationSound);
                }}
              >
                {isNotificationSoundPlaying ? <Pause size={15} /> : <Play size={15} />}
              </Button>
            </div>
          ) : (
            <div className="flex items-center rounded-lg px-2 py-1 bg-transparent transition-all duration-200 absolute right-0 opacity-50 pointer-events-none">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 p-0 mr-1 text-pomo-secondary cursor-not-allowed" 
                disabled
              >
                <Play size={15} />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div 
        className={cn(
          "grid grid-cols-2 sm:grid-cols-3 gap-2 transition-all duration-500 ease-in-out overflow-hidden",
          isExpanded 
            ? "opacity-100 max-h-[200px] mt-4" 
            : "opacity-0 max-h-0 mt-0"
        )}
        onClick={(e) => e.stopPropagation()} // Stop propagation for the sound grid
      >
        {NOTIFICATION_SOUNDS.map((sound) => (
          <Button
            key={sound.id}
            variant="outline"
            size="sm"
            className={cn(
              "text-xs justify-center font-[600]",
              getSoundButtonClass(sound.id)
            )}
            onClick={(e) => handleSoundSelection(e, sound.id)} // handleSoundSelection already stops propagation
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation(); // Stop propagation
              if (sound.id !== 'none') {
                toggleSoundPreview(sound.id);
              }
            }}
          >
            {sound.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default NotificationSoundControl;
