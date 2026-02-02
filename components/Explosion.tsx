import React from 'react';
import { Particle } from '../types';

interface ExplosionProps {
  particles: Particle[];
}

export const Explosion: React.FC<ExplosionProps> = ({ particles }) => {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute flex items-center justify-center"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            backgroundColor: p.content ? 'transparent' : p.color,
            borderRadius: '50%',
            opacity: p.life,
            transform: `scale(${p.life})`,
            boxShadow: p.content ? 'none' : `0 0 ${p.size * 2}px ${p.color}`,
            fontSize: p.content ? `${p.size}px` : undefined,
          }}
        >
          {p.content}
        </div>
      ))}
    </div>
  );
};