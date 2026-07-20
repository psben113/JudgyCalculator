import data from './sprites.json';

export interface Sprite {
  palette: Record<string, string>;
  frames: Record<string, string[]>;
}

export type SpriteName = 'sun' | 'cloud' | 'bunny' | 'bird' | 'butterfly';

export const SPRITES = data as unknown as Record<SpriteName, Sprite>;
