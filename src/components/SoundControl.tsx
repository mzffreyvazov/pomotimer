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
      if (mode === 'focus') {
        return isDark 
          ? 'bg-pomo-primary/20 text-pomo-primary border-pomo-primary/30'
          : 'bg-pomo-primary/20 text-pomo-primary border-pomo-primary/30';
      } else if (mode === 'break') {
        return isDark
          ? 'bg-green-500/20 text-green-300 border-green-500/30'
          : 'bg-green-600/20 text-green-700 border-green-600/30';
      } else {
        return isDark
          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
          : 'bg-blue-600/20 text-blue-700 border-blue-600/30';
      }
    } else {
      return isDark
        ? 'bg-pomo-muted/30 text-pomo-secondary border-pomo-muted/50'
        : 'bg-pomo-muted/50 text-pomo-foreground border-pomo-muted/50 hover:bg-pomo-muted/70';
    }
  };

  return (
    <div className="sound-control mt-6 p-4 rounded-xl animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium">Background Sound</h3>
        {backgroundSound !== 'none' && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-pomo-secondary hover:text-pomo-foreground" 
            onClick={toggleMute}
          >
            {backgroundVolume === 0 || isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </Button>
        )}
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

      {backgroundSound !== 'none' && (
        <div className="mt-4 px-1">
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
      )}
    </div>
  );
};

export default SoundControl;
