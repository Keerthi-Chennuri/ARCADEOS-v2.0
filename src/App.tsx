import { useState } from 'react';
import EchoShift from './components/EchoShift';
import OrbitalPulse from './components/OrbitalPulse';
import NeonDeflect from './components/NeonDeflect';
import QuantumSnake from './components/QuantumSnake';
import ChromaCatch from './components/ChromaCatch';
import AeroDrift from './components/AeroDrift';
import { audio } from './lib/audio';
import { Gamepad2, Orbit, ShieldCheck, ArrowLeft, GitCommitHorizontal, Palette, Navigation } from 'lucide-react';

interface GameInfo {
  id: string;
  name: string;
  description: string;
  rules: string[];
  theme: string;
  gradient: string;
  icon: JSX.Element;
}

const GAMES: GameInfo[] = [
  {
    id: 'echo',
    name: 'ECHO SHIFT',
    description: 'A neon time-distortion survival game.',
    rules: [
      '▶ Use WASD or Arrows to maneuver.',
      '▶ Every few seconds, an echo clone of your past appears.',
      '▶ NEVER touch your clones or the walls.',
      "▶ Keep moving so you don't trap your future self."
    ],
    theme: 'cyan/fuchsia',
    gradient: 'from-cyan-400 to-fuchsia-500',
    icon: <Gamepad2 size={32} />
  },
  {
    id: 'orbit',
    name: 'ORBITAL PULSE',
    description: 'Ethereal spatial timing & physics.',
    rules: [
      '▶ Press SPACE to launch off your current orbit.',
      '▶ Land on the next orbit ring before you are dragged away.',
      '▶ Timing is everything. Keep climbing outward into the void.'
    ],
    theme: 'teal',
    gradient: 'from-emerald-400 to-teal-500',
    icon: <Orbit size={32} />
  },
  {
    id: 'deflect',
    name: 'NEON DEFLECT',
    description: 'Retro synthwave arcade reflex defense.',
    rules: [
      '▶ Use LEFT and RIGHT arrows to rotate your shield.',
      '▶ Deflect incoming glowing energy orbs.',
      '▶ Protect the magenta core at all costs.'
    ],
    theme: 'magenta',
    gradient: 'from-fuchsia-500 to-orange-500',
    icon: <ShieldCheck size={32} />
  },
  {
    id: 'snake',
    name: 'QUANTUM SNAKE',
    description: 'Classic grid runner with a luminous twist.',
    rules: [
      '▶ Use Arrows/WASD to turn.',
      '▶ Eat the red energy fragments to grow and score.',
      '▶ Do not hit the walls or yourself.',
      '▶ Speeds up as you consume more fragments.'
    ],
    theme: 'green',
    gradient: 'from-green-400 to-lime-400',
    icon: <GitCommitHorizontal size={32} />
  },
  {
    id: 'catch',
    name: 'CHROMA CATCH',
    description: 'Color-matching rhythm drop catcher.',
    rules: [
      '▶ LEFT/RIGHT arrows to move your paddle.',
      '▶ Press SPACE to cycle your paddle color.',
      "▶ You MUST match the falling drop's color to catch it.",
      '▶ Catching the wrong color or dropping one is GAME OVER.'
    ],
    theme: 'indigo',
    gradient: 'from-indigo-400 to-purple-500',
    icon: <Palette size={32} />
  },
  {
    id: 'drift',
    name: 'AERO DRIFT',
    description: 'Anti-gravity cavern navigation.',
    rules: [
      '▶ Press SPACE to engage thrusters and rise.',
      '▶ Release SPACE to fall with gravity.',
      '▶ Navigate through the neon energy gaps.',
      '▶ Do not touch the structures or boundary walls.'
    ],
    theme: 'blue',
    gradient: 'from-blue-400 to-cyan-500',
    icon: <Navigation size={32} />
  }
];

type AppState = 'select' | 'rules' | 'playing' | 'gameover';

export default function App() {
  const [appState, setAppState] = useState<AppState>('select');
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const activeGame = GAMES.find(g => g.id === activeGameId);

  const handleSelect = (id: string) => {
    setActiveGameId(id);
    setAppState('rules');
  };

  const handleStart = async () => {
    await audio.init();
    if (activeGameId === 'echo') audio.playBGM();
    else if (activeGameId === 'orbit') audio.playOrbitBGM();
    else if (activeGameId === 'deflect') audio.playDeflectBGM();
    else if (activeGameId === 'snake') audio.playSnakeBGM();
    else if (activeGameId === 'catch') audio.playCatchBGM();
    else if (activeGameId === 'drift') audio.playDriftBGM();
    
    setAppState('playing');
  };

  const handleGameOver = (finalScore: number) => {
    audio.stopBGM();
    if (activeGameId) audio.playGameOver(activeGameId);
    setScore(finalScore);
    setAppState('gameover');
  };

  const handleBackToMenu = () => {
    audio.stopBGM();
    setAppState('select');
    setActiveGameId(null);
  };

  return (
    <div className="min-h-screen w-full flex items-start justify-center relative bg-[#050508] text-white selection:bg-fuchsia-500/30 overflow-y-auto">
      <div className="crt-overlay" />
      
      <div className="relative z-10 w-full max-w-5xl p-4 sm:p-6 flex flex-col items-center">
        
        {appState !== 'playing' && (
          <div className="text-center mb-8 w-full relative">
            {appState !== 'select' && (
               <button onClick={handleBackToMenu} className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                  <ArrowLeft size={20} /> <span className="hidden sm:inline">TERMINAL</span>
               </button>
            )}
            <h1 className="text-3xl font-bold tracking-[0.3em] uppercase text-gray-500 shadow-sm mt-8 md:mt-0">
                ARCADE<span className="text-white">OS</span> v2.0
            </h1>
          </div>
        )}

        {appState === 'select' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full mt-4 pb-10 px-2 lg:px-0">
            {GAMES.map(game => (
              <button
                key={game.id}
                onClick={() => handleSelect(game.id)}
                className="group relative flex flex-col items-center p-6 bg-black/40 border border-white/10 hover:border-white/40 rounded-xl backdrop-blur-md transition-all hover:scale-105 hover:bg-white/5"
              >
                <div className={`mb-3 text-white opacity-70 group-hover:opacity-100 transition-opacity`}>
                   {game.icon}
                </div>
                <h2 className={`text-xl font-black mb-2 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r ${game.gradient}`}>
                  {game.name}
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 font-sans tracking-wide">
                  {game.description}
                </p>
              </button>
            ))}
          </div>
        )}

        {appState === 'rules' && activeGame && (
          <div className="text-center p-8 bg-black/40 border border-white/10 backdrop-blur-sm rounded-xl max-w-xl w-full animate-in fade-in zoom-in duration-300">
            <h2 className={`text-5xl font-black mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r ${activeGame.gradient} glitch`}>
              {activeGame.name}
            </h2>
            <p className="text-gray-400 mb-8 max-w-sm mx-auto leading-relaxed">
              {activeGame.description}
            </p>
            
            <div className="flex flex-col gap-3 text-sm text-gray-300 mb-10 text-left bg-black/60 p-6 rounded-lg border border-white/5 shadow-inner">
              <strong className="text-white tracking-widest text-lg uppercase mb-2">HOW TO PLAY</strong>
              {activeGame.rules.map((rule, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="">{rule}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleStart}
              className={`px-12 py-4 border-2 border-white/20 text-white font-bold text-xl hover:bg-white hover:text-black transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] uppercase tracking-widest`}
            >
              INITIALIZE
            </button>
          </div>
        )}

        {appState === 'playing' && (
          <div className="relative w-full flex flex-col items-center">
             {activeGameId === 'echo' && <EchoShift onGameOver={handleGameOver} />}
             {activeGameId === 'orbit' && <OrbitalPulse onGameOver={handleGameOver} />}
             {activeGameId === 'deflect' && <NeonDeflect onGameOver={handleGameOver} />}
             {activeGameId === 'snake' && <QuantumSnake onGameOver={handleGameOver} />}
             {activeGameId === 'catch' && <ChromaCatch onGameOver={handleGameOver} />}
             {activeGameId === 'drift' && <AeroDrift onGameOver={handleGameOver} />}
          </div>
        )}

        {appState === 'gameover' && (
          <div className="text-center p-10 bg-black/80 border border-white/20 backdrop-blur-md rounded-xl max-w-md w-full animate-in zoom-in slide-in-from-bottom-4">
            <h2 className="text-5xl font-black mb-3 tracking-widest text-red-500 uppercase">
              GAME OVER
            </h2>
            <p className="text-2xl text-white mb-8 tracking-wider">FINAL SCORE: <span className="font-black text-3xl">{score}</span></p>
            
            <div className="flex flex-col gap-4">
               <button
                 onClick={handleStart}
                 className="px-8 py-4 border border-white/30 text-white hover:bg-white hover:text-black transition-colors uppercase tracking-widest font-bold"
               >
                 TRY AGAIN
               </button>
               <button
                 onClick={handleBackToMenu}
                 className="px-8 py-4 text-gray-500 hover:text-white transition-colors uppercase tracking-widest text-sm"
               >
                 MAIN TERMINAL
               </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
