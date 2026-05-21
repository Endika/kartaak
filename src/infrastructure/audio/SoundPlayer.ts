import type { ISoundPreferenceStorage } from './SoundPreferenceStorage';

export interface ISoundPlayer {
  playCorrect(): void;
  playPartial(): void;
  playIncorrect(): void;
  isEnabled(): boolean;
  setEnabled(enabled: boolean): void;
}

const GAIN = 0.15;

interface Tone {
  frequency: number;
  durationMs: number;
}

export class WebAudioSoundPlayer implements ISoundPlayer {
  private context: AudioContext | null = null;
  private enabled: boolean;

  constructor(private readonly preference: ISoundPreferenceStorage) {
    this.enabled = preference.load();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.preference.save(enabled);
  }

  playCorrect(): void {
    this.playSequence([
      { frequency: 523.25, durationMs: 90 }, // C5
      { frequency: 783.99, durationMs: 140 }, // G5
    ]);
  }

  playPartial(): void {
    this.playSequence([{ frequency: 392.0, durationMs: 130 }]); // G4
  }

  playIncorrect(): void {
    this.playSequence([{ frequency: 220.0, durationMs: 160 }]); // A3
  }

  private playSequence(tones: Tone[]): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    let offset = 0;
    for (const tone of tones) {
      this.playTone(ctx, tone, ctx.currentTime + offset);
      offset += tone.durationMs / 1000;
    }
  }

  private playTone(ctx: AudioContext, tone: Tone, startAt: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = tone.frequency;
    const duration = tone.durationMs / 1000;
    const end = startAt + duration;
    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(GAIN, startAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(gain).connect(ctx.destination);
    osc.start(startAt);
    osc.stop(end + 0.02);
  }

  private ensureContext(): AudioContext | null {
    if (this.context) {
      if (this.context.state === 'suspended') {
        void this.context.resume();
      }
      return this.context;
    }
    const Ctor =
      typeof window !== 'undefined'
        ? (window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
        : undefined;
    if (!Ctor) return null;
    this.context = new Ctor();
    return this.context;
  }
}
