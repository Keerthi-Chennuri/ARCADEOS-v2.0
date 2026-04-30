import { useEffect, useRef } from 'react';
import { audio } from '../lib/audio';

interface GameProps {
  onGameOver: (score: number) => void;
}

export default function ChromaCatch({ onGameOver }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.focus();

    const CANVAS_SIZE = 600;
    const COLORS = ['#ff0055', '#00ffcc', '#ffcc00'];
    
    const state = {
      player: { x: CANVAS_SIZE / 2, width: 80, colorIndex: 0 },
      drops: [] as { x: number, y: number, colorIndex: number, speed: number }[],
      score: 0,
      frames: 0,
      isGameOver: false,
      keys: new Set<string>()
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'a', 'd', 'A', 'D', 'Space'].includes(e.key) || e.code === 'Space') e.preventDefault();
      state.keys.add(e.code);
      if (e.code === 'Space') {
        state.player.colorIndex = (state.player.colorIndex + 1) % COLORS.length;
        audio.playPopSFX();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      state.keys.delete(e.code);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animationFrameId: number;
    let lastTime = performance.now();
    let accumulator = 0;
    const TICK_RATE = 1000 / 60; // 60 FPS Fixed Time Step

    const loop = (time: number) => {
      if (state.isGameOver) return onGameOver(state.score);
      
      let dt = time - lastTime;
      lastTime = time;
      if (dt > 100) dt = 100;
      accumulator += dt;

      while (accumulator >= TICK_RATE) {
        state.frames++;
        accumulator -= TICK_RATE;

        // Input
        if (state.keys.has('ArrowLeft') || state.keys.has('KeyA') || state.keys.has('a')) state.player.x -= 7;
        if (state.keys.has('ArrowRight') || state.keys.has('KeyD') || state.keys.has('d')) state.player.x += 7;
        
        // Clamp
        state.player.x = Math.max(state.player.width/2, Math.min(CANVAS_SIZE - state.player.width/2, state.player.x));

        // Spawn Drops
        if (state.frames % Math.max(30, 80 - Math.floor(state.score / 5)) === 0) {
          state.drops.push({
            x: 20 + Math.random() * (CANVAS_SIZE - 40),
            y: -20,
            colorIndex: Math.floor(Math.random() * COLORS.length),
            speed: 3 + Math.random() * 2 + (state.score / 50)
          });
        }

        // Drops Physics
        for (let i = state.drops.length - 1; i >= 0; i--) {
          const drop = state.drops[i];
          drop.y += drop.speed;

          // Collision Check
          if (drop.y > CANVAS_SIZE - 40 && drop.y < CANVAS_SIZE) {
            if (Math.abs(drop.x - state.player.x) < state.player.width / 2 + 10) {
              if (drop.colorIndex === state.player.colorIndex) {
                state.score += 10;
                audio.playPopSFX();
              } else {
                state.isGameOver = true;
                audio.playExplosionSFX();
              }
              state.drops.splice(i, 1);
              continue;
            }
          }

          // Missed
          if (drop.y > CANVAS_SIZE) {
             state.drops.splice(i, 1);
             state.isGameOver = true;
             audio.playExplosionSFX();
          }
        }
        if (state.isGameOver) break;
      }

      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Drops
      for (let i = state.drops.length - 1; i >= 0; i--) {
        const drop = state.drops[i];
        ctx.shadowBlur = 15;
        ctx.shadowColor = COLORS[drop.colorIndex];
        ctx.fillStyle = COLORS[drop.colorIndex];
        ctx.beginPath();
        ctx.arc(drop.x, drop.y, 10, 0, Math.PI*2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(drop.x - 3, drop.y - 3, 2, 0, Math.PI*2);
        ctx.fill();
      }

      // Player
      ctx.shadowBlur = 20;
      ctx.shadowColor = COLORS[state.player.colorIndex];
      ctx.fillStyle = COLORS[state.player.colorIndex];
      ctx.fillRect(state.player.x - state.player.width/2, CANVAS_SIZE - 30, state.player.width, 20);

      // Score
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '20px "Share Tech Mono", monospace';
      ctx.fillText(`SCORE: ${state.score}`, 20, 30);

      // Indicators next to score
      COLORS.forEach((col, idx) => {
        ctx.fillStyle = col;
        ctx.globalAlpha = idx === state.player.colorIndex ? 1 : 0.3;
        ctx.beginPath();
        ctx.arc(20 + idx * 25, 55, 8, 0, Math.PI*2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

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
     const x = (e.clientX - rect.left) * scaleX;
     window.dispatchEvent(new KeyboardEvent('keydown', {code: 'CustomPointerMove'})); // wakeup focus if needed
     if (canvas) {
        // we'll hackily set player x directly here for smooth mouse follow but it's best coupled with state via a ref.
     }
  };

  const handlePointerDown = () => {
     window.dispatchEvent(new KeyboardEvent('keydown', {code: 'Space'}));
  };

  return (
    <canvas 
      ref={canvasRef} 
      tabIndex={0}
      onPointerDown={handlePointerDown}
      width={600} 
      height={600} 
      className="w-full max-w-[600px] aspect-square h-auto border-2 border-indigo-500/30 rounded-lg shadow-[0_0_50px_rgba(100,50,255,0.1)] bg-[#0a0a1a] outline-none touch-none" 
    />
  );
}
