import React, { useState, useEffect, useRef } from 'react';
import { Exercise, ExerciseCategory, NoteNotation, PitchDetectionResult, VocalRangeProfile, ScalePatternId } from '../types';
import { VOCAL_EXERCISES } from '../data/exercises';
import { getNoteInfo, getScaleOffsets, playPianoNote, playPianoChord, playSirenGlide, playMetronomeClick, getAudioContext } from '../utils/audioSynth';
import { PitchDetector } from '../utils/pitchDetector';
import { InteractivePiano } from './InteractivePiano';
import { Play, Pause, Square, Mic, MicOff, Sparkles, CheckCircle2, Zap, Music, Volume2, VolumeX, Sliders, ArrowUp, ArrowDown, ArrowUpDown, Repeat, Gauge, BookOpen, Lightbulb, ChevronDown, Target, Wind, ArrowRight, ArrowLeft, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useRoutineQueue } from '../context/RoutineQueueContext';

const VOCAL_TIPS = [
  "Ricorda di sollevare gli zigomi",
  "Ricorda di respirare",
  "Aggiungi pianto se ti sembra di sforzare",
  "Fai attenzione a dove senti risuonare il suono",
  "Se non ti esce il lip trill metti le dita nelle guance"
];

const VOCAL_TIPS_EN = [
  "Remember to lift your cheekbones",
  "Remember to breathe",
  "Add a slight cry feeling if you feel strain",
  "Pay attention to where you feel the sound resonating",
  "If lip trill is hard, support your cheeks with fingers"
];

interface VocalExercisePlayerProps {
  notation: NoteNotation;
  vocalProfile: VocalRangeProfile | null;
  onExerciseComplete: (title: string, durationSec: number) => void;
  allowedCategories?: ExerciseCategory[];
  title?: string;
  sectionBadge?: string;
  onNavigate?: (tab: string, subTool?: string) => void;
  onGoBack?: () => void;
  canGoBack?: boolean;
  backButtonLabel?: string;
}

const ALL_SCALE_PATTERNS: { id: ScalePatternId; label: string }[] = [
  { id: 'five_notes', label: '1. 12345' },
  { id: 'scale_5_desc', label: '2. 54321' },
  { id: 'gliss_5_1_desc', label: '3. 5 1 - glissato di quinta discendente' },
  { id: 'siren_glide', label: '4. 1 8 1 - glissato di ottava' },
  { id: 'gliss_1_5_1', label: '5. 1 5 1 - glissato di quinta' },
  { id: 'gliss_1_5', label: '6. 1 5 - glissato quinta corta' },
  { id: 'three_notes', label: '7. 123' },
  { id: 'triad', label: '8. 135 - arpeggio triade' },
  { id: 'broad_arpeggio', label: '9. 1358 - arpeggio ottava' },
  { id: 'arpeggio_531_desc', label: '10. 531 - arpeggio triade discendente' },
  { id: 'arpeggio_compound_desc', label: '11. 8531 531 31 - arpeggio composto' },
  { id: 'lip_trill_run', label: '12. 1 9 1 - scala completa fino alla nona' },
  { id: 'scale_4_notes', label: '13. 1234' },
  { id: 'scale_4_notes_5x', label: '14. 1234 - tutte le vocali' },
  { id: 'arpeggio_1358888531', label: '15. 135 888 8531' },
  { id: 'scale_4_notes_2x', label: '16. 1234 - doppio' },
  { id: 'fixed_5_notes', label: '17. 1 1 1 1 1 - nota fissa' },
  { id: 'fixed_3_notes', label: '18. 1 1 1 - nota fissa' },
  { id: 'scale_mmm_me', label: '19. 12345 12345' },
  { id: 'scale_5_gliss_desc', label: '20. 12345 + glissando 5 1' },
  { id: 'arpeggio_13521', label: '21. 135 - 31 (Do-Mi-Sol-Mi-Do)' },
  { id: 'arpeggio_185', label: '22. 1 8 5 - petto, falsetto, misto' },
  { id: 'jump_5_1', label: '23. 111 51' },
  { id: 'arpeggio_55531', label: '24. 555 31' },
  { id: 'ninni_111_333_111', label: '25. 111 333 111' },
  { id: 'jump_13_15_18', label: '26. 1 3, 1 5, 1 8' },
  { id: 'ma_mo_ma_run', label: '27. 1358 12321 1358 - arpeggio composto' },
];

const getScalePatternLabel = (pat: { id: ScalePatternId; label: string }, lang: string) => {
  if (lang === 'en') {
    switch (pat.id) {
      case 'gliss_5_1_desc': return '3. 5 1 - descending 5th glissando';
      case 'siren_glide': return '4. 1 8 1 - octave glissando';
      case 'gliss_1_5_1': return '5. 1 5 1 - 5th glissando';
      case 'gliss_1_5': return '6. 1 5 - short 5th glissando';
      case 'triad': return '8. 135 - triad arpeggio';
      case 'broad_arpeggio': return '9. 1358 - octave arpeggio';
      case 'arpeggio_531_desc': return '10. 531 - descending triad arpeggio';
      case 'arpeggio_compound_desc': return '11. 8531 531 31 - compound arpeggio';
      case 'lip_trill_run': return '12. 1 9 1 - full scale to 9th';
      case 'scale_4_notes_5x': return '14. 1234 - all vowels';
      case 'scale_4_notes_2x': return '16. 1234 - double';
      case 'fixed_5_notes': return '17. 1 1 1 1 1 - sustained note';
      case 'fixed_3_notes': return '18. 1 1 1 - sustained note';
      case 'scale_5_gliss_desc': return '20. 12345 + 5 1 glissando';
      case 'arpeggio_13521': return '21. 135 - 31 (Do-Mi-Sol-Mi-Do)';
      case 'arpeggio_185': return '22. 1 8 5 - chest, falsetto, mix';
      case 'ma_mo_ma_run': return '27. 1358 12321 1358 - compound arpeggio';
      default: return pat.label;
    }
  }
  return pat.label;
};

const CATEGORIES: { id: ExerciseCategory; label: string; subtitle: string }[] = [
  { id: 'SOVT', label: 'SOVT', subtitle: 'Tratto vocale semi-occluso' },
  { id: 'Vocalizzi', label: 'Vocalizzi', subtitle: 'MMM, UUUH, NG, LIP TRILL-NG-NEE' },
  { id: 'Voce Mista', label: 'Voce Mista', subtitle: 'Voce mista e passaggio' },
  { id: 'MIX', label: 'Voce Mista', subtitle: 'Voce mista e passaggio' },
  { id: 'Risonanze', label: 'Risonanze', subtitle: 'Maschera e risonanza' },
  { id: 'Agilità', label: 'Agilità', subtitle: 'Velocità e flessibilità' },
  { id: 'Adduzione', label: 'Adduzione', subtitle: 'Chiusura cordale' },
  { id: 'Articolazione', label: 'Articolazione', subtitle: 'Dizione e articolazione' },
  { id: 'Ancoraggio', label: 'Ancoraggio', subtitle: 'Muscoli dorsali e stabilità' },
  { id: 'Sostegno', label: 'Sostegno', subtitle: 'Gestione respiro e fiato' },
  { id: 'Dinamiche', label: 'Dinamiche', subtitle: 'Controllo volume e intonazione' },
  { id: 'Defaticamento', label: 'Defaticamento', subtitle: 'WEE, UUUH, Lip Thrill e Cannuccia' },
];

const defaultTheme = {
  activeBg: 'bg-gradient-to-r from-sky-900/90 via-cyan-950 to-slate-900 text-white shadow-sky-900/30',
  activeBorder: 'border-sky-400',
  activeRing: 'ring-2 ring-sky-500/50',
  activeText: 'text-sky-200',
  badgeBg: 'bg-sky-950/90 border-sky-700/60',
  badgeText: 'text-sky-300',
  dropdownBorder: 'border-sky-400/70 focus:ring-sky-400 text-sky-200',
  pulseBg: 'bg-sky-400',
};

const CATEGORY_THEMES: Record<ExerciseCategory, typeof defaultTheme> = {
  SOVT: {
    activeBg: 'bg-gradient-to-r from-stone-900 via-rose-950/80 to-slate-900 text-white shadow-[#fa83b5]/30',
    activeBorder: 'border-[#fa83b5]',
    activeRing: 'ring-2 ring-[#fa83b5]/50',
    activeText: 'text-[#fa83b5]',
    badgeBg: 'bg-stone-950/90 border-[#fa83b5]/60',
    badgeText: 'text-[#fa83b5]',
    dropdownBorder: 'border-[#fa83b5]/70 focus:ring-[#fa83b5] text-[#fa83b5]',
    pulseBg: 'bg-[#fa83b5]',
  },
  Vocalizzi: {
    activeBg: 'bg-gradient-to-r from-stone-900 via-rose-950/80 to-slate-900 text-white shadow-[#fa83b5]/30',
    activeBorder: 'border-[#fa83b5]',
    activeRing: 'ring-2 ring-[#fa83b5]/50',
    activeText: 'text-[#fa83b5]',
    badgeBg: 'bg-stone-950/90 border-[#fa83b5]/60',
    badgeText: 'text-[#fa83b5]',
    dropdownBorder: 'border-[#fa83b5]/70 focus:ring-[#fa83b5] text-[#fa83b5]',
    pulseBg: 'bg-[#fa83b5]',
  },
  Defaticamento: {
    activeBg: 'bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white shadow-emerald-900/30',
    activeBorder: 'border-[#34D399]',
    activeRing: 'ring-2 ring-[#34D399]/50',
    activeText: 'text-[#34D399]',
    badgeBg: 'bg-emerald-950/90 border-[#34D399]/60',
    badgeText: 'text-[#34D399]',
    dropdownBorder: 'border-[#34D399]/70 focus:ring-[#34D399] text-[#34D399]',
    pulseBg: 'bg-[#34D399]',
  },
  'Voce Mista': defaultTheme,
  MIX: defaultTheme,
  Risonanze: defaultTheme,
  'Agilità': defaultTheme,
  Adduzione: defaultTheme,
  Articolazione: defaultTheme,
  Ancoraggio: defaultTheme,
  Sostegno: defaultTheme,
  Dinamiche: defaultTheme,
};

const WORKOUT_BLOCK_CONFIGS: {
  id: ExerciseCategory;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  borderColor: string;
  hoverBorderColor: string;
  textColor: string;
  selectBorderColor: string;
  selectFocusRing: string;
  iconColor: string;
  icon: React.ElementType;
}[] = [
  {
    id: 'Voce Mista',
    title: 'VOCE MISTA',
    titleEn: 'MIXED VOICE',
    description: 'Rendi il passaggio tra i registri più fluido e omogeneo.',
    descriptionEn: 'Make the register transitions smooth and homogeneous.',
    borderColor: 'border-cyan-500/50',
    hoverBorderColor: 'hover:border-cyan-400',
    textColor: 'text-cyan-300',
    selectBorderColor: 'border-cyan-500/70 focus:border-cyan-400',
    selectFocusRing: 'focus:ring-cyan-400/40',
    iconColor: 'text-cyan-400',
    icon: Sparkles,
  },
  {
    id: 'Risonanze',
    title: 'RISONANZE',
    titleEn: 'RESONANCE',
    description: 'Allenati a sentire gli spazi di risonanza per avere più consapevolezza della tua voce e sfruttarla al meglio',
    descriptionEn: 'Train to feel resonance spaces to gain vocal awareness and maximize potential.',
    borderColor: 'border-sky-500/50',
    hoverBorderColor: 'hover:border-sky-400',
    textColor: 'text-sky-300',
    selectBorderColor: 'border-sky-500/70 focus:border-sky-400',
    selectFocusRing: 'focus:ring-sky-400/40',
    iconColor: 'text-sky-400',
    icon: Music,
  },
  {
    id: 'Agilità',
    title: 'AGILITÀ',
    titleEn: 'AGILITY',
    description: "Migliora l'agilità della tua voce, questo allegerirà la tua fatica vocale e aumenterà la tua precisione e controllo nei passaggi vocali.",
    descriptionEn: 'Improve vocal agility to lighten fatigue and increase precision in vocal passages.',
    borderColor: 'border-teal-500/50',
    hoverBorderColor: 'hover:border-teal-400',
    textColor: 'text-teal-300',
    selectBorderColor: 'border-teal-500/70 focus:border-teal-400',
    selectFocusRing: 'focus:ring-teal-400/40',
    iconColor: 'text-teal-400',
    icon: Zap,
  },
  {
    id: 'Adduzione',
    title: 'ADDUZIONE',
    titleEn: 'CORD CLOSURE',
    description: 'Favorisci una chiusura cordale efficiente per una voce più stabile e meno ariosa',
    descriptionEn: 'Promote efficient cord closure for a more stable and less breathy voice.',
    borderColor: 'border-indigo-500/50',
    hoverBorderColor: 'hover:border-indigo-400',
    textColor: 'text-indigo-300',
    selectBorderColor: 'border-indigo-500/70 focus:border-indigo-400',
    selectFocusRing: 'focus:ring-indigo-400/40',
    iconColor: 'text-indigo-400',
    icon: Target,
  },
  {
    id: 'Articolazione',
    title: 'ARTICOLAZIONE',
    titleEn: 'ARTICULATION',
    description: "Allena l'articolazione per migliorare la pronuncia, il passaggio del suono e l'apertura degli spazi interni",
    descriptionEn: 'Train articulation to improve pronunciation, sound flow, and internal space opening.',
    borderColor: 'border-blue-500/50',
    hoverBorderColor: 'hover:border-blue-400',
    textColor: 'text-blue-300',
    selectBorderColor: 'border-blue-500/70 focus:border-blue-400',
    selectFocusRing: 'focus:ring-blue-400/40',
    iconColor: 'text-blue-400',
    icon: Mic,
  },
  {
    id: 'Ancoraggio',
    title: 'ANCORAGGIO',
    titleEn: 'ANCHORING',
    description: 'Sostieni la tua voce con l\'uso dei muscoli dorsali per diminuire lo sforzo vocale e rendere più sostenibile l\'uso prolungato della tua voce in maniera sana.',
    descriptionEn: 'Support your voice using back muscles to reduce effort and sustain healthy vocal use.',
    borderColor: 'border-emerald-500/50',
    hoverBorderColor: 'hover:border-emerald-400',
    textColor: 'text-emerald-300',
    selectBorderColor: 'border-emerald-500/70 focus:border-emerald-400',
    selectFocusRing: 'focus:ring-emerald-400/40',
    iconColor: 'text-emerald-400',
    icon: Target,
  },
  {
    id: 'Sostegno',
    title: 'SOSTEGNO',
    titleEn: 'BREATH SUPPORT',
    description: 'Allenati a gestire al meglio respiro e pressione dell\'aria durante il canto.',
    descriptionEn: 'Train to manage breath support and air pressure during singing.',
    borderColor: 'border-amber-500/50',
    hoverBorderColor: 'hover:border-amber-400',
    textColor: 'text-amber-300',
    selectBorderColor: 'border-amber-500/70 focus:border-amber-400',
    selectFocusRing: 'focus:ring-amber-400/40',
    iconColor: 'text-amber-400',
    icon: Volume2,
  },
  {
    id: 'Dinamiche',
    title: 'DINAMICHE',
    titleEn: 'DYNAMICS',
    description: 'Impara a controllare intensità e volume con consapevolezza, questo ti permetterà anche di rendere il passaggio tra i registri più fluido e omogeneo.',
    descriptionEn: 'Learn to control intensity and volume mindfully for smoother register transitions.',
    borderColor: 'border-violet-500/50',
    hoverBorderColor: 'hover:border-violet-400',
    textColor: 'text-violet-300',
    selectBorderColor: 'border-violet-500/70 focus:border-violet-400',
    selectFocusRing: 'focus:ring-violet-400/40',
    iconColor: 'text-violet-400',
    icon: Sliders,
  },
];

const COOLDOWN_BLOCK_CONFIGS = [
  {
    id: 'WEE',
    title: 'WEE',
    titleEn: 'WEE',
    icon: Wind,
    textColor: 'text-emerald-300',
    borderColor: 'border-emerald-500/50',
    hoverBorderColor: 'hover:border-emerald-400',
    selectBorderColor: 'border-emerald-500/70 focus:border-emerald-400',
    selectFocusRing: 'focus:ring-emerald-400/40',
    iconColor: 'text-emerald-400',
    description: 'La sillaba WEE aiuta a rilassare delicatamente la laringe e decomprimere il tratto vocale attraverso glissandi e scale discendenti.',
    descriptionEn: 'The WEE syllable helps gently relax the larynx and decompress the vocal tract with glides and descending scales.',
    filter: (ex: Exercise) => ex.id.includes('wee'),
  },
  {
    id: 'UUH',
    title: 'UUH',
    titleEn: 'UUH',
    icon: Sparkles,
    textColor: 'text-teal-300',
    borderColor: 'border-teal-500/50',
    hoverBorderColor: 'hover:border-teal-400',
    selectBorderColor: 'border-teal-500/70 focus:border-teal-400',
    selectFocusRing: 'focus:ring-teal-400/40',
    iconColor: 'text-teal-400',
    description: "La vocale scura UUH favorisce l'espansione faringea e l'abbassamento fisiologico della laringe per rilasciare ogni tensione residua.",
    descriptionEn: 'The dark UUH vowel promotes pharyngeal opening and physiological laryngeal lowering to release residual tension.',
    filter: (ex: Exercise) => ex.id.includes('uuuh') || ex.id.includes('uuh'),
  },
  {
    id: 'LIP_THRILL_CANNUCCIA',
    title: 'LIP THRILL / CANNUCCIA',
    titleEn: 'LIP THRILL / STRAW',
    icon: Zap,
    textColor: 'text-cyan-300',
    borderColor: 'border-cyan-500/50',
    hoverBorderColor: 'hover:border-cyan-400',
    selectBorderColor: 'border-cyan-500/70 focus:border-cyan-400',
    selectFocusRing: 'focus:ring-cyan-400/40',
    iconColor: 'text-cyan-400',
    description: "Esercizio a tratto vocale semi-occluso (SOVT) per la massima decompressione della mucosa cordale e il ripristino dell'assetto di riposo.",
    descriptionEn: 'Semi-occluded vocal tract (SOVT) exercise for optimal vocal fold decompression and return to resting state.',
    filter: (ex: Exercise) => ex.id.includes('lip_thrill') || ex.id.includes('cannuccia'),
  },
];

export const VocalExercisePlayer: React.FC<VocalExercisePlayerProps> = ({
  notation,
  vocalProfile,
  onExerciseComplete,
  allowedCategories,
  title = 'Riscaldamento Vocale',
  sectionBadge = 'Sezione Riscaldamento',
  onNavigate,
  onGoBack,
  canGoBack,
  backButtonLabel,
}) => {
  const { t, language } = useLanguage();
  const {
    activeRoutineQueue,
    goToNextExercise,
    goToPrevExercise,
    goToStepIndex,
    clearRoutineQueue,
    hasNextExercise,
    hasPrevExercise,
  } = useRoutineQueue();

  const displayCategories = allowedCategories
    ? CATEGORIES.filter((c) => allowedCategories.includes(c.id))
    : CATEGORIES;

  const defaultCategory = displayCategories[0]?.id || 'SOVT';

  const [activeCategory, setActiveCategory] = useState<ExerciseCategory>(defaultCategory);
  const [selectedExercise, setSelectedExercise] = useState<Exercise>(
    VOCAL_EXERCISES.find((ex) => ex.category === defaultCategory) || VOCAL_EXERCISES[0]
  );

  // Sync with active routine queue step when loaded or step changed
  useEffect(() => {
    if (!activeRoutineQueue) return;
    const step = activeRoutineQueue.steps[activeRoutineQueue.currentIndex];
    if (!step) return;

    // Helper to find matching exercise in catalog
    const searchContext = [
      step.title || '',
      step.vowel || '',
      ...(step.items || []),
      step.instruction || ''
    ].join(' ').toLowerCase();

    let matched: Exercise | undefined;

    if (step.exerciseId) {
      matched = VOCAL_EXERCISES.find(ex => ex.id === step.exerciseId);
    }

    if (!matched) {
      matched = VOCAL_EXERCISES.find(ex => {
        const exTitle = ex.title.toLowerCase();
        if (searchContext.includes('lip thrill') || searchContext.includes('lip trill')) {
          if (searchContext.includes('ng') || searchContext.includes('nee') || searchContext.includes('composto') || searchContext.includes('compound')) {
            return ex.id === 'lip_trill_ng_nee_compound';
          }
          return ex.id === 'lip_thrill_warmup';
        }
        if (searchContext.includes('cannuccia')) return ex.id === 'cannuccia_sovt';
        if (searchContext.includes('trillo')) return ex.id === 'trillo_sovt';
        if (searchContext.includes('sovt')) return ex.id === 'lip_thrill_warmup';
        if (searchContext.includes('mum')) return ex.id === 'mix_mum';
        if (searchContext.includes('mam')) {
          if (searchContext.includes('11151') || searchContext.includes('jump')) return ex.id === 'mix_mam_11151';
          return ex.id === 'mix_mam_fissa' || ex.id === 'vocalizzo_mam_fissa';
        }
        if (searchContext.includes('meee') && !searchContext.includes('mmm')) return ex.id === 'mix_meee';
        if (searchContext.includes('mmm') && (searchContext.includes('me') || searchContext.includes('mee'))) {
          return ex.id === 'mmm_me_resonance' || ex.id === 'mmm_vocalizzo';
        }
        if (searchContext.includes('mmm')) return ex.id === 'mmm_vocalizzo';
        if (searchContext.includes('uuuh')) return ex.id === 'uuuh_vocalizzo';
        if (searchContext.includes('wee')) return ex.id === 'wee_defaticamento';
        if (searchContext.includes('gne')) return ex.id === 'gne_squillo' || ex.id === 'gne_gne_gne';
        if (searchContext.includes('nay')) return ex.id === 'mix_nay' || ex.id === 'nay_mix' || ex.id === 'nay_135';
        if (searchContext.includes('mne')) {
          if (searchContext.includes('gliss')) return ex.id === 'mix_mne_111_5_gliss';
          return ex.id === 'mne_nota_fissa' || ex.id === 'mix_mne_fissa';
        }
        if (searchContext.includes('ottava') || searchContext.includes('1 3 5 8')) return ex.id === 'lip_thrill_warmup' || ex.id === 'arpeggio_ottava';
        return exTitle === searchContext;
      });
    }

    if (!matched && step.category) {
      matched = VOCAL_EXERCISES.find(ex => ex.category === step.category);
    }
    if (!matched && allowedCategories && allowedCategories.length > 0) {
      matched = VOCAL_EXERCISES.find(ex => allowedCategories.includes(ex.category));
    }
    if (!matched) {
      matched = VOCAL_EXERCISES[0];
    }

    if (matched) {
      setSelectedExercise(matched);
      setActiveCategory(matched.category);
      setCurrentRootMidi(matched.recommendedStartMidi);
      if (step.vowel) {
        setVowel(step.vowel);
      } else {
        setVowel(matched.defaultVowel);
      }
      if (step.bpm) {
        setBpm(step.bpm);
      } else {
        setBpm(matched.defaultTempoBpm);
      }

      // Determine scale pattern based on step or search context
      let patternToSet: ScalePatternId = step.scalePattern || matched.scalePattern;
      if (!step.scalePattern) {
        if (searchContext.includes('135 888 8531') || searchContext.includes('1358888531') || searchContext.includes('arpeggio_1358888531')) {
          patternToSet = 'arpeggio_1358888531';
        } else if (searchContext.includes('1358 - 13531 - 1358') || searchContext.includes('1358 12321 1358') || searchContext.includes('ma mo ma')) {
          patternToSet = 'ma_mo_ma_run';
        } else if (searchContext.includes('mi me ma mo mu')) {
          patternToSet = 'scale_4_notes_5x';
        } else if (searchContext.includes('glissando ottava') || searchContext.includes('glissato ottava') || searchContext.includes('siren glide') || searchContext.includes('1-8-1')) {
          patternToSet = 'siren_glide';
        } else if (searchContext.includes('glissando quinta') || searchContext.includes('glissato quinta') || searchContext.includes('1-5-1')) {
          patternToSet = 'gliss_1_5_1';
        } else if (searchContext.includes('12344 - 12345') || searchContext.includes('1 2 3 4 5  1 2 3 4 5') || searchContext.includes('scale_mmm_me')) {
          patternToSet = 'scale_mmm_me';
        } else if (searchContext.includes('1234 - 1234') || searchContext.includes('1234 1234') || searchContext.includes('scale_4_notes_2x')) {
          patternToSet = 'scale_4_notes_2x';
        } else if ((searchContext.includes('1234') || searchContext.includes('1 2 3 4')) && !searchContext.includes('12345') && !searchContext.includes('1 2 3 4 5')) {
          patternToSet = 'scale_4_notes';
        } else if (searchContext.includes('11151') || searchContext.includes('1 1 1 5 1') || searchContext.includes('jump_5_1')) {
          patternToSet = 'jump_5_1';
        } else if (searchContext.includes('11111') || searchContext.includes('1 1 1 1 1') || searchContext.includes('fixed_5_notes')) {
          patternToSet = 'fixed_5_notes';
        } else if ((searchContext.includes('1 2 3') || searchContext.includes('123')) && !searchContext.includes('1 2 3 4') && !searchContext.includes('1 2 3 4 5') && !searchContext.includes('1234') && !searchContext.includes('12345')) {
          patternToSet = 'three_notes';
        } else if (searchContext.includes('5 4 3 2 1') || searchContext.includes('54321')) {
          patternToSet = 'scale_5_desc';
        } else if (searchContext.includes('1 2 3 4 5') || searchContext.includes('12345')) {
          patternToSet = 'five_notes';
        } else if (searchContext.includes('1 3 5 8') || searchContext.includes('1358')) {
          patternToSet = 'broad_arpeggio';
        } else if (searchContext.includes('arpeggio composto') || searchContext.includes('arpeggio_compound_desc') || searchContext.includes('compound arpeggio')) {
          patternToSet = 'arpeggio_compound_desc';
        } else if (searchContext.includes('quinta') || searchContext.includes('5 1') || searchContext.includes('5-1')) {
          patternToSet = 'gliss_5_1_desc';
        }
      }
      setSelectedScalePattern(patternToSet);
    }
  }, [activeRoutineQueue?.currentIndex, activeRoutineQueue?.routineName]);

  useEffect(() => {
    if (allowedCategories && allowedCategories.length > 0) {
      if (!allowedCategories.includes(activeCategory)) {
        const firstCat = allowedCategories[0];
        setActiveCategory(firstCat);
        const firstEx = VOCAL_EXERCISES.find((ex) => ex.category === firstCat);
        if (firstEx) {
          setSelectedExercise(firstEx);
          setCurrentRootMidi(firstEx.recommendedStartMidi);
          setVowel(firstEx.defaultVowel);
          setBpm(firstEx.defaultTempoBpm);
          setSelectedScalePattern(firstEx.scalePattern);
        }
      }
    }
  }, [allowedCategories]);
  const [currentRootMidi, setCurrentRootMidi] = useState<number>(
    selectedExercise.recommendedStartMidi
  );
  const [vowel, setVowel] = useState<string>(selectedExercise.defaultVowel);
  const [bpm, setBpm] = useState<number>(selectedExercise.defaultTempoBpm);
  const [autoTranspose, setAutoTranspose] = useState<boolean>(true);
  const [transposeDirection, setTransposeDirection] = useState<'up' | 'down'>('up');
  const [transposeStep, setTransposeStep] = useState<number>(1); // 1 = semitono, 2 = 1 tono
  const [includeMetronome, setIncludeMetronome] = useState<boolean>(true);
  const [accompanimentMode, setAccompanimentMode] = useState<'all_notes' | 'chord_only'>('all_notes');
  const [selectedScalePattern, setSelectedScalePattern] = useState<ScalePatternId>(selectedExercise.scalePattern);
  const [pianoVolume, setPianoVolume] = useState<number>(0.9);
  const [metronomeVolume, setMetronomeVolume] = useState<number>(0.85);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState<number | null>(null);
  const [activeMidi, setActiveMidi] = useState<number | null>(null);
  const [currentCycleStep, setCurrentCycleStep] = useState<number>(0);
  const [totalCycleStepsCount, setTotalCycleStepsCount] = useState<number>(16);
  const [cycleCount, setCycleCount] = useState<number>(0);
  const [activeTip, setActiveTip] = useState<string | null>(null);
  const [showAudioControls, setShowAudioControls] = useState<boolean>(false);
  const cycleCountRef = useRef<number>(0);

  // Microphone Pitch Detector
  const [micActive, setMicActive] = useState<boolean>(false);
  const [livePitch, setLivePitch] = useState<PitchDetectionResult | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const pitchDetectorRef = useRef<PitchDetector | null>(null);

  // Stats
  const startTimeRef = useRef<number | null>(null);

  // Refs for smooth sequencer timing without restarting timer on key change
  const currentRootMidiRef = useRef(currentRootMidi);
  useEffect(() => {
    currentRootMidiRef.current = currentRootMidi;
  }, [currentRootMidi]);

  const transposeDirectionRef = useRef(transposeDirection);
  useEffect(() => {
    transposeDirectionRef.current = transposeDirection;
  }, [transposeDirection]);

  const transposeStepRef = useRef(transposeStep);
  useEffect(() => {
    transposeStepRef.current = transposeStep;
  }, [transposeStep]);

  const pianoVolumeRef = useRef(pianoVolume);
  useEffect(() => {
    pianoVolumeRef.current = pianoVolume;
  }, [pianoVolume]);

  const metronomeVolumeRef = useRef(metronomeVolume);
  useEffect(() => {
    metronomeVolumeRef.current = metronomeVolume;
  }, [metronomeVolume]);

  const vowelRef = useRef(vowel);
  useEffect(() => {
    vowelRef.current = vowel;
  }, [vowel]);

  const handleCategoryChange = (cat: ExerciseCategory) => {
    setIsPlaying(false);
    setActiveCategory(cat);
    const firstOfCat = VOCAL_EXERCISES.find((ex) => ex.category === cat);
    if (firstOfCat) {
      setSelectedExercise(firstOfCat);
      const targetPattern = firstOfCat.allowedPatterns
        ? (firstOfCat.allowedPatterns.includes(firstOfCat.scalePattern) ? firstOfCat.scalePattern : firstOfCat.allowedPatterns[0])
        : firstOfCat.scalePattern;
      setSelectedScalePattern(targetPattern);
      if (firstOfCat.defaultVowel) setVowel(firstOfCat.defaultVowel);
    }
  };

  // When exercise changes, reset defaults
  useEffect(() => {
    setCurrentRootMidi(
      vocalProfile
        ? Math.max(45, Math.min(vocalProfile.lowestMidi + 5, 65))
        : selectedExercise.recommendedStartMidi
    );
    setVowel(selectedExercise.defaultVowel);
    setBpm(selectedExercise.defaultTempoBpm);

    const allowed = selectedExercise.allowedPatterns;
    if (allowed && allowed.length > 0) {
      if (!allowed.includes(selectedScalePattern)) {
        const nextPattern = allowed.includes(selectedExercise.scalePattern)
          ? selectedExercise.scalePattern
          : allowed[0];
        setSelectedScalePattern(nextPattern);
      }
    } else {
      setSelectedScalePattern(selectedExercise.scalePattern);
    }
  }, [selectedExercise, vocalProfile]);

  // Handle Microphone toggling
  useEffect(() => {
    if (micActive) {
      if (!pitchDetectorRef.current) {
        pitchDetectorRef.current = new PitchDetector();
      }
      pitchDetectorRef.current.start(
        (pitch) => setLivePitch(pitch),
        (err) => {
          setMicError(err);
          setMicActive(false);
        }
      );
    } else {
      if (pitchDetectorRef.current) {
        pitchDetectorRef.current.stop();
      }
      setLivePitch(null);
    }

    return () => {
      if (pitchDetectorRef.current) {
        pitchDetectorRef.current.stop();
      }
    };
  }, [micActive]);

  // Compute scale pattern notes for current root note
  const offsets = getScaleOffsets(selectedScalePattern);
  const currentScaleMidis = offsets.map((off) => currentRootMidi + off);

  // Helper to calculate upcoming root midi and transpose direction
  const computeNextRootMidi = (current: number, dir: 'up' | 'down') => {
    if (!autoTranspose) return { nextMidi: current, nextDir: dir };
    const step = transposeStepRef.current;
    if (dir === 'up') {
      const candidate = current + step;
      const maxMidi = vocalProfile ? vocalProfile.highestMidi - 5 : selectedExercise.recommendedEndMidi;
      if (candidate >= maxMidi) {
        return { nextMidi: current - step, nextDir: 'down' as const };
      }
      return { nextMidi: candidate, nextDir: 'up' as const };
    } else {
      const candidate = current - step;
      const minMidi = vocalProfile ? vocalProfile.lowestMidi : selectedExercise.recommendedStartMidi;
      if (candidate <= minMidi) {
        return { nextMidi: current + step, nextDir: 'up' as const };
      }
      return { nextMidi: candidate, nextDir: 'down' as const };
    }
  };

  // Exercise Scale Playback Loop (2-measure cycle in ottavi / eighth notes)
  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;

    if (!isPlaying) {
      setCurrentNoteIndex(null);
      setActiveMidi(null);
      setCurrentCycleStep(0);
      return;
    }

    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    // Check time signatures
    const is68Time = ['broad_arpeggio', 'arpeggio_1358888531'].includes(selectedScalePattern);
    const is64Time = ['lip_trill_run', 'scale_5_desc', 'three_notes', 'gliss_5_1_desc', 'triad'].includes(selectedScalePattern);

    // Eighth note duration (ottavi / crome):
    // In 4/4, 6/4 time: (30 / bpm) * 1000 ms (bpm = quarter notes)
    // In 6/8 time: (20 / bpm) * 1000 ms (bpm = dotted-quarter compound beats)
    const stepDurationMs = is68Time ? (20 / bpm) * 1000 : (30 / bpm) * 1000;
    
    let totalCycleSteps = 16;
    if (selectedScalePattern === 'broad_arpeggio') {
      totalCycleSteps = 12; // 2 battute in 6/8 (12 ottavi)
    } else if (selectedScalePattern === 'arpeggio_1358888531') {
      totalCycleSteps = 15; // 2 battute + 3 ottavi in 6/8 (15 ottavi)
    } else if (selectedScalePattern === 'lip_trill_run' || selectedScalePattern === 'scale_mmm_me') {
      totalCycleSteps = 24; // 2 battute in 6/4 o scala doppia
    } else if (['scale_5_desc', 'three_notes', 'gliss_5_1_desc', 'triad', 'arpeggio_13521', 'jump_5_1', 'arpeggio_55531', 'scale_5_gliss_desc', 'fixed_5_notes', 'ninni_111_333_111', 'jump_13_15_18'].includes(selectedScalePattern)) {
      totalCycleSteps = 12; // 1 battuta in 6/4 (12 crome / 6 quarti)
    } else if (['arpeggio_531_desc', 'fixed_3_notes', 'arpeggio_185'].includes(selectedScalePattern)) {
      totalCycleSteps = 10; // 1 battuta in 5/4 (10 crome / 5 quarti)
    } else if (selectedScalePattern === 'scale_4_notes_2x') {
      totalCycleSteps = 24; // 3 battute in 4/4 (24 crome)
    } else if (selectedScalePattern === 'scale_4_notes_5x') {
      totalCycleSteps = 48; // 6 battute in 4/4 (48 crome)
    }

    let step = 0;

    const playStep = () => {
      // 1. Check if we reached end of cycle
      if (step >= totalCycleSteps) {
        step = 0;
        cycleCountRef.current += 1;
        const newCycle = cycleCountRef.current;
        setCycleCount(newCycle);

        if (newCycle > 0 && newCycle % 5 === 0) {
          const tipsList = language === 'en' ? VOCAL_TIPS_EN : VOCAL_TIPS;
          const tipIdx = (Math.floor(newCycle / 5) - 1) % tipsList.length;
          setActiveTip(tipsList[tipIdx]);
        } else if (newCycle % 5 === 2) {
          setActiveTip(null);
        }

        if (autoTranspose) {
          const current = currentRootMidiRef.current;
          const dir = transposeDirectionRef.current;
          const { nextMidi, nextDir } = computeNextRootMidi(current, dir);
          currentRootMidiRef.current = nextMidi;
          transposeDirectionRef.current = nextDir;
          setCurrentRootMidi(nextMidi);
          setTransposeDirection(nextDir);
        }
      }

      setCurrentCycleStep(step);
      setTotalCycleStepsCount(totalCycleSteps);

      const activeRootMidi = currentRootMidiRef.current;
      const activeDir = transposeDirectionRef.current;
      const scaleOffsets = getScaleOffsets(selectedScalePattern);
      const scaleMidis = scaleOffsets.map((off) => activeRootMidi + off);

      // Compute next midi for transition chord
      const { nextMidi } = computeNextRootMidi(activeRootMidi, activeDir);

      let chordStep1 = 10;
      let chordStep2 = 12;
      if (is68Time) {
        chordStep1 = 8;
        chordStep2 = 9;
      } else if (selectedScalePattern === 'lip_trill_run' || selectedScalePattern === 'scale_mmm_me') {
        chordStep1 = 18;
        chordStep2 = 20;
      } else if (selectedScalePattern === 'ninni_111_333_111') {
        chordStep1 = 9;  // Step 9 (dopo le 9 note 0..8)
        chordStep2 = 10; // Step 10
      } else if (selectedScalePattern === 'ma_mo_ma_run') {
        chordStep1 = 13; // Step 13 (dopo le 13 note 0..12)
        chordStep2 = 14; // Step 14
      } else if (['scale_5_desc', 'three_notes', 'gliss_5_1_desc', 'triad', 'arpeggio_13521', 'jump_5_1', 'arpeggio_55531', 'scale_5_gliss_desc', 'fixed_5_notes'].includes(selectedScalePattern)) {
        chordStep1 = 6;  // Quarto 4 del giro (step 6)
        chordStep2 = 8;  // Quarto 5 del giro (step 8)
      } else if (['arpeggio_531_desc', 'fixed_3_notes', 'arpeggio_185'].includes(selectedScalePattern)) {
        chordStep1 = 4;  // Quarto 3 del giro (step 4)
        chordStep2 = 6;  // Quarto 4 del giro (step 6)
      }

      // Handle glissando and special step mapping
      const isGliss = ['siren_glide', 'gliss_5_1_desc', 'gliss_1_5_1', 'gliss_1_5'].includes(selectedScalePattern);

      // Helper functions for scaled volume output
      const playNote = (midi: number, durationSec: number) => {
        playPianoNote(midi, durationSec, Math.min(1.0, 0.95 * pianoVolumeRef.current));
      };
      const playChord = (rootMidi: number, durationSec: number) => {
        playPianoChord(rootMidi, durationSec, Math.min(1.0, 0.90 * pianoVolumeRef.current));
      };
      const playChordSoft = (rootMidi: number, durationSec: number) => {
        playPianoChord(rootMidi, durationSec, Math.min(1.0, 0.85 * pianoVolumeRef.current));
      };

      if (isGliss) {
        if (selectedScalePattern === 'gliss_5_1_desc') {
          // Ex 3: glissato discendente in 6/4 (12 crome / 6 quarti)
          // Primo quarto (step 0): Sol con durata di 2 quarti (steps 0, 1, 2, 3)
          // Terzo quarto (step 4): Do con durata di 1 quarto (steps 4, 5)
          // Quarto quarto (step 6 = chordStep1): accordo della tonalità in corso con durata di 1 quarto (steps 6, 7)
          // Quinto e sesto quarto (step 8 = chordStep2): accordo della tonalità successiva con durata di 2 quarti (steps 8, 9, 10, 11)
          if (step === 0) {
            setCurrentNoteIndex(0);
            setActiveMidi(activeRootMidi + 7);
            if (accompanimentMode === 'all_notes') {
              playNote(activeRootMidi + 7, (stepDurationMs * 3.9) / 1000);
            } else if (accompanimentMode === 'chord_only') {
              playChord(activeRootMidi, (stepDurationMs * 3.9) / 1000);
            }
          } else if (step === 4) {
            setCurrentNoteIndex(1);
            setActiveMidi(activeRootMidi);
            if (accompanimentMode === 'all_notes') {
              playNote(activeRootMidi, (stepDurationMs * 1.95) / 1000);
            }
          } else if (step === chordStep1) {
            setCurrentNoteIndex(null);
            setActiveMidi(activeRootMidi);
            if (accompanimentMode !== 'silent') {
              playChordSoft(activeRootMidi, (stepDurationMs * 1.95) / 1000);
            }
          } else if (step === chordStep2) {
            setCurrentNoteIndex(null);
            setActiveMidi(nextMidi);
            if (accompanimentMode !== 'silent') {
              playChord(nextMidi, (stepDurationMs * 3.9) / 1000);
            }
          } else if (step > 4 && step < chordStep1) {
            // sustain state
          } else if (step > chordStep2) {
            setCurrentNoteIndex(null);
            setActiveMidi(null);
          }
        } else if (selectedScalePattern === 'siren_glide') {
          // Ex 4: Glissato di ottava in 4/4 (16 crome / 8 quarti, 2 battute)
          // 1° quarto (step 0): Do basso con durata di 2 quarti (steps 0..3)
          // 3° quarto (step 4): Do ottava superiore con durata di 2 quarti (steps 4..7)
          // 5° quarto (step 8): Do basso con durata di 1 quarto (steps 8..9)
          // 6° quarto (step 10 = chordStep1): Accordo della tonalità in corso con durata di 1 quarto (steps 10..11)
          // 7° quarto (step 12 = chordStep2): Accordo della tonalità successiva con durata di 2 quarti (steps 12..15)
          if (step === 0) {
            setCurrentNoteIndex(0);
            setActiveMidi(activeRootMidi);
            if (accompanimentMode === 'all_notes') {
              playNote(activeRootMidi, (stepDurationMs * 3.9) / 1000);
            } else if (accompanimentMode === 'chord_only') {
              playChord(activeRootMidi, (stepDurationMs * 3.9) / 1000);
            }
          } else if (step === 4) {
            setCurrentNoteIndex(1);
            setActiveMidi(activeRootMidi + 12);
            if (accompanimentMode === 'all_notes') {
              playNote(activeRootMidi + 12, (stepDurationMs * 3.9) / 1000);
            }
          } else if (step === 8) {
            setCurrentNoteIndex(2);
            setActiveMidi(activeRootMidi);
            if (accompanimentMode === 'all_notes') {
              playNote(activeRootMidi, (stepDurationMs * 1.95) / 1000);
            }
          } else if (step === chordStep1) {
            setCurrentNoteIndex(null);
            setActiveMidi(activeRootMidi);
            if (accompanimentMode !== 'silent') {
              playChordSoft(activeRootMidi, (stepDurationMs * 1.95) / 1000);
            }
          } else if (step === chordStep2) {
            setCurrentNoteIndex(null);
            setActiveMidi(nextMidi);
            if (accompanimentMode !== 'silent') {
              playChord(nextMidi, (stepDurationMs * 3.9) / 1000);
            }
          } else if (step > 8 && step < chordStep1) {
            // sustain state
          } else if (step > chordStep2) {
            setCurrentNoteIndex(null);
            setActiveMidi(null);
          }
        } else if (selectedScalePattern === 'gliss_1_5_1') {
          // Ex 5: Glissato 1 5 1 in 4/4 (16 crome / 8 quarti, 2 battute)
          // 1° quarto (step 0): Do con durata di 2 quarti (steps 0..3)
          // 3° quarto (step 4): Sol con durata di 2 quarti (steps 4..7)
          // 5° quarto (step 8): Do con durata di 1 quarto (steps 8..9)
          // 6° quarto (step 10 = chordStep1): Accordo della tonalità in corso con durata di 1 quarto (steps 10..11)
          // 7° quarto (step 12 = chordStep2): Accordo della tonalità successiva con durata di 2 quarti (steps 12..15)
          if (step === 0) {
            setCurrentNoteIndex(0);
            setActiveMidi(activeRootMidi);
            if (accompanimentMode === 'all_notes') {
              playNote(activeRootMidi, (stepDurationMs * 3.9) / 1000);
            } else if (accompanimentMode === 'chord_only') {
              playChord(activeRootMidi, (stepDurationMs * 3.9) / 1000);
            }
          } else if (step === 4) {
            setCurrentNoteIndex(1);
            setActiveMidi(activeRootMidi + 7);
            if (accompanimentMode === 'all_notes') {
              playNote(activeRootMidi + 7, (stepDurationMs * 3.9) / 1000);
            }
          } else if (step === 8) {
            setCurrentNoteIndex(2);
            setActiveMidi(activeRootMidi);
            if (accompanimentMode === 'all_notes') {
              playNote(activeRootMidi, (stepDurationMs * 1.95) / 1000);
            }
          } else if (step === chordStep1) {
            setCurrentNoteIndex(null);
            setActiveMidi(activeRootMidi);
            if (accompanimentMode !== 'silent') {
              playChordSoft(activeRootMidi, (stepDurationMs * 1.95) / 1000);
            }
          } else if (step === chordStep2) {
            setCurrentNoteIndex(null);
            setActiveMidi(nextMidi);
            if (accompanimentMode !== 'silent') {
              playChord(nextMidi, (stepDurationMs * 3.9) / 1000);
            }
          } else if (step > 8 && step < chordStep1) {
            // sustain state
          } else if (step > chordStep2) {
            setCurrentNoteIndex(null);
            setActiveMidi(null);
          }
        } else if (selectedScalePattern === 'gliss_1_5') {
          // Ex 6: Glissato quinta corta in 4/4 (16 crome / 8 quarti, 2 battute)
          // 1° quarto (step 0): Do con durata di 2 quarti (steps 0..3)
          // 3° quarto (step 4): Sol con durata di 3 quarti (steps 4..9)
          // 6° quarto (step 10 = chordStep1): Accordo della tonalità in corso con durata di 1 quarto (steps 10..11)
          // 7° quarto (step 12 = chordStep2): Accordo della tonalità successiva con durata di 2 quarti (steps 12..15)
          if (step === 0) {
            setCurrentNoteIndex(0);
            setActiveMidi(activeRootMidi);
            if (accompanimentMode === 'all_notes') {
              playNote(activeRootMidi, (stepDurationMs * 3.9) / 1000);
            } else if (accompanimentMode === 'chord_only') {
              playChord(activeRootMidi, (stepDurationMs * 3.9) / 1000);
            }
          } else if (step === 4) {
            setCurrentNoteIndex(1);
            setActiveMidi(activeRootMidi + 7);
            if (accompanimentMode === 'all_notes') {
              playNote(activeRootMidi + 7, (stepDurationMs * 5.85) / 1000);
            }
          } else if (step === chordStep1) {
            setCurrentNoteIndex(null);
            setActiveMidi(activeRootMidi);
            if (accompanimentMode !== 'silent') {
              playChordSoft(activeRootMidi, (stepDurationMs * 1.95) / 1000);
            }
          } else if (step === chordStep2) {
            setCurrentNoteIndex(null);
            setActiveMidi(nextMidi);
            if (accompanimentMode !== 'silent') {
              playChord(nextMidi, (stepDurationMs * 3.9) / 1000);
            }
          } else if (step > 4 && step < chordStep1) {
            // sustain state
          } else if (step > chordStep2) {
            setCurrentNoteIndex(null);
            setActiveMidi(null);
          }
        }
      } else if (is68Time) {
        // Ex 9: broad_arpeggio (2 battute in 6/8 = 12 ottavi, steps 0..11)
        if (step < scaleMidis.length) {
          // steps 0..6: Do, Mi, Sol, Do8, Sol, Mi, Do
          const noteMidi = scaleMidis[step];
          setCurrentNoteIndex(step);
          setActiveMidi(noteMidi);
          if (accompanimentMode === 'all_notes') {
            const isHeldFinal = step === scaleMidis.length - 1;
            playNote(
              noteMidi,
              (stepDurationMs * (isHeldFinal ? 2.8 : 0.95)) / 1000
            );
          } else if (accompanimentMode === 'chord_only' && step === 0) {
            playChord(activeRootMidi, 1.4);
          }
        } else if (step === 8) {
          // 3° ottavo del primo quarto puntato del 2° giro: accordo battuta in corso
          setCurrentNoteIndex(null);
          setActiveMidi(activeRootMidi);
          playChordSoft(activeRootMidi, (stepDurationMs * 1) / 1000);
        } else if (step === 9) {
          // 1° ottavo del secondo quarto puntato del 2° giro: accordo successivo (dura i 3 ottavi finali)
          setCurrentNoteIndex(null);
          setActiveMidi(nextMidi);
          playChord(nextMidi, (stepDurationMs * 3) / 1000);
        } else {
          setCurrentNoteIndex(null);
          setActiveMidi(null);
        }
      } else if (selectedScalePattern === 'scale_5_desc') {
        // Ex 2: in 6/4 (12 crome / ottavi, steps 0..11)
        // 1° quarto (steps 0, 1): Sol (step 0), Fa (step 1) - 2 ottavi
        // 2° quarto (steps 2, 3): Mi (step 2), Re (step 3) - 2 ottavi
        // 3° quarto (steps 4, 5): Do (step 4, dura 1 quarto = 2 ottavi)
        // 4° quarto (steps 6, 7): accordo dell'esercizio in corso
        // 5° e 6° quarto (steps 8, 9, 10, 11): accordo della tonalità successiva (dura 2 quarti)
        if (step === 0) {
          setCurrentNoteIndex(0);
          setActiveMidi(scaleMidis[0]);
          if (accompanimentMode === 'all_notes') {
            playNote(scaleMidis[0], (stepDurationMs * 0.95) / 1000);
          } else if (accompanimentMode === 'chord_only') {
            playChord(activeRootMidi, 1.4);
          }
        } else if (step === 1) {
          setCurrentNoteIndex(1);
          setActiveMidi(scaleMidis[1]);
          if (accompanimentMode === 'all_notes') {
            playNote(scaleMidis[1], (stepDurationMs * 0.95) / 1000);
          }
        } else if (step === 2) {
          setCurrentNoteIndex(2);
          setActiveMidi(scaleMidis[2]);
          if (accompanimentMode === 'all_notes') {
            playNote(scaleMidis[2], (stepDurationMs * 0.95) / 1000);
          }
        } else if (step === 3) {
          setCurrentNoteIndex(3);
          setActiveMidi(scaleMidis[3]);
          if (accompanimentMode === 'all_notes') {
            playNote(scaleMidis[3], (stepDurationMs * 0.95) / 1000);
          }
        } else if (step === 4) {
          setCurrentNoteIndex(4);
          setActiveMidi(scaleMidis[4]);
          if (accompanimentMode === 'all_notes') {
            playNote(scaleMidis[4], (stepDurationMs * 1.95) / 1000);
          }
        } else if (step === 6) {
          setCurrentNoteIndex(null);
          setActiveMidi(activeRootMidi);
          if (accompanimentMode !== 'silent') {
            playChordSoft(activeRootMidi, (stepDurationMs * 1.95) / 1000);
          }
        } else if (step === 8) {
          setCurrentNoteIndex(null);
          setActiveMidi(nextMidi);
          if (accompanimentMode !== 'silent') {
            playChord(nextMidi, (stepDurationMs * 3.9) / 1000);
          }
        }
      } else if (['three_notes', 'triad'].includes(selectedScalePattern)) {
        // Ex 7 (three_notes: Do Re Mi Re Do) & Ex 8 (triad: Do Mi Sol Mi Do)
        // 6/4 (12 crome / ottavi, 1 battuta)
        // 1° quarto (steps 0, 1): note 0 e note 1 (ottavi)
        // 2° quarto (steps 2, 3): note 2 e note 3 (ottavi)
        // 3° quarto (steps 4, 5): note 4 (Do, dura 1 quarto = 2 ottavi)
        // 4° quarto (steps 6, 7): accordo tonalità in corso (dura 1 quarto = 2 ottavi)
        // 5° e 6° quarto (steps 8, 9, 10, 11): accordo tonalità successiva (dura 2 quarti = 4 ottavi)
        if (step === 0) {
          setCurrentNoteIndex(0);
          setActiveMidi(scaleMidis[0]);
          if (accompanimentMode === 'all_notes') {
            playNote(scaleMidis[0], (stepDurationMs * 0.95) / 1000);
          } else if (accompanimentMode === 'chord_only') {
            playChord(activeRootMidi, 1.4);
          }
        } else if (step === 1) {
          setCurrentNoteIndex(1);
          setActiveMidi(scaleMidis[1]);
          if (accompanimentMode === 'all_notes') {
            playNote(scaleMidis[1], (stepDurationMs * 0.95) / 1000);
          }
        } else if (step === 2) {
          setCurrentNoteIndex(2);
          setActiveMidi(scaleMidis[2]);
          if (accompanimentMode === 'all_notes') {
            playNote(scaleMidis[2], (stepDurationMs * 0.95) / 1000);
          }
        } else if (step === 3) {
          setCurrentNoteIndex(3);
          setActiveMidi(scaleMidis[3]);
          if (accompanimentMode === 'all_notes') {
            playNote(scaleMidis[3], (stepDurationMs * 0.95) / 1000);
          }
        } else if (step === 4) {
          setCurrentNoteIndex(4);
          setActiveMidi(scaleMidis[4]);
          if (accompanimentMode === 'all_notes') {
            playNote(scaleMidis[4], (stepDurationMs * 1.95) / 1000);
          }
        } else if (step === chordStep1) {
          setCurrentNoteIndex(null);
          setActiveMidi(activeRootMidi);
          if (accompanimentMode !== 'silent') {
            playChordSoft(activeRootMidi, (stepDurationMs * 1.95) / 1000);
          }
        } else if (step === chordStep2) {
          setCurrentNoteIndex(null);
          setActiveMidi(nextMidi);
          if (accompanimentMode !== 'silent') {
            playChord(nextMidi, (stepDurationMs * 3.9) / 1000);
          }
        }
      } else if (selectedScalePattern === 'arpeggio_531_desc') {
        // Ex 10: arpeggio discendente 531 in 5/4 (10 crome / 5 quarti, 1 battuta)
        // 1° quarto (steps 0, 1): Sol (step 0, 1 ottavo) e Mi (step 1, 1 ottavo)
        // 2° quarto (steps 2, 3): Do (step 2, dura 1 quarto = 2 ottavi)
        // 3° quarto (steps 4, 5 = chordStep1): Accordo tonalità in corso (dura 1 quarto = 2 ottavi)
        // 4° e 5° quarto (steps 6, 7, 8, 9 = chordStep2): Accordo tonalità successiva (dura 2 quarti = 4 ottavi)
        if (step === 0) {
          setCurrentNoteIndex(0);
          setActiveMidi(scaleMidis[0]);
          if (accompanimentMode === 'all_notes') {
            playNote(scaleMidis[0], (stepDurationMs * 0.95) / 1000);
          } else if (accompanimentMode === 'chord_only') {
            playChord(activeRootMidi, 1.4);
          }
        } else if (step === 1) {
          setCurrentNoteIndex(1);
          setActiveMidi(scaleMidis[1]);
          if (accompanimentMode === 'all_notes') {
            playNote(scaleMidis[1], (stepDurationMs * 0.95) / 1000);
          }
        } else if (step === 2) {
          setCurrentNoteIndex(2);
          setActiveMidi(scaleMidis[2]);
          if (accompanimentMode === 'all_notes') {
            playNote(scaleMidis[2], (stepDurationMs * 1.95) / 1000);
          }
        } else if (step === chordStep1) {
          setCurrentNoteIndex(null);
          setActiveMidi(activeRootMidi);
          if (accompanimentMode !== 'silent') {
            playChordSoft(activeRootMidi, (stepDurationMs * 1.95) / 1000);
          }
        } else if (step === chordStep2) {
          setCurrentNoteIndex(null);
          setActiveMidi(nextMidi);
          if (accompanimentMode !== 'silent') {
            playChord(nextMidi, (stepDurationMs * 3.9) / 1000);
          }
        }
      } else if (selectedScalePattern === 'scale_4_notes') {
        // Ex 13: scala a 4 note 1234 321 in 4/4 (16 crome / 8 quarti, 2 battute)
        // Prima battuta (steps 0..7):
        // 1° quarto (steps 0, 1): Do (step 0, 1 ottavo), Re (step 1, 1 ottavo)
        // 2° quarto (steps 2, 3): Mi (step 2, 1 ottavo), Fa (step 3, 1 ottavo)
        // 3° quarto (steps 4, 5): Mi (step 4, 1 ottavo), Re (step 5, 1 ottavo)
        // 4° quarto (steps 6, 7): Do (step 6, dura 1 quarto = 2 ottavi)
        // Seconda battuta (steps 8..15):
        // 1° quarto (steps 8, 9): Accordo del giro in corso (dura 1 quarto = 2 ottavi)
        // 2° quarto (steps 10, 11): Accordo del giro in corso (dura 1 quarto = 2 ottavi)
        // 3° e 4° quarto (steps 12, 13, 14, 15): Accordo della tonalità successiva (dura 2 quarti = 4 ottavi)
        if (step === 0) {
          setCurrentNoteIndex(0);
          setActiveMidi(scaleMidis[0]);
          if (accompanimentMode === 'all_notes') {
            playNote(scaleMidis[0], (stepDurationMs * 0.95) / 1000);
          } else if (accompanimentMode === 'chord_only') {
            playChord(activeRootMidi, 1.4);
          }
        } else if (step === 1) {
          setCurrentNoteIndex(1);
          setActiveMidi(scaleMidis[1]);
          if (accompanimentMode === 'all_notes') {
            playNote(scaleMidis[1], (stepDurationMs * 0.95) / 1000);
          }
        } else if (step === 2) {
          setCurrentNoteIndex(2);
          setActiveMidi(scaleMidis[2]);
          if (accompanimentMode === 'all_notes') {
            playNote(scaleMidis[2], (stepDurationMs * 0.95) / 1000);
          }
        } else if (step === 3) {
          setCurrentNoteIndex(3);
          setActiveMidi(scaleMidis[3]);
          if (accompanimentMode === 'all_notes') {
            playNote(scaleMidis[3], (stepDurationMs * 0.95) / 1000);
          }
        } else if (step === 4) {
          setCurrentNoteIndex(4);
          setActiveMidi(scaleMidis[4]);
          if (accompanimentMode === 'all_notes') {
            playNote(scaleMidis[4], (stepDurationMs * 0.95) / 1000);
          }
        } else if (step === 5) {
          setCurrentNoteIndex(5);
          setActiveMidi(scaleMidis[5]);
          if (accompanimentMode === 'all_notes') {
            playNote(scaleMidis[5], (stepDurationMs * 0.95) / 1000);
          }
        } else if (step === 6) {
          setCurrentNoteIndex(6);
          setActiveMidi(scaleMidis[6]);
          if (accompanimentMode === 'all_notes') {
            playNote(scaleMidis[6], (stepDurationMs * 1.95) / 1000);
          }
        } else if (step === 8 || step === 10) {
          setCurrentNoteIndex(null);
          setActiveMidi(activeRootMidi);
          if (accompanimentMode !== 'silent') {
            playChordSoft(activeRootMidi, (stepDurationMs * 1.95) / 1000);
          }
        } else if (step === 12) {
          setCurrentNoteIndex(null);
          setActiveMidi(nextMidi);
          if (accompanimentMode !== 'silent') {
            playChord(nextMidi, (stepDurationMs * 3.9) / 1000);
          }
        }
      } else if (selectedScalePattern === 'scale_4_notes_5x') {
        // Ex 14: scala a 4 note 1234 321 x 5 in 4/4 (48 crome / 24 quarti, 6 battute)
        // Battute 1-5 (steps 0..39):
        // Per ciascuna battuta: Do Re (1° quarto), Mi Fa (2° quarto), Mi Re (3° quarto), Do (4° quarto)
        // Battuta 6 (steps 40..47):
        // 1° quarto (step 40): Accordo della tonalità in corso (dura 1 quarto = 2 ottavi)
        // 2° quarto (step 42): Accordo della tonalità in corso (dura 1 quarto = 2 ottavi)
        // 3° e 4° quarto (step 44): Accordo della tonalità successiva (dura 2 quarti = 4 ottavi)
        if (step < 40) {
          const subStep = step % 8;
          if (subStep === 0) {
            setCurrentNoteIndex(0);
            setActiveMidi(scaleMidis[0]);
            if (accompanimentMode === 'all_notes') {
              playNote(scaleMidis[0], (stepDurationMs * 0.95) / 1000);
            } else if (accompanimentMode === 'chord_only') {
              playChord(activeRootMidi, 1.4);
            }
          } else if (subStep === 1) {
            setCurrentNoteIndex(1);
            setActiveMidi(scaleMidis[1]);
            if (accompanimentMode === 'all_notes') {
              playNote(scaleMidis[1], (stepDurationMs * 0.95) / 1000);
            }
          } else if (subStep === 2) {
            setCurrentNoteIndex(2);
            setActiveMidi(scaleMidis[2]);
            if (accompanimentMode === 'all_notes') {
              playNote(scaleMidis[2], (stepDurationMs * 0.95) / 1000);
            }
          } else if (subStep === 3) {
            setCurrentNoteIndex(3);
            setActiveMidi(scaleMidis[3]);
            if (accompanimentMode === 'all_notes') {
              playNote(scaleMidis[3], (stepDurationMs * 0.95) / 1000);
            }
          } else if (subStep === 4) {
            setCurrentNoteIndex(4);
            setActiveMidi(scaleMidis[4]);
            if (accompanimentMode === 'all_notes') {
              playNote(scaleMidis[4], (stepDurationMs * 0.95) / 1000);
            }
          } else if (subStep === 5) {
            setCurrentNoteIndex(5);
            setActiveMidi(scaleMidis[5]);
            if (accompanimentMode === 'all_notes') {
              playNote(scaleMidis[5], (stepDurationMs * 0.95) / 1000);
            }
          } else if (subStep === 6) {
            setCurrentNoteIndex(6);
            setActiveMidi(scaleMidis[6]);
            if (accompanimentMode === 'all_notes') {
              playNote(scaleMidis[6], (stepDurationMs * 1.95) / 1000);
            }
          }
        } else if (step === 40 || step === 42) {
          setCurrentNoteIndex(null);
          setActiveMidi(activeRootMidi);
          if (accompanimentMode !== 'silent') {
            playChordSoft(activeRootMidi, (stepDurationMs * 1.95) / 1000);
          }
        } else if (step === 44) {
          setCurrentNoteIndex(null);
          setActiveMidi(nextMidi);
          if (accompanimentMode !== 'silent') {
            playChord(nextMidi, (stepDurationMs * 3.9) / 1000);
          }
        }
      } else if (selectedScalePattern === 'arpeggio_1358888531') {
        // Ex 15: arpeggio ottava prolungato 1358888531 in 6/8 (15 ottavi / 5 gruppi da 3)
        // 1°..9° ottavo (steps 0..8): Do (0), Mi (1), Sol (2), Do8 (3), Do8 (4), Do8 (5), Do8 (6), Sol (7), Mi (8)
        // 10°..11° ottavo (steps 9..10): Do finale (dura 2 ottavi)
        // 12° ottavo (step 11): accordo della tonalità corrente (dura 1 ottavo)
        // 13°..15° ottavo (steps 12..14): accordo della tonalità successiva / modulazione (dura 3 ottavi)
        if (step < 9) {
          setCurrentNoteIndex(step);
          setActiveMidi(scaleMidis[step]);
          if (accompanimentMode === 'all_notes') {
            playNote(scaleMidis[step], (stepDurationMs * 0.95) / 1000);
          } else if (accompanimentMode === 'chord_only' && step === 0) {
            playChord(activeRootMidi, 1.4);
          }
        } else if (step === 9) {
          setCurrentNoteIndex(9);
          setActiveMidi(scaleMidis[9]);
          if (accompanimentMode === 'all_notes') {
            playNote(scaleMidis[9], (stepDurationMs * 1.95) / 1000);
          }
        } else if (step === 11) {
          setCurrentNoteIndex(null);
          setActiveMidi(activeRootMidi);
          if (accompanimentMode !== 'silent') {
            playChordSoft(activeRootMidi, (stepDurationMs * 0.95) / 1000);
          }
        } else if (step === 12) {
          setCurrentNoteIndex(null);
          setActiveMidi(nextMidi);
          if (accompanimentMode !== 'silent') {
            playChord(nextMidi, (stepDurationMs * 2.95) / 1000);
          }
        }
      } else if (selectedScalePattern === 'scale_4_notes_2x') {
        // Ex 16: scala a 4 note 1234 321 x 2 in 4/4 (24 crome / 12 quarti, 3 battute)
        // Battute 1-2 (steps 0..15):
        // Per ciascuna battuta: Do Re (1° quarto), Mi Fa (2° quarto), Mi Re (3° quarto), Do (4° quarto)
        // Battuta 3 (steps 16..23):
        // 1° quarto (step 16): Accordo della tonalità in corso
        // 2° quarto (step 18): Accordo della tonalità in corso
        // 3° e 4° quarto (step 20): Accordo della tonalità successiva
        if (step < 16) {
          const subStep = step % 8;
          if (subStep === 0) {
            setCurrentNoteIndex(0);
            setActiveMidi(scaleMidis[0]);
            if (accompanimentMode === 'all_notes') {
              playNote(scaleMidis[0], (stepDurationMs * 0.95) / 1000);
            } else if (accompanimentMode === 'chord_only' && step === 0) {
              playChord(activeRootMidi, 1.4);
            }
          } else if (subStep === 1) {
            setCurrentNoteIndex(1);
            setActiveMidi(scaleMidis[1]);
            if (accompanimentMode === 'all_notes') {
              playNote(scaleMidis[1], (stepDurationMs * 0.95) / 1000);
            }
          } else if (subStep === 2) {
            setCurrentNoteIndex(2);
            setActiveMidi(scaleMidis[2]);
            if (accompanimentMode === 'all_notes') {
              playNote(scaleMidis[2], (stepDurationMs * 0.95) / 1000);
            }
          } else if (subStep === 3) {
            setCurrentNoteIndex(3);
            setActiveMidi(scaleMidis[3]);
            if (accompanimentMode === 'all_notes') {
              playNote(scaleMidis[3], (stepDurationMs * 0.95) / 1000);
            }
          } else if (subStep === 4) {
            setCurrentNoteIndex(4);
            setActiveMidi(scaleMidis[4]);
            if (accompanimentMode === 'all_notes') {
              playNote(scaleMidis[4], (stepDurationMs * 0.95) / 1000);
            }
          } else if (subStep === 5) {
            setCurrentNoteIndex(5);
            setActiveMidi(scaleMidis[5]);
            if (accompanimentMode === 'all_notes') {
              playNote(scaleMidis[5], (stepDurationMs * 0.95) / 1000);
            }
          } else if (subStep === 6) {
            setCurrentNoteIndex(6);
            setActiveMidi(scaleMidis[6]);
            if (accompanimentMode === 'all_notes') {
              playNote(scaleMidis[6], (stepDurationMs * 1.95) / 1000);
            }
          }
        } else if (step === 16 || step === 18) {
          setCurrentNoteIndex(null);
          setActiveMidi(activeRootMidi);
          if (accompanimentMode !== 'silent') {
            playChordSoft(activeRootMidi, (stepDurationMs * 1.95) / 1000);
          }
        } else if (step === 20) {
          setCurrentNoteIndex(null);
          setActiveMidi(nextMidi);
          if (accompanimentMode !== 'silent') {
            playChord(nextMidi, (stepDurationMs * 3.9) / 1000);
          }
        }
      } else {
        // Standard note by note playback (4/4, 6/4 nona, etc.)
        if (step < scaleMidis.length) {
          const noteMidi = scaleMidis[step];
          setCurrentNoteIndex(step);
          setActiveMidi(noteMidi);

          if (accompanimentMode === 'all_notes') {
            const isHeldFinalNote = step === scaleMidis.length - 1;
            const holdMultiplier = isHeldFinalNote ? 1.8 : 0.95;
            playNote(
              noteMidi,
              (stepDurationMs * holdMultiplier) / 1000
            );
          } else if (accompanimentMode === 'chord_only' && step === 0) {
            playChord(activeRootMidi, 1.4);
          }
        } else if (step === chordStep1) {
          setCurrentNoteIndex(null);
          setActiveMidi(activeRootMidi);
          playChordSoft(activeRootMidi, 1.2);
        } else if (step === chordStep2) {
          setCurrentNoteIndex(null);
          setActiveMidi(nextMidi);
          playChord(nextMidi, 1.6);
        } else {
          setCurrentNoteIndex(null);
          setActiveMidi(null);
        }
      }

      // Metronome clicks with boosted, punchy woodblock acoustics
      if (includeMetronome) {
        if (is68Time) {
          const isBarStart = step % 6 === 0;
          const isMidBar = step % 6 === 3;
          const isAccent = isBarStart || isMidBar;
          playMetronomeClick(isBarStart, (isAccent ? 0.95 : 0.75) * metronomeVolumeRef.current);
        } else if (is64Time) {
          if (step % 2 === 0) {
            const isBarStart = step === 0 || step === 12;
            playMetronomeClick(isBarStart, (isBarStart ? 0.95 : 0.75) * metronomeVolumeRef.current);
          }
        } else if (step % 2 === 0) {
          const isDownbeat = step === 0 || step === 8;
          playMetronomeClick(isDownbeat, (isDownbeat ? 0.95 : 0.8) * metronomeVolumeRef.current);
        }
      }

      step++;
      timerId = setTimeout(playStep, stepDurationMs);
    };

    playStep();

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [isPlaying, bpm, autoTranspose, transposeStep, includeMetronome, accompanimentMode, selectedScalePattern]);

  const handleTogglePlay = () => {
    // Unlock Web Audio API context directly on user click
    getAudioContext();

    if (isPlaying) {
      setIsPlaying(false);
      if (startTimeRef.current) {
        const elapsedSec = Math.round((Date.now() - startTimeRef.current) / 1000);
        if (elapsedSec > 5) {
          onExerciseComplete(selectedExercise.title, elapsedSec);
        }
        startTimeRef.current = null;
      }
    } else {
      setIsPlaying(true);
    }
  };

  const handleRootMidiChange = (delta: number) => {
    setCurrentRootMidi((prev) => Math.max(36, Math.min(84, prev + delta)));
  };

  const rootNoteInfo = getNoteInfo(currentRootMidi);
  const categoryExercises = VOCAL_EXERCISES.filter((ex) => ex.category === activeCategory);

  const isDefaticamento = title.toLowerCase().includes('defaticamento') || (allowedCategories && allowedCategories.includes('Defaticamento'));
  const isWarmup = !isDefaticamento && (title.toLowerCase().includes('riscaldamento') || (allowedCategories && allowedCategories.includes('SOVT')));

  // Theme colors depending on section
  const accentBorder = isDefaticamento ? 'border-[#34D399]' : isWarmup ? 'border-[#fa83b5]' : 'border-sky-400/80';
  const accentBorderSubtle = isDefaticamento ? 'border-[#34D399]/40' : isWarmup ? 'border-[#fa83b5]/40' : 'border-sky-500/40';
  const accentText = isDefaticamento ? 'text-[#34D399]' : isWarmup ? 'text-[#fa83b5]' : 'text-sky-300';
  const accentTextBright = isDefaticamento ? 'text-[#34D399]' : isWarmup ? 'text-[#fa83b5]' : 'text-sky-400';
  const accentBadgeBg = isDefaticamento ? 'bg-[#34D399]/20 border border-[#34D399]/40 text-[#34D399]' : isWarmup ? 'bg-[#fa83b5]/20 border border-[#fa83b5]/40 text-[#fa83b5]' : 'bg-sky-500/20 border border-sky-400/40 text-sky-300';
  const accentGlow = isDefaticamento ? 'bg-[#34D399]/10' : isWarmup ? 'bg-[#fa83b5]/10' : 'bg-sky-500/10';
  const accentHeaderBg = isDefaticamento ? 'from-emerald-950 via-slate-900 to-teal-950 border-b border-[#34D399]/80' : isWarmup ? 'from-rose-950/80 via-stone-900 to-slate-950 border-b border-[#fa83b5]/80' : 'from-sky-950 via-slate-900 to-cyan-950 border-b border-sky-400/80';
  const accentCardGradient = isDefaticamento ? 'from-slate-900 via-emerald-950/30 to-slate-900' : isWarmup ? 'from-slate-900 via-rose-950/30 to-slate-900' : 'from-slate-900 via-sky-950/40 to-slate-900';
  const accentProgressBar = isDefaticamento ? 'from-[#34D399] via-emerald-400 to-teal-300' : isWarmup ? 'from-[#fa83b5] via-pink-400 to-rose-300' : 'from-sky-500 via-cyan-400 to-sky-300';

  const availableScalePatterns = selectedExercise.allowedPatterns
    ? ALL_SCALE_PATTERNS.filter((p) => selectedExercise.allowedPatterns!.includes(p.id))
    : (selectedExercise.category === 'SOVT'
        ? ALL_SCALE_PATTERNS.slice(0, 12)
        : ALL_SCALE_PATTERNS);

  return (
    <div className="bg-[#121826] min-h-screen pb-12 text-slate-100">
      {/* Top Banner Header */}
      <div className={`bg-gradient-to-r ${accentHeaderBg} py-4 sm:py-6 px-3 sm:px-6`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest ${accentBadgeBg}`}>
                {sectionBadge}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {title}
            </h1>

            {/* Explanation text block for DEFATICAMENTO */}
            {isDefaticamento && (
              <div className="mt-3 sm:mt-4 p-3.5 sm:p-4.5 rounded-2xl bg-slate-950/80 border border-[#34D399]/50 text-slate-200 text-xs sm:text-sm leading-relaxed space-y-2 shadow-xl">
                <p className="text-slate-300">
                  {language === 'en'
                    ? "It can happen, especially when modifying old vocal habits, to feel slightly fatigued. This is completely normal during certain learning phases, so don't worry."
                    : "Può capitare, soprattutto quando stai modificando vecchie abitudini vocali, di fare un po' più fatica o di sentire la voce leggermente affaticata. È una situazione normale durante alcune fasi dell'apprendimento, quindi non ti spaventare."}
                </p>
                <p className="text-slate-300">
                  {language === 'en'
                    ? "In these cases, cooling down becomes even more important: taking a few minutes can help your voice recover better and prepare for your next workout."
                    : "Proprio in questi casi il defaticamento diventa ancora più importante: dedicargli qualche minuto può aiutare la voce a recuperare meglio e a prepararsi all'allenamento successivo."}
                </p>
              </div>
            )}

            {/* Explanation text block for ALLENAMENTO */}
            {!isWarmup && !isDefaticamento && (
              <div className="mt-3 sm:mt-4 p-3.5 sm:p-4.5 rounded-2xl bg-slate-950/80 border border-cyan-500/50 text-slate-200 text-xs sm:text-sm leading-relaxed space-y-2 shadow-xl">
                <div className="space-y-1.5">
                  <h3 className="font-black text-cyan-300 text-xs sm:text-base tracking-wide flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-cyan-400" /> {language === 'en' ? 'What would you like to train today?' : 'Cosa vuoi allenare oggi?'}
                  </h3>
                  <p className="text-slate-300">
                    {language === 'en'
                      ? 'I recommend focusing on one or two aspects at a time, keeping them for about a week. Working on a few goals at a time allows you to achieve more concrete results and avoid scattering energy.'
                      : 'Ti consiglio di concentrarti su uno o due aspetti alla volta, mantenendoli per circa una settimana. Lavorare su pochi obiettivi per volta ti permette di ottenere risultati più concreti e di evitare di disperdere le energie.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Tabs & Filtered Exercises */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 pt-4 sm:pt-6 space-y-4">
        {/* Section Question Label */}
        {!isDefaticamento && (
          <div className="flex items-center space-x-2.5">
            <div className={`p-1.5 sm:p-2 rounded-xl ${accentBadgeBg}`}>
              <Sparkles className={`w-4 h-4 sm:w-5 sm:h-5 ${accentText}`} />
            </div>
            <h3 className="text-sm sm:text-lg font-black text-white">
              {allowedCategories ? t('exerciseQuestion') : t('workoutQuestion')}
            </h3>
          </div>
        )}

        {isDefaticamento ? (
          /* 🍃 DEFATICAMENTO: 3 Blocchi separati (WEE, UUH, LIP THRILL / CANNUCCIA) 🍃 */
          <div className="relative w-full">
            <div className="flex overflow-x-auto gap-2.5 sm:gap-4 pb-3 sm:pb-4 pt-1 snap-x custom-scrollbar w-full touch-pan-x">
              {COOLDOWN_BLOCK_CONFIGS.map((block) => {
                const exercisesInCat = VOCAL_EXERCISES.filter(
                  (ex) => ex.category === 'Defaticamento' && block.filter(ex)
                );
                const IconComp = block.icon;
                const isCatSelected = selectedExercise.category === 'Defaticamento' && block.filter(selectedExercise);

                return (
                  <div
                    key={block.id}
                    className={`min-w-[230px] sm:min-w-[320px] max-w-[270px] sm:max-w-[350px] flex-shrink-0 snap-start bg-slate-950/80 border ${block.borderColor} ${block.hoverBorderColor} rounded-2xl p-3.5 sm:p-5 shadow-xl transition-all flex flex-col justify-between space-y-3 sm:space-y-4`}
                  >
                    <div className="space-y-3">
                      <h3 className={`font-extrabold ${block.textColor} text-base sm:text-lg tracking-wide flex items-center gap-2`}>
                        <IconComp className={`w-5 h-5 ${block.iconColor}`} /> {language === 'en' ? block.titleEn : block.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {language === 'en' ? block.descriptionEn : block.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <label className={`text-xs font-bold ${block.textColor} uppercase tracking-wider flex items-center gap-1.5`}>
                        <IconComp className="w-3.5 h-3.5" /> {language === 'en' ? `Select ${block.titleEn} exercise` : `Seleziona esercizio ${block.title}`}
                      </label>
                      <div className="relative w-full">
                        <select
                          value={isCatSelected ? selectedExercise.id : ''}
                          onChange={(e) => {
                            const ex = VOCAL_EXERCISES.find((item) => item.id === e.target.value);
                            if (ex) {
                              setIsPlaying(false);
                              setActiveCategory('Defaticamento');
                              setSelectedExercise(ex);
                              setSelectedScalePattern(ex.scalePattern);
                              if (ex.defaultVowel) setVowel(ex.defaultVowel);
                            }
                          }}
                          className={`w-full bg-slate-900 border ${block.selectBorderColor} focus:ring-2 ${block.selectFocusRing} font-extrabold text-xs sm:text-sm rounded-xl px-3.5 py-2.5 outline-none cursor-pointer appearance-none pr-8 text-white shadow-inner transition-all`}
                        >
                          {!isCatSelected && (
                            <option value="" disabled hidden>
                              {language === 'en' ? '-- Choose an exercise --' : '-- Scegli un esercizio --'}
                            </option>
                          )}
                          {exercisesInCat.map((ex) => (
                            <option key={ex.id} value={ex.id} className="bg-slate-900 text-white font-bold py-1.5">
                              {language === 'en' && ex.titleEn ? ex.titleEn : ex.title}
                            </option>
                          ))}
                        </select>
                        <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 ${block.textColor}`}>
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : isWarmup ? (
          /* 🌸 RISCALDAMENTO: Due blocchi dedicati per SOVT e VOCALIZZI 🌸 */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
            {/* Blocco 1: Esercizi SOVT */}
            <div className="bg-slate-950/80 border border-[#fa83b5]/50 hover:border-[#fa83b5] rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <h3 className="font-extrabold text-[#fa83b5] text-lg sm:text-xl tracking-wide flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#fa83b5]" /> {language === 'en' ? 'SOVT Exercises' : 'Esercizi SOVT'}
                </h3>
                <div className="space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  <p>
                    {language === 'en' ? 'SOVT (Semi-Occluded Vocal Tract) exercises use a semi-occluded vocal tract.' : 'Gli esercizi SOVT (Semi-Occluded Vocal Tract) sono esercizi a tratto vocale semi-occluso.'}
                  </p>
                  <p>
                    {language === 'en' ? 'They are among the most gentle and effective ways to start vocal training: back-pressure balances the vocal folds for greater ease.' : 'Sono tra i modi più delicati ed efficaci per iniziare ad allenare la voce: una parte della pressione dell\'aria viene riflessa verso le corde vocali, aiutandole a lavorare con maggiore equilibrio e minore sforzo.'}
                  </p>
                  <p className="text-pink-200 font-semibold italic">
                    {language === 'en' ? 'These are my favorite warm-up exercises and I highly recommend using them often.' : 'Sono i miei esercizi preferiti per il riscaldamento e consiglio di usarli spesso.'}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <label className="text-xs font-bold text-[#fa83b5] uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> {language === 'en' ? 'Select SOVT Exercise' : 'Seleziona Esercizio SOVT'}
                </label>
                <div className="relative w-full">
                  <select
                    value={selectedExercise.category === 'SOVT' ? selectedExercise.id : ''}
                    onChange={(e) => {
                      const ex = VOCAL_EXERCISES.find((item) => item.id === e.target.value);
                      if (ex) {
                        setIsPlaying(false);
                        setActiveCategory('SOVT');
                        setSelectedExercise(ex);
                        setSelectedScalePattern(ex.scalePattern);
                        if (ex.defaultVowel) setVowel(ex.defaultVowel);
                      }
                    }}
                    className="w-full bg-slate-900 border border-[#fa83b5]/70 focus:border-[#fa83b5] focus:ring-2 focus:ring-[#fa83b5]/40 font-extrabold text-xs sm:text-sm rounded-xl px-3.5 py-2.5 outline-none cursor-pointer appearance-none pr-8 text-white shadow-inner transition-all"
                  >
                    {selectedExercise.category !== 'SOVT' && (
                      <option value="" disabled hidden>
                        {language === 'en' ? '-- Choose an SOVT exercise --' : '-- Scegli un esercizio SOVT --'}
                      </option>
                    )}
                    {VOCAL_EXERCISES.filter((ex) => ex.category === 'SOVT').map((ex) => (
                      <option key={ex.id} value={ex.id} className="bg-slate-900 text-white font-bold py-1.5">
                        {language === 'en' && ex.titleEn ? ex.titleEn : ex.title}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#fa83b5]">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Blocco 2: Vocalizzi */}
            <div className="bg-slate-950/80 border border-pink-400/50 hover:border-pink-300 rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <h3 className="font-extrabold text-pink-300 text-lg sm:text-xl tracking-wide flex items-center gap-2">
                  <Mic className="w-5 h-5 text-pink-300" /> {language === 'en' ? 'Vocalizations' : 'Vocalizzi'}
                </h3>
                <div className="space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  <p>
                    {language === 'en' ? 'Traditional vocalizations are also great warm-up exercises.' : 'Anche i vocalizzi tradizionali sono ottimi esercizi di riscaldamento.'}
                  </p>
                  <p className="text-slate-200 font-semibold">
                    {language === 'en' ? 'My advice is to combine both: pick an SOVT exercise and a traditional vocalization before moving to the next stage.' : 'Il mio consiglio è di combinare le due cose: scegli un esercizio SOVT e un vocalizzo tradizionale prima di passare alla fase successiva.'}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <label className="text-xs font-bold text-pink-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5" /> {language === 'en' ? 'Select Vocalization Exercise' : 'Seleziona Esercizio Vocalizzo'}
                </label>
                <div className="relative w-full">
                  <select
                    value={selectedExercise.category === 'Vocalizzi' ? selectedExercise.id : ''}
                    onChange={(e) => {
                      const ex = VOCAL_EXERCISES.find((item) => item.id === e.target.value);
                      if (ex) {
                        setIsPlaying(false);
                        setActiveCategory('Vocalizzi');
                        setSelectedExercise(ex);
                        setSelectedScalePattern(ex.scalePattern);
                        if (ex.defaultVowel) setVowel(ex.defaultVowel);
                      }
                    }}
                    className="w-full bg-slate-900 border border-pink-400/70 focus:border-pink-300 focus:ring-2 focus:ring-pink-300/40 font-extrabold text-xs sm:text-sm rounded-xl px-3.5 py-2.5 outline-none cursor-pointer appearance-none pr-8 text-white shadow-inner transition-all"
                  >
                    {selectedExercise.category !== 'Vocalizzi' && (
                      <option value="" disabled hidden>
                        {language === 'en' ? '-- Choose a vocalization --' : '-- Scegli un vocalizzo --'}
                      </option>
                    )}
                    {VOCAL_EXERCISES.filter((ex) => ex.category === 'Vocalizzi').map((ex) => (
                      <option key={ex.id} value={ex.id} className="bg-slate-900 text-white font-bold py-1.5">
                        {language === 'en' && ex.titleEn ? ex.titleEn : ex.title}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-pink-300">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ⚡ ALLENAMENTO: Blocchi separati a scorrimento orizzontale ⚡ */
          <div className="relative w-full">
            <div className="flex overflow-x-auto gap-2.5 sm:gap-4 pb-3 sm:pb-4 pt-1 snap-x custom-scrollbar w-full touch-pan-x">
              {WORKOUT_BLOCK_CONFIGS.map((block) => {
                const exercisesInCat = VOCAL_EXERCISES.filter(
                  (ex) => ex.category === block.id || (block.id === 'Voce Mista' && ex.category === 'MIX')
                );
                const IconComp = block.icon;
                const isCatSelected = selectedExercise.category === block.id || (block.id === 'Voce Mista' && selectedExercise.category === 'MIX');

                return (
                  <div
                    key={block.id}
                    className={`min-w-[230px] sm:min-w-[320px] max-w-[270px] sm:max-w-[350px] flex-shrink-0 snap-start bg-slate-950/80 border ${block.borderColor} ${block.hoverBorderColor} rounded-2xl p-3.5 sm:p-5 shadow-xl transition-all flex flex-col justify-between space-y-3 sm:space-y-4`}
                  >
                    <div className="space-y-3">
                      <h3 className={`font-extrabold ${block.textColor} text-base sm:text-lg tracking-wide flex items-center gap-2`}>
                        <IconComp className={`w-5 h-5 ${block.iconColor}`} /> {language === 'en' ? block.titleEn : block.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {language === 'en' ? block.descriptionEn : block.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <label className={`text-xs font-bold ${block.textColor} uppercase tracking-wider flex items-center gap-1.5`}>
                        <IconComp className="w-3.5 h-3.5" /> {language === 'en' ? `Select ${block.titleEn} exercise` : `Seleziona esercizio ${block.title}`}
                      </label>
                      <div className="relative w-full">
                        <select
                          value={isCatSelected ? selectedExercise.id : ''}
                          onChange={(e) => {
                            const ex = VOCAL_EXERCISES.find((item) => item.id === e.target.value);
                            if (ex) {
                              setIsPlaying(false);
                              setActiveCategory(block.id);
                              setSelectedExercise(ex);
                              setSelectedScalePattern(ex.scalePattern);
                              if (ex.defaultVowel) setVowel(ex.defaultVowel);
                            }
                          }}
                          className={`w-full bg-slate-900 border ${block.selectBorderColor} focus:ring-2 ${block.selectFocusRing} font-extrabold text-xs sm:text-sm rounded-xl px-3.5 py-2.5 outline-none cursor-pointer appearance-none pr-8 text-white shadow-inner transition-all`}
                        >
                          {!isCatSelected && (
                            <option value="" disabled hidden>
                              {language === 'en' ? '-- Choose an exercise --' : '-- Scegli un esercizio --'}
                            </option>
                          )}
                          {exercisesInCat.map((ex) => (
                            <option key={ex.id} value={ex.id} className="bg-slate-900 text-white font-bold py-1.5">
                              {language === 'en' && ex.titleEn ? ex.titleEn : ex.title}
                            </option>
                          ))}
                        </select>
                        <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 ${block.textColor}`}>
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 🌟 EXPLANATION CARD - Directly below Exercise Selector Dropdown 🌟 */}
        <div className={`bg-gradient-to-r ${accentCardGradient} border ${accentBorder} rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3.5`}>
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b ${accentBorderSubtle} pb-3`}>
            <div className="flex items-center space-x-2.5">
              <div className={`p-2 rounded-xl ${accentBadgeBg}`}>
                <BookOpen className={`w-5 h-5 ${accentText}`} />
              </div>
              <div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${accentTextBright}`}>
                  {t('howToPerform')}
                </span>
                <h3 className="text-base sm:text-lg font-black text-white">
                  {language === 'en' && selectedExercise.titleEn ? selectedExercise.titleEn : selectedExercise.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
                {language === 'en' ? 'Sound:' : 'Suono:'} <strong className={accentText}>{vowel}</strong>
              </span>
              {selectedExercise.targetFocus && (
                <span className="text-[11px] font-bold text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 hidden sm:inline-block">
                  Target: <strong className="text-emerald-300">{selectedExercise.targetFocus}</strong>
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Step-by-step instructions */}
            <div className={`bg-slate-950/80 p-3.5 rounded-xl border ${accentBorderSubtle} space-y-2`}>
              <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${accentText}`}>
                <CheckCircle2 className={`w-4 h-4 ${accentTextBright}`} />
                {language === 'en' ? 'Execution Instructions' : 'Istruzioni Esecuzione'}
              </span>
              {Array.isArray(selectedExercise.instructions) ? (
                <ol className="text-xs text-slate-200 space-y-1.5 list-decimal pl-4 font-medium">
                  {((language === 'en' && selectedExercise.instructionsEn) ? selectedExercise.instructionsEn : selectedExercise.instructions).map((step, idx) => (
                    <li key={idx} className="leading-normal">{step}</li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-slate-200 leading-normal">{(language === 'en' && selectedExercise.instructionsEn) ? selectedExercise.instructionsEn : selectedExercise.instructions}</p>
              )}
            </div>

            {/* Vocal Tip / Advice */}
            <div className={`bg-slate-950/80 p-3.5 rounded-xl border ${accentBorderSubtle} space-y-2`}>
              <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${accentText}`}>
                <Lightbulb className={`w-4 h-4 ${accentTextBright}`} />
                {language === 'en' ? 'Troubleshooting & Tips' : 'Risoluzione dei problemi e consigli'}
              </span>
              <p className="text-xs text-slate-200 leading-normal font-medium whitespace-pre-line">
                {(language === 'en' && selectedExercise.vocalTipEn) ? selectedExercise.vocalTipEn : selectedExercise.vocalTip}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Banner Routine Guidata Attiva (se presente nella coda) */}
      {activeRoutineQueue && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-cyan-950 border-2 border-sky-400/80 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider bg-sky-500 text-slate-950 px-2.5 py-0.5 rounded-full">
                  {language === 'en' ? 'Active Routine' : 'Routine in Corso'}
                </span>
                <span className="text-xs font-bold text-sky-300">
                  {activeRoutineQueue.routineName}
                  {activeRoutineQueue.level && activeRoutineQueue.level.trim() !== '' && activeRoutineQueue.level.trim() !== '()'
                    ? ` (${activeRoutineQueue.level.replace(/[()]/g, '').trim()})`
                    : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-white">
                  {language === 'en' ? 'Step' : 'Esercizio'} {activeRoutineQueue.currentIndex + 1} {language === 'en' ? 'of' : 'di'} {activeRoutineQueue.steps.length}:
                </span>
                <span className="text-sm font-bold text-cyan-300">
                  {activeRoutineQueue.steps[activeRoutineQueue.currentIndex]?.title}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end flex-wrap">
              {hasPrevExercise && (
                <button
                  type="button"
                  onClick={goToPrevExercise}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{language === 'en' ? 'Previous' : 'Precedente'}</span>
                </button>
              )}

              {hasNextExercise ? (
                <button
                  type="button"
                  onClick={goToNextExercise}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
                >
                  <span>{language === 'en' ? 'Next Exercise' : 'Esercizio Successivo'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={clearRoutineQueue}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{language === 'en' ? 'Routine Completed' : 'Routine Completata'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={clearRoutineQueue}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all cursor-pointer"
                title={language === 'en' ? 'Exit Routine' : 'Esci dalla Routine'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 mt-6 space-y-6">
        {/* Main Player & Scale Ladder */}
        <div className="space-y-6">
          {/* Main Player Card */}
          <div className={`bg-slate-900 border ${accentBorder} rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-2xl relative overflow-hidden`}>
            <div className={`absolute -top-12 -right-12 w-48 h-48 ${accentGlow} rounded-full blur-3xl pointer-events-none`}></div>

            {/* 🌟 RIQUADRO: PRIMA DI INIZIARE 🌟 */}
            <div className={`mb-4 sm:mb-5 bg-gradient-to-r ${accentCardGradient} border ${accentBorder} p-3 sm:p-5 rounded-2xl shadow-xl space-y-3 sm:space-y-4`}>
              <div className={`flex items-center space-x-2 pb-2 sm:pb-2.5 border-b ${accentBorderSubtle}`}>
                <div className={`p-1.5 rounded-xl ${accentBadgeBg}`}>
                  <Sparkles className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${accentText}`} />
                </div>
                <h3 className={`text-xs sm:text-base font-black ${accentText} uppercase tracking-widest`}>
                  {language === 'en' ? 'Before You Start' : 'Prima di iniziare'}
                </h3>
              </div>

              {/* 1. SCEGLI IL PATTERN MELODICO */}
              <div className={`bg-slate-900/90 border ${accentBorderSubtle} p-2.5 sm:p-4 rounded-xl shadow-md`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                  <div className="flex items-center space-x-2 shrink-0">
                    <div className={`p-1.5 sm:p-2 rounded-xl ${accentBadgeBg}`}>
                      <Music className={`w-4 h-4 sm:w-5 sm:h-5 ${accentText}`} />
                    </div>
                    <h4 className="text-xs sm:text-base font-black text-white whitespace-nowrap">
                      {language === 'en' ? 'Choose Melodic Pattern' : 'Scegli il pattern melodico'}
                    </h4>
                  </div>

                  <div className="relative w-full sm:w-80">
                    <select
                      value={selectedScalePattern}
                      onChange={(e) => setSelectedScalePattern(e.target.value as ScalePatternId)}
                      className={`w-full bg-slate-950 border ${accentBorderSubtle} font-extrabold text-xs sm:text-sm rounded-xl px-2.5 py-2 sm:px-3.5 sm:py-2.5 focus:outline-none focus:ring-2 focus:ring-[#fa83b5] cursor-pointer appearance-none pr-8 text-white shadow-inner transition-all`}
                    >
                      {availableScalePatterns.map((pat) => (
                        <option key={pat.id} value={pat.id} className="bg-slate-900 text-white font-bold py-1.5">
                          {getScalePatternLabel(pat, language)}
                        </option>
                      ))}
                    </select>
                    <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 ${accentText}`}>
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. TONALITÀ, TRASPOSIZIONE E ACCOMPAGNAMENTO */}
              <div className={`bg-slate-900/90 border ${accentBorderSubtle} p-2.5 sm:p-3 rounded-xl shadow-md w-full overflow-hidden`}>
                <div className="flex flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 text-xs">
                  
                  {/* 1. TONALITÀ DI PARTENZA */}
                  <div className="flex items-center justify-between sm:justify-start space-x-2 bg-slate-950/50 sm:bg-transparent p-1.5 sm:p-0 rounded-lg">
                    <div className="flex items-center space-x-1.5">
                      <div className={`p-1 rounded-lg ${accentBadgeBg}`}>
                        <Music className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-bold text-slate-300 uppercase tracking-wider whitespace-nowrap">
                        {language === 'en' ? 'Key:' : 'Tonalità:'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleRootMidiChange(-1)}
                        className={`px-2 py-0.5 ${isWarmup ? 'bg-rose-950/80 text-rose-200 border-[#fa83b5]/50' : 'bg-sky-950 hover:bg-sky-900 text-sky-200 border border-sky-400/50'} rounded-lg transition-colors font-bold text-[11px] active:scale-95`}
                        title={language === 'en' ? 'Lower 1 semitone' : 'Abbassa di 1 semitono'}
                      >
                        -1
                      </button>
                      <span className={`font-black ${accentText} text-xs px-1.5 text-center min-w-[38px] whitespace-nowrap`}>
                        {notation === 'latin' ? rootNoteInfo.nameLatin : rootNoteInfo.nameScientific}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRootMidiChange(1)}
                        className={`px-2 py-0.5 ${isWarmup ? 'bg-rose-950/80 text-rose-200 border-[#fa83b5]/50' : 'bg-sky-950 hover:bg-sky-900 text-sky-200 border border-sky-400/50'} rounded-lg transition-colors font-bold text-[11px] active:scale-95`}
                        title={language === 'en' ? 'Raise 1 semitone' : 'Alza di 1 semitono'}
                      >
                        +1
                      </button>
                    </div>
                  </div>

                  <div className="hidden lg:block w-px h-5 bg-slate-800" />

                  {/* 2. TRASPOSIZIONE AUTO */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 bg-slate-950/50 sm:bg-transparent p-1.5 sm:p-0 rounded-lg w-full">
                    <div className="flex items-center justify-between sm:justify-start space-x-2 w-full sm:w-auto">
                      <div className="flex items-center space-x-1.5">
                        <div className={`p-1 rounded-lg ${accentBadgeBg}`}>
                          <Repeat className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-300 uppercase tracking-wider whitespace-nowrap">
                          Auto Transpose:
                        </span>
                      </div>

                      {/* Switch ON/OFF affianco al titolo su mobile */}
                      <button
                        type="button"
                        onClick={() => setAutoTranspose(!autoTranspose)}
                        className={`flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-extrabold transition-all border ${
                          autoTranspose
                            ? isWarmup
                              ? 'bg-rose-950 text-rose-200 border-[#fa83b5]/80 shadow-sm'
                              : 'bg-sky-950 text-sky-200 border-sky-400/80 shadow-sm shadow-sky-500/20'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        <div className={`w-4 h-2.5 sm:w-5 sm:h-3 flex items-center rounded-full p-0.5 transition-colors ${autoTranspose ? (isWarmup ? 'bg-[#fa83b5]' : 'bg-sky-500') : 'bg-slate-700'}`}>
                          <div className={`bg-white w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shadow-md transform transition-transform ${autoTranspose ? 'translate-x-1.5 sm:translate-x-2' : 'translate-x-0'}`} />
                        </div>
                        <span>{autoTranspose ? 'ON' : 'OFF'}</span>
                      </button>
                    </div>

                    {/* Passo 1 sem / 1 tono al centro sotto su mobile */}
                    <div className="flex justify-center sm:justify-start w-full sm:w-auto mt-0.5 sm:mt-0">
                      <div className="flex bg-slate-950 p-0.5 rounded-xl border border-slate-800">
                        <button
                          type="button"
                          onClick={() => setTransposeStep(1)}
                          className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-extrabold transition-all ${
                            transposeStep === 1
                              ? isWarmup
                                ? 'bg-gradient-to-r from-[#fa83b5] to-pink-400 text-slate-950 shadow-sm border border-[#fa83b5]'
                                : 'bg-gradient-to-r from-sky-600 via-cyan-600 to-sky-700 text-white shadow-sm border border-sky-400/50'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          {language === 'en' ? '1 Semitone' : '1 Semitono'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setTransposeStep(2)}
                          className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-extrabold transition-all ${
                            transposeStep === 2
                              ? isWarmup
                                ? 'bg-gradient-to-r from-[#fa83b5] to-pink-400 text-slate-950 shadow-sm border border-[#fa83b5]'
                                : 'bg-gradient-to-r from-sky-600 via-cyan-600 to-sky-700 text-white shadow-sm border border-sky-400/50'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          {language === 'en' ? '1 Tone' : '1 Tono'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="hidden lg:block w-px h-5 bg-slate-800" />

                  {/* 3. ACCOMPAGNAMENTO PIANOFORTE */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 bg-slate-950/50 sm:bg-transparent p-1.5 sm:p-0 rounded-lg w-full">
                    <div className="flex items-center justify-start space-x-1.5 w-full sm:w-auto">
                      <div className={`p-1 rounded-lg ${accentBadgeBg}`}>
                        <Sliders className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-bold text-slate-300 uppercase tracking-wider whitespace-nowrap">
                        {language === 'en' ? 'Accompaniment:' : 'Accompagnamento:'}
                      </span>
                    </div>

                    {/* Modalità al centro sotto su mobile */}
                    <div className="flex justify-center sm:justify-start w-full sm:w-auto mt-0.5 sm:mt-0">
                      <div className="flex bg-slate-950 p-0.5 rounded-xl border border-slate-800">
                        <button
                          type="button"
                          onClick={() => setAccompanimentMode('all_notes')}
                          className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-extrabold transition-all ${
                            accompanimentMode === 'all_notes'
                              ? isWarmup
                                ? 'bg-gradient-to-r from-[#fa83b5] to-pink-400 text-slate-950 shadow-sm border border-[#fa83b5]'
                                : 'bg-gradient-to-r from-sky-600 via-cyan-600 to-sky-700 text-white shadow-sm border border-sky-400/50'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          {language === 'en' ? 'Chord + Notes' : 'Accordo + Note'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setAccompanimentMode('chord_only')}
                          className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-extrabold transition-all ${
                            accompanimentMode === 'chord_only'
                              ? isWarmup
                                ? 'bg-gradient-to-r from-[#fa83b5] to-pink-400 text-slate-950 shadow-sm border border-[#fa83b5]'
                                : 'bg-gradient-to-r from-sky-600 via-cyan-600 to-sky-700 text-white shadow-sm border border-sky-400/50'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          {language === 'en' ? 'Chords Only' : 'Solo Accordi'}
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* 🎛️ PLAYER ESERCIZIO 🎛️ */}
            <div className={`mb-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border ${accentBorder} p-3.5 sm:p-4 rounded-2xl shadow-xl`}>
              
              {/* 🎼 BARRA DI AVANZAMENTO CICLO NOTE (IN ALTO) 🎼 */}
              <div className="mb-3.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1.5">
                  <span className={`flex items-center gap-1.5 ${accentText}`}>
                    <Sparkles className={`w-3.5 h-3.5 ${accentTextBright}`} />
                    <span>{t('startExercise')}</span>
                  </span>
                </div>

                {/* Dynamic Progress Bar Track */}
                <div className={`relative w-full bg-slate-950 h-3 rounded-full overflow-hidden border ${accentBorderSubtle} p-0.5 shadow-inner`}>
                  <div
                    className={`h-full bg-gradient-to-r ${accentProgressBar} rounded-full transition-all duration-200 ease-out shadow-sm`}
                    style={{
                      width: `${isPlaying && totalCycleStepsCount > 0 ? Math.min(100, Math.max(0, Math.round(((currentCycleStep + 1) / totalCycleStepsCount) * 100))) : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* CONTROLS AREA: STOP, PLAY, PAUSA ICON BUTTONS & INIZIA DISCESA */}
              <div className="flex flex-col items-center justify-center space-y-3 pt-1">
                {/* Stop, Play & Pause Icon-only Buttons + Routine Navigation */}
                <div className="flex items-center justify-center gap-3 sm:gap-4">
                  {/* Tasto Previous Step nella routine (se disponibile) */}
                  {activeRoutineQueue && hasPrevExercise && (
                    <button
                      type="button"
                      onClick={goToPrevExercise}
                      className="p-3 rounded-full transition-all border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 shadow-md active:scale-95 hover:scale-105"
                      title={language === 'en' ? 'Previous Routine Exercise' : 'Esercizio Precedente della Routine'}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  )}

                  {/* Tasto STOP (a sinistra, solo icona) */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentCycleStep(0);
                      setCurrentNoteIndex(null);
                      setActiveMidi(null);
                      setCurrentRootMidi(selectedExercise.recommendedStartMidi);
                      currentRootMidiRef.current = selectedExercise.recommendedStartMidi;
                      setTransposeDirection('up');
                      transposeDirectionRef.current = 'up';
                    }}
                    className="p-3.5 rounded-full transition-all border border-rose-500/60 bg-gradient-to-r from-rose-700 to-red-600 hover:from-rose-600 hover:to-red-500 text-white shadow-lg shadow-rose-950/50 active:scale-95 hover:scale-105"
                    title={language === 'en' ? 'Stop Exercise and Reset Key' : 'Ferma Esercizio e Ripristina Tonalità'}
                  >
                    <Square className="w-5 h-5 fill-current" />
                  </button>

                  {/* Tasto PLAY */}
                  <button
                    type="button"
                    onClick={() => setIsPlaying(true)}
                    className={`p-3.5 rounded-full transition-all border active:scale-95 shadow-lg ${
                      isPlaying
                        ? isWarmup
                          ? 'bg-[#fa83b5] text-slate-950 border-rose-200 shadow-[#fa83b5]/50 ring-2 ring-[#fa83b5]/50'
                          : 'bg-blue-600 text-white border-blue-300 shadow-blue-600/50 ring-2 ring-blue-400/50'
                        : isWarmup
                          ? 'bg-gradient-to-r from-[#fa83b5] to-pink-400 hover:from-[#fa83b5]/90 hover:to-pink-300 text-slate-950 border-rose-200 shadow-[#fa83b5]/40 hover:scale-105'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-blue-400/80 shadow-blue-900/40 hover:scale-105'
                    }`}
                    title={language === 'en' ? 'Start Exercise' : 'Avvia Esercizio'}
                  >
                    <Play className="w-6 h-6 fill-current ml-0.5 text-slate-950" />
                  </button>

                  {/* Tasto PAUSA */}
                  <button
                    type="button"
                    onClick={() => setIsPlaying(false)}
                    className={`p-3.5 rounded-full transition-all border active:scale-95 shadow-lg ${
                      !isPlaying
                        ? isWarmup
                          ? 'bg-rose-950/80 text-rose-300 border-rose-800/80 shadow-inner'
                          : 'bg-sky-950/80 text-sky-300 border-sky-800 shadow-inner'
                        : isWarmup
                          ? 'bg-gradient-to-r from-pink-400 via-[#fa83b5] to-pink-400 text-slate-950 border-rose-200 shadow-[#fa83b5]/40 hover:scale-105'
                          : 'bg-gradient-to-r from-sky-400 via-cyan-400 to-sky-400 hover:from-sky-300 hover:to-cyan-300 text-slate-950 border-sky-200 shadow-sky-400/40 hover:scale-105'
                    }`}
                    title={language === 'en' ? 'Pause' : 'Metti in Pausa'}
                  >
                    <Pause className="w-6 h-6 fill-current" />
                  </button>

                  {/* Tasto Next Step nella routine (se disponibile) */}
                  {activeRoutineQueue && hasNextExercise && (
                    <button
                      type="button"
                      onClick={goToNextExercise}
                      className="p-3 rounded-full transition-all border border-sky-400/80 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-black shadow-lg shadow-sky-500/20 active:scale-95 hover:scale-105"
                      title={language === 'en' ? 'Next Routine Exercise' : 'Esercizio Successivo della Routine'}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Tasto INIZIA DISCESA */}
                <div className="flex justify-center w-full">
                  <button
                    type="button"
                    onClick={() => {
                      const newDir = transposeDirection === 'down' ? 'up' : 'down';
                      setTransposeDirection(newDir);
                      transposeDirectionRef.current = newDir;
                    }}
                    className={`flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all border active:scale-95 shadow-md ${
                      transposeDirection === 'down'
                        ? isWarmup
                          ? 'bg-gradient-to-r from-[#fa83b5] to-pink-400 text-slate-950 border-rose-200 shadow-[#fa83b5]/40 ring-2 ring-[#fa83b5]/50'
                          : 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white border-sky-300 shadow-sky-600/40 ring-2 ring-sky-400/50'
                        : isWarmup
                          ? 'bg-slate-900 text-slate-200 border-[#fa83b5]/50 hover:bg-slate-800 hover:border-[#fa83b5]'
                          : 'bg-slate-900 text-slate-200 border-sky-500/50 hover:bg-slate-800 hover:border-sky-400'
                    }`}
                    title={transposeDirection === 'down' ? (language === 'en' ? 'Currently descending. Click to reverse ascending' : 'Attualmente in discesa. Clicca per invertire in salita') : (language === 'en' ? 'Click to start key descent' : 'Clicca per avviare la discesa di tonalità')}
                  >
                    {transposeDirection === 'down' ? (
                      <>
                        <ArrowDown className={`w-4 h-4 ${isWarmup ? 'text-slate-950' : 'text-sky-200'} animate-bounce`} />
                        <span>{language === 'en' ? 'DESCENDING' : 'IN DISCESA'}</span>
                      </>
                    ) : (
                      <>
                        <ArrowDown className={`w-4 h-4 ${accentTextBright}`} />
                        <span>{language === 'en' ? 'START DESCENT' : 'INIZIA DISCESA'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Banner Suggerimento Vocale */}
                <div className="w-full mt-2 min-h-[46px] flex items-center justify-center">
                  {activeTip ? (
                    <div className={`w-full p-3 bg-gradient-to-r ${isWarmup ? 'from-rose-950/90 via-stone-900 to-rose-950/90 border-[#fa83b5]/60 text-rose-200 shadow-[#fa83b5]/30' : 'from-sky-950/90 via-cyan-950/80 to-sky-950/90 border-sky-500/60 text-sky-200 shadow-sky-950/60'} border rounded-xl flex items-center justify-center space-x-2 text-xs font-bold shadow-lg transition-all animate-fade-in`}>
                      <Lightbulb className={`w-4 h-4 ${accentTextBright} shrink-0 animate-pulse`} />
                      <span className="text-center font-extrabold tracking-wide">{activeTip}</span>
                    </div>
                  ) : (
                    <div className="w-full p-3 border border-transparent rounded-xl opacity-0 select-none pointer-events-none text-xs">
                      &nbsp;
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 🎛️ MENU A SCOMPARSA: VOLUMI & VELOCITÀ 🎛️ */}
            <div className="my-3">
              <button
                type="button"
                onClick={() => setShowAudioControls(!showAudioControls)}
                className={`w-full flex items-center justify-between px-3.5 py-2 bg-slate-950/90 border ${accentBorderSubtle} hover:${accentBorder} rounded-xl text-xs font-extrabold text-slate-200 transition-all shadow-lg hover:bg-slate-900/90 active:scale-[0.99]`}
              >
                <div className="flex items-center space-x-2">
                  <div className={`p-1 rounded-lg ${accentBadgeBg}`}>
                    <Sliders className="w-3.5 h-3.5" />
                  </div>
                  <span className="tracking-wide text-xs">{language === 'en' ? 'Volume & Speed' : 'Volumi e Velocità'}</span>
                  <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">{language === 'en' ? '(Metronome, BPM, Piano)' : '(Metronomo, BPM, Piano)'}</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${accentText}`}>
                  <span className="text-[10px] font-bold">{showAudioControls ? (language === 'en' ? 'Hide' : 'Nascondi') : (language === 'en' ? 'Show' : 'Mostra')}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showAudioControls ? `rotate-180 ${accentTextBright}` : ''}`} />
                </div>
              </button>

              {showAudioControls && (
                <div className={`mt-2 p-2.5 bg-slate-950/95 border ${accentBorderSubtle} rounded-xl shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-[11px] animate-fade-in`}>
                  {/* TOP ROW ON MOBILE (Metronomo & Velocità BPM) */}
                  <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 w-full sm:w-auto">
                    {/* 1. METRONOMO WITH SWITCH ON/OFF */}
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <span className="font-extrabold text-slate-200 text-[11px] whitespace-nowrap flex items-center gap-1">
                        <Gauge className={`w-3.5 h-3.5 ${accentTextBright}`} />
                        <span className="hidden sm:inline">{language === 'en' ? 'Metronome' : 'Metronomo'}</span>
                        <span className="sm:hidden">{language === 'en' ? 'Metro' : 'Metro'}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIncludeMetronome(!includeMetronome)}
                        className={`flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg text-[10px] font-extrabold transition-all border ${
                          includeMetronome
                            ? isWarmup
                              ? 'bg-rose-950 text-rose-200 border-[#fa83b5]/80 shadow-sm'
                              : 'bg-sky-950 text-sky-200 border-sky-400/80 shadow-sm shadow-sky-500/20'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                        title={language === 'en' ? 'Toggle metronome' : 'Attiva o disattiva il metronomo'}
                      >
                        <div className={`w-4 h-2.5 sm:w-5 sm:h-3 flex items-center rounded-full p-0.5 transition-colors ${includeMetronome ? (isWarmup ? 'bg-[#fa83b5]' : 'bg-sky-500') : 'bg-slate-700'}`}>
                          <div className={`bg-white w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shadow-md transform transition-transform ${includeMetronome ? 'translate-x-1.5 sm:translate-x-2' : 'translate-x-0'}`} />
                        </div>
                        <span className="font-black text-[9px] sm:text-[10px] tracking-wider uppercase">{includeMetronome ? 'ON' : 'OFF'}</span>
                      </button>
                    </div>

                    {/* DIVIDER FOR DESKTOP */}
                    <div className="hidden sm:block w-px h-5 bg-slate-800 shrink-0" />

                    {/* 2. VELOCITÀ (BPM) */}
                    <div className={`flex items-center space-x-1 sm:space-x-1.5 shrink-0 transition-opacity ${includeMetronome ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                      <span className="font-bold text-slate-300 text-[10px] hidden xl:inline">{language === 'en' ? 'Speed:' : 'Velocità:'}</span>
                      <button
                        type="button"
                        onClick={() => setBpm(Math.max(40, bpm - 5))}
                        className="px-1 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded text-[10px] font-black border border-slate-800"
                      >
                        -5
                      </button>
                      <input
                        type="range"
                        min="40"
                        max="180"
                        value={bpm}
                        onChange={(e) => setBpm(Number(e.target.value))}
                        className={`w-12 sm:w-20 ${isWarmup ? 'accent-[#fa83b5]' : 'accent-sky-400'} cursor-pointer h-1 bg-slate-800 rounded-lg`}
                      />
                      <button
                        type="button"
                        onClick={() => setBpm(Math.min(200, bpm + 5))}
                        className="px-1 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded text-[10px] font-black border border-slate-800"
                      >
                        +5
                      </button>
                      <span className={`text-[10px] font-black ${accentText} ${isWarmup ? 'bg-rose-950/80 border-[#fa83b5]/50' : 'bg-sky-950/80 border-sky-800/50'} px-1 py-0.5 rounded border font-mono whitespace-nowrap`}>
                        {bpm} BPM
                      </span>
                    </div>
                  </div>

                  {/* DIVIDER FOR DESKTOP */}
                  <div className="hidden sm:block w-px h-5 bg-slate-800 shrink-0" />

                  {/* BOTTOM ROW ON MOBILE (Vol. Metro & Vol. Piano) */}
                  <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t border-slate-800/80 sm:border-0">
                    {/* 3. VOLUME METRONOMO */}
                    <div className={`flex items-center space-x-1 sm:space-x-1.5 shrink-0 transition-opacity ${includeMetronome ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                      <button
                        type="button"
                        onClick={() => setMetronomeVolume(metronomeVolume === 0 ? 0.85 : 0)}
                        className="text-slate-400 hover:text-white transition-colors p-0.5"
                        title={metronomeVolume === 0 ? (language === 'en' ? 'Unmute metronome' : 'Riattiva metronomo') : (language === 'en' ? 'Mute metronome' : 'Muto metronomo')}
                      >
                        {metronomeVolume === 0 ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-sky-400" />}
                      </button>
                      <span className="font-bold text-slate-300 text-[10px]">{language === 'en' ? 'Metro:' : 'Metro:'}</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.02"
                        value={metronomeVolume}
                        onChange={(e) => setMetronomeVolume(Number(e.target.value))}
                        className="w-12 sm:w-20 accent-sky-400 cursor-pointer h-1 bg-slate-800 rounded-lg"
                      />
                      <span className="text-[10px] font-black text-sky-300 w-6 text-right font-mono">
                        {Math.round(metronomeVolume * 100)}%
                      </span>
                    </div>

                    {/* DIVIDER FOR DESKTOP */}
                    <div className="hidden sm:block w-px h-5 bg-slate-800 shrink-0" />

                    {/* 4. VOLUME PIANOFORTE */}
                    <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPianoVolume(pianoVolume === 0 ? 0.9 : 0)}
                        className="text-slate-400 hover:text-white transition-colors p-0.5"
                        title={pianoVolume === 0 ? (language === 'en' ? 'Unmute piano' : 'Riattiva pianoforte') : (language === 'en' ? 'Mute piano' : 'Muto pianoforte')}
                      >
                        {pianoVolume === 0 ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-sky-400" />}
                      </button>
                      <span className="font-bold text-slate-300 text-[10px]">Piano:</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.02"
                        value={pianoVolume}
                        onChange={(e) => setPianoVolume(Number(e.target.value))}
                        className="w-12 sm:w-20 accent-sky-400 cursor-pointer h-1 bg-slate-800 rounded-lg"
                      />
                      <span className="text-[10px] font-black text-sky-300 w-6 text-right font-mono">
                        {Math.round(pianoVolume * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Reference Keyboard */}
          <InteractivePiano
            startOctave={2}
            numOctaves={4}
            highlightMidi={activeMidi}
            activeScaleMidis={currentScaleMidis}
            notation={notation}
            onNotePlay={(midi) => {
              setCurrentRootMidi(midi);
            }}
          />
        </div>
      </div>
    </div>
  );
};
