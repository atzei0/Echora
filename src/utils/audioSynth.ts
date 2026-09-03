import { NoteInfo, ScalePatternId, VoiceCategory } from '../types';

const LATIN_NAMES = ['Do', 'Do♯', 'Re', 'Re♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'];
const SCIENTIFIC_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function freqToMidi(freq: number): number {
  if (freq <= 0) return 0;
  return Math.round(69 + 12 * Math.log2(freq / 440));
}

export function getNoteInfo(midi: number): NoteInfo {
  const noteIndex = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const isAccidental = [1, 3, 6, 8, 10].includes(noteIndex);
  
  return {
    midi,
    frequency: Math.round(midiToFreq(midi) * 100) / 100,
    octave,
    isAccidental,
    nameLatin: `${LATIN_NAMES[noteIndex]}${octave}`,
    nameScientific: `${SCIENTIFIC_NAMES[noteIndex]}${octave}`,
  };
}

// Global Web Audio Context singleton
let audioCtx: AudioContext | null = null;
let masterOutputNode: GainNode | null = null;
let masterCompressorNode: DynamicsCompressorNode | null = null;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function getMasterOutput(ctx: AudioContext): AudioNode {
  if (masterOutputNode && masterCompressorNode && masterOutputNode.context === ctx) {
    return masterCompressorNode;
  }

  // Dynamics compressor acts as a transparent master bus limiter/compressor
  // to avoid digital distortion while maximizing clear, punchy acoustic volume
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-4, ctx.currentTime);
  compressor.knee.setValueAtTime(4, ctx.currentTime);
  compressor.ratio.setValueAtTime(3.5, ctx.currentTime);
  compressor.attack.setValueAtTime(0.002, ctx.currentTime);
  compressor.release.setValueAtTime(0.12, ctx.currentTime);

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(1.4, ctx.currentTime); // Clean gain boost

  compressor.connect(masterGain);
  masterGain.connect(ctx.destination);

  masterCompressorNode = compressor;
  masterOutputNode = masterGain;

  return compressor;
}

// Unlock audio context on user interaction
if (typeof window !== 'undefined') {
  const unlock = () => {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    } else if (!audioCtx) {
      getAudioContext();
    }
  };
  window.addEventListener('click', unlock, { passive: true });
  window.addEventListener('touchstart', unlock, { passive: true });
  window.addEventListener('keydown', unlock, { passive: true });
}

// Acoustic Grand Piano Sample Cache
const sampleBufferCache = new Map<number, AudioBuffer>();
const loadingSamplePromises = new Map<number, Promise<AudioBuffer | null>>();

const NOTE_FILE_NAMES: Record<number, string> = {
  36: 'C2', 38: 'D2', 40: 'E2', 41: 'F2', 43: 'G2', 45: 'A2', 47: 'B2',
  48: 'C3', 50: 'D3', 52: 'E3', 53: 'F3', 55: 'G3', 57: 'A3', 59: 'B3',
  60: 'C4', 62: 'D4', 64: 'E4', 65: 'F4', 67: 'G4', 69: 'A4', 71: 'B4',
  72: 'C5', 74: 'D5', 76: 'E5', 77: 'F5', 79: 'G5', 81: 'A5', 83: 'B5',
  84: 'C6', 86: 'D6', 88: 'E6', 89: 'F6', 91: 'G6', 93: 'A6', 95: 'B6'
};

async function loadPianoSample(midi: number): Promise<AudioBuffer | null> {
  if (sampleBufferCache.has(midi)) {
    return sampleBufferCache.get(midi)!;
  }
  if (loadingSamplePromises.has(midi)) {
    return loadingSamplePromises.get(midi)!;
  }

  const fileName = NOTE_FILE_NAMES[midi];
  if (!fileName) return null;

  const url = `https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/gh-pages/FluidR3_GM/acoustic_grand_piano-mp3/${fileName}.mp3`;

  const promise = (async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const arrayBuffer = await response.arrayBuffer();
      const ctx = getAudioContext();
      const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
      sampleBufferCache.set(midi, decodedBuffer);
      return decodedBuffer;
    } catch {
      return null;
    } finally {
      loadingSamplePromises.delete(midi);
    }
  })();

  loadingSamplePromises.set(midi, promise);
  return promise;
}

// Preload key vocal range notes automatically
export function preloadPianoSamples(): void {
  const commonMidis = [45, 48, 52, 57, 60, 64, 69, 72, 76, 81];
  commonMidis.forEach((m) => loadPianoSample(m));
}

// Preload on initial load
if (typeof window !== 'undefined') {
  setTimeout(() => {
    preloadPianoSamples();
  }, 1000);
}

/**
 * Synthesize a realistic acoustic grand piano tone with felt hammer attack,
 * soundboard body resonance, triple-string unisons, inharmonic partials, and room acoustics.
 */
let pianoReverbGain: GainNode | null = null;
let reverbConvolver: ConvolverNode | null = null;

function getPianoReverb(ctx: AudioContext): ConvolverNode | null {
  if (reverbConvolver && reverbConvolver.context === ctx) {
    return reverbConvolver;
  }

  try {
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * 0.8); // 800ms impulse response
    const impulse = ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const decay = Math.exp(-i / (rate * 0.16));
      left[i] = (Math.random() * 2 - 1) * decay;
      right[i] = (Math.random() * 2 - 1) * decay;
    }

    const convolver = ctx.createConvolver();
    convolver.buffer = impulse;

    const wetGain = ctx.createGain();
    wetGain.gain.value = 0.18; // Warm, subtle acoustic room space

    const masterOut = getMasterOutput(ctx);
    convolver.connect(wetGain);
    wetGain.connect(masterOut);

    reverbConvolver = convolver;
    pianoReverbGain = wetGain;
    return convolver;
  } catch {
    return null;
  }
}

export function playPianoNote(midi: number, durationSec = 1.0, volume = 0.85): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const masterOut = getMasterOutput(ctx);

    // Check if sample buffer is available for this MIDI pitch or close to it
    let bestMidi = -1;
    let minDistance = 999;
    sampleBufferCache.forEach((_, sampleMidi) => {
      const dist = Math.abs(sampleMidi - midi);
      if (dist < minDistance) {
        minDistance = dist;
        bestMidi = sampleMidi;
      }
    });

    if (bestMidi !== -1 && minDistance <= 12) {
      const buffer = sampleBufferCache.get(bestMidi)!;
      const srcNode = ctx.createBufferSource();
      srcNode.buffer = buffer;
      const playbackRate = Math.pow(2, (midi - bestMidi) / 12);
      srcNode.playbackRate.value = playbackRate;

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume * 1.8, now + 0.004);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(durationSec, 0.8));

      srcNode.connect(gainNode);
      gainNode.connect(masterOut);

      const convolver = getPianoReverb(ctx);
      if (convolver) {
        gainNode.connect(convolver);
      }

      srcNode.start(now);
      return;
    } else {
      // Trigger background fetch for this note so future playback uses real sample
      loadPianoSample(midi);
    }

    const freq = midiToFreq(midi);

    // Master envelope for note with rich presence
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(volume * 1.7, now + 0.004); // Sharp acoustic hammer impact
    masterGain.gain.exponentialRampToValueAtTime(volume * 1.1, now + 0.08); // Initial pluck decay
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(durationSec, 0.7)); // Natural wood/string decay

    // Soundboard Body Tone Filter (Warm acoustic wood resonance EQ)
    const bodyFilter = ctx.createBiquadFilter();
    bodyFilter.type = 'peaking';
    bodyFilter.frequency.setValueAtTime(220, now); // Wooden soundboard resonance
    bodyFilter.Q.setValueAtTime(1.2, now);
    bodyFilter.gain.setValueAtTime(4.0, now); // +4dB warm body boost

    // Dynamic Tone Lowpass Filter (Bright strike that mellows out as string vibrates)
    const toneFilter = ctx.createBiquadFilter();
    toneFilter.type = 'lowpass';
    const attackCutoff = Math.min(12000, Math.max(1600, freq * 8));
    const sustainCutoff = Math.max(650, freq * 2.5);
    toneFilter.frequency.setValueAtTime(attackCutoff, now);
    toneFilter.frequency.exponentialRampToValueAtTime(sustainCutoff, now + 0.16);

    // 1. Felt Hammer Thud (Low frequency physical impact of hammer hitting string)
    const hammerThud = ctx.createOscillator();
    const hammerGain = ctx.createGain();
    hammerThud.type = 'sine';
    hammerThud.frequency.setValueAtTime(140, now);
    hammerThud.frequency.exponentialRampToValueAtTime(50, now + 0.02);
    hammerGain.gain.setValueAtTime(volume * 0.45, now);
    hammerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
    hammerThud.connect(hammerGain);
    hammerGain.connect(masterGain);
    hammerThud.start(now);
    hammerThud.stop(now + 0.03);

    // 2. High-Frequency Felt Click Noise
    const noiseLen = Math.floor(ctx.sampleRate * 0.012);
    const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    const noiseData = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) noiseData[i] = Math.random() * 2 - 1;
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuf;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(2800, now);
    noiseFilter.Q.setValueAtTime(1.2, now);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(volume * 0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);
    noiseSrc.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noiseSrc.start(now);

    // 3. String Unisons & Inharmonic Harmonic Partials
    const inharmonic = 0.00025;
    const partials = [
      // Fundamental triple string chorus
      { ratio: 1, type: 'triangle' as OscillatorType, gain: 0.85, detune: -2.0, decayMult: 1.0 },
      { ratio: 1, type: 'sine' as OscillatorType, gain: 0.75, detune: 0, decayMult: 1.0 },
      { ratio: 1, type: 'triangle' as OscillatorType, gain: 0.85, detune: 2.0, decayMult: 1.0 },

      // Higher partials with realistic faster acoustic decay
      { ratio: 2 * (1 + inharmonic * 4), type: 'sine' as OscillatorType, gain: 0.45, detune: 0, decayMult: 0.75 },
      { ratio: 3 * (1 + inharmonic * 9), type: 'sine' as OscillatorType, gain: 0.28, detune: 1, decayMult: 0.55 },
      { ratio: 4 * (1 + inharmonic * 16), type: 'sine' as OscillatorType, gain: 0.14, detune: -1, decayMult: 0.38 },
      { ratio: 5 * (1 + inharmonic * 25), type: 'sine' as OscillatorType, gain: 0.06, detune: 0, decayMult: 0.22 },
    ];

    partials.forEach(({ ratio, type, gain: pGain, detune, decayMult }) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq * ratio, now);
      if (detune) osc.detune.setValueAtTime(detune, now);

      const pGainNode = ctx.createGain();
      pGainNode.gain.setValueAtTime(pGain, now);
      const partialDuration = Math.max(0.12, durationSec * decayMult);
      pGainNode.gain.exponentialRampToValueAtTime(0.0001, now + partialDuration);

      osc.connect(pGainNode);
      pGainNode.connect(toneFilter);

      osc.start(now);
      osc.stop(now + partialDuration + 0.05);
    });

    // Connect audio signal chain
    toneFilter.connect(bodyFilter);
    bodyFilter.connect(masterGain);

    // Direct output
    masterGain.connect(masterOut);

    // Room reverb send for realistic room acoustics
    const convolver = getPianoReverb(ctx);
    if (convolver) {
      masterGain.connect(convolver);
    }
  } catch (e) {
    console.error('Audio synth error:', e);
  }
}

/**
 * Synthesize a major triad piano chord with humanized acoustic stroke
 */
export function playPianoChord(rootMidi: number, durationSec = 1.8, volume = 0.85): void {
  try {
    const chordOffsets = [0, 4, 7, 12]; // Major triad + octave
    chordOffsets.forEach((offset, idx) => {
      setTimeout(() => {
        const noteVol = idx === 0 ? volume * 0.95 : volume * 0.8;
        playPianoNote(rootMidi + offset, durationSec, noteVol);
      }, idx * 14); // Slightly staggered stroke for acoustic realism
    });
  } catch (e) {
    console.error('Piano chord error:', e);
  }
}

/**
 * Glissando (Siren) tone synthesis
 */
export function playSirenGlide(startMidi: number, endMidi: number, durationSec = 2.5, volume = 0.75): void {
  try {
    const ctx = getAudioContext();
    const startFreq = midiToFreq(startMidi);
    const endFreq = midiToFreq(endMidi);
    const now = ctx.currentTime;
    const masterOut = getMasterOutput(ctx);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, now);
    // Exponential pitch glide up and back down
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + durationSec / 2);
    osc.frequency.exponentialRampToValueAtTime(startFreq, now + durationSec);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume * 1.5, now + 0.05);
    gain.gain.setValueAtTime(volume * 1.5, now + durationSec - 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(gain);
    gain.connect(masterOut);

    osc.start(now);
    osc.stop(now + durationSec + 0.05);
  } catch (e) {
    console.error('Siren glide error:', e);
  }
}

/**
 * Click track for metronome with crisp acoustic woodblock transient & body resonance
 */
export function playMetronomeClick(isDownbeat = false, volume = 0.8): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const masterOut = getMasterOutput(ctx);

    const effectiveVolume = Math.max(0.001, volume * 1.5);

    // 1. Woodblock Body Resonance (Warm acoustic tone)
    const bodyOsc = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    bodyOsc.type = 'triangle';
    const bodyFreq = isDownbeat ? 1400 : 960;
    bodyOsc.frequency.setValueAtTime(bodyFreq, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(bodyFreq * 0.7, now + 0.04);

    bodyGain.gain.setValueAtTime(effectiveVolume * 0.85, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + (isDownbeat ? 0.06 : 0.045));

    bodyOsc.connect(bodyGain);
    bodyGain.connect(masterOut);

    bodyOsc.start(now);
    bodyOsc.stop(now + 0.07);

    // 2. High-Impact Attack Click (Wood stick / clave transient snap)
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'sine';
    const clickFreq = isDownbeat ? 2800 : 2000;
    clickOsc.frequency.setValueAtTime(clickFreq, now);
    clickOsc.frequency.exponentialRampToValueAtTime(600, now + 0.015);

    clickGain.gain.setValueAtTime(effectiveVolume * 0.9, now);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

    clickOsc.connect(clickGain);
    clickGain.connect(masterOut);

    clickOsc.start(now);
    clickOsc.stop(now + 0.03);

    // 3. Transient Noise Impulse for acoustic attack definition
    const noiseLen = Math.floor(ctx.sampleRate * 0.006);
    const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    const noiseData = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (noiseLen * 0.3));
    }
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuf;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(isDownbeat ? 3500 : 2500, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(effectiveVolume * 0.45, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.008);

    noiseSrc.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterOut);

    noiseSrc.start(now);
  } catch (e) {
    // ignore
  }
}

/**
 * Returns array of semitone offsets from root note
 */
export function getScaleOffsets(pattern: ScalePatternId): number[] {
  switch (pattern) {
    case 'three_notes':
      return [0, 2, 4, 2, 0];
    case 'five_notes':
      return [0, 2, 4, 5, 7, 5, 4, 2, 0];
    case 'scale_5_desc':
      return [7, 5, 4, 2, 0];
    case 'gliss_5_1_desc':
      return [7, 0];
    case 'gliss_1_5_1':
      return [0, 7, 0];
    case 'gliss_1_5':
      return [0, 7];
    case 'triad':
      return [0, 4, 7, 4, 0];
    case 'broad_arpeggio':
      return [0, 4, 7, 12, 7, 4, 0];
    case 'arpeggio_531_desc':
      return [7, 4, 0];
    case 'arpeggio_compound_desc':
      return [12, 7, 4, 0, 7, 4, 0, 4, 0];
    case 'arpeggio_1358888531':
      return [0, 4, 7, 12, 12, 12, 12, 7, 4, 0];
    case 'scale_4_notes':
    case 'scale_4_notes_2x':
    case 'scale_4_notes_5x':
      return [0, 2, 4, 5, 4, 2, 0];
    case 'siren_glide':
      return [0, 12, 0];
    case 'lip_trill_run':
      return [0, 2, 4, 5, 7, 9, 11, 12, 14, 12, 11, 9, 7, 5, 4, 2, 0];
    case 'fixed_5_notes':
      return [0, 0, 0, 0, 0];
    case 'fixed_3_notes':
      return [0, 0, 0];
    case 'scale_mmm_me':
      return [0, 2, 4, 5, 7, 5, 4, 2, 0, 2, 4, 5, 7, 5, 4, 2, 0];
    case 'scale_5_gliss_desc':
      return [0, 2, 4, 5, 7, 0];
    case 'arpeggio_13521':
      return [0, 4, 7, 4, 0];
    case 'arpeggio_185':
      return [0, 12, 7];
    case 'jump_5_1':
      return [0, 0, 0, 7, 0];
    case 'arpeggio_55531':
      return [7, 7, 7, 4, 0];
    case 'ninni_111_333_111':
      return [0, 0, 0, 4, 4, 4, 0, 0, 0];
    case 'jump_13_15_18':
      return [0, 4, 0, 7, 0, 12];
    case 'ma_mo_ma_run':
      return [0, 4, 7, 12, 0, 2, 4, 2, 0, 0, 4, 7, 12];
    default:
      return [0, 2, 4, 5, 7, 5, 4, 2, 0];
  }
}

export interface VoiceRegisterDef {
  category: VoiceCategory;
  gender: 'female' | 'male';
  lowMidi: number;
  highMidi: number;
  lowNameLatin: string;
  highNameLatin: string;
  lowNameScientific: string;
  highNameScientific: string;
}

export const VOICE_REGISTER_DEFINITIONS: VoiceRegisterDef[] = [
  // Femminili
  { category: 'Soprano', gender: 'female', lowMidi: 57, highMidi: 84, lowNameLatin: 'La 3', highNameLatin: 'Do 6', lowNameScientific: 'A3', highNameScientific: 'C6' },
  { category: 'Mezzo-Soprano', gender: 'female', lowMidi: 57, highMidi: 81, lowNameLatin: 'La 3', highNameLatin: 'La 5', lowNameScientific: 'A3', highNameScientific: 'A5' },
  { category: 'Contralto', gender: 'female', lowMidi: 53, highMidi: 77, lowNameLatin: 'Fa 3', highNameLatin: 'Fa 5', lowNameScientific: 'F3', highNameScientific: 'F5' },

  // Maschili
  { category: 'Tenore', gender: 'male', lowMidi: 48, highMidi: 72, lowNameLatin: 'Do 3', highNameLatin: 'Do 5', lowNameScientific: 'C3', highNameScientific: 'C5' },
  { category: 'Baritono', gender: 'male', lowMidi: 45, highMidi: 67, lowNameLatin: 'La 2', highNameLatin: 'Sol 4', lowNameScientific: 'A2', highNameScientific: 'G4' },
  { category: 'Basso', gender: 'male', lowMidi: 40, highMidi: 64, lowNameLatin: 'Mi 2', highNameLatin: 'Mi 4', lowNameScientific: 'E2', highNameScientific: 'E4' },
];

/**
 * Calculates voice category based on lowest and highest comfortable sung notes
 * Implements flexible matching: if notes vary by 1 or 2 tones (2 to 4 semitones)
 * from standard endpoints, it does not change category abruptly.
 */
export function classifyVoice(lowestMidi: number, highestMidi: number): VoiceCategory {
  let bestCategory: VoiceCategory = 'Non determinato';
  let minScore = Infinity;

  for (const reg of VOICE_REGISTER_DEFINITIONS) {
    const lowDiff = Math.abs(lowestMidi - reg.lowMidi);
    const highDiff = Math.abs(highestMidi - reg.highMidi);

    // Apply flexibility buffer: up to 4 semitones (2 tones) variation on either end is absorbed smoothly
    const flexLow = Math.max(0, lowDiff - 4);
    const flexHigh = Math.max(0, highDiff - 4);

    // Score combines flexible boundary penalties plus a minor tie-breaker based on actual difference
    const score = flexLow * 3 + flexHigh * 3 + lowDiff * 0.2 + highDiff * 0.2;

    if (score < minScore) {
      minScore = score;
      bestCategory = reg.category;
    }
  }

  return bestCategory;
}
