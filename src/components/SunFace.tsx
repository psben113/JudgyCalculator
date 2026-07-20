import { useEffect, useState } from 'react';
import { SPRITES } from '../sprites';
import { PixelSprite } from './PixelSprite';

export type Mood = 'idle' | 'mock' | 'praise';

export function SunFace({ mood }: { mood: Mood }) {
  const [frame, setFrame] = useState('idle');

  useEffect(() => {
    if (mood === 'mock') {
      setFrame('laugh1');
      let open = true;
      const id = setInterval(() => {
        open = !open;
        setFrame(open ? 'laugh1' : 'laugh2');
      }, 170);
      return () => clearInterval(id);
    }

    if (mood === 'praise') {
      setFrame('praise');
      return;
    }

    setFrame('idle');
    let blinkTimer = 0;
    const id = setInterval(() => {
      setFrame('blink');
      blinkTimer = window.setTimeout(() => setFrame('idle'), 180);
    }, 3600);
    return () => {
      clearInterval(id);
      clearTimeout(blinkTimer);
    };
  }, [mood]);

  const sun = SPRITES.sun;
  return (
    <div className={`sun mood-${mood}`}>
      <PixelSprite rows={sun.frames[frame]} palette={sun.palette} scale={4} />
    </div>
  );
}
