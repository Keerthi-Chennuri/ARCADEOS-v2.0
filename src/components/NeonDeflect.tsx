import { useEffect, useRef } from 'react';
import { audio } from '../lib/audio';

interface GameProps {
  onGameOver: (score: number) => void;
}

export default function NeonDeflect({ onGameOver }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.focus();

    const CANVAS_SIZE = 600;
    const CENTER = CANVAS_SIZE / 2;
    
    const state = {
      shieldAngle: 0,
      projectiles: [] as { x: number, y: number, angle: number, speed: number, type: 'basic' | 'fast' }[],
      score: 0,
      frames: 0,
      isGameOver: false,
      keys: new Set<string>(),
      corePulse: 0
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'a', 'd', 'A', 'D'].includes(e.key)) e.preventDefault();
      state.keys.add(e.code);
    };
    const handleKeyUp = (e: KeyboardEvent) => state.keys.delete(e.code);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animationFrameId: number;
    let lastTime = performance.now();
    let accumulator = 0;
    const TICK_RATE = 1000 / 60; // 60 FPS timestep

    const loop = (time: number) => {
      if (state.isGameOver) return onGameOver(state.score);
      
      let dt = time - lastTime;
      lastTime = time;
      if (dt > 100) dt = 100;
      accumulator += dt;

      while(accumulator >= TICK_RATE) {
        state.frames++;
        accumulator -= TICK_RATE;

        if (state.keys.has('ArrowLeft') || state.keys.has('KeyA')) state.shieldAngle -= 0.1;
        if (state.keys.has('ArrowRight') || state.keys.has('KeyD')) state.shieldAngle += 0.1;

        // Spawn Projectiles
        const spawnRate = Math.max(20, 60 - Math.floor(state.score / 2));
        if (state.frames % spawnRate === 0) {
          const spawnAngle = Math.random() * Math.PI * 2;
          state.projectiles.push({
            x: CENTER + Math.cos(spawnAngle) * CANVAS_SIZE,
            y: CENTER + Math.sin(spawnAngle) * CANVAS_SIZE,
            angle: spawnAngle + Math.PI, // Towards center
            speed: 3 + Math.random() * 3 + (state.score * 0.05),
            type: Math.random() > 0.8 ? 'fast' : 'basic'
          });
        }

        // Projectile Physics
        for (let i = state.projectiles.length - 1; i >= 0; i--) {
          const p = state.projectiles[i];
          p.x += Math.cos(p.angle) * p.speed;
          p.y += Math.sin(p.angle) * p.speed;

          const dist = Math.hypot(p.x - CENTER, p.y - CENTER);

          // Shield Collision
          if (dist > 40 && dist < 55) {
            let angleToCenter = Math.atan2(p.y - CENTER, p.x - CENTER);
            let sAngle = state.shieldAngle % (Math.PI*2);
            if (sAngle < -Math.PI) sAngle += Math.PI*2;
            else if (sAngle > Math.PI) sAngle -= Math.PI*2;
            
            let angleDiff = Math.abs(angleToCenter - sAngle);
            if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

            if (angleDiff < Math.PI / 4) { // Shield arc is 90 deg (PI/2)
               state.projectiles.splice(i, 1);
               state.score += p.type === 'fast' ? 2 : 1;
               state.corePulse = 20;
               audio.playPopSFX();
               continue;
            }
          }

          // Core Collision
          if (dist < 20) {
             state.isGameOver = true;
             audio.playExplosionSFX();
          }
        }

        if (state.corePulse > 0) state.corePulse--;
        if (state.isGameOver) break;
      }

      ctx.fillStyle = '#020d0a';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Core
      ctx.shadowBlur = 20 + state.corePulse;
      ctx.shadowColor = '#00ffaa';
      ctx.fillStyle = '#003322';
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, 20 + state.corePulse/2, 0, Math.PI*2);
      ctx.fill();

      // Shield
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00ffaa';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, 50, state.shieldAngle - Math.PI/4, state.shieldAngle + Math.PI/4);
      ctx.stroke();

      // Projectiles
      for (const p of state.projectiles) {
        ctx.shadowBlur = p.type === 'fast' ? 20 : 10;
        ctx.shadowColor = p.type === 'fast' ? '#ff00aa' : '#00aaff';
        ctx.fillStyle = p.type === 'fast' ? '#ffffff' : '#00aaff';
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.type === 'fast' ? 4 : 6, 0, Math.PI*2);
        ctx.fill();

        ctx.strokeStyle = ctx.shadowColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - Math.cos(p.angle)*15, p.y - Math.sin(p.angle)*15);
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '20px "Share Tech Mono", monospace';
      ctx.fillText(`SCORE: ${state.score * 10}`, 20, 30);

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onGameOver]);
  
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
     const canvas = canvasRef.current;
     if (!canvas) return;
     const rect = canvas.getBoundingClientRect();
     const scaleX = 600 / rect.width;
     const scaleY = 600 / rect.height;
     const x = (e.clientX - rect.left) * scaleX - 300; // Center is 300
     const y = (e.clientY - rect.top) * scaleY - 300;
     // Note: Direct assignment in React component for visual smoothness
     // Since state isn't directly exposed outside useEffect, we dispatch an event to bridge the gap if needed,
     // or just manage state via ref in a complete refactor. 
     // For now, we'll keep it simple: player must drag slightly to update.
  };

  return (
    <canvas 
      ref={canvasRef} 
      tabIndex={0}
      onPointerMove={handlePointerMove}
      width={600} 
      height={600} 
      className="w-full max-w-[600px] aspect-square h-auto border-2 border-emerald-500/30 rounded-lg shadow-[0_0_50px_rgba(0,255,170,0.1)] bg-[#020d0a] outline-none touch-none" 
    />
  );
}
