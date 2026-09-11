/**
 * Aviator Procedural Web Audio API Engine
 * Synthesizes all sounds dynamically (engine rev, flight pitch climb, whoosh/crash, win fanfare, coins)
 * Fully compliant with browser autoplay policies & 100% self-contained without external audio file dependencies.
 */

class AviatorAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = localStorage.getItem('aviator_muted') === 'true';
    this.isUnlocked = false;
    this.activeFlightOsc = null;
    this.activeGain = null;
    this.activeNoiseNode = null;
  }

  // Initialize and unlock AudioContext on first user interaction
  init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  unlock() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        this.isUnlocked = true;
      }).catch(e => console.warn('Audio resume error:', e));
    } else if (this.ctx) {
      this.isUnlocked = true;
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    localStorage.setItem('aviator_muted', muted ? 'true' : 'false');
    if (muted && this.ctx) {
      this.stopFlightSound();
    }
  }

  toggleMute() {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  // Helper to create a noise buffer for jet engine rumble and crash whoosh
  createNoiseBuffer() {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Pink/Brown noise filter for realistic low-end rumble
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
    return buffer;
  }

  // Sound 1: Click / UI Interaction
  playClick() {
    if (this.isMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (e) {}
  }

  // Sound 2: Flight Takeoff & Continuous Climb Sound
  startFlightSound() {
    if (this.isMuted || !this.ctx) return;
    try {
      this.stopFlightSound();

      const now = this.ctx.currentTime;

      // Tone Oscillator (Twin Turboprop / Jet sound)
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now); // Low A2
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(165, now); // E3 fifth

      // Noise source for wind / exhaust rumble
      const noiseBuffer = this.createNoiseBuffer();
      let noiseNode = null;
      let filter = null;
      if (noiseBuffer) {
        noiseNode = this.ctx.createBufferSource();
        noiseNode.buffer = noiseBuffer;
        noiseNode.loop = true;

        filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(350, now);

        noiseNode.connect(filter);
        filter.connect(gain);
      }

      // Smooth envelope ramp up
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.2);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc2.start(now);
      if (noiseNode) noiseNode.start(now);

      this.activeFlightOsc = osc;
      this.activeFlightOsc2 = osc2;
      this.activeNoiseFilter = filter;
      this.activeNoiseNode = noiseNode;
      this.activeGain = gain;
    } catch (e) {
      console.warn('Flight sound error:', e);
    }
  }

  // Update engine frequency in real-time as multiplier rises
  updateFlightPitch(multiplier, progress = 0) {
    if (this.isMuted || !this.ctx || !this.activeFlightOsc) return;
    try {
      const now = this.ctx.currentTime;
      // Exponential frequency rise
      const baseFreq = 110 + Math.min(progress * 280, 450);
      this.activeFlightOsc.frequency.setTargetAtTime(baseFreq, now, 0.05);
      if (this.activeFlightOsc2) {
        this.activeFlightOsc2.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.05);
      }
      if (this.activeNoiseFilter) {
        this.activeNoiseFilter.frequency.setTargetAtTime(350 + progress * 800, now, 0.05);
      }
    } catch (e) {}
  }

  stopFlightSound() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      if (this.activeGain) {
        this.activeGain.gain.setValueAtTime(this.activeGain.gain.value, now);
        this.activeGain.gain.linearRampToValueAtTime(0.0001, now + 0.1);
      }
      if (this.activeFlightOsc) {
        this.activeFlightOsc.stop(now + 0.1);
        this.activeFlightOsc = null;
      }
      if (this.activeFlightOsc2) {
        this.activeFlightOsc2.stop(now + 0.1);
        this.activeFlightOsc2 = null;
      }
      if (this.activeNoiseNode) {
        this.activeNoiseNode.stop(now + 0.1);
        this.activeNoiseNode = null;
      }
    } catch (e) {}
  }

  // Sound 3: Crash / Flew Away (Whoosh + low thud)
  playCrash() {
    this.stopFlightSound();
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;

      // Rocket whoosh off-screen
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.35); // Whoosh away up
      oscGain.gain.setValueAtTime(0.25, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);

      // Low bass impact
      const bass = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bass.type = 'sine';
      bass.frequency.setValueAtTime(130, now);
      bass.frequency.exponentialRampToValueAtTime(40, now + 0.4);
      bassGain.gain.setValueAtTime(0.3, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      bass.connect(bassGain);
      bassGain.connect(this.ctx.destination);
      bass.start(now);
      bass.stop(now + 0.4);
    } catch (e) {}
  }

  // Sound 4: Win Celebration Fanfare (Major Triad chimes + celebratory shimmer)
  playWinFanfare() {
    this.stopFlightSound();
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Arpeggio notes: C5, E5, G5, C6, E6, G6
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const noteTime = now + idx * 0.08;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.001, noteTime);
        gain.gain.linearRampToValueAtTime(0.25, noteTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.65);
      });

      // Shimmer chord at the end
      setTimeout(() => {
        if (this.isMuted || !this.ctx) return;
        this.playChord([1046.50, 1318.51, 1567.98, 2093.00], 1.2);
      }, 500);
    } catch (e) {}
  }

  playChord(frequencies, duration = 1.0) {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      frequencies.forEach(f => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
      });
    } catch (e) {}
  }

  // Sound 5: Coin Cashout Cascade
  playCoins() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      for (let i = 0; i < 12; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + i * 0.06;
        const f = 1800 + Math.random() * 800;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);

        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.09);
      }
    } catch (e) {}
  }

  // Sound 6: Dramatic Urgency Pulse (Heartbeat / Sub-bass pulse)
  playUrgencyPulse() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(75, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {}
  }
}

// Global audio engine instance
window.aviatorAudio = new AviatorAudioEngine();
