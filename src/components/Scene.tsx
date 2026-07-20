import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { SPRITES, type SpriteName } from '../sprites';
import { PixelSprite } from './PixelSprite';
import { SunFace, type Mood } from './SunFace';

function mulberry(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
}

function Cloud({ top, duration, delay, scale }: { top: number; duration: number; delay: number; scale: number }) {
  const style: CSSProperties = {
    top,
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`,
  };
  return (
    <div className="cloud" style={style}>
      <PixelSprite rows={SPRITES.cloud.frames.drift} palette={SPRITES.cloud.palette} scale={scale} />
    </div>
  );
}

interface CritterProps {
  name: SpriteName;
  fps: number;
  scale: number;
  duration: number;
  delay: number;
  top?: number;
  bottom?: number;
}

function Critter({ name, fps, scale, duration, delay, top, bottom }: CritterProps) {
  const sprite = SPRITES[name];
  const frames = useMemo(() => Object.values(sprite.frames), [sprite]);
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % frames.length), 1000 / fps);
    return () => clearInterval(id);
  }, [fps, frames.length]);

  const style: CSSProperties = {
    top,
    bottom,
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`,
  };
  return (
    <div className="critter" style={style}>
      <div className={`gait gait-${name}`}>
        <PixelSprite rows={frames[i]} palette={sprite.palette} scale={scale} />
      </div>
    </div>
  );
}

function Stars() {
  const stars = useMemo(() => {
    const rnd = mulberry(42);
    return Array.from({ length: 26 }, (_, i) => ({
      id: i,
      x: rnd() * 96 + 2,
      y: rnd() * 120 + 4,
      delay: rnd() * 2,
    }));
  }, []);
  return (
    <div className="stars" aria-hidden="true">
      {stars.map((s) => (
        <span key={s.id} style={{ left: `${s.x}%`, top: s.y, animationDelay: `${s.delay}s` }} />
      ))}
    </div>
  );
}

function GrassStrip() {
  const cols = 88;
  const tufts = useMemo(() => {
    const rnd = mulberry(7);
    return Array.from({ length: cols }, (_, x) => ({
      x,
      h: 1 + Math.floor(rnd() * 3),
      shade: rnd() > 0.5,
    }));
  }, []);
  return (
    <svg
      className="grass"
      viewBox={`0 0 ${cols} 8`}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <rect x={0} y={3} width={cols} height={5} fill="var(--grass-base)" />
      {tufts.map((t) => (
        <rect
          key={t.x}
          x={t.x}
          y={3 - t.h}
          width={1}
          height={t.h + 1}
          fill={t.shade ? 'var(--grass-dark)' : 'var(--grass-light)'}
        />
      ))}
    </svg>
  );
}

export function Scene({ mood, message }: { mood: Mood; message: string | null }) {
  return (
    <div className="scene">
      <Stars />
      <Cloud top={16} duration={38} delay={-12} scale={3} />
      <Cloud top={58} duration={55} delay={-34} scale={2} />
      <Cloud top={94} duration={70} delay={-8} scale={2} />
      <SunFace mood={mood} />
      {message && <div className="bubble">{message}</div>}
      <Critter name="bird" top={44} duration={13} delay={-5} fps={6} scale={3} />
      <Critter name="butterfly" top={100} duration={24} delay={-16} fps={7} scale={3} />
      <Critter name="bunny" bottom={16} duration={17} delay={-3} fps={5} scale={3} />
      <GrassStrip />
    </div>
  );
}
