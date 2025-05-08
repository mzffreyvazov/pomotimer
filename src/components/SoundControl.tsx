import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX } from 'lucide-react';
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
    setBackgroundVolume 
  } = useTimer();
  
  const { theme } = useTheme();
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [previousVolume, setPreviousVolume] = useState<number>(backgroundVolume);

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleVolumeChange = (newVolume: number[]) => {
    setBackgroundVolume(newVolume[0]);
    if (newVolume[0] > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setBackgroundVolume(previousVolume > 0 ? previousVolume : 50);
      setIsMuted(false);
    } else {
      setPreviousVolume(backgroundVolume);
      setBackgroundVolume(0);
      setIsMuted(true);
    }
  };

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
    <div className="sound-control mt-6 p-4 rounded-xl animate-fade-in">
      <div className="flex justify-between items-center mb-4 h-8">
        <h3 className="text-sm font-medium">Background Sound</h3>
        <div className="unified-volume-container group relative">
          {backgroundSound !== 'none' ? (
            <div className="flex items-center rounded-lg px-2 py-1 bg-transparent group-hover:bg-pomo-muted/50 transition-all duration-200">
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
            <div className="h-7 w-7"></div> /* Placeholder to maintain consistent height */
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {SOUNDS.map((sound) => (
          <Button
            key={sound.id}
            variant="outline"
            size="sm"
            className={cn(
              "text-xs justify-center",
              getSoundButtonClass(sound.id)
            )}
            onClick={() => setBackgroundSound(sound.id)}
          >
            {sound.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default SoundControl;
