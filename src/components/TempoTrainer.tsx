import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  Timer,
  Award,
  Music,
  CheckCircle2,
  Activity,
  ChevronRight,
  Flame,
  Lightbulb,
  Sliders,
  Radio,
  BookOpen,
  Footprints,
  Hand
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getAudioContext, getMasterOutput, playMetronomeClick } from '../utils/audioSynth';

export type TimeSignature = '4/4' | '3/4' | '2/4' | '6/8';
export type Subdivision = 'quarter' | 'eighth' | 'triplet' | 'sixteenth';

export interface RhythmDrill {
  id: string;
  title: string;
  titleEn: string;
  badge: string;
  badgeEn: string;
  category: 'vocal' | 'body';
  bpm: number;
  timeSig: TimeSignature;
  subdivision: Subdivision;
  syllables: string;
  description: string;
  descriptionEn: string;
  coachTip: string;
  coachTipEn: string;
  hasOptionToggle?: boolean;
  options?: { id: string; label: string; syllables: string; getSteps: () => { beat: number; sub: string; syllable?: string; accent?: boolean; bodyAction?: string }[] }[];
  gridSteps: { beat: number; sub: string; syllable?: string; accent?: boolean; bodyAction?: string }[];
}

export const RHYTHM_DRILLS: RhythmDrill[] = [
  {
    id: 'offbeat_syncopation',
    title: "1. L'Attacco in Levare (Syncopation)",
    titleEn: '1. Off-Beat Attacks (Syncopation)',
    badge: 'Pop / Soul / Funk',
    badgeEn: 'Pop / Soul / Funk',
    category: 'vocal',
    bpm: 85,
    timeSig: '4/4',
    subdivision: 'eighth',
    syllables: '[pausa] - DA - [pausa] - DA',
    description: "Impara a cantare le note esattamente sul 'levare' (&) senza farti trascinare dal battere. È la base di tutto il groove moderno.",
    descriptionEn: 'Learn to land precisely on the off-beat (&) without falling onto the downbeat. The foundation of modern vocal groove.',
    coachTip: "Respira rilassando l'addome sul battere (1, 2, 3, 4) e lancia il suono sul levare (+). Non trattenere il fiato!",
    coachTipEn: 'Release your breath on the downbeat (1, 2, 3, 4) and launch the vowel on the offbeat (+). Never hold tension!',
    gridSteps: [
      { beat: 1, sub: 'Tempo 1', syllable: '—' },
      { beat: 1, sub: 'Levare (+)', syllable: 'DA', accent: true },
      { beat: 2, sub: 'Tempo 2', syllable: '—' },
      { beat: 2, sub: 'Levare (+)', syllable: 'DA', accent: true },
      { beat: 3, sub: 'Tempo 3', syllable: '—' },
      { beat: 3, sub: 'Levare (+)', syllable: 'DA', accent: true },
      { beat: 4, sub: 'Tempo 4', syllable: '—' },
      { beat: 4, sub: 'Levare (+)', syllable: 'DA', accent: true },
    ],
  },
  {
    id: 'pop_anticipation',
    title: '2. Il Groove Pop & Anticipo (Pop Push)',
    titleEn: '2. Pop Groove & Anticipation',
    badge: 'Pop Contemporaneo',
    badgeEn: 'Contemporary Pop',
    category: 'vocal',
    bpm: 95,
    timeSig: '4/4',
    subdivision: 'eighth',
    syllables: 'UNO - DUE - e - TRE - e - QUATTRO',
    description: "Nel pop moderno quasi tutte le melodie forti 'anticipano' la battuta di mezzo ottavo. Allena il tuo orecchio a non aspettare l'accordo.",
    descriptionEn: "Modern pop vocal lines anticipate the next chord by an eighth note. Train your ear not to wait for the chord.",
    coachTip: "Focalizza l'energia sull'anticipo (l'ottavo prima del 3 o dell'1): deve suonare deciso ed energico, non incerto.",
    coachTipEn: 'Focus rhythmic punch on the anticipation (eighth note before 3 or 1): deliver it crisp, never hesitant.',
    gridSteps: [
      { beat: 1, sub: 'Uno', syllable: 'UNO' },
      { beat: 1, sub: 'e', syllable: '—' },
      { beat: 2, sub: 'Due', syllable: 'DUE' },
      { beat: 2, sub: 'e (Anticipo)', syllable: 'e', accent: true },
      { beat: 3, sub: 'Tre', syllable: 'TRE', accent: true },
      { beat: 3, sub: 'e', syllable: '—' },
      { beat: 4, sub: 'Quattro', syllable: 'e' },
      { beat: 4, sub: 'e (Anticipo)', syllable: 'QUATTRO', accent: true },
    ],
  },
  {
    id: 'vocal_triplets',
    title: '3. Terzine Vocali: DA - BI - DI (Swing / R&B)',
    titleEn: '3. Vocal Triplets: DA - BI - DI (Swing / R&B)',
    badge: 'R&B / Soul / Jazz',
    badgeEn: 'R&B / Soul / Jazz',
    category: 'vocal',
    bpm: 75,
    timeSig: '4/4',
    subdivision: 'triplet',
    syllables: 'DA - BI - DI  DA - BI - DI',
    description: "Dividere ogni beat in 3 parti uguali (ternario) è indispensabile per melismi, abbellimenti R&B e brani shuffle/swing. Il metronomo suona 'DA' forte e 'BI - DI' meno accentati per farti capire al volo l'esercizio!",
    descriptionEn: 'Dividing each beat into 3 equal pulses is vital for riffs, runs, R&B melismas, and swing pocket. The metronome clicks all 3 notes to guide you!',
    coachTip: "Pronuncia le sillabe DA - BI - DI leggere e vicine alla parte anteriore della bocca (lingua e denti). Immagina di rimbalzare su una palla di gomma.",
    coachTipEn: 'Keep syllables DA - BI - DI feather-light near the front of your mouth (tongue and teeth). Think of a bouncy rubber ball.',
    gridSteps: [
      { beat: 1, sub: '1', syllable: 'DA', accent: true },
      { beat: 1, sub: 'bi', syllable: 'BI' },
      { beat: 1, sub: 'di', syllable: 'DI' },
      { beat: 2, sub: '2', syllable: 'DA', accent: true },
      { beat: 2, sub: 'bi', syllable: 'BI' },
      { beat: 2, sub: 'di', syllable: 'DI' },
      { beat: 3, sub: '3', syllable: 'DA', accent: true },
      { beat: 3, sub: 'bi', syllable: 'BI' },
      { beat: 3, sub: 'di', syllable: 'DI' },
      { beat: 4, sub: '4', syllable: 'DA', accent: true },
      { beat: 4, sub: 'bi', syllable: 'BI' },
      { beat: 4, sub: 'di', syllable: 'DI' },
    ],
  },
  {
    id: 'sixteenth_diction',
    title: '4. Agilità a Semicrome (TIKITAKA o TO PO LI NO)',
    titleEn: '4. 16th-Note Fast Diction & Agility',
    badge: 'Articolazione Rapida',
    badgeEn: 'Fast Articulation',
    category: 'vocal',
    bpm: 90,
    timeSig: '4/4',
    subdivision: 'sixteenth',
    syllables: 'TI-KI-TA-KA  oppure  TO-PO-LI-NO',
    description: "Quattro colpi per battito: potenzia l'articolazione consonantica per non rimanere mai indietro nei ritornelli fitti di parole. Puoi scegliere liberamente tra TIKITAKA e TO PO LI NO con i pulsanti dedicati!",
    descriptionEn: 'Four hits per beat: powers consonant articulation so you never fall behind in word-heavy fast choruses. Choose between TIKITAKA and TO PO LI NO!',
    coachTip: "Muovi poco la mandibola ed esagera il lavoro di punta e dorso della lingua. Minimo sforzo, massima chiarezza sillabica.",
    coachTipEn: 'Minimize jaw drop and maximize tongue-tip precision. Minimum effort, maximum syllabic clarity.',
    hasOptionToggle: true,
    options: [
      {
        id: 'tikitaka',
        label: 'TIKITAKA (TI-KI-TA-KA)',
        syllables: 'TI-KI-TA-KA  TI-KI-TA-KA',
        getSteps: () => [
          { beat: 1, sub: '1', syllable: 'TI', accent: true },
          { beat: 1, sub: 'e', syllable: 'KI' },
          { beat: 1, sub: '+', syllable: 'TA' },
          { beat: 1, sub: 'a', syllable: 'KA' },
          { beat: 2, sub: '2', syllable: 'TI', accent: true },
          { beat: 2, sub: 'e', syllable: 'KI' },
          { beat: 2, sub: '+', syllable: 'TA' },
          { beat: 2, sub: 'a', syllable: 'KA' },
          { beat: 3, sub: '3', syllable: 'TI', accent: true },
          { beat: 3, sub: 'e', syllable: 'KI' },
          { beat: 3, sub: '+', syllable: 'TA' },
          { beat: 3, sub: 'a', syllable: 'KA' },
          { beat: 4, sub: '4', syllable: 'TI', accent: true },
          { beat: 4, sub: 'e', syllable: 'KI' },
          { beat: 4, sub: '+', syllable: 'TA' },
          { beat: 4, sub: 'a', syllable: 'KA' },
        ],
      },
      {
        id: 'topolino',
        label: 'TO PO LI NO (TO-PO-LI-NO)',
        syllables: 'TO-PO-LI-NO  TO-PO-LI-NO',
        getSteps: () => [
          { beat: 1, sub: '1', syllable: 'TO', accent: true },
          { beat: 1, sub: 'e', syllable: 'PO' },
          { beat: 1, sub: '+', syllable: 'LI' },
          { beat: 1, sub: 'a', syllable: 'NO' },
          { beat: 2, sub: '2', syllable: 'TO', accent: true },
          { beat: 2, sub: 'e', syllable: 'PO' },
          { beat: 2, sub: '+', syllable: 'LI' },
          { beat: 2, sub: 'a', syllable: 'NO' },
          { beat: 3, sub: '3', syllable: 'TO', accent: true },
          { beat: 3, sub: 'e', syllable: 'PO' },
          { beat: 3, sub: '+', syllable: 'LI' },
          { beat: 3, sub: 'a', syllable: 'NO' },
          { beat: 4, sub: '4', syllable: 'TO', accent: true },
          { beat: 4, sub: 'e', syllable: 'PO' },
          { beat: 4, sub: '+', syllable: 'LI' },
          { beat: 4, sub: 'a', syllable: 'NO' },
        ],
      },
    ],
    gridSteps: [
      { beat: 1, sub: '1', syllable: 'TI', accent: true },
      { beat: 1, sub: 'e', syllable: 'KI' },
      { beat: 1, sub: '+', syllable: 'TA' },
      { beat: 1, sub: 'a', syllable: 'KA' },
      { beat: 2, sub: '2', syllable: 'TI', accent: true },
      { beat: 2, sub: 'e', syllable: 'KI' },
      { beat: 2, sub: '+', syllable: 'TA' },
      { beat: 2, sub: 'a', syllable: 'KA' },
      { beat: 3, sub: '3', syllable: 'TI', accent: true },
      { beat: 3, sub: 'e', syllable: 'KI' },
      { beat: 3, sub: '+', syllable: 'TA' },
      { beat: 3, sub: 'a', syllable: 'KA' },
      { beat: 4, sub: '4', syllable: 'TI', accent: true },
      { beat: 4, sub: 'e', syllable: 'KI' },
      { beat: 4, sub: '+', syllable: 'TA' },
      { beat: 4, sub: 'a', syllable: 'KA' },
    ],
  },
  // --- FUN BODY PERCUSSION & RHYTHMIC GROOVE DRILLS ---
  {
    id: 'stomp_clap_funk',
    title: '5. Body Percussion: Piede sul Battere & Clap sul Levare',
    titleEn: '5. Body Percussion: Stomp on Downbeat & Clap on Offbeat',
    badge: 'Coordinazione Corpo & Voce',
    badgeEn: 'Body & Voice Groove',
    category: 'body',
    bpm: 88,
    timeSig: '4/4',
    subdivision: 'eighth',
    syllables: '🦶 PIEDE (Battere 1 2 3 4) | 👏 CLAP (Levare +)',
    description: "Coordina il corpo come una vera band: il piede segna il tempo a terra (1, 2, 3, 4) e le mani battono esattamente in levare (+). Libera la gola perché il ritmo è nel corpo!",
    descriptionEn: 'Foot stomps the ground on the downbeats (1, 2, 3, 4) and hands clap crisp on the offbeats (+). Frees the throat by moving groove into the body!',
    coachTip: "Tieni le ginocchia morbide ed elastiche. Sentire il ritmo nei piedi impedisce alle corde vocali di contrarsi per tenere il tempo.",
    coachTipEn: 'Keep knees relaxed and springy. Grounding the pulse in your feet keeps the larynx free of rhythmic tension.',
    gridSteps: [
      { beat: 1, sub: '1', syllable: '🦶 PIEDE', accent: true, bodyAction: 'stomp' },
      { beat: 1, sub: '+', syllable: '👏 CLAP', bodyAction: 'clap' },
      { beat: 2, sub: '2', syllable: '🦶 PIEDE', accent: true, bodyAction: 'stomp' },
      { beat: 2, sub: '+', syllable: '👏 CLAP', bodyAction: 'clap' },
      { beat: 3, sub: '3', syllable: '🦶 PIEDE', accent: true, bodyAction: 'stomp' },
      { beat: 3, sub: '+', syllable: '👏 CLAP', bodyAction: 'clap' },
      { beat: 4, sub: '4', syllable: '🦶 PIEDE', accent: true, bodyAction: 'stomp' },
      { beat: 4, sub: '+', syllable: '👏 CLAP', bodyAction: 'clap' },
    ],
  },
  {
    id: 'rock_stomp_clap',
    title: '6. Il Groove Rock da Stadio "We Will Rock You"',
    titleEn: '6. "We Will Rock You" Stadium Groove',
    badge: 'Energia & Presenza',
    badgeEn: 'Energy & Stage Groove',
    category: 'body',
    bpm: 82,
    timeSig: '4/4',
    subdivision: 'eighth',
    syllables: '🦶 PIEDE - 🦶 PIEDE - 👏 CLAP! - 🤫 [Pausa]',
    description: "Il famosissimo ritmo da stadio: due colpi di piede consecutivi (ottavi 1 &), un battito secco di mani sul beat 2, e pausa. Potentissimo prima di cantare brani rock o energici!",
    descriptionEn: 'Classic stadium pulse: two rapid foot stomps (eighths 1 &), a punchy hand clap on beat 2, then breath pause. Perfect energy booster before high-power songs!',
    coachTip: "Sfrutta il battito di mani sul tempo 2 per ancorare i muscoli dorsali. Quando canti frasi potenti immagina la forza del clap!",
    coachTipEn: 'Use the hand clap on beat 2 to engage back anchor muscles. Channels stadium power into your vocal delivery!',
    gridSteps: [
      { beat: 1, sub: '1', syllable: '🦶 PIEDE', accent: true, bodyAction: 'stomp' },
      { beat: 1, sub: '+', syllable: '🦶 PIEDE', bodyAction: 'stomp' },
      { beat: 2, sub: '2', syllable: '👏 CLAP!', accent: true, bodyAction: 'clap' },
      { beat: 2, sub: '+', syllable: '🤫 —', bodyAction: 'rest' },
      { beat: 3, sub: '3', syllable: '🦶 PIEDE', accent: true, bodyAction: 'stomp' },
      { beat: 3, sub: '+', syllable: '🦶 PIEDE', bodyAction: 'stomp' },
      { beat: 4, sub: '4', syllable: '👏 CLAP!', accent: true, bodyAction: 'clap' },
      { beat: 4, sub: '+', syllable: '🤫 —', bodyAction: 'rest' },
    ],
  },
  {
    id: 'backbeat_snap',
    title: '7. Schiocco sul 2 e sul 4 (Finger Snap Jazz / Motown)',
    titleEn: '7. Backbeat Finger Snap (Jazz / Motown)',
    badge: 'Swing & Backbeat',
    badgeEn: 'Swing & Backbeat',
    category: 'body',
    bpm: 92,
    timeSig: '4/4',
    subdivision: 'quarter',
    syllables: '1 (Piede) - 🫰 SNAP (2) - 3 (Piede) - 🫰 SNAP (4)',
    description: "La regola d'oro della musica afroamericana e del pop: non si battono le mani sull'1 e sul 3! Schiocca le dita esclusivamente sul 2 e sul 4 mentre canti.",
    descriptionEn: 'The golden rule of pop, Motown and jazz: never snap on 1 and 3! Snap crisp fingers strictly on beats 2 and 4.',
    coachTip: "Non alzare le spalle durante lo schiocco. Se non riesci a schioccare forte, batti la mano sul petto o sulla coscia sul 2 e sul 4.",
    coachTipEn: "Keep shoulders down during snaps. If fingers aren't loud, tap your thigh or chest on beats 2 and 4.",
    gridSteps: [
      { beat: 1, sub: 'Tempo 1', syllable: '🦶 Passo 1', bodyAction: 'step' },
      { beat: 2, sub: 'Tempo 2', syllable: '🫰 SNAP 2', accent: true, bodyAction: 'snap' },
      { beat: 3, sub: 'Tempo 3', syllable: '🦶 Passo 3', bodyAction: 'step' },
      { beat: 4, sub: 'Tempo 4', syllable: '🫰 SNAP 4', accent: true, bodyAction: 'snap' },
    ],
  },
  {
    id: 'polyrhythm_shuffle',
    title: '8. Poliritmia 3:2 (Piede Cammina & Mani Terzina)',
    titleEn: '8. 3:2 Polyrhythm (Foot Walks, Hands Triplet)',
    badge: 'Poliritmia & Shuffle',
    badgeEn: 'Polyrhythm & Shuffle',
    category: 'body',
    bpm: 78,
    timeSig: '4/4',
    subdivision: 'triplet',
    syllables: '🦶 PIEDE (sul battere) | 👏 MANI (DA - BI - DI)',
    description: "Il piede batte costante a terra sul tempo principale (1, 2, 3, 4), mentre le mani e la voce rimbalzano in terzine fluide (DA - BI - DI). Sblocca l'indipendenza ritmica totale!",
    descriptionEn: 'Foot steps on the quarter notes while hands and voice bounce in smooth triplets (DA - BI - DI). Unlocks total rhythmic independence!',
    coachTip: "Concentrati sul piede: una volta che il piede è automatico, le mani e la voce galopperanno da sole senza fatica.",
    coachTipEn: 'Anchor to your feet first: once the foot pulse is automatic, triplets will float on top effortlessly.',
    gridSteps: [
      { beat: 1, sub: '1', syllable: '🦶 PIEDE + 👏 DA', accent: true, bodyAction: 'stomp' },
      { beat: 1, sub: 'bi', syllable: '👏 BI' },
      { beat: 1, sub: 'di', syllable: '👏 DI' },
      { beat: 2, sub: '2', syllable: '🦶 PIEDE + 👏 DA', accent: true, bodyAction: 'stomp' },
      { beat: 2, sub: 'bi', syllable: '👏 BI' },
      { beat: 2, sub: 'di', syllable: '👏 DI' },
      { beat: 3, sub: '3', syllable: '🦶 PIEDE + 👏 DA', accent: true, bodyAction: 'stomp' },
      { beat: 3, sub: 'bi', syllable: '👏 BI' },
      { beat: 3, sub: 'di', syllable: '👏 DI' },
      { beat: 4, sub: '4', syllable: '🦶 PIEDE + 👏 DA', accent: true, bodyAction: 'stomp' },
      { beat: 4, sub: 'bi', syllable: '👏 BI' },
      { beat: 4, sub: 'di', syllable: '👏 DI' },
    ],
  },
  {
    id: 'clave_afro_latin',
    title: '9. Clave 3:2 Afro-Cubana (Mani & Cosce)',
    titleEn: '9. Afro-Cuban 3:2 Clave (Hands & Thighs)',
    badge: 'Latin / Salsa Groove',
    badgeEn: 'Latin / Salsa Groove',
    category: 'body',
    bpm: 96,
    timeSig: '4/4',
    subdivision: 'eighth',
    syllables: '👏 TA... - 👏 TA... - 👏 TA! | 👏 TA... - 👏 TA!',
    description: "La regina di tutti i ritmi caraibici e pop sincopati: tre colpi nella prima battuta (1, 1+, 2+) e due colpi nella seconda (3, 4). Fa muovere istantaneamente bacino e voce!",
    descriptionEn: 'The core backbone of Afro-Latin groove: 3 beats then 2 beats. Loosens pelvic alignment and rhythmic breath recoil.',
    coachTip: "Batti le mani o tamburella sulle cosce. Non stringere le spalle: il ritmo sincopato ha bisogno di morbidezza.",
    coachTipEn: 'Tap hands on thighs. Keep shoulders loose: syncopation lives on elasticity, not muscular stiffness.',
    gridSteps: [
      { beat: 1, sub: '1', syllable: '👏 TA!', accent: true, bodyAction: 'clap' },
      { beat: 1, sub: '+', syllable: '—' },
      { beat: 2, sub: '2', syllable: '—' },
      { beat: 2, sub: '+', syllable: '👏 TA!', accent: true, bodyAction: 'clap' },
      { beat: 3, sub: '3', syllable: '—' },
      { beat: 3, sub: '+', syllable: '—' },
      { beat: 4, sub: '4', syllable: '👏 TA!', accent: true, bodyAction: 'clap' },
      { beat: 4, sub: '+', syllable: '—' },
    ],
  },
  {
    id: 'body_drumkit',
    title: '10. Drum-Kit Umano: Cassa Piede & Rullante Mani',
    titleEn: '10. Human Drum-Kit: Foot Kick & Hand Snare',
    badge: 'Beatbox Body Groove',
    badgeEn: 'Beatbox Body Groove',
    category: 'body',
    bpm: 90,
    timeSig: '4/4',
    subdivision: 'quarter',
    syllables: '🦶 CASSA (1) - 👏 RULLANTE (2) - 🦶 CASSA (3) - 👏 RULLANTE (4)',
    description: "Diventa tu stessə la batteria del brano! Piede sul battere 1 e 3 (cassa), battito di mani o colpo sul petto sul 2 e 4 (rullante). Il fondamento di tutta la musica moderna.",
    descriptionEn: 'Become your own drum kit! Foot stomps on 1 & 3 (kick), hands clap on 2 & 4 (snare). The foundation of modern groove.',
    coachTip: "Canta una frase qualsiasi sopra questo ritmo: noterai che non avrai più paura di perdere il tempo durante un live!",
    coachTipEn: 'Sing any melodic line over this body beat: you will never lose the pocket in a live performance again!',
    gridSteps: [
      { beat: 1, sub: '1', syllable: '🦶 CASSA', accent: true, bodyAction: 'stomp' },
      { beat: 2, sub: '2', syllable: '👏 RULLANTE', accent: true, bodyAction: 'clap' },
      { beat: 3, sub: '3', syllable: '🦶 CASSA', accent: true, bodyAction: 'stomp' },
      { beat: 4, sub: '4', syllable: '👏 RULLANTE', accent: true, bodyAction: 'clap' },
    ],
  },
];

export const TempoTrainer: React.FC = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [activeTab, setActiveTab] = useState<'metronome' | 'challenge' | 'drills' | 'tips'>('metronome');

  // Metronome state
  const [bpm, setBpm] = useState<number>(100);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [timeSignature, setTimeSignature] = useState<TimeSignature>('4/4');
  const [subdivision, setSubdivision] = useState<Subdivision>('quarter');
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Active beat tracking
  const [currentBeat, setCurrentBeat] = useState<number>(1);
  const [currentSubStep, setCurrentSubStep] = useState<number>(0);
  const [pendulumAngle, setPendulumAngle] = useState<number>(0);

  // Tap Tempo state
  const tapTimesRef = useRef<number[]>([]);
  const [isTapping, setIsTapping] = useState<boolean>(false);

  // Gap Click Challenge state
  const [gapMode, setGapMode] = useState<'4_on_2_off' | '4_on_4_off'>('4_on_2_off');
  const [challengeRunning, setChallengeRunning] = useState<boolean>(false);
  const [challengeMeasure, setChallengeMeasure] = useState<number>(1);
  const [challengeIsSilent, setChallengeIsSilent] = useState<boolean>(false);
  const [lastTapFeedback, setLastTapFeedback] = useState<{
    diffMs: number;
    rating: string;
    color: string;
  } | null>(null);
  const [scoreHits, setScoreHits] = useState<number>(0);
  const [totalAttempts, setTotalAttempts] = useState<number>(0);

  // Active Drill state
  const [selectedDrill, setSelectedDrill] = useState<RhythmDrill>(RHYTHM_DRILLS[0]);
  const [drillSubOption, setDrillSubOption] = useState<string>('tikitaka');

  // Audio scheduler refs
  const timerWorkerRef = useRef<number | null>(null);
  const stepCountRef = useRef<number>(0);
  const measureCountRef = useRef<number>(0);

  // Calculate beats per measure
  const getBeatsPerMeasure = (sig: TimeSignature) => {
    switch (sig) {
      case '2/4': return 2;
      case '3/4': return 3;
      case '6/8': return 6;
      case '4/4':
      default: return 4;
    }
  };

  const getSubdivisionsCount = (sub: Subdivision, sig: TimeSignature) => {
    if (sig === '6/8') return 1; // 6/8 counts in eighths
    switch (sub) {
      case 'eighth': return 2;
      case 'triplet': return 3;
      case 'sixteenth': return 4;
      case 'quarter':
      default: return 1;
    }
  };

  // Tempo markings helper
  const getTempoLabel = (val: number) => {
    if (val < 60) return isEn ? 'Largo (Very Slow)' : 'Largo (Molto Lento)';
    if (val < 76) return isEn ? 'Adagio (Slow & expressive)' : 'Adagio (Lento ed espressivo)';
    if (val < 100) return isEn ? 'Andante (Walking pace)' : 'Andante (A passo comodo)';
    if (val < 120) return isEn ? 'Moderato (Medium)' : 'Moderato (Medio)';
    if (val < 144) return isEn ? 'Allegro (Fast & bright)' : 'Allegro (Vivace e brillante)';
    if (val < 176) return isEn ? 'Vivace (Very fast)' : 'Vivace (Molto rapido)';
    return isEn ? 'Presto (Super fast)' : 'Presto (Rapidissimo)';
  };

  // Tap tempo handler
  const handleTapTempo = () => {
    const now = Date.now();
    setIsTapping(true);
    setTimeout(() => setIsTapping(false), 150);

    const taps = tapTimesRef.current;
    if (taps.length > 0 && now - taps[taps.length - 1] > 2500) {
      tapTimesRef.current = [];
    }

    tapTimesRef.current.push(now);
    if (tapTimesRef.current.length > 5) {
      tapTimesRef.current.shift();
    }

    if (tapTimesRef.current.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < tapTimesRef.current.length; i++) {
        intervals.push(tapTimesRef.current[i] - tapTimesRef.current[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      if (avgInterval > 0) {
        const computedBpm = Math.round(60000 / avgInterval);
        const clampedBpm = Math.max(40, Math.min(240, computedBpm));
        setBpm(clampedBpm);
      }
    }
  };

  // Gentle acoustic click for sub-beats & triplets
  const playSubTick = (vol: number) => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const masterOut = getMasterOutput(ctx);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(740, now);
      osc.frequency.exponentialRampToValueAtTime(380, now + 0.02);

      gain.gain.setValueAtTime(vol * 0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

      osc.connect(gain);
      gain.connect(masterOut);

      osc.start(now);
      osc.stop(now + 0.035);
    } catch {}
  };

  // Master Metronome Sequencer
  useEffect(() => {
    if (!isPlaying && !challengeRunning) {
      if (timerWorkerRef.current) {
        window.clearTimeout(timerWorkerRef.current);
        timerWorkerRef.current = null;
      }
      setCurrentBeat(1);
      setCurrentSubStep(0);
      setPendulumAngle(0);
      stepCountRef.current = 0;
      measureCountRef.current = 0;
      return;
    }

    const beatsPerMeasure = getBeatsPerMeasure(timeSignature);
    const subsPerBeat = getSubdivisionsCount(subdivision, timeSignature);
    const totalStepsPerMeasure = beatsPerMeasure * subsPerBeat;

    const beatDurationMs = (60 / bpm) * 1000;
    const stepDurationMs = beatDurationMs / subsPerBeat;

    const scheduleStep = () => {
      const currentStep = stepCountRef.current % totalStepsPerMeasure;
      const beatIndex = Math.floor(currentStep / subsPerBeat) + 1; // 1-indexed
      const subIndex = currentStep % subsPerBeat;
      const isBeatStart = subIndex === 0;

      // RULE 1: In 6/8, downbeat accent is on beat 1 AND beat 4!
      const isDownbeat = currentStep === 0 || (timeSignature === '6/8' && beatIndex === 4 && isBeatStart);

      setCurrentBeat(beatIndex);
      setCurrentSubStep(subIndex);

      // Visual pendulum swing
      const swingRatio = ((beatIndex - 1) / (beatsPerMeasure - 1 || 1)) * 2 - 1;
      setPendulumAngle(swingRatio * 28);

      // Gap Challenge check
      let shouldMuteAudio = isMuted;
      if (challengeRunning) {
        const onBars = 4;
        const offBars = gapMode === '4_on_2_off' ? 2 : 4;
        const totalCycleBars = onBars + offBars;
        const currentMeasureInCycle = (measureCountRef.current % totalCycleBars) + 1;
        const inSilentZone = currentMeasureInCycle > onBars;

        setChallengeMeasure(currentMeasureInCycle);
        setChallengeIsSilent(inSilentZone);

        if (inSilentZone) {
          shouldMuteAudio = true;
        }
      }

      // Play click audio
      if (!shouldMuteAudio) {
        if (isDownbeat) {
          playMetronomeClick(true, volume);
        } else if (isBeatStart) {
          playMetronomeClick(false, volume * 0.9);
        } else if (subdivision === 'triplet') {
          // Triplet sub-beats: play audible crisp woodblock click slightly less accented ("ba da" / "BI DI")
          playMetronomeClick(false, volume * 0.7);
        } else {
          // Play softer audible sub-tick for 16ths and others
          playMetronomeClick(false, volume * 0.55);
        }
      }

      stepCountRef.current++;
      if (stepCountRef.current % totalStepsPerMeasure === 0) {
        measureCountRef.current++;
      }

      timerWorkerRef.current = window.setTimeout(scheduleStep, stepDurationMs);
    };

    scheduleStep();

    return () => {
      if (timerWorkerRef.current) {
        window.clearTimeout(timerWorkerRef.current);
        timerWorkerRef.current = null;
      }
    };
  }, [isPlaying, challengeRunning, bpm, timeSignature, subdivision, volume, isMuted, gapMode]);

  // Challenge Tap response evaluation
  const handleChallengeUserTap = () => {
    if (!challengeRunning) return;

    const beatDurationMs = (60 / bpm) * 1000;
    const now = Date.now();

    const modulo = now % beatDurationMs;
    const offset = modulo > beatDurationMs / 2 ? modulo - beatDurationMs : modulo;
    const absOffset = Math.abs(offset);

    let rating = 'PERFETTO!';
    let color = 'text-emerald-400 bg-emerald-950/60 border-emerald-500/50';
    let isGood = false;

    if (absOffset < 35) {
      rating = isEn ? 'PERFECT! In The Pocket 🔥' : 'PERFETTO! In Tasca 🔥';
      color = 'text-emerald-400 bg-emerald-950/60 border-emerald-500/50';
      isGood = true;
    } else if (absOffset < 70) {
      rating = isEn ? 'GREAT! Solid Groove 🎯' : 'OTTIMO! Buon Senso del Tempo 🎯';
      color = 'text-cyan-400 bg-cyan-950/60 border-cyan-500/50';
      isGood = true;
    } else if (offset < 0) {
      rating = isEn ? `RUSHING (-${Math.round(absOffset)}ms) ⚡` : `IN ANTICIPO (-${Math.round(absOffset)}ms) ⚡`;
      color = 'text-amber-400 bg-amber-950/60 border-amber-500/50';
    } else {
      rating = isEn ? `DRAGGING (+${Math.round(absOffset)}ms) 🐢` : `IN RITARDO (+${Math.round(absOffset)}ms) 🐢`;
      color = 'text-rose-400 bg-rose-950/60 border-rose-500/50';
    }

    setLastTapFeedback({ diffMs: Math.round(offset), rating, color });
    setTotalAttempts((prev) => prev + 1);
    if (isGood) setScoreHits((prev) => prev + 1);
  };

  const beatsCount = getBeatsPerMeasure(timeSignature);

  // Active steps for Drill 4 if option toggle is present
  const currentDrillSteps =
    selectedDrill.hasOptionToggle && selectedDrill.options
      ? (selectedDrill.options.find((o) => o.id === drillSubOption) || selectedDrill.options[0]).getSteps()
      : selectedDrill.gridSteps;

  // Reusable compact Metronome Parameters Bar component
  const MetronomeParametersBar: React.FC<{ titleBadge?: string }> = ({ titleBadge }) => (
    <div className="bg-slate-950/90 border border-sky-500/30 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-black text-white uppercase tracking-wider">
            {titleBadge || (isEn ? 'Metronome Parameters' : 'Parametri del Metronomo')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {timeSignature !== '4/4' && (
            <button
              type="button"
              onClick={() => {
                setTimeSignature('4/4');
                setSubdivision('quarter');
              }}
              className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-[10px] font-bold border border-sky-400/40 cursor-pointer transition-all"
              title={isEn ? 'Reset to 4/4' : 'Ripristina tempo in 4/4'}
            >
              ↩ {isEn ? 'Reset 4/4' : 'Ripristina 4/4'}
            </button>
          )}
          <span className="text-xl font-black text-white tabular-nums">{bpm} BPM</span>
          <span className="text-xs text-sky-400 font-bold hidden sm:inline">({getTempoLabel(bpm)})</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Time Signature */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-sky-300 uppercase tracking-wider block">
            {isEn ? 'Time Signature' : 'Tempo / Metro'}
          </label>
          <div className="grid grid-cols-4 gap-1">
            {(['4/4', '3/4', '2/4', '6/8'] as TimeSignature[]).map((sig) => (
              <button
                key={sig}
                type="button"
                onClick={() => setTimeSignature(sig)}
                className={`py-1.5 rounded-lg text-xs font-black border transition-all cursor-pointer ${
                  timeSignature === sig
                    ? 'bg-sky-500 text-slate-950 border-sky-300 shadow-sm'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {sig}
              </button>
            ))}
          </div>
        </div>

        {/* Subdivision */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-sky-300 uppercase tracking-wider block">
            {isEn ? 'Subdivision' : 'Suddivisione'}
          </label>
          <div className="grid grid-cols-4 gap-1">
            {[
              { id: 'quarter', label: '♩ 1/4' },
              { id: 'eighth', label: '♪ 1/8' },
              { id: 'triplet', label: '3 Terz.' },
              { id: 'sixteenth', label: '♬ 1/16' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSubdivision(s.id as Subdivision)}
                className={`py-1.5 px-1 rounded-lg text-[10.5px] font-bold border transition-all cursor-pointer text-center ${
                  subdivision === s.id
                    ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-sm'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* BPM Quick Slider & Adjust */}
        <div className="space-y-1.5 md:col-span-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-sky-300 uppercase">
            <span>BPM</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setBpm((p) => Math.max(40, p - 5))}
                className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 hover:text-white border border-slate-800 text-[10px]"
              >
                -5
              </button>
              <button
                type="button"
                onClick={() => setBpm((p) => Math.min(240, p + 5))}
                className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 hover:text-white border border-slate-800 text-[10px]"
              >
                +5
              </button>
            </div>
          </div>
          <input
            type="range"
            min="40"
            max="220"
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-full accent-sky-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Volume & Tap Tempo */}
        <div className="space-y-1.5 flex items-center justify-between gap-3 pt-1">
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-sky-300 uppercase">
              <span>Vol.</span>
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="text-slate-400 hover:text-white"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

          <button
            type="button"
            onClick={handleTapTempo}
            className={`px-3 py-2 rounded-xl font-black text-[11px] border transition-all cursor-pointer shadow-sm active:scale-95 shrink-0 ${
              isTapping
                ? 'bg-sky-400 text-slate-950 border-sky-300 ring-2 ring-sky-300'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-sky-300'
            }`}
          >
            TAP
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top Section Navigation Tabs */}
      <div className="flex items-center justify-center">
        <div className="bg-slate-900/90 border border-sky-400/50 p-1.5 rounded-2xl flex items-center gap-1.5 shadow-xl max-w-full overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('metronome');
              setChallengeRunning(false);
            }}
            className={`px-3.5 sm:px-5 py-2 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'metronome'
                ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Timer className="w-4 h-4" />
            <span>{isEn ? 'Visual Metronome' : 'Metronomo Interattivo'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('challenge');
              setIsPlaying(false);
            }}
            className={`px-3.5 sm:px-5 py-2 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'challenge'
                ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>{isEn ? 'Internal Pulse Challenge' : 'Sfida: Mantieni il Tempo'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('drills');
              setChallengeRunning(false);
            }}
            className={`px-3.5 sm:px-5 py-2 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'drills'
                ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>{isEn ? 'Rhythm & Body Drills' : 'Esercizi di Fraseggio & Body Percussion'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('tips');
              setChallengeRunning(false);
            }}
            className={`px-3.5 sm:px-5 py-2 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'tips'
                ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>{isEn ? 'Coach Advice' : 'Consigli di Francesca'}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: METRONOMO INTERATTIVO */}
      {activeTab === 'metronome' && (
        <div className="space-y-6">
          {/* Main Display & Pendulum */}
          <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-sky-400/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Pendulum Indicator */}
            <div className="h-16 flex items-center justify-center relative max-w-sm mx-auto mb-2">
              <div className="w-full h-1 bg-slate-800 rounded-full relative">
                <div
                  className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-400 to-cyan-300 shadow-lg shadow-sky-400/50 border-2 border-white absolute -top-2.5 transition-transform duration-75"
                  style={{
                    left: '50%',
                    transform: `translateX(-50%) translateX(${pendulumAngle * 3.8}px)`,
                  }}
                />
              </div>
            </div>

            {/* Big BPM Display */}
            <div className="text-center space-y-1">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-6xl sm:text-7xl font-black text-white tracking-tighter tabular-nums drop-shadow-md">
                  {bpm}
                </span>
                <span className="text-sm sm:text-base font-extrabold text-sky-400 uppercase tracking-widest">
                  BPM
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-300">{getTempoLabel(bpm)}</p>
            </div>

            {/* Beat LED Grid - with accent on Beat 1 AND Beat 4 in 6/8 */}
            <div className="flex items-center justify-center gap-2 sm:gap-4 my-6 flex-wrap">
              {Array.from({ length: beatsCount }).map((_, idx) => {
                const beatNum = idx + 1;
                const isCurrent = isPlaying && currentBeat === beatNum;
                // In 6/8, beat 1 AND beat 4 are accented downbeats
                const isDownbeat = beatNum === 1 || (timeSignature === '6/8' && beatNum === 4);

                return (
                  <div
                    key={idx}
                    className={`flex flex-col items-center justify-center transition-all ${
                      isCurrent ? 'scale-110' : 'opacity-80'
                    }`}
                  >
                    <div
                      className={`w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-base sm:text-lg border transition-all ${
                        isCurrent
                          ? isDownbeat
                            ? 'bg-amber-400 border-amber-300 text-slate-950 shadow-xl shadow-amber-400/50 ring-4 ring-amber-400/30'
                            : 'bg-sky-400 border-sky-300 text-slate-950 shadow-xl shadow-sky-400/50 ring-4 ring-sky-400/30'
                          : isDownbeat
                          ? 'bg-slate-950 border-amber-500/40 text-amber-300 shadow-inner'
                          : 'bg-slate-950 border-slate-800 text-slate-400 shadow-inner'
                      }`}
                    >
                      {beatNum}
                    </div>
                    <span
                      className={`text-[9px] sm:text-[10px] font-bold mt-1 uppercase text-center ${
                        isDownbeat ? 'text-amber-400 font-black' : 'text-slate-400'
                      }`}
                    >
                      {isDownbeat ? (beatNum === 1 ? 'Beat 1 (Acc.)' : 'Beat 4 (Acc.)') : `Beat ${beatNum}`}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Play/Pause & Tap Tempo Buttons */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => {
                  getAudioContext();
                  setIsPlaying(!isPlaying);
                }}
                className={`px-8 py-4 rounded-2xl font-black text-sm sm:text-base flex items-center gap-2.5 shadow-xl transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                  isPlaying
                    ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/30'
                    : 'bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-slate-950 shadow-sky-400/30'
                }`}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                <span>{isPlaying ? (isEn ? 'Stop Metronome' : 'Ferma Metronomo') : (isEn ? 'Start Metronome' : 'Avvia Metronomo')}</span>
              </button>

              <button
                type="button"
                onClick={handleTapTempo}
                className={`px-6 py-4 rounded-2xl font-black text-xs sm:text-sm border transition-all cursor-pointer shadow-lg active:scale-95 ${
                  isTapping
                    ? 'bg-sky-400 text-slate-950 border-sky-300 ring-2 ring-sky-300 shadow-sky-400/50 scale-105'
                    : 'bg-slate-800/90 hover:bg-slate-700/90 border-slate-700 text-sky-300'
                }`}
              >
                <span>{isEn ? 'TAP TEMPO' : 'TAP TEMPO'}</span>
              </button>
            </div>

            {/* Tempo Slider & Increment Buttons */}
            <div className="mt-8 pt-6 border-t border-slate-800 max-w-xl mx-auto space-y-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setBpm((p) => Math.max(40, p - 5))}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 cursor-pointer"
                >
                  -5
                </button>
                <button
                  type="button"
                  onClick={() => setBpm((p) => Math.max(40, p - 1))}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 cursor-pointer"
                >
                  -1
                </button>

                <input
                  type="range"
                  min="40"
                  max="220"
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="flex-1 accent-sky-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />

                <button
                  type="button"
                  onClick={() => setBpm((p) => Math.min(240, p + 1))}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 cursor-pointer"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => setBpm((p) => Math.min(240, p + 5))}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 cursor-pointer"
                >
                  +5
                </button>
              </div>

              {/* Quick Tempo Presets */}
              <div className="flex items-center justify-between gap-1.5 flex-wrap pt-1">
                {[
                  { label: '60', bpm: 60, name: 'Lento' },
                  { label: '80', bpm: 80, name: 'Andante' },
                  { label: '100', bpm: 100, name: 'Moderato' },
                  { label: '120', bpm: 120, name: 'Pop 4/4' },
                  { label: '140', bpm: 140, name: 'Allegro' },
                  { label: '160', bpm: 160, name: 'Up-tempo' },
                ].map((item) => (
                  <button
                    key={item.bpm}
                    type="button"
                    onClick={() => setBpm(item.bpm)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      bpm === item.bpm
                        ? 'bg-sky-500/20 text-sky-300 border-sky-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {item.label} <span className="text-[10px] opacity-70">({item.name})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Configuration Controls: Signature, Subdivisions & Volume */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Metri / Time Signatures */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2.5">
              <label className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5" />
                <span>{isEn ? 'Time Signature' : 'Tempo / Metro'}</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['4/4', '3/4', '2/4', '6/8'] as TimeSignature[]).map((sig) => (
                  <button
                    key={sig}
                    type="button"
                    onClick={() => setTimeSignature(sig)}
                    className={`py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      timeSignature === sig
                        ? 'bg-sky-500 text-slate-950 border-sky-300 shadow-md'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {sig}
                  </button>
                ))}
              </div>
              {timeSignature === '6/8' && (
                <p className="text-[11px] text-amber-300/90 font-medium">
                  ✨ Nel 6/8 sono accentati sia il Beat 1 che il Beat 4 (movimenti ternari principali).
                </p>
              )}
            </div>

            {/* Suddivisioni Ritmiche */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2.5">
              <label className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                <span>{isEn ? 'Subdivision' : 'Suddivisione'}</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'quarter', label: '♩ 1/4' },
                  { id: 'eighth', label: '♪ 1/8' },
                  { id: 'triplet', label: '3 Terzine' },
                  { id: 'sixteenth', label: '♬ 1/16' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSubdivision(s.id as Subdivision)}
                    className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                      subdivision === s.id
                        ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-md'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Volume Click & Mute */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Click Volume' : 'Volume Click'}</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-1 rounded-lg border text-xs cursor-pointer ${
                    isMuted ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                  title={isMuted ? 'Riattiva audio' : 'Muta audio'}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer h-2 bg-slate-800 rounded-lg mt-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SFIDA "MANTIENI IL TEMPO" (GAP CLICK) */}
      {activeTab === 'challenge' && (
        <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-sky-400/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-extrabold uppercase">
                <Flame className="w-3.5 h-3.5" />
                <span>{isEn ? 'Ear & Pulse Workout' : 'Allenamento Pulsazione Interna'}</span>
              </div>
              <h3 className="text-2xl font-black text-white">
                {isEn ? 'Gap Click Challenge' : 'Sfida: Mantieni il Tempo'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                {isEn
                  ? 'The metronome plays 4 bars to lock in your groove, then GOES SILENT for 2 or 4 bars. Keep tapping or clapping to test your internal tempo!'
                  : 'Il metronomo suona 4 battute per darti il groove, poi si AZZERA per 2 o 4 battute. Continua a battere a tempo e scopri se resti in tasca!'}
              </p>
            </div>

            {/* Score pill */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center shrink-0 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {isEn ? 'Pocket Score' : 'Precisione'}
              </span>
              <div className="text-2xl font-black text-emerald-400">
                {totalAttempts > 0 ? `${Math.round((scoreHits / totalAttempts) * 100)}%` : '—'}
              </div>
              <span className="text-[10px] text-slate-500 block">
                {scoreHits}/{totalAttempts} {isEn ? 'in the pocket' : 'centrati'}
              </span>
            </div>
          </div>

          {/* PARAMETRI METRONOMO INCLUSI NELLA SFIDA */}
          <MetronomeParametersBar
            titleBadge={isEn ? 'Challenge Tempo & Metro Settings' : 'Imposta Metro, BPM e Suddivisione per la Sfida'}
          />

          {/* Mode Selector */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-xs font-bold text-slate-300">
              {isEn ? 'Silence Duration:' : 'Durata Silenzio:'}
            </span>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setGapMode('4_on_2_off')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                  gapMode === '4_on_2_off'
                    ? 'bg-sky-500 text-slate-950 border-sky-300'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                4 {isEn ? 'Bars ON' : 'Misure Click'} + 2 {isEn ? 'Bars OFF' : 'Misure Silenzio'}
              </button>
              <button
                type="button"
                onClick={() => setGapMode('4_on_4_off')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                  gapMode === '4_on_4_off'
                    ? 'bg-sky-500 text-slate-950 border-sky-300'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                4 {isEn ? 'Bars ON' : 'Misure Click'} + 4 {isEn ? 'Bars OFF (Hard)' : 'Misure Silenzio (Avanzato)'}
              </button>
            </div>
          </div>

          {/* Challenge Active Visualizer */}
          <div className="text-center space-y-4 py-4">
            <div className="space-y-1">
              <span
                className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                  challengeIsSilent
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                }`}
              >
                {challengeRunning
                  ? challengeIsSilent
                    ? (isEn ? '🔇 SILENCE! Keep the groove in your head...' : '🔇 SILENZIO! Mantieni il groove nella testa...')
                    : (isEn ? '🔊 CLICK ACTIVE — Lock in the beat' : '🔊 CLICK ATTIVO — Sintonizzati sul beat')
                  : (isEn ? 'Challenge Ready' : 'Sfida Pronta')}
              </span>

              <div className="text-5xl sm:text-6xl font-black text-white pt-2 tabular-nums">
                {challengeRunning ? `${isEn ? 'Bar' : 'Battuta'} ${challengeMeasure}` : `${bpm} BPM (${timeSignature})`}
              </div>
            </div>

            {/* Interactive BIG TAP BUTTON */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleChallengeUserTap}
                disabled={!challengeRunning}
                className={`w-full max-w-md mx-auto py-8 rounded-3xl font-black text-lg sm:text-xl border transition-all shadow-2xl flex flex-col items-center justify-center gap-1 active:scale-95 ${
                  challengeRunning
                    ? 'bg-gradient-to-tr from-sky-500 via-cyan-400 to-indigo-500 hover:from-sky-400 hover:to-cyan-300 text-slate-950 border-sky-200 shadow-sky-500/30 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-60'
                }`}
              >
                <Flame className="w-7 h-7 text-slate-950" />
                <span>{isEn ? 'TAP ON THE BEAT!' : 'BATTI SUL TEMPO!'}</span>
                <span className="text-xs font-semibold opacity-80">
                  {challengeRunning
                    ? (isEn ? 'Tap on every beat during click or silence' : 'Clicca a ogni beat anche quando il click tace')
                    : (isEn ? 'Press Start Challenge below first' : 'Premi prima Avvia Sfida qui sotto')}
                </span>
              </button>
            </div>

            {/* Last Tap Feedback Box */}
            {lastTapFeedback && (
              <div
                className={`max-w-md mx-auto p-3.5 rounded-2xl border text-xs sm:text-sm font-black transition-all ${lastTapFeedback.color}`}
              >
                {lastTapFeedback.rating}
              </div>
            )}

            {/* Start/Stop Challenge */}
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  getAudioContext();
                  setChallengeRunning(!challengeRunning);
                  setLastTapFeedback(null);
                }}
                className={`px-8 py-3.5 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                  challengeRunning
                    ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/25'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/25'
                }`}
              >
                {challengeRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{challengeRunning ? (isEn ? 'Stop Challenge' : 'Ferma Sfida') : (isEn ? 'Start Challenge' : 'Avvia Sfida')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setScoreHits(0);
                  setTotalAttempts(0);
                  setLastTapFeedback(null);
                }}
                className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 cursor-pointer"
                title={isEn ? 'Reset score' : 'Azzera punteggio'}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ESERCIZI DI FRASEGGIO RITMICO VOCALE & BODY PERCUSSION */}
      {activeTab === 'drills' && (
        <div className="space-y-6">
          {/* Metronome Parameters Bar for Drills */}
          <MetronomeParametersBar
            titleBadge={isEn ? 'Interactive Tempo Bar for Drills' : 'Pannello Metronomo Esercizi (BPM, Metro & Suddivisione)'}
          />

          {/* Drill Category Filter / Header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              <span>{isEn ? 'Choose a Rhythm or Body Percussion Drill' : 'Scegli un Esercizio Ritmico o di Body Percussion'}</span>
            </h4>
            <span className="text-xs text-slate-400 font-semibold">
              {RHYTHM_DRILLS.length} {isEn ? 'interactive drills' : 'esercizi interattivi'}
            </span>
          </div>

          {/* Drill Selector Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {RHYTHM_DRILLS.map((drill) => {
              const isSelected = selectedDrill.id === drill.id;
              const isBody = drill.category === 'body';

              return (
                <div
                  key={drill.id}
                  onClick={() => {
                    setSelectedDrill(drill);
                    setBpm(drill.bpm);
                    setTimeSignature(drill.timeSig);
                    setSubdivision(drill.subdivision);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'bg-slate-900 border-sky-400 shadow-xl shadow-sky-500/15 ring-2 ring-sky-400/50'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2.5 py-0.5 rounded-md font-black text-[10px] border uppercase tracking-wider ${
                          isBody
                            ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                            : 'bg-sky-950 text-sky-300 border-sky-800'
                        }`}
                      >
                        {isBody ? '🦶👏 ' : '🗣️ '}
                        {isEn ? drill.badgeEn : drill.badge}
                      </span>
                      <span className="text-xs font-bold text-slate-400">{drill.bpm} BPM</span>
                    </div>

                    <h5 className="text-sm font-black text-white line-clamp-1">
                      {isEn ? drill.titleEn : drill.title}
                    </h5>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {isEn ? drill.descriptionEn : drill.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="font-black text-cyan-300 font-mono text-[11px] truncate max-w-[190px]">
                      {drill.syllables}
                    </span>
                    <span className="text-sky-400 font-bold flex items-center gap-1 shrink-0">
                      <span>{isSelected ? (isEn ? 'Selected' : 'Selezionato') : (isEn ? 'Select' : 'Scegli')}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Drill Interactive Sheet */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-sky-400/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-sky-400 uppercase tracking-widest">
                    {isEn ? 'Active Rhythm Exercise' : 'Esercizio Selezionato'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-sky-300 font-bold text-[10px]">
                    {selectedDrill.timeSig} • {selectedDrill.bpm} BPM
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                  {isEn ? selectedDrill.titleEn : selectedDrill.title}
                </h3>
              </div>

              {/* Play / Stop Click Button for Drill */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    getAudioContext();
                    setIsPlaying(!isPlaying);
                  }}
                  className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                    isPlaying
                      ? 'bg-rose-500 text-white'
                      : 'bg-gradient-to-r from-sky-400 to-cyan-400 text-slate-950 hover:scale-105'
                  }`}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isPlaying ? (isEn ? 'Stop Click' : 'Ferma Click') : (isEn ? 'Start Click' : 'Avvia Click Esercizio')}</span>
                </button>
              </div>
            </div>

            {/* OPTION TOGGLE FOR DRILL 4 (TIKITAKA vs TOPOLINO) */}
            {selectedDrill.hasOptionToggle && selectedDrill.options && (
              <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-sky-500/40 space-y-2">
                <label className="text-xs font-black text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isEn ? 'Choose Syllable Pattern:' : 'Scegli la combinazione di sillabe:'}</span>
                </label>
                <div className="flex gap-2.5">
                  {selectedDrill.options.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDrillSubOption(opt.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        drillSubOption === opt.id
                          ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-md'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* METRONOME PARAMETERS DIRECTLY IN EVERY EXERCISE */}
            <MetronomeParametersBar
              titleBadge={isEn ? `Metronome Controls for Drill (${bpm} BPM)` : `Controlli Metronomo Diretti per questo Esercizio (${bpm} BPM)`}
            />

            {/* Vocal Grid Visualization */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  {isEn ? 'Rhythmic Grid & Syllables:' : 'Griglia Ritmica & Posizionamento Sillabe / Azioni:'}
                </label>
                <span className="text-[11px] text-cyan-300 font-bold">
                  {selectedDrill.category === 'body'
                    ? 'Coordinazione Corpo & Voce'
                    : selectedDrill.id === 'vocal_triplets'
                    ? '3 note per beat (DA - BI - DI)'
                    : 'Segui il click evidenziato'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {currentDrillSteps.map((step, idx) => {
                  const isCurrent = isPlaying && currentBeat === step.beat;
                  const isAction = Boolean(step.bodyAction);

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        step.accent
                          ? 'bg-sky-950/70 border-sky-400/70 text-sky-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      } ${isCurrent ? 'ring-2 ring-sky-300 scale-105 shadow-lg shadow-sky-500/20' : ''}`}
                    >
                      <div className="text-[10px] font-extrabold text-slate-400 uppercase">
                        {step.sub}
                      </div>
                      <div
                        className={`text-xs sm:text-sm font-black my-1 truncate ${
                          step.accent ? 'text-cyan-300 font-extrabold' : 'text-slate-300'
                        }`}
                      >
                        {step.syllable || '—'}
                      </div>
                      {step.bodyAction && (
                        <div className="text-[10px] font-extrabold text-amber-300 uppercase tracking-tighter">
                          {step.bodyAction === 'stomp' ? 'Piede' : step.bodyAction === 'clap' ? 'Mani' : step.bodyAction === 'snap' ? 'Schiocco' : ''}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Coach Tip Callout */}
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs sm:text-sm flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-extrabold text-amber-300 uppercase text-[11px] block">
                  {isEn ? "Francesca's Vocal Tip" : 'Il Consiglio di Francesca:'}
                </span>
                <p className="leading-relaxed">
                  {isEn ? selectedDrill.coachTipEn : selectedDrill.coachTip}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: I CONSIGLI DELLA VOCAL COACH PER IL TEMPO */}
      {activeTab === 'tips' && (
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-sky-400/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="space-y-1 border-b border-slate-800 pb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-300 text-xs font-extrabold uppercase">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isEn ? 'Vocal Coach Masterclass' : 'Guida al Tempo per Cantanti'}</span>
            </div>
            <h3 className="text-2xl font-black text-white">
              {isEn ? 'How to Internalize Rhythm & Groove' : 'Come Interiorizzare il Tempo nel Canto'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tip 1 */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-black">
                1
              </div>
              <h4 className="font-bold text-white text-sm">
                {isEn ? 'The Body as a Pendulum' : 'Il Corpo come Pendolo'}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isEn
                  ? 'Never keep tempo only in your mind: gently bounce on your heels, tap your foot, or snap on beats 2 and 4. When your body moves freely, your vocal cords relax.'
                  : 'Non tenere il tempo solo con la testa: ondeggia leggermente, batti il tallone o fai schioccare le dita sul 2 e sul 4. Il ritmo nasce nel corpo, non nella gola!'}
              </p>
            </div>

            {/* Tip 2 */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-black">
                2
              </div>
              <h4 className="font-bold text-white text-sm">
                {isEn ? 'Breathing on the Beat' : 'Respirare a Tempo'}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isEn
                  ? '90% of timing errors happen because you breathe at the last millisecond. In 4/4, inhale smoothly on beat 4 so you attack beat 1 relaxed and right on time.'
                  : "Il 90% degli attacchi in ritardo dipende dal respiro: se respiri all'ultimo secondo arrivi tardi. In 4/4, inspira con calma sul battito 4 per attaccare sull'1 perfettamente a fuoco."}
              </p>
            </div>

            {/* Tip 3 */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-black">
                3
              </div>
              <h4 className="font-bold text-white text-sm">
                {isEn ? 'Consonants as Drums' : 'Le Consonanti sono Percussioni'}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isEn
                  ? 'Vowels carry tone and pitch, but consonants (T, K, P, D, B) are your drums. Place the consonant slightly ahead so the vowel lands right on the downbeat.'
                  : 'Le vocali portano il suono e la melodia, ma le consonanti (T, K, P, D, B) sono la tua batteria. Fai scoccare la consonante nitida in modo che la vocale piena cada esattamente sul beat.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
