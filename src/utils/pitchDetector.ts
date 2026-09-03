import { PitchDetectionResult, NoteInfo } from '../types';
import { getNoteInfo, midiToFreq } from './audioSynth';

export class PitchDetector {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private isListening = false;
  private animFrameId: number | null = null;
  private buffer: Float32Array = new Float32Array(0);

  public async start(
    onPitch: (result: PitchDetectionResult) => void,
    onError: (err: string) => void
  ): Promise<boolean> {
    try {
      if (this.isListening) return true;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      });

      this.mediaStream = stream;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtx();
      
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      const source = this.audioCtx.createMediaStreamSource(stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048; // High resolution for vocal range
      this.buffer = new Float32Array(this.analyser.fftSize);

      source.connect(this.analyser);
      this.isListening = true;

      const updateLoop = () => {
        if (!this.isListening || !this.analyser) return;

        this.analyser.getFloatTimeDomainData(this.buffer);
        const pitchData = this.autoCorrelate(this.buffer, this.audioCtx!.sampleRate);

        if (pitchData) {
          onPitch(pitchData);
        } else {
          // Silent or uncertain
          onPitch({
            detectedFreq: 0,
            closestNote: getNoteInfo(60),
            centsDiff: 0,
            inTune: false,
            volume: 0,
            clarity: 0,
          });
        }

        this.animFrameId = requestAnimationFrame(updateLoop);
      };

      updateLoop();
      return true;
    } catch (err: any) {
      console.error('Mic access error:', err);
      onError(err.message || 'Impossibile accedere al microfono. Verifica i permessi.');
      return false;
    }
  }

  public stop(): void {
    this.isListening = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }

    this.analyser = null;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Autocorrelation algorithm for pitch detection
   */
  private autoCorrelate(buffer: Float32Array, sampleRate: number): PitchDetectionResult | null {
    const SIZE = buffer.length;

    // 1. Calculate RMS volume
    let sumOfSquares = 0;
    for (let i = 0; i < SIZE; i++) {
      const val = buffer[i];
      sumOfSquares += val * val;
    }
    const rms = Math.sqrt(sumOfSquares / SIZE);

    // Noise threshold
    if (rms < 0.015) {
      return null;
    }

    // 2. Trim buffer to zero crossings
    let r1 = 0;
    let r2 = SIZE - 1;
    const thres = 0.2;

    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buffer[i]) < thres) {
        r1 = i;
        break;
      }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buffer[SIZE - i]) < thres) {
        r2 = SIZE - i;
        break;
      }
    }

    const trimmedBuffer = buffer.slice(r1, r2);
    const newSize = trimmedBuffer.length;

    // 3. Autocorrelation array
    const c = new Float32Array(newSize);
    for (let i = 0; i < newSize; i++) {
      for (let j = 0; j < newSize - i; j++) {
        c[i] = c[i] + trimmedBuffer[j] * trimmedBuffer[j + i];
      }
    }

    // 4. Find peak lag
    let d = 0;
    while (c[d] > c[d + 1]) d++;

    let maxval = -1;
    let maxpos = -1;

    for (let i = d; i < newSize; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }

    let T0 = maxpos;

    // Parabolic interpolation for fine frequency resolution
    if (T0 > 0 && T0 < newSize - 1) {
      const x1 = c[T0 - 1];
      const x2 = c[T0];
      const x3 = c[T0 + 1];
      const a = (x1 + x3 - 2 * x2) / 2;
      const b = (x3 - x1) / 2;
      if (a !== 0) {
        T0 = T0 - b / (2 * a);
      }
    }

    const freq = sampleRate / T0;

    // Filter unrealistic vocal pitch frequencies (e.g., 50Hz to 1600Hz covers Bass to high Soprano whistle)
    if (freq < 55 || freq > 1600 || isNaN(freq)) {
      return null;
    }

    // Calculate nearest note & cents difference
    const midi = Math.round(69 + 12 * Math.log2(freq / 440));
    const targetFreq = midiToFreq(midi);
    const centsDiff = Math.round(1200 * Math.log2(freq / targetFreq));
    const closestNote: NoteInfo = getNoteInfo(midi);

    return {
      detectedFreq: Math.round(freq * 10) / 10,
      closestNote,
      centsDiff,
      inTune: Math.abs(centsDiff) <= 15,
      volume: Math.min(1, rms * 5),
      clarity: Math.min(1, maxval / c[0]),
    };
  }
}
