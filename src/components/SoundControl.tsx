import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { useTimer, SoundOption } from '@/contexts/TimerContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { SOUNDS } from '@/lib/sounds';

const SoundControl: React.FC = () => {
  const { 
    isActive, 
    mode, 
    backgroundSound, 
    backgroundVolume, 
    setBackgroundSound, 
    setBackgroundVolume,
    previewSound,
    togglePreview,
    isPreviewPlaying
  } = useTimer();
  
  const { theme } = useTheme();
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [previousVolume, setPreviousVolume] = useState<number>(backgroundVolume);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleVolumeChange = (newVolume: number[]) => {
    setBackgroundVolume(newVolume[0]);
    if (newVolume[0] > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMuted) {
      setBackgroundVolume(previousVolume > 0 ? previousVolume : 50);
      setIsMuted(false);
    } else {
      setPreviousVolume(backgroundVolume);
      setBackgroundVolume(0);
      setIsMuted(true);
    }
  };

  const handleSoundSelection = (e: React.MouseEvent, soundId: SoundOption) => {
    e.stopPropagation();
    
    // Stop any currently playing preview sound
    if (isPreviewPlaying) {
      togglePreview(backgroundSound);
    }
    
    setBackgroundSound(soundId);
    
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
    const isSelected = backgroundSound === soundId;
    
    if (isSelected) {
      let baseClass;
      let modeClass;
      
      if (mode === 'focus') {
        baseClass = isDark 
          ? 'bg-pomo-primary/20 text-pomo-primary border-pomo-primary/30 cursor-pointer'
          : 'bg-pomo-primary/20 text-pomo-primary border-pomo-primary/30 cursor-pointer';
        modeClass = 'sound-button-selected focus-mode';
      } else if (mode === 'break') {
        baseClass = isDark
          ? 'bg-green-500/20 text-green-300 border-green-500/30 cursor-pointer'
          : 'bg-green-600/20 text-green-700 border-green-600/30 cursor-pointer';
        modeClass = 'sound-button-selected break-mode';
      } else {
        baseClass = isDark
          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30 cursor-pointer'
          : 'bg-blue-600/20 text-blue-700 border-blue-600/30 cursor-pointer';
        modeClass = 'sound-button-selected short-break-mode';
      }
      
      return `${baseClass} ${modeClass}`;
    } else {
      // Add the mode-specific classes for non-selected buttons as well
      let modeClass;
      
      if (mode === 'focus') {
        modeClass = 'sound-button-normal focus-mode';
      } else if (mode === 'break') {
        modeClass = 'sound-button-normal break-mode';
      } else {
        modeClass = 'sound-button-normal short-break-mode';
      }
      
      return isDark
        ? `bg-pomo-muted/30 text-pomo-secondary border-pomo-muted/50 cursor-pointer ${modeClass}`
        : `bg-pomo-muted/50 text-pomo-foreground border-pomo-muted/50 cursor-pointer ${modeClass}`;
    }
  };

  return (
    <div 
      className={cn(
        "sound-control mt-6 rounded-xl animate-fade-in cursor-pointer",
        isExpanded ? "p-4" : "py-3 px-4",
        "transition-all duration-500 ease-in-out"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex justify-between items-center h-7">
        <div className="flex items-center gap-1">
          <h3 className="text-sm font-medium">Background Sound</h3>
          <span className="text-xs text-pomo-secondary ml-2 px-2 py-0.5 rounded-full bg-pomo-muted/50">
            {backgroundSound === 'none' ? 'No Sound' : SOUNDS.find(s => s.id === backgroundSound)?.name}
          </span>
        </div>
        <div className="unified-volume-container group relative h-7 flex items-center justify-center">
          {backgroundSound !== 'none' ? (
            <div className="flex items-center rounded-lg px-2 py-1 bg-transparent group-hover:bg-pomo-muted/50 transition-all duration-200 absolute right-0">
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-7 w-7 p-0 mr-1 text-pomo-secondary hover:text-pomo-foreground hover:bg-transparent",
                  isPreviewPlaying && "text-pomo-primary"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  togglePreview(backgroundSound);
                }}
              >
                <div className="relative w-[15px] h-[15px]">
                  <div className={cn(
                    "absolute inset-0 transition-opacity duration-300",
                    isPreviewPlaying ? "opacity-0" : "opacity-100"
                  )}>
                    <Play size={15} />
                  </div>
                  <div className={cn(
                    "absolute inset-0 transition-opacity duration-300",
                    isPreviewPlaying ? "opacity-100" : "opacity-0"
                  )}>
                    <Pause size={15} />
                  </div>
                </div>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 p-0 mr-1 text-pomo-secondary hover:text-pomo-foreground hover:bg-transparent" 
                onClick={toggleMute}
              >
                {backgroundVolume === 0 || isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </Button>
              <div className="volume-slider-container overflow-hidden w-0 group-hover:w-20 transition-all duration-300 ease-in-out opacity-0 group-hover:opacity-100">
                <Slider
                  defaultValue={[backgroundVolume]}
                  max={100}
                  step={1}
                  value={[backgroundVolume]}
                  onValueChange={handleVolumeChange}
                  className={cn(
                    "volume-slider",
                    `${
                      mode === 'focus'
                        ? '[&>.slider-thumb]:bg-pomo-primary'
                        : mode === 'break'
                        ? '[&>.slider-thumb]:bg-green-400 dark:[&>.slider-thumb]:bg-green-400'
                        : '[&>.slider-thumb]:bg-blue-400 dark:[&>.slider-thumb]:bg-blue-400'
                    }`
                  )}
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
        {SOUNDS.map((sound) => (
          <Button
            key={sound.id}
            variant="outline"
            size="sm"
            className={cn(
              "text-xs justify-center",
              getSoundButtonClass(sound.id)
            )}
            onClick={(e) => handleSoundSelection(e, sound.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (sound.id !== 'none') {
                togglePreview(sound.id);
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

export default SoundControl;
