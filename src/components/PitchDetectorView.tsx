import React, { useState, useEffect, useRef } from 'react';
import { NoteNotation, PitchDetectionResult } from '../types';
import { PitchDetector } from '../utils/pitchDetector';
import { getNoteInfo, playPianoNote, playMetronomeClick } from '../utils/audioSynth';
import {
  Mic,
  MicOff,
  Volume2,
  Activity,
  Play,
  Square,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Radio,
  Target,
  Sparkles,
  Trophy,
  RotateCcw,
  Music,
  Lightbulb,
  Zap,
  Flame,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface PitchDetectorViewProps {
  notation: NoteNotation;
}

interface PitchInterval {
  id: string;
  name: string;
  nameEn: string;
  semitones: number;
  songExample: string;
  songExampleEn: string;
  description: string;
  descriptionEn: string;
}

const INTERVALS_LIST: PitchInterval[] = [
  {
    id: 'second_maj',
    name: '2ª Maggiore (2 semitoni)',
    nameEn: 'Major 2nd (2 semitones)',
    semitones: 2,
    songExample: 'Inizio di "Albachiara" (Vasco) o "Fra Martino"',
    songExampleEn: 'Start of "Happy Birthday" or "Silent Night"',
    description: 'Il primo gradino di una scala. Distanza di un tono intero.',
    descriptionEn: 'One full whole step. The basic stepping stone of a major scale.',
  },
  {
    id: 'third_maj',
    name: '3ª Maggiore (4 semitoni)',
    nameEn: 'Major 3rd (4 semitones)',
    semitones: 4,
    songExample: 'Le prime due note di "Fra Martino" (Do -> Mi) o "Kumbaya"',
    songExampleEn: 'Start of "When the Saints Go Marching In"',
    description: 'Il suono allegro e luminoso dell\'accordo maggiore.',
    descriptionEn: 'The bright, joyful defining interval of a major triad.',
  },
  {
    id: 'fourth_perf',
    name: '4ª Giusta (5 semitoni)',
    nameEn: 'Perfect 4th (5 semitones)',
    semitones: 5,
    songExample: 'Inizio di "Amazing Grace" o "Inno di Mameli"',
    songExampleEn: 'Start of "Amazing Grace" or "Here Comes the Bride"',
    description: 'Salto solenne e aperto, tipico degli inni e delle melodie epiche.',
    descriptionEn: 'Stately, noble leap found in anthems and traditional hymns.',
  },
  {
    id: 'fifth_perf',
    name: '5ª Giusta (7 semitoni)',
    nameEn: 'Perfect 5th (7 semitones)',
    semitones: 7,
    songExample: 'Tema di "Star Wars" o "Twinkle Twinkle Little Star"',
    songExampleEn: 'Theme of "Star Wars" or "Twinkle Twinkle Little Star"',
    description: 'L\'intervallo più armonico e consonante in natura.',
    descriptionEn: 'The most stable, resonant consonant interval in acoustic physics.',
  },
  {
    id: 'sixth_maj',
    name: '6ª Maggiore (9 semitoni)',
    nameEn: 'Major 6th (9 semitones)',
    semitones: 9,
    songExample: 'Inizio di "Nel blu dipinto di blu" (Volare) o "My Bonnie"',
    songExampleEn: 'Start of "My Bonnie Lies Over the Ocean"',
    description: 'Salto espressivo e caldo, amatissimo nel pop e nella musica leggera.',
    descriptionEn: 'Warm, expressive, emotional leap common in melodic pop ballads.',
  },
  {
    id: 'octave_perf',
    name: '8ª Ottava (12 semitoni)',
    nameEn: 'Perfect Octave (12 semitones)',
    semitones: 12,
    songExample: 'Inizio di "Somewhere Over the Rainbow"',
    songExampleEn: 'Start of "Somewhere Over the Rainbow"',
    description: 'La stessa nota ad un\'altezza doppia: massima apertura e potenza.',
    descriptionEn: 'Same pitch class in a higher register: wide expressive range.',
  },
];

export const PitchDetectorView: React.FC<PitchDetectorViewProps> = ({ notation }) => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [activeTab, setActiveTab] = useState<'tuner' | 'game' | 'intervals' | 'siren' | 'tips'>('tuner');

  // Shared Pitch Detection state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [livePitch, setLivePitch] = useState<PitchDetectionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pitch History for Canvas Chart
  const pitchHistoryRef = useRef<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sirenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Drone Reference Tone
  const [targetMidi, setTargetMidi] = useState<number>(60); // C4
  const [isPlayingDrone, setIsPlayingDrone] = useState<boolean>(false);
  const droneIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- GAME 1: "CENTRA LA NOTA" (Match the Pitch) ---
  const [gameDifficulty, setGameDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [gameTargetMidi, setGameTargetMidi] = useState<number>(60); // C4
  const [gameScore, setGameScore] = useState<number>(0);
  const [gameStreak, setGameStreak] = useState<number>(0);
  const [gameHoldProgress, setGameHoldProgress] = useState<number>(0); // 0 to 100
  const [gameFeedbackMsg, setGameFeedbackMsg] = useState<string>('');
  const [gameJustHit, setGameJustHit] = useState<boolean>(false);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Note pools for match pitch game
  const difficultyNotes = {
    easy: [60, 64, 67], // C4, E4, G4 (Do, Mi, Sol)
    medium: [60, 62, 64, 67, 69], // C4, D4, E4, G4, A4 (Pentatonica)
    hard: [60, 62, 64, 65, 67, 69, 71, 72], // Scala Maggiore completa
  };

  // --- GAME 2: EAR TRAINING INTERVALLI ---
  const [selectedInterval, setSelectedInterval] = useState<PitchInterval>(INTERVALS_LIST[1]); // 3a Maggiore
  const [intervalRootMidi, setIntervalRootMidi] = useState<number>(60); // C4
  const [detectedIntervalFeedback, setDetectedIntervalFeedback] = useState<{
    semitonesDiff: number;
    centsDiff: number;
    match: boolean;
    noteName: string;
  } | null>(null);

  const pitchDetectorRef = useRef<PitchDetector | null>(null);

  const toggleListening = async () => {
    if (isListening) {
      if (pitchDetectorRef.current) {
        pitchDetectorRef.current.stop();
      }
      setIsListening(false);
      setLivePitch(null);
    } else {
      setErrorMsg(null);
      if (!pitchDetectorRef.current) {
        pitchDetectorRef.current = new PitchDetector();
      }
      const success = await pitchDetectorRef.current.start(
        (pitch) => {
          setLivePitch(pitch);
          if (pitch.detectedFreq > 0) {
            pitchHistoryRef.current.push(pitch.detectedFreq);
            if (pitchHistoryRef.current.length > 100) {
              pitchHistoryRef.current.shift();
            }
          }
        },
        (err) => {
          setErrorMsg(err);
          setIsListening(false);
        }
      );
      if (success) {
        setIsListening(true);
      }
    }
  };

  // Continuous Drone Loop
  useEffect(() => {
    if (isPlayingDrone) {
      playPianoNote(targetMidi, 1.2, 0.85);
      droneIntervalRef.current = setInterval(() => {
        playPianoNote(targetMidi, 1.2, 0.85);
      }, 1000);
    } else {
      if (droneIntervalRef.current) {
        clearInterval(droneIntervalRef.current);
        droneIntervalRef.current = null;
      }
    }

    return () => {
      if (droneIntervalRef.current) {
        clearInterval(droneIntervalRef.current);
        droneIntervalRef.current = null;
      }
    };
  }, [isPlayingDrone, targetMidi]);

  // Clean up pitch detector on unmount
  useEffect(() => {
    return () => {
      if (pitchDetectorRef.current) {
        pitchDetectorRef.current.stop();
      }
      if (droneIntervalRef.current) {
        clearInterval(droneIntervalRef.current);
      }
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current);
      }
    };
  }, []);

  // --- GAME 1: HOLD CHECK LOGIC ---
  useEffect(() => {
    if (activeTab !== 'game' || !isListening || !livePitch || livePitch.detectedFreq <= 0) {
      setGameHoldProgress(0);
      return;
    }

    const currentMidi = livePitch.closestNote.midiNumber;
    // Allow octave equivalent or exact note
    const isMatchingNote = (currentMidi % 12) === (gameTargetMidi % 12);
    const isTuneAccurate = Math.abs(livePitch.centsDiff) <= 32;

    if (isMatchingNote && isTuneAccurate) {
      setGameFeedbackMsg(isEn ? '🎯 PERFECT! Hold it steady...' : '🎯 CENTRATO IN PIENO! Tieni la nota...');
      setGameHoldProgress((prev) => {
        const next = prev + 12; // ~1.2s to fill
        if (next >= 100) {
          // Success!
          playPianoNote(gameTargetMidi + 12, 0.6, 0.8);
          setGameScore((s) => s + 100);
          setGameStreak((st) => st + 1);
          setGameJustHit(true);
          setTimeout(() => setGameJustHit(false), 800);

          // Pick next note
          const pool = difficultyNotes[gameDifficulty];
          const nextPool = pool.filter((m) => m !== gameTargetMidi);
          const nextMidi = nextPool[Math.floor(Math.random() * nextPool.length)] || pool[0];
          setGameTargetMidi(nextMidi);
          setTimeout(() => playPianoNote(nextMidi, 1.2, 0.85), 300);
          return 0;
        }
        return next;
      });
    } else if (isMatchingNote) {
      if (livePitch.centsDiff < 0) {
        setGameFeedbackMsg(isEn ? '🔼 Slightly flat: push gently higher!' : '🔼 Un pizzico calante: sali leggermente!');
      } else {
        setGameFeedbackMsg(isEn ? '🔽 Slightly sharp: ease gently lower!' : '🔽 Un pizzico crescente: scendi dolcemente!');
      }
      setGameHoldProgress((prev) => Math.max(0, prev - 8));
    } else {
      setGameFeedbackMsg(isEn ? 'Sing the target note!' : 'Canta la nota bersaglio!');
      setGameHoldProgress(0);
    }
  }, [livePitch, isListening, activeTab, gameTargetMidi, gameDifficulty]);

  // --- GAME 2: INTERVALS DETECTION LOGIC ---
  useEffect(() => {
    if (activeTab !== 'intervals' || !isListening || !livePitch || livePitch.detectedFreq <= 0) {
      return;
    }

    const targetIntervalMidi = intervalRootMidi + selectedInterval.semitones;
    const currentMidi = livePitch.closestNote.midiNumber;
    const diffSemitones = currentMidi - intervalRootMidi;
    const isMatch = (diffSemitones % 12) === (selectedInterval.semitones % 12);

    const noteName = notation === 'latin' ? livePitch.closestNote.nameLatin : livePitch.closestNote.nameScientific;
    setDetectedIntervalFeedback({
      semitonesDiff: diffSemitones,
      centsDiff: livePitch.centsDiff,
      match: isMatch && Math.abs(livePitch.centsDiff) < 35,
      noteName,
    });
  }, [livePitch, isListening, activeTab, intervalRootMidi, selectedInterval, notation]);

  // Render Pitch Waveform Canvas
  useEffect(() => {
    let animId: number;
    const canvas = activeTab === 'siren' ? sirenCanvasRef.current : canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderGraph = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let y = 15; y < canvas.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      const history = pitchHistoryRef.current;
      if (history.length > 1) {
        ctx.strokeStyle = activeTab === 'siren' ? '#38bdf8' : '#818cf8';
        ctx.lineWidth = activeTab === 'siren' ? 3.5 : 2.5;
        ctx.lineJoin = 'round';
        ctx.beginPath();

        const minF = 80;
        const maxF = 900;
        const stepX = canvas.width / 100;

        for (let i = 0; i < history.length; i++) {
          const freq = history[i];
          const x = i * stepX;
          const normalized = Math.max(0, Math.min(1, (freq - minF) / (maxF - minF)));
          const y = canvas.height - normalized * (canvas.height - 16) - 8;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();

        // Glowing dot on current point
        if (history.length > 0) {
          const lastFreq = history[history.length - 1];
          const x = (history.length - 1) * stepX;
          const normalized = Math.max(0, Math.min(1, (lastFreq - minF) / (maxF - minF)));
          const y = canvas.height - normalized * (canvas.height - 16) - 8;

          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(renderGraph);
    };

    animId = requestAnimationFrame(renderGraph);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [activeTab]);

  const targetNoteInfo = getNoteInfo(targetMidi);
  const gameTargetInfo = getNoteInfo(gameTargetMidi);
  const intervalRootInfo = getNoteInfo(intervalRootMidi);
  const intervalTargetInfo = getNoteInfo(intervalRootMidi + selectedInterval.semitones);

  // Meter Needle angle (-90deg to +90deg based on -50 to +50 cents)
  const cents = livePitch?.centsDiff || 0;
  const clampedCents = Math.max(-50, Math.min(50, cents));
  const needleDeg = (clampedCents / 50) * 80;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sky-400 font-extrabold text-xs uppercase tracking-wider">
            <Activity className="w-4 h-4" />
            <span>{isEn ? 'Vocal Pitch & Intonation Center' : 'Palestra di Intonazione Vocale'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {isEn ? 'Ear Training & Pitch Exercises' : 'Allena l\'Intonazione & Centra la Nota'}
          </h2>
        </div>

        {/* Global Mic Activation Button */}
        <button
          type="button"
          onClick={toggleListening}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer shadow-lg shrink-0 ${
            isListening
              ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/25 animate-pulse'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          <span>{isListening ? (isEn ? 'Mute Mic' : 'Spegni Microfono') : (isEn ? 'Start Mic' : 'Attiva Microfono')}</span>
        </button>
      </div>

      {/* Sub-Tabs Selector */}
      <div className="flex items-center space-x-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto scrollbar-none shadow-md">
        <button
          type="button"
          onClick={() => setActiveTab('tuner')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'tuner'
              ? 'bg-sky-500 text-slate-950 shadow-sm border border-sky-300 font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>{isEn ? 'Chromatic Tuner' : 'Accordatore & Drone'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('game')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'game'
              ? 'bg-sky-500 text-slate-950 shadow-sm border border-sky-300 font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>{isEn ? 'Game: Match the Pitch' : 'Sfida: Centra la Nota! 🎯'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('intervals')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'intervals'
              ? 'bg-sky-500 text-slate-950 shadow-sm border border-sky-300 font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span>{isEn ? 'Ear Training: Intervals' : 'Ear Training: Intervalli 🎵'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('siren')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'siren'
              ? 'bg-sky-500 text-slate-950 shadow-sm border border-sky-300 font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{isEn ? 'Smooth Siren Glissando' : 'Sirena & Glissando Fluido'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tips')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'tips'
              ? 'bg-sky-500 text-slate-950 shadow-sm border border-sky-300 font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>{isEn ? "Coach's Secrets" : 'I Consigli di Francesca'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* --- TAB 1: ACCORDATORE & DRONE --- */}
      {activeTab === 'tuner' && (
        <div className="space-y-6">
          {/* Section 1: Nota Guida / Drone */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-center sm:text-left">
                <h3 className="text-base font-black text-white flex items-center justify-center sm:justify-start gap-1.5">
                  <Volume2 className="w-4 h-4 text-sky-400" />
                  <span>{isEn ? 'Guide Reference Note (Drone)' : 'Nota Guida di Riferimento (Drone)'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isEn ? 'Listen to the tone on piano, then sing it into the mic.' : 'Ascolta la nota al pianoforte, poi canta all\'unisono.'}
                </p>
              </div>

              {/* Controlli Nota Compatti */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setTargetMidi((prev) => Math.max(36, prev - 12))}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                    title="-8va"
                  >
                    -8va
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetMidi((prev) => Math.max(36, prev - 1))}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                    title="-1 semitono"
                  >
                    -1
                  </button>

                  <div className="text-center px-3 py-1 bg-slate-950 rounded-lg min-w-[70px] border border-slate-800/80">
                    <span className="text-lg font-black text-sky-300 tracking-tight block leading-tight">
                      {notation === 'latin' ? targetNoteInfo.nameLatin : targetNoteInfo.nameScientific}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setTargetMidi((prev) => Math.min(84, prev + 1))}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                    title="+1 semitono"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetMidi((prev) => Math.min(84, prev + 12))}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                    title="+8va"
                  >
                    +8va
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPlayingDrone(!isPlayingDrone)}
                  className={`p-2.5 rounded-xl transition-all shadow-md flex items-center justify-center cursor-pointer ${
                    isPlayingDrone
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30 animate-pulse'
                      : 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sky-500/30'
                  }`}
                  title={isPlayingDrone ? 'Stop drone' : 'Play drone'}
                >
                  {isPlayingDrone ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Real-time Tuner Gauge */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md space-y-4">
            <div className="text-center space-y-1">
              <span className="text-xs font-extrabold text-sky-400 uppercase tracking-widest">
                {isEn ? 'Live Chromatic Tuner' : 'Ago di Precisione Cromatico'}
              </span>
              <p className="text-xs text-slate-400">
                {isEn ? 'Sing into the microphone to measure your pitch accuracy.' : 'Canta nel microfono per misurare centesimi e stabilità.'}
              </p>
            </div>

            {/* Circular Gauge */}
            <div className="flex flex-col items-center justify-center space-y-2 pt-2">
              <div className="relative w-48 h-24 sm:w-56 sm:h-28 overflow-hidden flex items-end justify-center">
                <div className="absolute inset-0 rounded-t-full border-[12px] border-slate-800 border-b-0"></div>
                <div className="absolute top-0 w-8 h-full border-t-[12px] border-emerald-500"></div>

                <div
                  className="absolute bottom-0 w-1 bg-white origin-bottom rounded-full shadow-lg transition-transform duration-100 ease-out"
                  style={{
                    height: '80%',
                    transform: `rotate(${needleDeg}deg)`,
                    backgroundColor: livePitch?.inTune ? '#34d399' : '#f43f5e',
                  }}
                >
                  <div className="w-3 h-3 -ml-1 -mt-1 rounded-full bg-white shadow-md"></div>
                </div>

                <div className="w-4 h-4 rounded-full bg-slate-700 border-2 border-white z-10 -mb-2 shadow-md"></div>
              </div>

              <div className="w-48 sm:w-56 flex justify-between text-[10px] font-bold text-slate-500 -mt-1">
                <span>-50♭</span>
                <span>-25</span>
                <span className="text-emerald-400 font-black">0 (Perfetto)</span>
                <span>+25</span>
                <span>+50♯</span>
              </div>

              {/* Detected Note Display */}
              <div className="text-center py-2 min-h-[65px] flex flex-col items-center justify-center">
                {isListening && livePitch && livePitch.detectedFreq > 0 ? (
                  <div>
                    <div className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                      {notation === 'latin' ? livePitch.closestNote.nameLatin : livePitch.closestNote.nameScientific}
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                      <span className="text-xs font-semibold text-slate-400">
                        {Math.round(livePitch.detectedFreq)} Hz
                      </span>
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          livePitch.inTune
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                            : livePitch.centsDiff < 0
                            ? 'bg-amber-950 text-amber-300 border border-amber-500'
                            : 'bg-purple-950 text-purple-300 border border-purple-500'
                        }`}
                      >
                        {livePitch.inTune
                          ? '🎯 INTONATO!'
                          : livePitch.centsDiff < 0
                          ? `${livePitch.centsDiff} cents (Calante ♭)`
                          : `+${livePitch.centsDiff} cents (Crescente ♯)`}
                      </span>
                    </div>
                  </div>
                ) : isListening ? (
                  <div className="flex items-center gap-2 text-xs text-sky-300 animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                    <span>In ascolto... canta una nota stabile</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={toggleListening}
                    className="text-xs text-sky-400 hover:underline font-bold cursor-pointer"
                  >
                    Clicca qui per attivare il microfono
                  </button>
                )}
              </div>
            </div>

            {/* Canvas Chart */}
            <div className="pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between mb-1.5 text-xs text-slate-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-sky-400" />
                  Continuità del Timbro & Frequenza
                </span>
                <span className="text-[10px] text-slate-500">Onda armonica</span>
              </div>
              <div className="w-full h-24 bg-slate-900 rounded-xl border border-slate-800 p-1 overflow-hidden">
                <canvas ref={canvasRef} width={800} height={100} className="w-full h-full block" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: SFIDA "CENTRA LA NOTA" (Match the Pitch Game) --- */}
      {activeTab === 'game' && (
        <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-sky-400/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Header with Score & Streak */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-black uppercase">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>{isEn ? 'Vocal Match Game' : 'Gioco Interattivo: Centra la Nota!'}</span>
              </div>
              <h3 className="text-2xl font-black text-white mt-1">
                {isEn ? 'Sing the Exact Pitch' : 'Ascolta la Nota e Centrala con la Voce'}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {isEn
                  ? 'Listen to the target piano note, activate the mic, and hold the note in-tune for 1.2s to score points!'
                  : 'Ascolta la nota al piano, attiva il mic e tienila ferma per 1,2s per fare punto e aumentare la serie!'}
              </p>
            </div>

            {/* Score & Streak Pill */}
            <div className="flex items-center gap-3">
              <div className="bg-slate-950 p-3 sm:p-4 rounded-2xl border border-slate-800 text-center min-w-[80px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Punti</span>
                <span className="text-2xl font-black text-amber-400 tabular-nums">{gameScore}</span>
              </div>
              <div className="bg-slate-950 p-3 sm:p-4 rounded-2xl border border-slate-800 text-center min-w-[80px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Serie 🔥</span>
                <span className="text-2xl font-black text-sky-400 tabular-nums">{gameStreak}</span>
              </div>
            </div>
          </div>

          {/* Difficulty Selector */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-xs font-bold text-slate-300">
              {isEn ? 'Difficulty Level:' : 'Livello di Difficoltà:'}
            </span>
            <div className="flex gap-2">
              {[
                { id: 'easy', label: isEn ? 'Beginner (Triad)' : 'Principiante (Do-Mi-Sol)' },
                { id: 'medium', label: isEn ? 'Intermediate (Pentatonic)' : 'Intermedio (Pentatonica)' },
                { id: 'hard', label: isEn ? 'Advanced (Full Octave)' : 'Avanzato (Scala Completa)' },
              ].map((diff) => (
                <button
                  key={diff.id}
                  type="button"
                  onClick={() => {
                    setGameDifficulty(diff.id as any);
                    const pool = difficultyNotes[diff.id as 'easy' | 'medium' | 'hard'];
                    setGameTargetMidi(pool[0]);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    gameDifficulty === diff.id
                      ? 'bg-sky-500 text-slate-950 border-sky-300 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {diff.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Target Card */}
          <div className={`p-6 sm:p-8 rounded-3xl border transition-all text-center space-y-4 ${
            gameJustHit
              ? 'bg-emerald-950/80 border-emerald-400 scale-102 ring-4 ring-emerald-400/40'
              : 'bg-slate-950/90 border-sky-500/40'
          }`}>
            <span className="text-xs font-black text-sky-400 uppercase tracking-widest block">
              {isEn ? 'Target Note to Sing:' : 'Nota Bersaglio da Cantare:'}
            </span>

            <div className="text-5xl sm:text-6xl font-black text-white tracking-tight drop-shadow-lg">
              {notation === 'latin' ? gameTargetInfo.nameLatin : gameTargetInfo.nameScientific}
            </div>

            {/* Play target tone button */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => playPianoNote(gameTargetMidi, 1.2, 0.85)}
                className="px-5 py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/40 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
              >
                <Volume2 className="w-4 h-4 text-sky-400" />
                <span>{isEn ? 'Listen to Note 🎹' : 'Ascolta la Nota al Piano 🎹'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const pool = difficultyNotes[gameDifficulty];
                  const nextPool = pool.filter((m) => m !== gameTargetMidi);
                  const nextMidi = nextPool[Math.floor(Math.random() * nextPool.length)] || pool[0];
                  setGameTargetMidi(nextMidi);
                  playPianoNote(nextMidi, 1.2, 0.85);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold cursor-pointer transition-all"
                title={isEn ? 'Skip to another note' : 'Cambia nota bersaglio'}
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Hold progress bar */}
            <div className="max-w-md mx-auto space-y-1.5 pt-2">
              <div className="flex justify-between text-[11px] font-bold text-slate-400">
                <span>{isEn ? 'Intonation lock progress:' : 'Tenuta della nota:'}</span>
                <span className="text-emerald-400">{gameHoldProgress}%</span>
              </div>
              <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 rounded-full transition-all duration-100"
                  style={{ width: `${gameHoldProgress}%` }}
                />
              </div>
              <p className="text-xs font-black text-cyan-300 min-h-[20px] transition-all">
                {gameFeedbackMsg || (isEn ? 'Sing into the mic to play!' : 'Canta nel microfono per giocare!')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: EAR TRAINING INTERVALLI --- */}
      {activeTab === 'intervals' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-sky-400/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs font-black uppercase">
                <Music className="w-3.5 h-3.5 text-indigo-400" />
                <span>Ear Training Vocale</span>
              </div>
              <h3 className="text-2xl font-black text-white mt-1">
                {isEn ? 'Sing the Interval (Relative Pitch)' : 'Impara a Riconoscere e Cantare gli Intervalli'}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {isEn
                  ? 'Sensing intervals is the superpower of great singers: memorize the distance and hit the note without hesitation.'
                  : 'Sentire gli intervalli è il superpotere dei grandi cantanti: impara la distanza e canta la nota al primo colpo senza cercare tentoni.'}
              </p>
            </div>

            {/* Intervals Selector Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {INTERVALS_LIST.map((inv) => {
                const isSelected = selectedInterval.id === inv.id;
                return (
                  <div
                    key={inv.id}
                    onClick={() => setSelectedInterval(inv)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'bg-slate-900 border-sky-400 shadow-lg shadow-sky-500/20 ring-2 ring-sky-400/40'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div>
                      <h4 className={`text-sm font-black ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                        {isEn ? inv.nameEn : inv.name}
                      </h4>
                      <p className="text-xs text-sky-300 font-bold mt-1">
                        💡 {isEn ? inv.songExampleEn : inv.songExample}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-400 block leading-tight">
                      {isEn ? inv.descriptionEn : inv.description}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Practice Card for Selected Interval */}
            <div className="p-6 rounded-3xl bg-slate-950 border border-sky-400/40 text-center space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                {isEn ? 'Selected Interval Exercise:' : 'Esercizio Intervallo:'}
              </span>

              <div className="flex items-center justify-center gap-4 flex-wrap">
                <div className="bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Nota 1 (Partenza)</span>
                  <span className="text-2xl font-black text-sky-300">
                    {notation === 'latin' ? intervalRootInfo.nameLatin : intervalRootInfo.nameScientific}
                  </span>
                </div>

                <span className="text-xl font-black text-slate-500">➔</span>

                <div className="bg-slate-900 px-4 py-2.5 rounded-2xl border border-sky-500/40">
                  <span className="text-[10px] text-sky-400 block uppercase font-bold">Nota 2 ({selectedInterval.name})</span>
                  <span className="text-2xl font-black text-emerald-400">
                    {notation === 'latin' ? intervalTargetInfo.nameLatin : intervalTargetInfo.nameScientific}
                  </span>
                </div>
              </div>

              {/* Play buttons */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => playPianoNote(intervalRootMidi, 1.2, 0.85)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Suona Nota 1</span>
                </button>

                <button
                  type="button"
                  onClick={() => playPianoNote(intervalRootMidi + selectedInterval.semitones, 1.2, 0.85)}
                  className="px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-400/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Suona Salto Completo</span>
                </button>
              </div>

              {/* Live Mic check */}
              {isListening && detectedIntervalFeedback && (
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-1">
                  <span className="text-xs text-slate-400">
                    Nota rilevata dalla tua voce: <strong className="text-white">{detectedIntervalFeedback.noteName}</strong>
                  </span>
                  <div>
                    <span
                      className={`text-xs font-black uppercase px-3 py-1 rounded-full ${
                        detectedIntervalFeedback.match
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                      }`}
                    >
                      {detectedIntervalFeedback.match
                        ? '🎯 INTERVALLO ESATTO!'
                        : `Distanza attuale: ${detectedIntervalFeedback.semitonesDiff} semitoni`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 4: SIRENA & GLISSANDO FLUIDO --- */}
      {activeTab === 'siren' && (
        <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-sky-400/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-black uppercase">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Agilità & Connessione dei Registri</span>
            </div>
            <h3 className="text-2xl font-black text-white mt-1">
              {isEn ? 'Vocal Siren & Continuous Glissando' : 'Sirena Vocale & Tracciatore di Glissando'}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              {isEn
                ? 'Slide from your lowest comfortable note to your highest note without breaks or flips. The canvas traces your fluid curve in real time!'
                : 'Scivola dolcemente dalle note basse alle note acute e torna indietro senza scalini o crepe. Il grafico traccia la tua curva vocale continua in tempo reale!'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs sm:text-sm flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-black text-amber-300 uppercase text-[11px] block">
                {isEn ? "How to Practice:" : 'Come eseguire la Sirena:'}
              </span>
              <p className="leading-relaxed">
                Usa una cannuccia (semi-occlusione SOVT), un lip thrill o una vocale morbida come "Vu" o "Ooo". Inizia dal petto, attraversa la zona di passaggio con pochissima pressione d'aria e lascia volare la voce nella testa!
              </p>
            </div>
          </div>

          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-3 overflow-hidden space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold px-1">
              <span>Traccia Ondulatoria (Frequenza continua Hz)</span>
              <span className="text-cyan-400">
                {livePitch && livePitch.detectedFreq > 0 ? `${Math.round(livePitch.detectedFreq)} Hz` : 'In attesa del suono...'}
              </span>
            </div>
            <div className="w-full h-36 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <canvas ref={sirenCanvasRef} width={800} height={140} className="w-full h-full block" />
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 5: CONSIGLI DELLA VOCAL COACH SULL'INTONAZIONE --- */}
      {activeTab === 'tips' && (
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-sky-400/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-300 text-xs font-black uppercase">
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
              <span>Vocal Coach Masterclass</span>
            </div>
            <h3 className="text-2xl font-black text-white mt-1">
              {isEn ? "Francesca's Secrets for Spot-On Pitch" : "I 4 Segreti di Francesca per un'Intonazione Perfetta"}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-black text-sm">
                1
              </div>
              <h4 className="text-base font-black text-white">Pensa la nota "dall'alto"</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Non 'salire' verso la nota come se stessi spingendo un peso su una collina. Immagina invece di scendere delicatamente sulla nota come un paracadute: eviterai all'istante di calare (flat).
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-black text-sm">
                2
              </div>
              <h4 className="text-base font-black text-white">Risonanza negli zigomi & Maschera</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Un sorriso interno apre lo spazio faringeo e sposta la risonanza nella parte anteriore del viso. Questo dona armonici brillanti che rendono l'intonazione nitida e percettibile.
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-black text-sm">
                3
              </div>
              <h4 className="text-base font-black text-white">Non mollare il fiato a fine frase</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Il 90% delle note stonate si verifica nell'ultimo secondo della nota, quando il cantante si rilassa troppo presto. Mantieni l'appoggio addominale attivo fino a quando il suono non si è completamente spento!
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-black text-sm">
                4
              </div>
              <h4 className="text-base font-black text-white">Ascolto interiore preventivo</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Prima di emettere il suono, immagina la nota con estrema precisione nella tua mente. Se riesci a 'sentire' la frequenza internamente, le corde vocali si imposteranno da sole alla tensione esatta.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
