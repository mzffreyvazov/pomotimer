
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX } from 'lucide-react';
import { useTimer } from '@/contexts/TimerContext';

const SOUNDS = [
  { id: 'none', name: 'No Sound', path: '' },
  { id: 'rain', name: 'Rain', path: '/sounds/rain.mp3' },
  { id: 'forest', name: 'Forest', path: '/sounds/forest.mp3' },
  { id: 'cafe', name: 'Cafe', path: '/sounds/cafe.mp3' },
  { id: 'whitenoise', name: 'White Noise', path: '/sounds/whitenoise.mp3' },
];

const SoundControl: React.FC = () => {
  const { 
    isActive, 
    mode, 
    backgroundSound, 
    backgroundVolume, 
    setBackgroundSound, 
    setBackgroundVolume 
  } = useTimer();
  
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [previousVolume, setPreviousVolume] = useState<number>(backgroundVolume);

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

  return (
    <div className="sound-control mt-6 p-4 rounded-xl bg-pomo-muted/20 border border-pomo-muted/30 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-pomo-secondary">Background Sound</h3>
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
            className={`text-xs justify-center ${
              backgroundSound === sound.id
                ? mode === 'focus'
                  ? 'bg-pomo-primary/20 text-pomo-primary border-pomo-primary/30'
                  : mode === 'shortBreak'
                  ? 'bg-green-500/20 text-green-300 border-green-500/30'
                  : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                : 'bg-pomo-muted/30 text-pomo-secondary border-pomo-muted/50'
            }`}
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
            className={`${
              mode === 'focus'
                ? '[&>.slider-thumb]:bg-pomo-primary'
                : mode === 'shortBreak'
                ? '[&>.slider-thumb]:bg-green-400'
                : '[&>.slider-thumb]:bg-blue-400'
            }`}
          />
        </div>
      )}
    </div>
  );
};

export default SoundControl;
