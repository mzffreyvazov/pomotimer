import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Play, Pause, VolumeX, Volume1, Volume2 } from 'lucide-react';
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
    notificationVolume, 
    soundNotificationsEnabled 
  } = settings;
  
  const { theme } = useTheme();
  const [isMuted, setIsMuted] = useState<boolean>(notificationVolume === 0);
  const [previousVolume, setPreviousVolume] = useState<number>(notificationVolume);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const handleVolumeChange = (newVolume: number[]) => {
    // Ensure the volume is finite
    const volume = isFinite(newVolume[0]) ? newVolume[0] : 50;
    updateSettings({ notificationVolume: volume });
    if (volume > 0 && isMuted) {
      setIsMuted(false);
    }
  };
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMuted) {
      // Make sure previousVolume is a valid number
      const safeVolume = isFinite(previousVolume) && previousVolume > 0 ? previousVolume : 50;
      updateSettings({ notificationVolume: safeVolume });
      setIsMuted(false);
    } else {
      // Save the current volume if it's valid
      const currentVolume = isFinite(notificationVolume) ? notificationVolume : 50;
      setPreviousVolume(currentVolume);
      updateSettings({ notificationVolume: 0 });
      setIsMuted(true);
    }
  };

  const handleSoundSelection = (e: React.MouseEvent, soundId: NotificationSoundOption) => {
    e.stopPropagation();
    
    // Stop any currently playing preview sound
    if (isNotificationSoundPlaying) {
      toggleSoundPreview(notificationSound);
    }
    
    updateSettings({ notificationSound: soundId });
    
    // Schedule collapse after selection with a delay
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
    }
    
    collapseTimeoutRef.current = setTimeout(() => {
      if (!isHovering) {
        setIsExpanded(false);
      }
    }, 1000); // 1 second delay before collapsing
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
    }
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
    }
    
    collapseTimeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 500); // 0.5 second delay before collapsing
  };

  useEffect(() => {
    // Clean up timeout on unmount
    return () => {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
    };
  }, []);

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
        "sound-control mt-3 rounded-xl animate-fade-in cursor-pointer",
        isExpanded ? "p-4" : "py-3 px-4",
        "transition-all duration-500 ease-in-out"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => setIsExpanded(!isExpanded)}
    >      <div className="flex justify-between items-center h-7">
        <div className="flex items-center gap-0.5">
          <h3 className="text-sm font-medium">Alarm</h3>
          <span className="text-xs text-pomo-secondary ml-2 px-2 py-0.5 rounded-full bg-pomo-muted/50 font-poppins font-semibold">            
            {notificationSound === 'none' ? 'None Selected' : NOTIFICATION_SOUNDS.find(s => s.id === notificationSound)?.name}
          </span>
        </div>
        <div className="unified-volume-container group relative h-7 flex items-center justify-center">
          {notificationSound !== 'none' ? (
            <div className="flex items-center rounded-lg px-2 py-1 bg-transparent group-hover:bg-pomo-muted/50 transition-all duration-200 absolute right-0">
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-7 w-7 p-0 mr-1 text-pomo-secondary hover:text-pomo-foreground hover:bg-transparent",
                  isNotificationSoundPlaying && "text-pomo-primary"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSoundPreview(notificationSound);
                }}
              >
                {isNotificationSoundPlaying ? <Pause size={15} /> : <Play size={15} />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 p-0 mr-1 text-pomo-secondary hover:text-pomo-foreground hover:bg-transparent" 
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX size={15} /> : (notificationVolume < 50 ? <Volume1 size={15} /> : <Volume2 size={15} />)}
              </Button>
              
              <div className="volume-slider-container overflow-hidden w-0 group-hover:w-20 transition-all duration-300 ease-in-out opacity-0 group-hover:opacity-100">
                <Slider
                  defaultValue={[notificationVolume]}
                  max={100}
                  step={1}
                  value={[notificationVolume]}
                  onValueChange={handleVolumeChange}
                  className="volume-slider [&>.slider-thumb]:bg-pomo-primary"
                />
              </div>
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
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 p-0 mr-1 text-pomo-secondary cursor-not-allowed" 
                disabled
              >
                <VolumeX size={15} />
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
            onClick={(e) => handleSoundSelection(e, sound.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
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
