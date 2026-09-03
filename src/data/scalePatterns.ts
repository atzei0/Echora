import { ScalePatternId } from '../types';

export interface ScalePatternConfig {
  id: ScalePatternId;
  label: string;
  labelEn?: string;
  shortFormula: string;
}

export const ALL_SCALE_PATTERNS: ScalePatternConfig[] = [
  { id: 'five_notes', label: '1. 12345 (Do-Re-Mi-Fa-Sol)', labelEn: '1. 12345 (5-Note Scale)', shortFormula: '1 2 3 4 5 4 3 2 1' },
  { id: 'scale_5_desc', label: '2. 54321 (Sol-Fa-Mi-Re-Do discendente)', labelEn: '2. 54321 (Descending 5th)', shortFormula: '5 4 3 2 1' },
  { id: 'gliss_5_1_desc', label: '3. 5 1 - Glissato di Quinta Discendente', labelEn: '3. 5 1 - Descending 5th Glissando', shortFormula: '5 → 1' },
  { id: 'siren_glide', label: '4. 1 8 1 - Glissato di Ottava (Sirena)', labelEn: '4. 1 8 1 - Octave Glissando (Siren)', shortFormula: '1 → 8 → 1' },
  { id: 'gliss_1_5_1', label: '5. 1 5 1 - Glissato di Quinta', labelEn: '5. 1 5 1 - 5th Glissando', shortFormula: '1 → 5 → 1' },
  { id: 'gliss_1_5', label: '6. 1 5 - Glissato Quinta Corta', labelEn: '6. 1 5 - Short 5th Glissando', shortFormula: '1 → 5' },
  { id: 'three_notes', label: '7. 123 (Do-Re-Mi-Re-Do)', labelEn: '7. 123 (3-Note Scale)', shortFormula: '1 2 3 2 1' },
  { id: 'triad', label: '8. 135 - Arpeggio Triade (Do-Mi-Sol)', labelEn: '8. 135 - Triad Arpeggio', shortFormula: '1 3 5 3 1' },
  { id: 'broad_arpeggio', label: '9. 1358 - Arpeggio di Ottava', labelEn: '9. 1358 - Octave Arpeggio', shortFormula: '1 3 5 8 5 3 1' },
  { id: 'arpeggio_531_desc', label: '10. 531 - Arpeggio Discendente', labelEn: '10. 531 - Descending Triad', shortFormula: '5 3 1' },
  { id: 'arpeggio_compound_desc', label: '11. 8531 531 31 - Arpeggio Composto', labelEn: '11. 8531 531 31 - Compound Arpeggio', shortFormula: '8531 531 31' },
  { id: 'lip_trill_run', label: '12. 1 9 1 - Scala Completa alla Nona', labelEn: '12. 1 9 1 - Full Scale to 9th', shortFormula: '1..9..1' },
  { id: 'scale_4_notes', label: '13. 1234 (Do-Re-Mi-Fa)', labelEn: '13. 1234 (4-Note Scale)', shortFormula: '1 2 3 4 3 2 1' },
  { id: 'scale_4_notes_5x', label: '14. 1234 - MI ME MA MO MU', labelEn: '14. 1234 - MI ME MA MO MU', shortFormula: '1234 x5' },
  { id: 'arpeggio_1358888531', label: '15. 135 888 8531 (MUM Agilità)', labelEn: '15. 135 888 8531 (MUM Agility)', shortFormula: '135 888 8531' },
  { id: 'scale_4_notes_2x', label: '16. 1234 - Doppio (1234 - 1234)', labelEn: '16. 1234 - Double (1234 - 1234)', shortFormula: '1234 - 1234' },
  { id: 'fixed_5_notes', label: '17. 1 1 1 1 1 - Nota Fissa x5', labelEn: '17. 1 1 1 1 1 - Sustained Note x5', shortFormula: '1 1 1 1 1' },
  { id: 'fixed_3_notes', label: '18. 1 1 1 - Nota Fissa x3', labelEn: '18. 1 1 1 - Sustained Note x3', shortFormula: '1 1 1' },
  { id: 'scale_mmm_me', label: '19. 12345 12345 (MMM ME)', labelEn: '19. 12345 12345 (MMM ME)', shortFormula: '12345 - 12345' },
  { id: 'scale_5_gliss_desc', label: '20. 12345 + Glissando 5 1', labelEn: '20. 12345 + 5 1 Glissando', shortFormula: '12345 + 5-1' },
  { id: 'arpeggio_13521', label: '21. 135 - 31 (Do-Mi-Sol-Mi-Do)', labelEn: '21. 135 - 31 (Do-Mi-Sol-Mi-Do)', shortFormula: '1 3 5 3 1' },
  { id: 'arpeggio_185', label: '22. 1 8 5 - Petto, Falsetto, Misto', labelEn: '22. 1 8 5 - Chest, Falsetto, Mix', shortFormula: '1 8 5' },
  { id: 'jump_5_1', label: '23. 111 51 (MAM)', labelEn: '23. 111 51 (MAM)', shortFormula: '1 1 1 5 1' },
  { id: 'arpeggio_55531', label: '24. 555 31 (Sol Sol Sol Mi Do)', labelEn: '24. 555 31 Arpeggio', shortFormula: '5 5 5 3 1' },
  { id: 'ninni_111_333_111', label: '25. 111 333 111 (NINNI)', labelEn: '25. 111 333 111 (NINNI)', shortFormula: '111 333 111' },
  { id: 'jump_13_15_18', label: '26. 1 3, 1 5, 1 8 - Intervalli Cresc.', labelEn: '26. 1 3, 1 5, 1 8 - Intervals', shortFormula: '1-3 1-5 1-8' },
  { id: 'ma_mo_ma_run', label: '27. 1358 - 13531 - 1358 (MA MO MA)', labelEn: '27. 1358 - 13531 - 1358 (MA MO MA)', shortFormula: '1358 13531 1358' },
];

export const getScalePatternLabel = (pat: { id: ScalePatternId; label: string }, lang: string) => {
  const found = ALL_SCALE_PATTERNS.find((p) => p.id === pat.id);
  if (lang === 'en' && found?.labelEn) {
    return found.labelEn;
  }
  return found?.label || pat.label;
};
