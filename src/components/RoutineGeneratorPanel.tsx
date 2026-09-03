import React, { useState } from 'react';
import { Sparkles, CheckCircle2, ArrowRight, ExternalLink, Play, Target, Award, Sliders, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useRoutineQueue } from '../context/RoutineQueueContext';
import { CustomRoutineBuilder } from './CustomRoutineBuilder';

interface RoutineGeneratorPanelProps {
  onNavigate: (tab: string, subTool?: 'range' | 'tuner' | 'breathing' | 'routine', fromLabel?: string) => void;
}

export interface RoutineStep {
  title: string;
  duration: string;
  vowel: string;
  focus: string;
  instruction: string;
  items?: string[];
  targetTab: 'warmup' | 'exercises' | 'workout' | 'cooldown';
}

export interface GuidedRoutine {
  id: string;
  name: string;
  description: string;
  totalDurationMinutes: number;
  level: string;
  steps: RoutineStep[];
}

export const RoutineGeneratorPanel: React.FC<RoutineGeneratorPanelProps> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const { startRoutineQueue } = useRoutineQueue();

  const [routineMode, setRoutineMode] = useState<'guided' | 'custom'>('guided');
  const [goal, setGoal] = useState<string>('warmup_quick');
  const [level, setLevel] = useState<string>('beginner');
  
  // Specific variation selector for quick warmup
  const [quickWarmupChoice, setQuickWarmupChoice] = useState<string>('opt1');
  
  const [activeRoutine, setActiveRoutine] = useState<GuidedRoutine | null>(null);

  const buildRoutineSteps = (targetGoal: string, targetLevel: string, choiceKey: string) => {
    let routineName = '';
    let description = '';
    let steps: RoutineStep[] = [];
    let totalTime = 8;

    // --- 1. RISCALDAMENTO RAPIDO (5/10 MINUTI) ---
    if (targetGoal === 'warmup_quick') {
      totalTime = 8;
      routineName = isEn ? 'Quick Warm-up (5/10 min)' : 'Riscaldamento Rapido (5/10 minuti)';
      description = isEn
        ? 'Targeted gentle activation to prepare vocal cords safely according to your selected exercise and level.'
        : 'Attivazione vocale dolce e sicura per risvegliare le corde vocali in base all\'opzione e al livello scelto.';

      if (targetLevel === 'beginner') {
        // Principiante:
        // Opzione A: Lip Thrill / Cannuccia / Trillo con 1 2 3 (SOVT)
        // Opzione B: MMM 1 2 3 / UUUH 5 4 3 2 1 (Vocalizzi)
        if (choiceKey === 'opt1') {
          steps = [
            {
              title: isEn ? 'Option A: Lip Thrill / Straw / Tongue Trill (1 2 3)' : 'Opzione A: Lip Thrill / Cannuccia / Trillo Lingua (1 2 3)',
              duration: '5-8 min',
              vowel: 'Lip Thrill / Cannuccia / Trillo',
              focus: isEn ? 'Subglottic pressure balance (SOVT)' : 'Bilanciamento pressione SOVT',
              instruction: isEn
                ? 'Sing pattern 1 2 3 choosing freely between Lip Thrill, Straw, or Tongue Trill.'
                : 'Esegui il pattern melodico (1 2 3) con uno dei 3 esercizi SOVT suggeriti.',
              targetTab: 'exercises',
            },
          ];
        } else {
          steps = [
            {
              title: isEn ? 'Option B: MMM (1 2 3) / UUUH (5 4 3 2 1)' : 'Opzione B: MMM (1 2 3) / UUUH (5 4 3 2 1)',
              duration: '5-8 min',
              vowel: 'MMM / UUUH',
              focus: isEn ? 'Vocalize alternative' : 'Vocalizzi di riscaldamento',
              instruction: isEn
                ? 'Warm up with vocalizes: choose between MMM on 1 2 3 or smooth downward UUUH on 5 4 3 2 1.'
                : 'Riscaldati con i vocalizzi se li preferisci agli SOVT, scegli tra MMM 1 2 3 o UUUH 54321.',
              targetTab: 'exercises',
            },
          ];
        }
      } else if (targetLevel === 'intermediate') {
        // Intermedio:
        // Opzione A: Lip thrill / Cannuccia / Trillo 1 2 3 4 5
        // Opzione B: MMM 1 2 3 4 5
        // Opzione C: UUUH 5 4 3 2 1
        if (choiceKey === 'opt1') {
          steps = [
            {
              title: isEn ? 'Option A: Lip Thrill / Straw / Trill (1 2 3 4 5)' : 'Opzione A: Lip Thrill / Cannuccia / Trillo (1 2 3 4 5)',
              duration: '6-9 min',
              vowel: 'Lip Thrill / Cannuccia / Trillo',
              focus: isEn ? '5-note SOVT scale' : 'Scala a 5 note SOVT',
              instruction: isEn
                ? 'Ascend and descend 1 2 3 4 5 using Lip Thrill, Straw, or Tongue Trill.'
                : 'Esegui la scala a 5 note (1 2 3 4 5) con Lip Thrill, Cannuccia o Trillo in scioltezza.',
              targetTab: 'exercises',
            },
          ];
        } else if (choiceKey === 'opt2') {
          steps = [
            {
              title: isEn ? 'Option B: MMM (1 2 3 4 5)' : 'Opzione B: MMM (1 2 3 4 5)',
              duration: '6-9 min',
              vowel: 'MMM',
              focus: isEn ? 'Mask resonance on 5 notes' : 'Risonanza in maschera su 5 note',
              instruction: isEn
                ? 'Sing 1 2 3 4 5 on humming MMM feeling clear vibrations in cheekbones and lips.'
                : 'Canta la scala a 5 note (1 2 3 4 5) con MMM focalizzando la vibrazione in maschera.',
              targetTab: 'exercises',
            },
          ];
        } else {
          steps = [
            {
              title: isEn ? 'Option C: UUUH (5 4 3 2 1)' : 'Opzione C: UUUH (5 4 3 2 1)',
              duration: '6-9 min',
              vowel: 'UUUH',
              focus: isEn ? 'Downward relaxing scale' : 'Discesa morbida rilassante',
              instruction: isEn
                ? 'Descend smoothly 5 4 3 2 1 on round UUUH keeping the larynx relaxed.'
                : 'Scendi dolcemente sulla scala 5 4 3 2 1 con vocale rotonda UUUH in relax.',
              targetTab: 'exercises',
            },
          ];
        }
      } else {
        // Avanzato:
        // Opzione A: Lip thrill / Cannuccia / Trillo 1 2 3 4 5
        // Opzione B: 1 3 5 8 (Ottava)
        // Opzione C: MMM ME (1 2 3 4 5  1 2 3 4 5)
        // Opzione D: Lip thrill - NG - NEE con arpeggio composto
        if (choiceKey === 'opt1') {
          steps = [
            {
              title: isEn ? 'Option A: Lip Thrill / Straw / Trill (1 2 3 4 5)' : 'Opzione A: Lip Thrill / Cannuccia / Trillo (1 2 3 4 5)',
              duration: '6-8 min',
              vowel: 'Lip Thrill / Cannuccia / Trillo',
              focus: isEn ? '5-note warm-up scale' : 'Attivazione su 5 note',
              instruction: isEn
                ? 'Fast, fluid 5-note scales to balance breath pressure and mucosal elasticity.'
                : 'Scale fluide e veloci a 5 note per bilanciare il fiato e svegliare la voce.',
              targetTab: 'exercises',
            },
          ];
        } else if (choiceKey === 'opt2') {
          steps = [
            {
              title: isEn ? 'Option B: Octave Arpeggio (1 3 5 8)' : 'Opzione B: Arpeggio di Ottava (1 3 5 8)',
              duration: '6-8 min',
              vowel: 'Lip Thrill / Cannuccia / Trillo',
              focus: isEn ? 'Octave extension with SOVT' : 'Estensione su ottava con SOVT',
              instruction: isEn
                ? 'Perform arpeggio 1 3 5 8 accessing upper register with effortless SOVT resonance.'
                : 'Esegui l\'arpeggio 1 3 5 8 collegando il registro acuto con facilità SOVT.',
              targetTab: 'exercises',
            },
          ];
        } else if (choiceKey === 'opt3') {
          steps = [
            {
              title: isEn ? 'Option C: MMM ME (12345 12345)' : 'Opzione C: MMM ME (12345 12345)',
              duration: '6-8 min',
              vowel: 'MMM ME',
              focus: isEn ? 'Mask humming to bright vowel' : 'Da MMM a ME brillante',
              instruction: isEn
                ? 'Sing 1 2 3 4 5 on MMM and repeat immediately on ME keeping the forward acoustic placement.'
                : 'Canta 1 2 3 4 5 su MMM e ripeti subito su ME mantenendo la risonanza proiettata.',
              targetTab: 'exercises',
            },
          ];
        } else {
          steps = [
            {
              title: isEn ? 'Option D: Compound Arpeggio: Lip Thrill - NG - NEE' : 'Opzione D: Arpeggio Composto: Lip Thrill - NG - NEE',
              duration: '6-8 min',
              vowel: 'Lip Thrill -> NG -> NEE',
              focus: isEn ? 'Compound arpeggio flexibility' : 'Arpeggio composto su 3 timbri',
              instruction: isEn
                ? 'Execute the compound arpeggio cycling Lip Thrill, NG resonance, and bright NEE.'
                : 'Esegui l\'arpeggio composto alternando Lip Thrill, risonanza nasale NG e vocale squillante NEE.',
              targetTab: 'exercises',
            },
          ];
        }
      }
    }
    // --- 2. RISCALDAMENTO INTENSO ---
    else if (targetGoal === 'warmup_intense') {
      totalTime = 12;
      routineName = isEn ? 'Intense Warm-up Routine' : 'Riscaldamento Intenso';
      description = isEn
        ? 'Deep full-range warm-up structured according to your vocal level.'
        : 'Riscaldamento completo e approfondito strutturato in base al tuo livello vocale.';

      if (targetLevel === 'beginner') {
        steps = [
          {
            title: isEn ? 'Warm-up' : 'Riscaldamento',
            duration: '11 min',
            vowel: 'Lip Thrill / UUUH',
            focus: isEn ? 'Subglottic activation & octave extension' : 'Attivazione iniziale ed espansione sull\'ottava',
            items: [
              'Lip Thrill (1 2 3) / UUUH (5 4 3 2 1)',
              'Lip Thrill / UUUH (1 3 5 8)',
            ],
            instruction: isEn
              ? 'Execute Lip Thrill (1 2 3) / UUUH (5 4 3 2 1) and expand with octave arpeggio (1 3 5 8).'
              : 'Inizia con Lip Thrill (1 2 3) o UUUH (5 4 3 2 1) e prosegui con l\'arpeggio di ottava (1 3 5 8).',
            targetTab: 'exercises',
          },
        ];
      } else if (targetLevel === 'intermediate') {
        steps = [
          {
            title: isEn ? 'Warm-up' : 'Riscaldamento',
            duration: '12 min',
            vowel: 'Lip Thrill / UUUH / MMM MEEE',
            focus: isEn ? '5-note scale activation & open vowel brightness' : 'Attivazione su 5 note e passaggio a vocale aperta',
            items: [
              'Lip Thrill (12345) / UUUH (54321)',
              'MMM MEEE (12344 - 12345)',
            ],
            instruction: isEn
              ? 'Execute Lip Thrill (12345) / UUUH (54321) and MMM MEEE (12344 - 12345).'
              : 'Esegui Lip Thrill su 12345 / UUUH 54321 e passa a MMM MEEE (12344 - 12345).',
            targetTab: 'exercises',
          },
        ];
      } else {
        steps = [
          {
            title: isEn ? 'Warm-up' : 'Riscaldamento',
            duration: '13 min',
            vowel: 'Lip Thrill / UUUH / NG / NEE / MEEE',
            focus: isEn ? 'Dynamic SOVT, compound arpeggio & 4-note phrasing' : 'Attivazione SOVT, arpeggio composto e fraseggio a 4 note',
            items: [
              'Lip Thrill (12345) / UUUH (54321)',
              'Lip Thrill - NG - NEE (Arpeggio Composto)',
              'MEEE (1234 - 1234)',
            ],
            instruction: isEn
              ? 'Execute 5-note SOVT, compound arpeggio, and crisp 4-note phrasing on MEEE.'
              : 'Esegui Lip Thrill (12345) / UUUH (54321), arpeggio composto e fraseggio su MEEE (1234 - 1234).',
            targetTab: 'exercises',
          },
        ];
      }
    }
    // --- 3. ALLENAMENTO RISONANZA SQUILLO ---
    else if (targetGoal === 'resonance') {
      totalTime = 14;
      routineName = isEn ? 'Resonance & Squillo Workout' : 'Allenamento Risonanza Squillo';
      description = isEn
        ? 'Targeted workout for vocal mask resonance, pharyngeal twang, and acoustic projection.'
        : 'Allenamento mirato per sviluppare risonanza in maschera, squillo e brillantezza vocale.';

      if (targetLevel === 'beginner') {
        steps = [
          {
            title: isEn ? 'Warm-up' : 'Riscaldamento',
            duration: '5 min',
            vowel: 'Lip Thrill / UUUH',
            focus: isEn ? 'Initial vocal tract activation' : 'Attivazione e riscaldamento iniziale',
            items: [
              'Lip Thrill (1 2 3) / UUUH (5 4 3 2 1)',
            ],
            instruction: isEn
              ? 'Start with Lip Thrill on 1 2 3 or gentle descending UUUH on 5 4 3 2 1 to awaken your vocal tract without tension.'
              : 'Inizia con Lip Thrill sul pattern 1 2 3 oppure con la discesa dolce 5 4 3 2 1 su UUUH per svegliare la voce in scioltezza.',
            targetTab: 'exercises',
          },
          {
            title: isEn ? 'Workout' : 'Allenamento',
            duration: '6 min',
            vowel: 'GNE GNE GNE',
            focus: isEn ? 'Mask resonance' : 'Risonanza in maschera e squillo',
            items: [
              'GNE GNE GNE',
            ],
            instruction: isEn
              ? 'Sing GNE GNE GNE feeling direct acoustic buzzing in the mask and cheekbones.'
              : 'Canta GNE GNE GNE sentendo la vibrazione focalizzata negli zigomi e nella maschera facciale.',
            targetTab: 'workout',
          },
          {
            title: isEn ? 'Cooldown' : 'Defaticamento',
            duration: '3 min',
            vowel: 'WEE / UUUH / Cannuccia',
            focus: isEn ? 'Vocal decompression and relaxation' : 'Decompressione laringea e defaticamento',
            items: [
              'Esercizio a scelta (WEE / UUUH / Cannuccia)',
            ],
            instruction: isEn
              ? 'Choose a gentle cooldown exercise (WEE, UUUH, or Straw) to decompress vocal folds.'
              : 'Scegli un esercizio di defaticamento (WEE, UUUH o Cannuccia) per decomprimere le corde vocali.',
            targetTab: 'cooldown',
          },
        ];
      } else if (targetLevel === 'intermediate') {
        steps = [
          {
            title: isEn ? 'Warm-up' : 'Riscaldamento',
            duration: '5 min',
            vowel: 'Lip Thrill / UUUH',
            focus: isEn ? '5-note scale warm-up' : 'Riscaldamento ed elasticità su scala a 5 note',
            items: [
              'Lip Thrill (12345) / UUUH (54321)',
            ],
            instruction: isEn
              ? 'Warm up on 12345 with Lip Thrill or descend smoothly on UUUH 54321.'
              : 'Riscaldati sulla scala 12345 con Lip Thrill oppure con la discesa UUUH 54321.',
            targetTab: 'exercises',
          },
          {
            title: isEn ? 'Workout' : 'Allenamento',
            duration: '6 min',
            vowel: 'NAY',
            focus: isEn ? 'Pharyngeal twang & projection on 3 notes' : 'Squillo e proiezione vocale su 3 note',
            items: [
              'NAY (123)',
            ],
            instruction: isEn
              ? 'Sing NAY on 123 with bright pharyngeal twang to project sound forward with ease.'
              : 'Canta NAY sul pattern 123 sfruttando lo squillo e il twang anteriore per proiettare la voce.',
            targetTab: 'workout',
          },
          {
            title: isEn ? 'Cooldown' : 'Defaticamento',
            duration: '3 min',
            vowel: 'WEE / UUUH / Cannuccia',
            focus: isEn ? 'Vocal decompression and relaxation' : 'Decompressione laringea e defaticamento',
            items: [
              'Esercizio a scelta (WEE / UUUH / Cannuccia)',
            ],
            instruction: isEn
              ? 'Choose a gentle cooldown exercise (WEE, UUUH, or Straw) to decompress vocal folds.'
              : 'Scegli un esercizio di defaticamento (WEE, UUUH o Cannuccia) per decomprimere le corde vocali.',
            targetTab: 'cooldown',
          },
        ];
      } else {
        totalTime = 15;
        steps = [
          {
            title: isEn ? 'Warm-up' : 'Riscaldamento',
            duration: '6 min',
            vowel: 'Lip Thrill / UUUH / NG / NEE',
            focus: isEn ? '5-note SOVT & compound arpeggio' : 'Attivazione SOVT e arpeggio composto',
            items: [
              'Lip Thrill (12345) / UUUH (54321)',
              'Lip Thrill - NG - NEE (Arpeggio Composto)',
            ],
            instruction: isEn
              ? 'Execute Lip Thrill (12345) / UUUH (54321) and Lip Thrill - NG - NEE (Compound Arpeggio).'
              : 'Esegui Lip Thrill (12345) / UUUH (54321) e Lip Thrill - NG - NEE (Arpeggio Composto).',
            targetTab: 'exercises',
          },
          {
            title: isEn ? 'Workout' : 'Allenamento',
            duration: '6 min',
            vowel: 'MNE / NAY',
            focus: isEn ? 'Fixed note mask resonance & Squillo octave run' : 'Risonanza su nota fissa e squillo su estensione',
            items: [
              'MNE nota fissa',
              'NAY (135 - 888 - 8531)',
            ],
            instruction: isEn
              ? 'Sing MNE on sustained note and NAY on 135 - 888 - 8531.'
              : 'Canta MNE su nota fissa e NAY sul pattern 135 - 888 - 8531 con twang proiettato.',
            targetTab: 'workout',
          },
          {
            title: isEn ? 'Cooldown' : 'Defaticamento',
            duration: '3 min',
            vowel: 'WEE / UUUH / Cannuccia',
            focus: isEn ? 'Vocal decompression and relaxation' : 'Decompressione laringea e defaticamento',
            items: [
              'Esercizio a scelta (WEE / UUUH / Cannuccia)',
            ],
            instruction: isEn
              ? 'Choose a gentle cooldown exercise (WEE, UUUH, or Straw) to decompress vocal folds.'
              : 'Scegli un esercizio di defaticamento (WEE, UUUH o Cannuccia) per decomprimere le corde vocali.',
            targetTab: 'cooldown',
          },
        ];
      }
    }
    // --- 4. ALLENAMENTO VOCE MISTA ---
    else if (targetGoal === 'mix') {
      routineName = isEn ? 'Mixed Voice Workout' : 'Allenamento Voce Mista';
      description = isEn
        ? 'Chest-to-head register blending, passaggio crossover, and balanced mix placement.'
        : 'Connessione fluida tra petto e testa, superamento del passaggio e bilanciamento della voce mista.';

      if (targetLevel === 'beginner') {
        totalTime = 14;
        steps = [
          {
            title: isEn ? 'Warm-up' : 'Riscaldamento',
            duration: '5 min',
            vowel: 'SOVT / UUUH',
            focus: isEn ? '3-note SOVT & descending 5-note release' : 'Attivazione SOVT su 3 note e discesa 5 note',
            items: [
              'SOVT a scelta (123) / UUUH (54321)',
            ],
            instruction: isEn
              ? 'Execute chosen SOVT (123) or descending UUUH (54321).'
              : 'Esegui SOVT a scelta (123) oppure discesa UUUH (54321).',
            targetTab: 'exercises',
          },
          {
            title: isEn ? 'Workout' : 'Allenamento',
            duration: '6 min',
            vowel: 'MEEE',
            focus: isEn ? 'Forward mix resonance on 4 notes' : 'Risonanza e passaggio su scala a 4 note',
            items: [
              'MEEE (1234)',
            ],
            instruction: isEn
              ? 'Sing MEEE on 1234 focusing narrow, forward mix placement without pushing.'
              : 'Canta MEEE sul pattern 1234 mantenendo la risonanza alta e senza forzare la voce di petto.',
            targetTab: 'workout',
          },
          {
            title: isEn ? 'Cooldown' : 'Defaticamento',
            duration: '3 min',
            vowel: 'WEE / UUUH / Cannuccia',
            focus: isEn ? 'Vocal decompression and relaxation' : 'Decompressione laringea e defaticamento',
            items: [
              'Esercizio a scelta (WEE / UUUH / Cannuccia)',
            ],
            instruction: isEn
              ? 'Choose a gentle cooldown exercise (WEE, UUUH, or Straw) to decompress vocal folds.'
              : 'Scegli un esercizio di defaticamento (WEE, UUUH o Cannuccia) per decomprimere le corde vocali.',
            targetTab: 'cooldown',
          },
        ];
      } else if (targetLevel === 'intermediate') {
        totalTime = 15;
        steps = [
          {
            title: isEn ? 'Warm-up' : 'Riscaldamento',
            duration: '6 min',
            vowel: 'SOVT / UUUH / MAM',
            focus: isEn ? '5-note SOVT & sustained note stability' : 'Attivazione SOVT 5 note e tenuta su nota fissa',
            items: [
              'SOVT a scelta (12345) / UUUH (54321)',
              'MAM (11111)',
            ],
            instruction: isEn
              ? 'Execute chosen SOVT (12345) / UUUH (54321) and MAM (11111).'
              : 'Esegui SOVT a scelta (12345) oppure discesa UUUH (54321) e MAM (11111).',
            targetTab: 'exercises',
          },
          {
            title: isEn ? 'Workout' : 'Allenamento',
            duration: '6 min',
            vowel: 'MEEE / MUM',
            focus: isEn ? '4-note phrase & octave arpeggio mix' : 'Fraseggio brillante su 4 note e arpeggio d\'ottava',
            items: [
              'MEEE (1234 - 1234)',
              'MUM (1358)',
            ],
            instruction: isEn
              ? 'Sing MEEE (1234 - 1234) and MUM (1358) maintaining stable larynx and narrow vowels.'
              : 'Canta MEEE (1234 - 1234) e MUM (1358) mantenendo laringe stabile e passaggio fluido.',
            targetTab: 'workout',
          },
          {
            title: isEn ? 'Cooldown' : 'Defaticamento',
            duration: '3 min',
            vowel: 'WEE / UUUH / Cannuccia',
            focus: isEn ? 'Vocal decompression and relaxation' : 'Decompressione laringea e defaticamento',
            items: [
              'Esercizio a scelta (WEE / UUUH / Cannuccia)',
            ],
            instruction: isEn
              ? 'Choose a gentle cooldown exercise (WEE, UUUH, or Straw) to decompress vocal folds.'
              : 'Scegli un esercizio di defaticamento (WEE, UUUH o Cannuccia) per decomprimere le corde vocali.',
            targetTab: 'cooldown',
          },
        ];
      } else {
        totalTime = 15;
        steps = [
          {
            title: isEn ? 'Warm-up' : 'Riscaldamento',
            duration: '6 min',
            vowel: 'SOVT / MMM MEE / Lip Thrill - NG - NEE',
            focus: isEn ? 'Advanced SOVT & compound arpeggio' : 'Attivazione SOVT e arpeggio composto',
            items: [
              'SOVT a scelta (12345) / MMM MEE (12345 - 12345)',
              'SOVT a scelta (1358) / Lip Thrill - NG - NEE (Arpeggio Composto)',
            ],
            instruction: isEn
              ? 'Execute chosen SOVT (12345) / MMM MEE (12345 - 12345) and SOVT (1358) / Lip Thrill - NG - NEE (Compound Arpeggio).'
              : 'Esegui SOVT a scelta (12345) / MMM MEE (12345 - 12345) e SOVT (1358) / Lip Thrill - NG - NEE (Arpeggio Composto).',
            targetTab: 'exercises',
          },
          {
            title: isEn ? 'Workout' : 'Allenamento',
            duration: '6 min',
            vowel: 'MEEE / MAM / MNE',
            focus: isEn ? '4-note run, 5th jump & glissando release' : 'Fraseggio 4 note, salto di quinta e rilascio in glissando',
            items: [
              'MEEE (1234 - 1234)',
              'MAM (11151)',
              'MNE + Glissando',
            ],
            instruction: isEn
              ? 'Sing MEEE (1234 - 1234), MAM (11151), and MNE with smooth glissando release.'
              : 'Canta MEEE (1234 - 1234), MAM (11151) e MNE con glissando fluido.',
            targetTab: 'workout',
          },
          {
            title: isEn ? 'Cooldown' : 'Defaticamento',
            duration: '3 min',
            vowel: 'WEE / UUUH / Cannuccia',
            focus: isEn ? 'Vocal decompression and relaxation' : 'Decompressione laringea e defaticamento',
            items: [
              'Esercizio a scelta (WEE / UUUH / Cannuccia)',
            ],
            instruction: isEn
              ? 'Choose a gentle cooldown exercise (WEE, UUUH, or Straw) to decompress vocal folds.'
              : 'Scegli un esercizio di defaticamento (WEE, UUUH o Cannuccia) per decomprimere le corde vocali.',
            targetTab: 'cooldown',
          },
        ];
      }
    }
    // --- 5. ALLENAMENTO AGILITÀ ---
    else if (targetGoal === 'agility') {
      routineName = isEn ? 'Agility Workout' : 'Allenamento Agilità';
      description = isEn
        ? 'Train speed, laryngeal flexibility, and fast runs.'
        : 'Allena la velocità di articolazione, la flessibilità laringea e la precisione nei passaggi rapidi.';

      if (targetLevel === 'beginner') {
        totalTime = 14;
        steps = [
          {
            title: isEn ? 'Warm-up' : 'Riscaldamento',
            duration: '5 min',
            vowel: 'SOVT / UUUH',
            focus: isEn ? '3-note SOVT & descending 5-note release' : 'SOVT su 3 note e discesa 5 note',
            items: [
              'SOVT a scelta (123) / UUUH (54321)',
            ],
            instruction: isEn
              ? 'Execute chosen SOVT (123) or descending UUUH (54321).'
              : 'Esegui SOVT a scelta (123) oppure discesa UUUH (54321).',
            targetTab: 'exercises',
          },
          {
            title: isEn ? 'Workout' : 'Allenamento',
            duration: '6 min',
            vowel: 'MEEE / MUM',
            focus: isEn ? '4-note agility & octave run' : 'Fraseggio a 4 note e arpeggio esteso',
            items: [
              'MEEE (1234 - 1234) / MUM (135 888 8531)',
            ],
            instruction: isEn
              ? 'Sing MEEE (1234 - 1234) or MUM on octave run (135 888 8531).'
              : 'Canta MEEE (1234 - 1234) oppure MUM sul pattern (135 888 8531) con articolazione agile.',
            targetTab: 'workout',
          },
          {
            title: isEn ? 'Cooldown' : 'Defaticamento',
            duration: '3 min',
            vowel: 'WEE / UUUH / Cannuccia',
            focus: isEn ? 'Vocal decompression and relaxation' : 'Decompressione laringea e defaticamento',
            items: [
              'Esercizio a scelta (WEE / UUUH / Cannuccia)',
            ],
            instruction: isEn
              ? 'Choose a gentle cooldown exercise (WEE, UUUH, or Straw) to decompress vocal folds.'
              : 'Scegli un esercizio di defaticamento a scelta per decomprimere le corde vocali.',
            targetTab: 'cooldown',
          },
        ];
      } else if (targetLevel === 'intermediate') {
        totalTime = 15;
        steps = [
          {
            title: isEn ? 'Warm-up' : 'Riscaldamento',
            duration: '5 min',
            vowel: 'SOVT / UUUH / MAM',
            focus: isEn ? '5-note SOVT & sustained note stability' : 'Attivazione SOVT a 5 note e tenuta su nota fissa',
            items: [
              'SOVT a scelta (12345) / UUUH (54321)',
              'MAM (11111)',
            ],
            instruction: isEn
              ? 'Execute chosen SOVT (12345) / UUUH (54321) and MAM (11111).'
              : 'Esegui SOVT a scelta (12345) o discesa UUUH (54321) e stabilità su MAM (11111).',
            targetTab: 'exercises',
          },
          {
            title: isEn ? 'Workout' : 'Allenamento',
            duration: '7 min',
            vowel: 'MEEE / MUM / MI ME MA MO MU',
            focus: isEn ? '4-note phrase, octave run & vowel agility' : 'Fraseggio a 4 note, arpeggio d\'ottava e cambi vocalici',
            items: [
              'MEEE (1234 - 1234) / MUM (1358)',
              'MI ME MA MO MU (1234)',
            ],
            instruction: isEn
              ? 'Sing MEEE (1234 - 1234), MUM (1358) and MI ME MA MO MU (1234).'
              : 'Canta MEEE (1234 - 1234), MUM (1358) e la sequenza MI ME MA MO MU (1234).',
            targetTab: 'workout',
          },
          {
            title: isEn ? 'Cooldown' : 'Defaticamento',
            duration: '3 min',
            vowel: 'WEE / UUUH / Cannuccia',
            focus: isEn ? 'Vocal decompression and relaxation' : 'Decompressione laringea e defaticamento',
            items: [
              'Esercizio a scelta (WEE / UUUH / Cannuccia)',
            ],
            instruction: isEn
              ? 'Choose a gentle cooldown exercise (WEE, UUUH, or Straw) to decompress vocal folds.'
              : 'Scegli un esercizio di defaticamento a scelta per decomprimere le corde vocali.',
            targetTab: 'cooldown',
          },
        ];
      } else {
        // Avanzato
        totalTime = 17;
        steps = [
          {
            title: isEn ? 'Warm-up' : 'Riscaldamento',
            duration: '6 min',
            vowel: 'SOVT / MMM MEE / Lip Thrill - NG - NEE',
            focus: isEn ? '5-note & octave SOVT, compound arpeggio' : 'Attivazione SOVT e arpeggio composto',
            items: [
              'SOVT a scelta (12345) / MMM MEE (12345 - 12345)',
              'SOVT a scelta (1358) / Lip Thrill - NG - NEE (Arpeggio Composto)',
            ],
            instruction: isEn
              ? 'Execute chosen SOVT (12345) / MMM MEE (12345 - 12345) and SOVT (1358) / Lip Thrill - NG - NEE (Arpeggio Composto).'
              : 'Esegui SOVT a scelta (12345) / MMM MEE (12345 - 12345) e SOVT a scelta (1358) / Lip Thrill - NG - NEE (Arpeggio Composto).',
            targetTab: 'exercises',
          },
          {
            title: isEn ? 'Workout' : 'Allenamento',
            duration: '8 min',
            vowel: 'MEEE / MAM / MI ME MA MO MU / MA MO MA',
            focus: isEn ? '4-note phrase, 5th jump, vowel cycles & compound agility run' : 'Fraseggio 4 note, salto di quinta, sequenza vocalica e arpeggio composto rapido',
            items: [
              'MEEE (1234 - 1234) / MAM (11151)',
              'MI ME MA MO MU (1234)',
              'MA MO MA (1358 - 13531 - 1358)',
            ],
            instruction: isEn
              ? 'Execute MEEE (1234 - 1234) / MAM (11151), MI ME MA MO MU (1234) and MA MO MA (1358 - 13531 - 1358).'
              : 'Canta MEEE (1234 - 1234) / MAM (11151), la sequenza MI ME MA MO MU (1234) e l\'arpeggio agile MA MO MA (1358 - 13531 - 1358).',
            targetTab: 'workout',
          },
          {
            title: isEn ? 'Cooldown' : 'Defaticamento',
            duration: '3 min',
            vowel: 'WEE / UUUH / Cannuccia',
            focus: isEn ? 'Vocal decompression and relaxation' : 'Decompressione laringea e defaticamento',
            items: [
              'Esercizio a scelta (WEE / UUUH / Cannuccia)',
            ],
            instruction: isEn
              ? 'Choose a gentle cooldown exercise (WEE, UUUH, or Straw) to decompress vocal folds.'
              : 'Scegli un esercizio di defaticamento a scelta per decomprimere le corde vocali.',
            targetTab: 'cooldown',
          },
        ];
      }
    }
    // --- 6. DEFATICAMENTO ---
    else {
      routineName = isEn ? 'Vocal Cooldown & Decompression' : 'Defaticamento Vocale';
      description = isEn
        ? 'Decompress vocal cords, relieve laryngeal tension, and gently restore vocal rest state.'
        : 'Decomprime la mucosa cordale, allenta le tensioni accumulate e ripristina la condizione di riposo della voce.';

      if (targetLevel === 'beginner') {
        totalTime = 6;
        steps = [
          {
            title: isEn ? 'Cooldown' : 'Defaticamento',
            duration: '5-6 min',
            vowel: 'WEE / UUUH / LIP THRILL',
            focus: isEn ? '5th interval gentle glissando decompression' : 'Decompressione laringea con glissando di quinta',
            items: [
              'WEE / UUUH / LIP THRILL Glissando quinta',
            ],
            instruction: isEn
              ? 'Sing gentle 5th interval glides (1-5-1) choosing between WEE, UUUH, or Lip Thrill to release tension.'
              : 'Esegui scivolamenti morbidi di quinta (1-5-1) a scelta tra WEE, UUUH o Lip Thrill per decomprimere la laringe.',
            targetTab: 'cooldown',
          },
        ];
      } else if (targetLevel === 'intermediate') {
        totalTime = 6;
        steps = [
          {
            title: isEn ? 'Cooldown' : 'Defaticamento',
            duration: '5-6 min',
            vowel: 'WEE / UUUH / LIP THRILL',
            focus: isEn ? '5-note descending gentle scale' : 'Discesa rilassante su scala a 5 note (54321)',
            items: [
              'WEE / UUUH / LIP THRILL (54321)',
            ],
            instruction: isEn
              ? 'Sing smooth descending 5-note scales (54321) on WEE, UUUH, or Lip Thrill to bring voice back to rest.'
              : 'Canta la scala discendente 54321 scegliendo tra WEE, UUUH o Lip Thrill per riportare la voce in posizione di riposo.',
            targetTab: 'cooldown',
          },
        ];
      } else {
        // Avanzato
        totalTime = 7;
        steps = [
          {
            title: isEn ? 'Cooldown' : 'Defaticamento',
            duration: '6-8 min',
            vowel: 'WEE / UUUH / LIP THRILL',
            focus: isEn ? 'Octave glide decompression & descending scale as needed' : 'Decompressione su glissando d\'ottava e discesa a 5 note al bisogno',
            items: [
              'WEE / UUUH / LIP THRILL Glissando Ottava',
              'WEE / UUUH / LIP THRILL (54321) (al bisogno)',
            ],
            instruction: isEn
              ? 'Execute full octave glides (1-8-1) on WEE, UUUH, or Lip Thrill. Add 54321 descending scale as needed.'
              : 'Esegui glissandi completi di ottava (1-8-1) su WEE, UUUH o Lip Thrill. Al bisogno aggiungere anche la discesa 54321.',
            targetTab: 'cooldown',
          },
        ];
      }
    }

    return {
      id: `${targetGoal}_${targetLevel}_${choiceKey}`,
      name: routineName,
      description,
      totalDurationMinutes: totalTime,
      level: targetLevel === 'beginner' ? (isEn ? 'Beginner' : 'Principiante') : targetLevel === 'advanced' ? (isEn ? 'Advanced' : 'Avanzato') : (isEn ? 'Intermediate' : 'Intermedio'),
      steps,
    };
  };

  const handleGenerate = () => {
    const routine = buildRoutineSteps(goal, level, quickWarmupChoice);
    setActiveRoutine(routine);
  };

  const handleStartRoutine = () => {
    if (!activeRoutine || activeRoutine.steps.length === 0) return;
    startRoutineQueue(activeRoutine.name, activeRoutine.level, activeRoutine.steps, 0);
    onNavigate(activeRoutine.steps[0].targetTab, 'routine', isEn ? 'Routine Generator' : 'Generatore di Routine');
  };

  const handleStartStep = (stepIndex: number) => {
    if (!activeRoutine || !activeRoutine.steps[stepIndex]) return;
    startRoutineQueue(activeRoutine.name, activeRoutine.level, activeRoutine.steps, stepIndex);
    onNavigate(activeRoutine.steps[stepIndex].targetTab, 'routine', isEn ? 'Routine Generator' : 'Generatore di Routine');
  };

  const handleSwitchOption = (optKey: string) => {
    setQuickWarmupChoice(optKey);
    const updated = buildRoutineSteps(goal, level, optKey);
    setActiveRoutine(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Mode Switcher Bar */}
      <div className="flex items-center justify-center">
        <div className="bg-slate-900/90 border border-sky-400/50 p-1.5 rounded-2xl flex items-center gap-1.5 shadow-xl backdrop-blur-sm max-w-full overflow-x-auto">
          <button
            type="button"
            onClick={() => setRoutineMode('guided')}
            className={`px-4 sm:px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              routineMode === 'guided'
                ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{isEn ? 'Guided Routine Generator' : 'Generatore Guidato per Obiettivo'}</span>
          </button>

          <button
            type="button"
            onClick={() => setRoutineMode('custom')}
            className={`px-4 sm:px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              routineMode === 'custom'
                ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>{isEn ? 'Build Custom Routine' : 'Costruisci la tua Routine'}</span>
          </button>
        </div>
      </div>

      {routineMode === 'custom' ? (
        <CustomRoutineBuilder onNavigate={onNavigate} />
      ) : (
        <>
          {/* Header Info */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header Centrato */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-sky-500 mx-auto flex items-center justify-center shadow-lg shadow-cyan-600/30 mb-2">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {isEn ? 'Custom Vocal Routine Generator' : 'Generatore Routine su Misura'}
          </h2>
          <p className="text-slate-400 text-[13px] leading-relaxed">
            {isEn ? (
              <>
                Select your goal and your vocal level, then click <strong>Generate My Routine</strong>.
                <br />
                Echora will build your personalized guided exercise plan!
              </>
            ) : (
              <>
                Seleziona il tuo obiettivo e il tuo livello vocale, poi clicca su <strong>Genera la Mia Routine</strong>.
                <br />
                Echora comporrà la scheda con la sequenza di esercizi ideale per te!
              </>
            )}
          </p>
        </div>

        {/* Selection Form */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Goal Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-sky-400" />
                <span>{isEn ? 'Primary Goal' : 'Obiettivo Principale'}</span>
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-sky-500"
              >
                <option value="warmup_quick">
                  {isEn ? 'Riscaldamento rapido (5/10 minuti)' : 'Riscaldamento rapido (5/10 minuti)'}
                </option>
                <option value="warmup_intense">
                  {isEn ? 'Riscaldamento intenso' : 'Riscaldamento intenso'}
                </option>
                <option value="resonance">
                  {isEn ? 'Allenamento risonanza squillo' : 'Allenamento risonanza squillo'}
                </option>
                <option value="mix">
                  {isEn ? 'Allenamento voce mista' : 'Allenamento voce mista'}
                </option>
                <option value="agility">
                  {isEn ? 'Allenamento agilità' : 'Allenamento agilità'}
                </option>
                <option value="cooldown">
                  {isEn ? 'Defaticamento' : 'Defaticamento'}
                </option>
              </select>
            </div>

            {/* Level Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>{isEn ? 'Vocal Level' : 'Livello Vocale'}</span>
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-sky-500"
              >
                <option value="beginner">{isEn ? 'Beginner' : 'Principiante'}</option>
                <option value="intermediate">{isEn ? 'Intermediate' : 'Intermedio'}</option>
                <option value="advanced">{isEn ? 'Advanced' : 'Avanzato'}</option>
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-sky-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer hover:scale-[1.01]"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isEn ? 'Generate My Routine' : 'Genera la Mia Routine'}</span>
        </button>
      </div>

      {/* Generated Routine Card */}
      {activeRoutine && (
        <div className="bg-slate-900 border border-sky-400/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fadeIn">
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wider bg-amber-950 px-3 py-1 rounded-full border border-amber-800">
                  🎯 {activeRoutine.level}
                </span>
              </div>
              <h3 className="text-2xl font-black text-white mt-2">{activeRoutine.name}</h3>
            </div>

            <button
              onClick={handleStartRoutine}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isEn ? 'Start Exercise Routine' : 'Avvia la Tua Routine'}</span>
            </button>
          </div>

          {/* Sottoscheda di Scelta Opzioni: compare DOPO aver generato la routine */}
          {goal === 'warmup_quick' && (
            <div className="bg-slate-950/90 border border-sky-500/40 rounded-2xl p-4 sm:p-5 space-y-3 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-xs font-black text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>
                    {isEn ? 'Select your preferred warmup exercise:' : 'Scegli la modalità di riscaldamento che preferisci:'}
                  </span>
                </label>
                <span className="text-[11px] font-semibold text-sky-400/90 bg-sky-950/60 px-2.5 py-0.5 rounded-full border border-sky-800/60 self-start sm:self-auto">
                  {level === 'beginner' ? 'Scegli Opzione A / Opzione B' : 'Scegli un\'opzione'}
                </span>
              </div>

              {level === 'beginner' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Opzione A */}
                  <button
                    type="button"
                    onClick={() => handleSwitchOption('opt1')}
                    className={`text-left p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                      quickWarmupChoice === 'opt1'
                        ? 'bg-sky-500/20 border-sky-400 text-white shadow-lg shadow-sky-500/20 ring-1 ring-sky-400'
                        : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${quickWarmupChoice === 'opt1' ? 'bg-sky-400 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                          Opzione A
                        </span>
                        <span className="text-xs font-bold text-white">Esercizio SOVT</span>
                      </div>
                      {quickWarmupChoice === 'opt1' && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
                    </div>
                    <div className="text-xs font-bold text-sky-200">
                      Lip Thrill / Cannuccia / Trillo (1 2 3)
                    </div>
                    <p className="mt-1.5 text-[10.5px] text-slate-300 font-normal leading-relaxed">
                      Esegui il pattern melodico (1 2 3) con uno dei 3 esercizi SOVT suggeriti
                    </p>
                  </button>

                  {/* Opzione B */}
                  <button
                    type="button"
                    onClick={() => handleSwitchOption('opt2')}
                    className={`text-left p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                      quickWarmupChoice === 'opt2'
                        ? 'bg-sky-500/20 border-sky-400 text-white shadow-lg shadow-sky-500/20 ring-1 ring-sky-400'
                        : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${quickWarmupChoice === 'opt2' ? 'bg-sky-400 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                          Opzione B
                        </span>
                        <span className="text-xs font-bold text-white">Vocalizzi</span>
                      </div>
                      {quickWarmupChoice === 'opt2' && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
                    </div>
                    <div className="text-xs font-bold text-sky-200">
                      MMM (1 2 3) / UUUH (5 4 3 2 1)
                    </div>
                    <p className="mt-1.5 text-[10.5px] text-slate-300 font-normal leading-relaxed">
                      Riscaldati con i vocalizzi se li preferisci agli SOVT, scegli tra MMM 1 2 3 o UUUH 54321
                    </p>
                  </button>
                </div>
              )}

              {level === 'intermediate' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSwitchOption('opt1')}
                    className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      quickWarmupChoice === 'opt1'
                        ? 'bg-sky-500/20 border-sky-400 text-white shadow-md shadow-sky-500/10 ring-1 ring-sky-400'
                        : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Opzione A</span>
                      {quickWarmupChoice === 'opt1' && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />}
                    </div>
                    <p className="mt-1 text-xs text-sky-200 font-bold">
                      Lip Thrill / Cannuccia / Trillo (1 2 3 4 5)
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchOption('opt2')}
                    className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      quickWarmupChoice === 'opt2'
                        ? 'bg-sky-500/20 border-sky-400 text-white shadow-md shadow-sky-500/10 ring-1 ring-sky-400'
                        : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Opzione B</span>
                      {quickWarmupChoice === 'opt2' && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />}
                    </div>
                    <p className="mt-1 text-xs text-sky-200 font-bold">
                      MMM (1 2 3 4 5)
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchOption('opt3')}
                    className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      quickWarmupChoice === 'opt3'
                        ? 'bg-sky-500/20 border-sky-400 text-white shadow-md shadow-sky-500/10 ring-1 ring-sky-400'
                        : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Opzione C</span>
                      {quickWarmupChoice === 'opt3' && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />}
                    </div>
                    <p className="mt-1 text-xs text-sky-200 font-bold">
                      UUUH (5 4 3 2 1)
                    </p>
                  </button>
                </div>
              )}

              {level === 'advanced' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSwitchOption('opt1')}
                    className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      quickWarmupChoice === 'opt1'
                        ? 'bg-sky-500/20 border-sky-400 text-white shadow-md shadow-sky-500/10 ring-1 ring-sky-400'
                        : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Opzione A</span>
                      {quickWarmupChoice === 'opt1' && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />}
                    </div>
                    <p className="mt-1 text-xs text-sky-200 font-bold">
                      Lip Thrill / Cannuccia / Trillo (1 2 3 4 5)
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchOption('opt2')}
                    className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      quickWarmupChoice === 'opt2'
                        ? 'bg-sky-500/20 border-sky-400 text-white shadow-md shadow-sky-500/10 ring-1 ring-sky-400'
                        : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Opzione B</span>
                      {quickWarmupChoice === 'opt2' && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />}
                    </div>
                    <p className="mt-1 text-xs text-sky-200 font-bold">
                      Arpeggio di Ottava (1 3 5 8)
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchOption('opt3')}
                    className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      quickWarmupChoice === 'opt3'
                        ? 'bg-sky-500/20 border-sky-400 text-white shadow-md shadow-sky-500/10 ring-1 ring-sky-400'
                        : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Opzione C</span>
                      {quickWarmupChoice === 'opt3' && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />}
                    </div>
                    <p className="mt-1 text-xs text-sky-200 font-bold">
                      MMM ME (1 2 3 4 5  1 2 3 4 5)
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchOption('opt4')}
                    className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      quickWarmupChoice === 'opt4'
                        ? 'bg-sky-500/20 border-sky-400 text-white shadow-md shadow-sky-500/10 ring-1 ring-sky-400'
                        : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Opzione D</span>
                      {quickWarmupChoice === 'opt4' && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />}
                    </div>
                    <p className="mt-1 text-xs text-sky-200 font-bold">
                      Lip Thrill - NG - NEE (Arpeggio Composto)
                    </p>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Steps */}
          <div className="space-y-4">
            <h4 className="text-sm font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-400" />
              <span>{isEn ? 'Exercise Sequence' : 'Sequenza degli Esercizi'}</span>
            </h4>

            {activeRoutine.steps.map((step, idx) => (
              <div
                key={idx}
                className="bg-slate-950/90 border border-slate-800 hover:border-sky-500/40 p-4 sm:p-5 rounded-2xl transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <span className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-300 font-extrabold text-xs flex items-center justify-center border border-sky-400/40 shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="space-y-1.5">
                      <h5 className="font-bold text-white text-sm sm:text-base">{step.title}</h5>
                      {step.items && step.items.length > 0 && (
                        <ul className="text-xs sm:text-sm text-slate-300 space-y-1 font-medium pt-0.5">
                          {step.items.map((it, i) => (
                            <li key={i} className="flex items-center gap-2 text-sky-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                              <span>{it}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                    <button
                      onClick={() => handleStartStep(idx)}
                      className="px-3.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/50 text-sky-300 hover:text-white font-bold flex items-center gap-1.5 transition-all cursor-pointer text-xs sm:text-sm shadow-sm"
                    >
                      <span>{isEn ? 'Open Player' : 'Apri Player'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

          {/* Mandatory Disclaimer Note for Routine Generator */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex items-start gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed">
                <strong className="text-amber-300 font-bold">Nota bene:</strong> questa routine è generica e non è pensata per i tuoi bisogni specifici, è sempre bene farsi seguire da un insegnante.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Direct 1-on-1 Coaching Card with Francesca */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border border-sky-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>{isEn ? '1-on-1 Vocal Coaching' : 'Lezioni & Coaching 1 a 1'}</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white">
            {isEn ? 'Study & Sing with Francesca' : 'Studia e Canta con Francesca'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            {isEn
              ? 'Want personalized 1-on-1 vocal coaching or to join live singing workshops? Discover courses and book your session on Beacons.'
              : 'Vuoi fare lezioni di canto private con me o partecipare ai laboratori di canto in presenza e online? Scopri tutte le info e prenota la tua sessione su Beacons.'}
          </p>
        </div>
        <a
          href="https://beacons.ai/nielafreh"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-sky-500/25 flex items-center gap-2.5 transition-all hover:scale-105 shrink-0 cursor-pointer"
        >
          <span>{isEn ? 'Book 1-on-1 Session' : 'Prendi Lezioni o Laboratori con Me'}</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};
