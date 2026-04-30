import { useEffect, useRef } from 'react';
import { audio } from '../lib/audio';

interface GameProps {
  onGameOver: (score: number) => void;
}

export default function QuantumSnake({ onGameOver }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.focus();

    const GRID_SIZE = 20;
    const TILE_COUNT = 600 / GRID_SIZE; // 30
    
    // Initial state
    const state = {
      snake: [
        { x: 15, y: 15 },
        { x: 15, y: 16 },
        { x: 15, y: 17 }
      ],
      dir: { x: 0, y: -1 },
      nextDir: { x: 0, y: -1 },
      apple: { x: 10, y: 10 },
      score: 0,
      frames: 0,
      isGameOver: false,
      speed: 8, // updates every N frames
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) e.preventDefault();
      
      if ((e.key === 'ArrowUp' || e.key === 'w') && state.dir.y !== 1) state.nextDir = { x: 0, y: -1 };
      if ((e.key === 'ArrowDown' || e.key === 's') && state.dir.y !== -1) state.nextDir = { x: 0, y: 1 };
      if ((e.key === 'ArrowLeft' || e.key === 'a') && state.dir.x !== 1) state.nextDir = { x: -1, y: 0 };
      if ((e.key === 'ArrowRight' || e.key === 'd') && state.dir.x !== -1) state.nextDir = { x: 1, y: 0 };
    };
    window.addEventListener('keydown', handleKeyDown);

    // Touch swipe support
    let touchStartX = 0;
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
       touchStartX = e.touches[0].clientX;
       touchStartY = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
       const dx = e.changedTouches[0].clientX - touchStartX;
       const dy = e.changedTouches[0].clientY - touchStartY;
       if (Math.abs(dx) > Math.abs(dy)) {
           if (dx > 20 && state.dir.x !== -1) state.nextDir = {x: 1, y: 0};
           else if (dx < -20 && state.dir.x !== 1) state.nextDir = {x: -1, y: 0};
       } else {
           if (dy > 20 && state.dir.y !== -1) state.nextDir = {x: 0, y: 1};
           else if (dy < -20 && state.dir.y !== 1) state.nextDir = {x: 0, y: -1}; // Fix: Down is y:1 mapped against y!==1? Wait. Down is y:1, up is y:-1.
       }
    };
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);


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

        if (state.frames % state.speed === 0) {
          state.dir = { ...state.nextDir };
          const head = state.snake[0];
          const newHead = { x: head.x + state.dir.x, y: head.y + state.dir.y };

          // Wall collision
          if (newHead.x < 0 || newHead.x >= TILE_COUNT || newHead.y < 0 || newHead.y >= TILE_COUNT) {
            state.isGameOver = true;
            audio.playExplosionSFX();
          }

          // Self collision
          for (const segment of state.snake) {
            if (newHead.x === segment.x && newHead.y === segment.y) {
              state.isGameOver = true;
              audio.playExplosionSFX();
            }
          }

          if (state.isGameOver) break;

          state.snake.unshift(newHead);

          // Apple collision
          if (newHead.x === state.apple.x && newHead.y === state.apple.y) {
             state.score += 10;
             audio.playPopSFX();
             state.speed = Math.max(3, 8 - Math.floor(state.score / 50));
             
             let newApple;
             while (true) {
                newApple = { x: Math.floor(Math.random() * TILE_COUNT), y: Math.floor(Math.random() * TILE_COUNT) };
                if (!state.snake.some(s => s.x === newApple?.x && s.y === newApple?.y)) break;
             }
             state.apple = newApple!;
          } else {
             state.snake.pop();
          }
        }
      }

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 600, 600);

      // Grid
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 1;
      for(let i=0; i<TILE_COUNT; i++) {
        ctx.beginPath(); ctx.moveTo(i*GRID_SIZE, 0); ctx.lineTo(i*GRID_SIZE, 600); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i*GRID_SIZE); ctx.lineTo(600, i*GRID_SIZE); ctx.stroke();
      }

      // Apple
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00ff00';
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(state.apple.x * GRID_SIZE + 2, state.apple.y * GRID_SIZE + 2, GRID_SIZE - 4, GRID_SIZE - 4);

      // Snake
      state.snake.forEach((seg, i) => {
        ctx.shadowBlur = i === 0 ? 10 : 0;
        ctx.shadowColor = '#ffffff';
        ctx.fillStyle = i === 0 ? '#ffffff' : `hsl(120, ${100 - i*2}%, ${50 - i*0.5}%)`;
        ctx.fillRect(seg.x * GRID_SIZE + 1, seg.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2);
      });

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
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onGameOver]);

  return (
    <canvas 
      ref={canvasRef} 
      tabIndex={0}
      width={600} 
      height={600} 
      className="w-full max-w-[600px] aspect-square h-auto border-2 border-green-500/30 rounded-lg shadow-[0_0_50px_rgba(0,255,0,0.1)] bg-black outline-none touch-none" 
    />
  );
}
