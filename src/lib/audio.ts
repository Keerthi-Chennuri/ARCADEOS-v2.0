export class AudioEngine {
  ctx: AudioContext | null = null;
  bgmNodes: any[] = [];

  async init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  stopBGM() {
    this.bgmNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {}
    });
    this.bgmNodes = [];
  }

  _playDrone(freq: number, type: OscillatorType, vol: number) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 2);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    this.bgmNodes.push(osc, gain);
  }

  playBGM() {
    this.stopBGM();
    this._playDrone(65.41, 'sine', 0.3); // C2
    this._playDrone(98.00, 'triangle', 0.1);  // G2
  }

  playOrbitBGM() {
    this.stopBGM();
    this._playDrone(146.83, 'sine', 0.2); // D3
    this._playDrone(220.00, 'triangle', 0.15); // A3
  }

  playDeflectBGM() {
    this.stopBGM();
    this._playDrone(82.41, 'triangle', 0.2); // E2
    this._playDrone(123.47, 'sine', 0.1); 
  }

  playSnakeBGM() {
    this.stopBGM();
    this._playDrone(110, 'square', 0.05); // A2
    this._playDrone(164.81, 'sine', 0.1); 
  }

  playCatchBGM() {
    this.stopBGM();
    this._playDrone(174.61, 'sine', 0.2); // F3
    this._playDrone(261.63, 'triangle', 0.1); // C4
  }

  playDriftBGM() {
    this.stopBGM();
    this._playDrone(87.31, 'sine', 0.2); // F2
    this._playDrone(130.81, 'sine', 0.15); 
  }

  playEchoSpawn() {
    this.playPopSFX();
  }

  playGameOver(gameId?: string) {
    this.stopBGM();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 1.5);
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 1.5);
  }

  playShootSFX() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  playPopSFX() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.1);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  playExplosionSFX() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    
    // Smooth explosion using a filtered sawtooth for rich harmonic noise
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(10, t + 0.4);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, t);
    filter.frequency.exponentialRampToValueAtTime(100, t + 0.4);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.4);
  }
}

export const audio = new AudioEngine();
