export interface Vector2 {
  x: number;
  y: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
  content?: string; // For emojis
}

export type GameState = 'intro' | 'asking' | 'won';

export interface FloatingHeart {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}