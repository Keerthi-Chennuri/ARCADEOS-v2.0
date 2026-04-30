import { useEffect, useRef } from 'react';
import { audio } from '../lib/audio';

interface GameProps {
  onGameOver: (score: number) => void;
}

export default function OrbitalPulse({ onGameOver }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.focus();

    const CANVAS_SIZE = 600;
    const CENTER = CANVAS_SIZE / 2;
    const ORBIT_RADIUS = 200;
    
    const state = {
      player: { angle: 0, isJumping: false, jumpVelocity: 0, jumpAngle: 0, distance: ORBIT_RADIUS },
      enemies: [] as { angle: number, distance: number, isActive: boolean, speed: number }[],
      score: 0,
      frames: 0,
      isGameOver: false,
      pulseRadius: 0
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (!state.player.isJumping) {
          state.player.isJumping = true;
          state.player.jumpVelocity = 8;
          state.player.jumpAngle = state.player.angle;
          audio.playPopSFX();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

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

        // Player physics
        if (!state.player.isJumping) {
          state.player.angle += 0.03 + (state.score * 0.0005);
          state.player.distance = ORBIT_RADIUS;
        } else {
          state.player.distance -= state.player.jumpVelocity;
          state.player.jumpVelocity -= 0.5; // Gravity towards orbit
          
          if (state.player.distance >= ORBIT_RADIUS) {
            state.player.distance = ORBIT_RADIUS;
            state.player.isJumping = false;
            state.player.angle = state.player.jumpAngle + (state.frames * 0.03); // approximate re-entry
            audio.playShootSFX(); // thud
            state.pulseRadius = 20;
          }
        }

        // Spawn Enemies
        if (state.frames % Math.max(40, 100 - Math.floor(state.score)) === 0) {
          state.enemies.push({
            angle: Math.random() * Math.PI * 2,
            distance: CANVAS_SIZE,
            isActive: true,
            speed: 2 + Math.random() * 2 + (state.score * 0.1)
          });
        }

        // Enemy Physics
        for (let i = state.enemies.length - 1; i >= 0; i--) {
          const enemy = state.enemies[i];
          enemy.distance -= enemy.speed;

          // Check Collision
          if (enemy.isActive && Math.abs(enemy.distance - state.player.distance) < 20) {
             // Normalized angle diff
             let angleDiff = Math.abs((enemy.angle % (Math.PI*2)) - (state.player.angle % (Math.PI*2)));
             if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
             
             if (angleDiff < 0.2) {
               state.isGameOver = true;
               audio.playExplosionSFX();
             }
          }

          // Score and remove
          if (enemy.distance < ORBIT_RADIUS - 40) {
            if (enemy.isActive) {
               enemy.isActive = false;
               state.score += 10;
            }
          }
          if (enemy.distance < 0) {
             state.enemies.splice(i, 1);
          }
        }

        state.pulseRadius = Math.max(0, state.pulseRadius - 1);
        if (state.isGameOver) break;
      }

      ctx.fillStyle = '#0a0510';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Core
      ctx.shadowBlur = 30 + Math.sin(state.frames * 0.1) * 10;
      ctx.shadowColor = '#ab00ff';
      ctx.fillStyle = '#1a0033';
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, 40, 0, Math.PI*2);
      ctx.fill();
      
      // Orbit Path
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(171, 0, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, ORBIT_RADIUS, 0, Math.PI*2);
      ctx.stroke();

      // Pulse
      if (state.pulseRadius > 0) {
        ctx.strokeStyle = `rgba(171, 0, 255, ${state.pulseRadius / 20})`;
        ctx.beginPath();
        ctx.arc(CENTER, CENTER, ORBIT_RADIUS + (20 - state.pulseRadius) * 2, 0, Math.PI*2);
        ctx.stroke();
      }

      // Enemies
      for (const enemy of state.enemies) {
        const ex = CENTER + Math.cos(enemy.angle) * enemy.distance;
        const ey = CENTER + Math.sin(enemy.angle) * enemy.distance;
        
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff0055';
        ctx.fillStyle = '#ff0055';
        ctx.beginPath();
        ctx.arc(ex, ey, Math.max(2, enemy.distance/30), 0, Math.PI*2);
        ctx.fill();

        ctx.strokeStyle = '#ff0055';
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(CENTER + Math.cos(enemy.angle) * (enemy.distance + 15), CENTER + Math.sin(enemy.angle) * (enemy.distance + 15));
        ctx.stroke();
      }

      // Player
      const px = CENTER + Math.cos(state.player.angle) * state.player.distance;
      const py = CENTER + Math.sin(state.player.angle) * state.player.distance;
      
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#00ffff';
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px, py, 12, 0, Math.PI*2);
      ctx.fill();

      // Score
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
    };
  }, [onGameOver]);

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
      className="w-full max-w-[600px] aspect-square h-auto border-2 border-fuchsia-500/30 rounded-lg shadow-[0_0_50px_rgba(171,0,255,0.1)] bg-[#0a0510] outline-none touch-none" 
    />
  );
}
