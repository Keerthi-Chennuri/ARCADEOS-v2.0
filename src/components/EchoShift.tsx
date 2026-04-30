import { useEffect, useRef } from 'react';
import { audio } from '../lib/audio';

interface GameProps {
  onGameOver: (score: number) => void;
}

export default function EchoShift({ onGameOver }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.focus();

    const CANVAS_SIZE = 600;
    
    const state = {
      player: { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 },
      history: [] as { x: number, y: number, time: number }[],
      echos: [] as { delay: number }[],
      score: 0,
      frames: 0,
      isGameOver: false,
      keys: new Set<string>()
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) e.preventDefault();
      state.keys.add(e.key);
    };
    const handleKeyUp = (e: KeyboardEvent) => state.keys.delete(e.key);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animationFrameId: number;
    let lastTime = performance.now();
    let accumulator = 0;
    const TICK_RATE = 1000 / 60; // 60 FPS Fixed Time Step

    const loop = (time: number) => {
      if (state.isGameOver) {
        return onGameOver(state.score);
      }

      let dt = time - lastTime;
      lastTime = time;
      if (dt > 100) dt = 100;
      accumulator += dt;

      while (accumulator >= TICK_RATE) {
        state.frames++;
        accumulator -= TICK_RATE;

        const pSpeed = 4;
        let dx = 0; let dy = 0;
        
        if (state.keys.has('ArrowUp') || state.keys.has('w')) dy -= pSpeed;
        if (state.keys.has('ArrowDown') || state.keys.has('s')) dy += pSpeed;
        if (state.keys.has('ArrowLeft') || state.keys.has('a')) dx -= pSpeed;
        if (state.keys.has('ArrowRight') || state.keys.has('d')) dx += pSpeed;

        if (dx !== 0 && dy !== 0) {
          dx *= Math.SQRT1_2;
          dy *= Math.SQRT1_2;
        }

        state.player.x += dx;
        state.player.y += dy;

        // Collect score if moving
        if (dx !== 0 || dy !== 0) {
           state.score += 1;
        }

        // Wall collision
        if (
          state.player.x < 10 || state.player.x > CANVAS_SIZE - 10 ||
          state.player.y < 10 || state.player.y > CANVAS_SIZE - 10
        ) {
          state.isGameOver = true;
          audio.playExplosionSFX();
        }

        // Record history for echoes
        state.history.push({ x: state.player.x, y: state.player.y, time: state.frames });

        // Spawn echo every 5 seconds (300 frames)
        if (state.frames > 0 && state.frames % 300 === 0) {
          state.echos.push({ delay: state.frames });
          audio.playEchoSpawn();
        }

        // Keep history only as long as needed for the oldest echo
        if (state.echos.length > 0) {
          const maxDelay = state.echos[state.echos.length - 1].delay;
          while (state.history.length > 0 && state.history[0].time < state.frames - maxDelay) {
            state.history.shift();
          }
        }

        // Echo collision check
        for (const echo of state.echos) {
          // Find player's position `echo.delay` frames ago
          const pastState = state.history.find(h => h.time === state.frames - echo.delay);
          if (pastState) {
             const dist = Math.hypot(state.player.x - pastState.x, state.player.y - pastState.y);
             if (dist < 15) { // Collision radius
                state.isGameOver = true;
                audio.playExplosionSFX();
             }
          }
        }

        if (state.isGameOver) break;
      }

      ctx.fillStyle = '#05050c';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Draw grid
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      const xOffset = ((state.frames % gridSize) + gridSize) % gridSize;
      for (let i = -gridSize; i < CANVAS_SIZE + gridSize; i += gridSize) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_SIZE); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_SIZE, i); ctx.stroke();
      }

      ctx.shadowBlur = 15;

      // Draw Echoes
      state.echos.forEach((echo) => {
        const pastState = state.history.find(h => h.time === state.frames - echo.delay);
        if (pastState) {
          ctx.beginPath();
          ctx.arc(pastState.x, pastState.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = '#ff00aa';
          ctx.shadowColor = '#ff00aa';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(pastState.x, pastState.y, 14 + Math.sin(state.frames * 0.1) * 3, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 0, 170, ${0.3 + Math.sin(state.frames * 0.05) * 0.2})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      // Draw Player
      ctx.beginPath();
      ctx.arc(state.player.x, state.player.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#00f3ff';
      ctx.shadowColor = '#00f3ff';
      ctx.fill();

      // Draw UI
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '20px "Share Tech Mono", monospace';
      ctx.fillText(`SCORE: ${Math.floor(state.score / 10)}`, 20, 30);
      ctx.fillText(`ECHOS: ${state.echos.length}`, 20, 60);

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onGameOver]);

  return (
    <canvas 
      ref={canvasRef} 
      tabIndex={0}
      width={600} 
      height={600} 
      className="w-full max-w-[600px] aspect-square h-auto border-2 border-cyan-500/30 rounded-lg shadow-[0_0_50px_rgba(0,243,255,0.1)] bg-[#05050c] outline-none touch-none" 
    />
  );
}
