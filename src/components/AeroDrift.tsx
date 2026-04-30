import { useEffect, useRef } from 'react';
import { audio } from '../lib/audio';

interface GameProps {
  onGameOver: (score: number) => void;
}

export default function AeroDrift({ onGameOver }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.focus();

    const CANVAS_SIZE = 600;
    
    const state = {
      player: { y: CANVAS_SIZE / 2, velocity: 0, gravity: 0.35, boost: -6.5 },
      obstacles: [] as { x: number, topHeight: number, gap: number, passed?: boolean }[],
      score: 0,
      frames: 0,
      isGameOver: false,
      keys: new Set<string>(),
      isBoosting: false
    };

    const handleKeyDown = (e: KeyboardEvent) => {
       if (e.code === 'Space') {
         e.preventDefault();
         state.isBoosting = true;
       }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
       if (e.code === 'Space') {
         e.preventDefault();
         state.isBoosting = false;
       }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    state.obstacles.push({ x: CANVAS_SIZE, topHeight: 200, gap: 200 });

    let animationFrameId: number;
    let lastTime = performance.now();
    let accumulator = 0;
    const TICK_RATE = 1000 / 60; 

    const loop = (time: number) => {
      if (state.isGameOver) return onGameOver(state.score);
      
      let dt = time - lastTime;
      lastTime = time;
      if (dt > 100) dt = 100;
      accumulator += dt;

      while (accumulator >= TICK_RATE) {
        state.frames++;
        accumulator -= TICK_RATE;

        if (state.isBoosting) {
          state.player.velocity += (state.player.boost - state.player.velocity) * 0.15;
        } else {
          state.player.velocity += state.player.gravity;
        }
        state.player.y += state.player.velocity;

        if (state.player.y < 0 || state.player.y > CANVAS_SIZE) {
          state.isGameOver = true;
          audio.playExplosionSFX();
        }

        const speed = 4 + (state.score / 500);

        if (state.obstacles.length === 0 || (CANVAS_SIZE - state.obstacles[state.obstacles.length - 1].x > 250)) {
           const gap = Math.max(100, 200 - state.score / 5);
           const minHeight = 50;
           const maxHeight = CANVAS_SIZE - gap - 50;
           const topHeight = minHeight + Math.random() * (maxHeight - minHeight);
           state.obstacles.push({ x: CANVAS_SIZE, topHeight, gap });
        }

        for (let i = state.obstacles.length - 1; i >= 0; i--) {
          const obs = state.obstacles[i];
          obs.x -= speed;
          const obsWidth = 50;
          const playerX = 100;

          if (playerX + 15 > obs.x && playerX - 15 < obs.x + obsWidth) {
             if (state.player.y - 15 < obs.topHeight || state.player.y + 15 > obs.topHeight + obs.gap) {
               state.isGameOver = true;
               audio.playExplosionSFX();
             }
          }

          if (obs.x + obsWidth < playerX && !obs.passed) {
             obs.passed = true;
             state.score += 10;
             audio.playShootSFX();
          }

          if (obs.x < -100) {
             state.obstacles.splice(i, 1);
          }
        }
        
        if (state.isGameOver) break;
      }

      ctx.fillStyle = '#080d14';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      ctx.fillStyle = '#ffffff';
      for(let i=0; i<30; i++) {
        ctx.globalAlpha = Math.random() * 0.5;
        ctx.fillRect((((i * 47 - state.frames) % CANVAS_SIZE) + CANVAS_SIZE) % CANVAS_SIZE, (i * 31) % CANVAS_SIZE, 2, 2);
      }
      ctx.globalAlpha = 1;

      for (let i = state.obstacles.length - 1; i >= 0; i--) {
        const obs = state.obstacles[i];
        const obsWidth = 50;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00f3ff';
        ctx.fillStyle = '#005566';
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 2;

        ctx.fillRect(obs.x, 0, obsWidth, obs.topHeight);
        ctx.strokeRect(obs.x, 0, obsWidth, obs.topHeight);

        const bottomY = obs.topHeight + obs.gap;
        ctx.fillRect(obs.x, bottomY, obsWidth, CANVAS_SIZE - bottomY);
        ctx.strokeRect(obs.x, bottomY, obsWidth, CANVAS_SIZE - bottomY);
      }

      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ffcc00';
      ctx.fillStyle = state.isBoosting ? '#ffffff' : '#ffcc00';
      ctx.beginPath();
      ctx.arc(100, state.player.y, 15, 0, Math.PI*2);
      ctx.fill();

      if (state.isBoosting) {
         ctx.fillStyle = '#ff5500';
         ctx.beginPath();
         ctx.moveTo(85, state.player.y);
         ctx.lineTo(60 + Math.random() * 10, state.player.y + 5);
         ctx.lineTo(60 + Math.random() * 10, state.player.y - 5);
         ctx.fill();
      }

      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '20px "Share Tech Mono", monospace';
      ctx.fillText(`SCORE: ${state.score}`, 20, 30);

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onGameOver]);

  const handlePointerDown = () => { window.dispatchEvent(new KeyboardEvent('keydown', {code: 'Space'})); };
  const handlePointerUp = () => { window.dispatchEvent(new KeyboardEvent('keyup', {code: 'Space'})); };

  return (
    <canvas 
      ref={canvasRef} 
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      width={600} 
      height={600} 
      className="w-full max-w-[600px] aspect-square h-auto border-2 border-blue-500/30 rounded-lg shadow-[0_0_50px_rgba(0,100,255,0.1)] bg-[#080d14] outline-none touch-none" 
    />
  );
}
