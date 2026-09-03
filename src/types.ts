export type NoteNotation = 'latin' | 'scientific'; // 'latin' = Do Re Mi, 'scientific' = C D E

export interface NoteInfo {
  nameLatin: string;      // Do4, Do#4, ecc.
  nameScientific: string; // C4, C#4, ecc.
  frequency: number;      // in Hz
  midi: number;           // 60 = C4
  octave: number;
  isAccidental: boolean;  // diesis / bemolle
}

export type ScalePatternId = 
  | 'five_notes'          // 1. do re mi fa sol fa mi re do (scala di quinta asc e desc)
  | 'scale_5_desc'        // 2. sol fa mi re do (scala di quinta descendente)
  | 'gliss_5_1_desc'      // 3. glissato discendente (5-1 sol do)
  | 'siren_glide'         // 4. glissato ottava 1-8-1 (do do do)
  | 'gliss_1_5_1'         // 5. glissato 1-5-1 (do sol do)
  | 'gliss_1_5'           // 6. glissato quinta corta 1-5 (do sol)
  | 'three_notes'         // 7. arpeggio 123 (do re mi re do)
  | 'triad'               // 8. arpeggio triade 135 (do mi sol mi do)
  | 'broad_arpeggio'      // 9. arpeggio ottava 1358 (6/8)
  | 'arpeggio_531_desc'   // 10. arpeggio discendente 531 (5/4)
  | 'arpeggio_compound_desc' // 11. arpeggio composto discendente
  | 'lip_trill_run'      // 12. scala completa alla nona (6/4)
  | 'scale_4_notes'       // 13. scala a 4 note 1234 321 in 4/4 (2 battute)
  | 'scale_4_notes_5x'    // 14. scala a 4 note 1234 321 x5 in 4/4 (6 battute)
  | 'arpeggio_1358888531' // 15. arpeggio ottava 1358888531 in 6/8 (15 ottavi)
  | 'scale_4_notes_2x'    // 16. scala a 4 note 1234 321 x2 in 4/4 (3 battute)
  | 'fixed_5_notes'       // 17. nota fissa x5 (1 1 1 1 1)
  | 'fixed_3_notes'       // 18. nota fissa x3 (1 1 1)
  | 'scale_mmm_me'        // 19. scala doppia 12345 432 - 12345 4321
  | 'scale_5_gliss_desc'  // 20. scala di quinta 12345 + glissando 5-1
  | 'arpeggio_13521'      // 21. arpeggio 135 - 31 (do mi sol mi do)
  | 'arpeggio_185'        // 22. salto 1 8 5 (petto - falsetto - misto)
  | 'jump_5_1'            // 23. salto di quinta 1 1 1 5 1
  | 'arpeggio_55531'      // 24. arpeggio 5 5 5 3 1 (sol sol sol mi do)
  | 'ninni_111_333_111'  // 25. ninni 111 333 111 (do do do mi mi mi do do do)
  | 'jump_13_15_18'      // 26. intervalli 13 - 15 - 18 (do mi - do sol - do do8)
  | 'ma_mo_ma_run';      // 27. ma mo ma (1358 12321 1358)

export type ExerciseCategory = 
  | 'SOVT'
  | 'Vocalizzi'
  | 'Voce Mista'
  | 'MIX'
  | 'Risonanze'
  | 'Agilità'
  | 'Adduzione'
  | 'Articolazione'
  | 'Ancoraggio'
  | 'Sostegno'
  | 'Dinamiche'
  | 'Defaticamento';

export interface Exercise {
  id: string;
  title: string;
  titleEn?: string;
  category: ExerciseCategory;
  description: string;
  descriptionEn?: string;
  scalePattern: ScalePatternId;
  allowedPatterns?: ScalePatternId[];
  defaultVowel: string;       // "AH", "OH", "EE", "MM", "Zzz"
  defaultTempoBpm: number;
  recommendedStartMidi: number; // e.g. 60 (C4)
  recommendedEndMidi: number;   // e.g. 72 (C5)
  direction: 'asc' | 'desc' | 'asc_desc';
  instructions: string[];
  instructionsEn?: string[];
  vocalTip: string;
  vocalTipEn?: string;
  targetFocus?: string;
  targetFocusEn?: string;
}

export interface PitchDetectionResult {
  detectedFreq: number;
  closestNote: NoteInfo;
  centsDiff: number;        // -50 to +50
  inTune: boolean;          // Math.abs(centsDiff) <= 15
  volume: number;           // 0 to 1
  clarity: number;          // 0 to 1 confidence
}

export type VoiceCategory = 
  | 'Soprano' 
  | 'Mezzo-Soprano' 
  | 'Contralto' 
  | 'Tenore' 
  | 'Baritono' 
  | 'Basso' 
  | 'Non determinato';

export interface VocalRangeProfile {
  lowestMidi: number;
  highestMidi: number;
  lowestNote: string;
  highestNote: string;
  totalSemitones: number;
  voiceCategory: VoiceCategory;
  testedAt: string;
}

export interface SavedRecording {
  id: string;
  date: string;
  exerciseTitle: string;
  durationSeconds: number;
  audioBlobUrl: string;
  note: string;
}

export interface PracticeSession {
  id: string;
  date: string;
  durationMinutes: number;
  exercisesCompleted: string[];
  notes?: string;
}

export interface RoutineStep {
  id: string;
  title: string;
  duration: string;
  instruction: string;
  scaleType: ScalePatternId | 'none';
  vowel: string;
  focus: string;
}

export interface CustomRoutine {
  routineName: string;
  description: string;
  totalDurationMinutes: number;
  steps: RoutineStep[];
}
