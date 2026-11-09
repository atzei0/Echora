import { Exercise } from '../types';

export const VOCAL_EXERCISES: Exercise[] = [
  // --- 1. SOVT ---
  {
    id: 'lip_thrill_warmup',
    title: 'LIP THRILL',
    category: 'SOVT',
    description: 'Riscalda delicatamente le corde vocali con la scala Do-Re-Mi-Fa-Sol-Fa-Mi-Re-Do.',
    scalePattern: 'five_notes',
    allowedPatterns: ['five_notes', 'scale_5_desc', 'gliss_5_1_desc', 'siren_glide', 'gliss_1_5_1', 'gliss_1_5', 'three_notes', 'triad', 'broad_arpeggio', 'arpeggio_531_desc', 'arpeggio_compound_desc', 'lip_trill_run'],
    defaultVowel: 'Lip Trill',
    defaultTempoBpm: 130,
    recommendedStartMidi: 45, // A2
    recommendedEndMidi: 67,   // G4
    direction: 'asc_desc',
    instructions: [
      'Fai vibrare le labbra come se stessi sbuffando.',
      'Cerca di farle vibrare per tutto un respiro.',
      'Ora cerca di aggiungere una nota a quella vibrazione.',
      'Ora prova a seguire la melodia dell\'esercizio.',
      'Ricorda di buttare fuori l\'aria e prendere un nuovo respiro al cambio di nota.',
      'Quando arrivi alle note alte piangi dalle sopracciglia, ossia fai l\'espressione imbronciata.',
      'Ricorda che questo è il riscaldamento quindi non dobbiamo performare arrivando a note altissime, sali fin dove trovi comodità e poi riscendi, assicurandoti di passare per entrambi i registri: petto e testa (M1 e M2).'
    ],
    instructionsEn: [
      'Make your lips vibrate as if you were snorting/fluttering.',
      'Try to keep them vibrating for an entire breath.',
      'Now try adding a vocal note to that vibration.',
      'Now try following the exercise melody.',
      'Remember to release your air and take a new breath at each key change.',
      'When reaching high notes, cry from your eyebrows—make a pouting expression.',
      'Remember this is a warm-up, so don\'t aim for extreme high notes: ascend as far as comfortable and descend, passing through both registers: chest and head (M1 and M2).'
    ],
    vocalTip: '• Cerca di fare uno sbuffo che inizi con la P o con la B a seconda di quello che ti dà meno problemi a far vibrare le labbra.\n• Se non vibrano le labbra prova a mettere le dita al centro delle guance all\'altezza dei pre-molari.\n• Se non ti esce per niente, allenati a sbuffare e basta per almeno una settimana ogni giorno, poi allenati con una nota singola a farla durare tutto il respiro.\n• Se ancora non ti viene l\'esercizio, allena il respiro con l\'esercizio SSS che trovi nella sezione Altri Strumenti - Respirazione.\n• Altrimenti puoi anche sostituire il Lip Thrill con uno degli altri SOVT.',
    vocalTipEn: '• Try starting with a flutter/snort that begins with a P or a B sound, depending on which helps your lips vibrate more easily.\n• If your lips don\'t vibrate, try placing your fingers in the center of your cheeks at premolar level.\n• If it doesn\'t work at all, practice just snorting/fluttering every day for at least a week, then practice holding a single note for a full breath.\n• If the exercise still doesn\'t work, train your breath with the SSS exercise found in the Other Tools - Breathing section.\n• Otherwise, you can also replace the Lip Trill with one of the other SOVT exercises.'
  },
  {
    id: 'cannuccia_sovt',
    title: 'CANNUCCIA',
    category: 'SOVT',
    description: 'Esercizio a tratto vocale semi-occluso con cannuccia per bilanciare la pressione dell\'aria e defaticare la voce.',
    scalePattern: 'five_notes',
    allowedPatterns: ['five_notes', 'scale_5_desc', 'gliss_5_1_desc', 'siren_glide', 'gliss_1_5_1', 'gliss_1_5', 'three_notes', 'triad', 'broad_arpeggio', 'arpeggio_531_desc', 'arpeggio_compound_desc', 'lip_trill_run'],
    defaultVowel: 'OOO',
    defaultTempoBpm: 130,
    recommendedStartMidi: 45,
    recommendedEndMidi: 67,
    direction: 'asc_desc',
    instructions: [
      'Riempi di acqua un bicchiere fino a metà o poco più',
      'Fai le bolle ed emetti un suono continuo attraverso la cannuccia facendo il pattern melodico scelto',
      'Ricorda di buttare fuori l\'aria e prendere un nuovo respiro al cambio di nota.',
      'Quando arrivi alle note alte piangi dalle sopracciglia, ossia fai l\'espressione imbronciata.',
      'Ricorda che questo è il riscaldamento quindi non dobbiamo performare arrivando a note altissime, sali fin dove trovi comodità e poi riscendi, assicurandoti di passare per entrambi i registri: petto e testa (M1 e M2).'
    ],
    instructionsEn: [
      'Fill a glass with water up to halfway or a little more',
      'Blow bubbles and emit a continuous vocal sound through the straw following your chosen melody pattern',
      'Remember to release your air and take a new breath at each key change.',
      'When reaching high notes, cry from your eyebrows—make a pouting expression.',
      'Remember this is a warm-up, so don\'t aim for extreme high notes: ascend as far as comfortable and descend, passing through both registers: chest and head (M1 and M2).'
    ],
    vocalTip: '• Puoi fare l\'esercizio anche solo con la cannuccia senza l\'acqua\n• Presta attenzione a mantenere un flusso d\'aria uniforme\n• Tieni la cannuccia con le dita, altrimenti accumulerai tensioni ai muscoli facciali\n• Presta attenzione a non poggiare la cannuccia sul fondo del bicchiere - Scegli quanto immergere la cannuccia: più a fondo è, maggiore sarà la resistenza dell\'acqua al flusso d\'aria (più pesante soffiare)',
    vocalTipEn: '• You can also perform the exercise with just the straw, without water\n• Pay attention to maintaining a steady, even airflow\n• Hold the straw with your fingers, otherwise you will accumulate tension in your facial muscles\n• Be careful not to rest the straw on the bottom of the glass - Choose how deep to submerge it: the deeper it is, the higher the water resistance to airflow (harder to blow)'
  },
  {
    id: 'trillo_sovt',
    title: 'TRILLO',
    category: 'SOVT',
    description: 'Trillo di lingua per sciogliere la laringe e attivare la vibrazione anteriore.',
    scalePattern: 'five_notes',
    allowedPatterns: ['five_notes', 'scale_5_desc', 'gliss_5_1_desc', 'siren_glide', 'gliss_1_5_1', 'gliss_1_5', 'three_notes', 'triad', 'broad_arpeggio', 'arpeggio_531_desc', 'arpeggio_compound_desc', 'lip_trill_run'],
    defaultVowel: 'TRRR',
    defaultTempoBpm: 130,
    recommendedStartMidi: 45,
    recommendedEndMidi: 67,
    direction: 'asc_desc',
    instructions: [
      'Appoggia la punta della lingua sul palato anteriore dietro i denti.',
      'Fai vibrare la lingua con il flusso d\'aria continuo pronunciando "TRRR".'
    ],
    instructionsEn: [
      'Rest the tip of your tongue on the front palate just behind your upper teeth.',
      'Make your tongue vibrate with a continuous stream of air while pronouncing "TRRR".'
    ],
    vocalTip: '• Se la lingua smette di vibrare prova a spostarla più avanti o più indietro sul palato\n• Ricorda di buttare fuori l\'aria e prendere un nuovo respiro al cambio di nota.\n• Quando arrivi alle note alte piangi dalle sopracciglia, ossia fai l\'espressione imbronciata.\n• Ricorda che questo è il riscaldamento quindi non dobbiamo performare arrivando a note altissime, sali fin dove trovi comodità e poi riscendi, assicurandoti di passare per entrambi i registri: petto e testa (M1 e M2).',
    vocalTipEn: '• If your tongue stops vibrating, try moving it slightly further forward or backward on the palate.\n• Remember to release your air and take a new breath at each key change.\n• When reaching high notes, cry from your eyebrows—make a pouting expression.\n• Remember this is a warm-up, so don\'t aim for extreme high notes: ascend as far as comfortable and descend, passing through both registers: chest and head (M1 and M2).'
  },
  {
    id: 'vvv_sovt',
    title: 'VVV',
    category: 'SOVT',
    description: 'Fricativa labiodentale sonora per allenare l\'appoggio e il flusso d\'aria uniforme.',
    scalePattern: 'five_notes',
    allowedPatterns: ['five_notes', 'scale_5_desc', 'gliss_5_1_desc', 'siren_glide', 'gliss_1_5_1', 'gliss_1_5', 'three_notes', 'triad', 'broad_arpeggio', 'arpeggio_531_desc', 'arpeggio_compound_desc', 'lip_trill_run'],
    defaultVowel: 'VVV',
    defaultTempoBpm: 130,
    recommendedStartMidi: 45,
    recommendedEndMidi: 67,
    direction: 'asc_desc',
    instructions: [
      'Appoggia i denti superiori sul labbro inferiore.',
      'Emetti il suono continuo "VVV" avvertendo la vibrazione costante sulle labbra.'
    ],
    instructionsEn: [
      'Rest your upper teeth gently on your lower lip.',
      'Emit a continuous "VVV" sound, feeling a constant vibration across your lips.'
    ],
    vocalTip: '• Puoi mettere un dito appoggiato alle labbra se vuoi, come a fare "sshh" 🤫\n• Ricorda di buttare fuori l\'aria e prendere un nuovo respiro al cambio di nota.\n• Quando arrivi alle note alte piangi dalle sopracciglia, ossia fai l\'espressione imbronciata.\n• Ricorda che questo è il riscaldamento quindi non dobbiamo performare arrivando a note altissime, sali fin dove trovi comodità e poi riscendi, assicurandoti di passare per entrambi i registri: petto e testa (M1 e M2).',
    vocalTipEn: '• You can rest a finger on your lips if you want, as if making a "shh" 🤫 gesture\n• Remember to release your air and take a new breath at each key change.\n• When reaching high notes, cry from your eyebrows—make a pouting expression.\n• Remember this is a warm-up, so don\'t aim for extreme high notes: ascend as far as comfortable and descend, passing through both registers: chest and head (M1 and M2).'
  },
  {
    id: 'zzz_sovt',
    title: 'ZZZ',
    category: 'SOVT',
    description: 'Fricativa alveolare sonora per stimolare la risonanza anteriore e l\'ingaggio addominale.',
    scalePattern: 'five_notes',
    allowedPatterns: ['five_notes', 'scale_5_desc', 'gliss_5_1_desc', 'siren_glide', 'gliss_1_5_1', 'gliss_1_5', 'three_notes', 'triad', 'broad_arpeggio', 'arpeggio_531_desc', 'arpeggio_compound_desc', 'lip_trill_run'],
    defaultVowel: 'ZZZ',
    defaultTempoBpm: 130,
    recommendedStartMidi: 45,
    recommendedEndMidi: 67,
    direction: 'asc_desc',
    instructions: [
      'Esegui l\'esercizio cantando il pattern melodico scelto con la Z, la stessa che senti in "casa"'
    ],
    instructionsEn: [
      'Perform the exercise singing the chosen melody pattern with a voiced Z (as in the Italian "casa" or "rose")'
    ],
    vocalTip: '• Cerca di mantenere un flusso d\'aria misurato e continuo per tutta l\'emissione\n• Ricorda di buttare fuori l\'aria e prendere un nuovo respiro al cambio di nota.\n• Quando arrivi alle note alte piangi dalle sopracciglia, ossia fai l\'espressione imbronciata.\n• Ricorda che questo è il riscaldamento quindi non dobbiamo performare arrivando a note altissime, sali fin dove trovi comodità e poi riscendi, assicurandoti di passare per entrambi i registri: petto e testa (M1 e M2).',
    vocalTipEn: '• Try to maintain a measured, continuous stream of air throughout the entire vocal emission\n• Remember to release your air and take a new breath at each key change.\n• When reaching high notes, cry from your eyebrows—make a pouting expression.\n• Remember this is a warm-up, so don\'t aim for extreme high notes: ascend as far as comfortable and descend, passing through both registers: chest and head (M1 and M2).'
  },
  {
    id: 'pesce_palla_sovt',
    title: 'PESCE PALLA',
    category: 'SOVT',
    description: 'Tecnica Puffy Cheeks (guance gonfie) per ammorbidire l\'attacco vocale e rilassare le corde.',
    scalePattern: 'five_notes',
    allowedPatterns: ['five_notes', 'scale_5_desc', 'gliss_5_1_desc', 'siren_glide', 'gliss_1_5_1', 'gliss_1_5', 'three_notes', 'triad', 'broad_arpeggio', 'arpeggio_531_desc', 'arpeggio_compound_desc', 'lip_trill_run'],
    defaultVowel: 'PUFF',
    defaultTempoBpm: 130,
    recommendedStartMidi: 45,
    recommendedEndMidi: 67,
    direction: 'asc_desc',
    instructions: [
      'Gonfia le guance come un pesce palla lasciando uscire solo uno spiffero d\'aria dalle labbra.'
    ],
    instructionsEn: [
      'Puff up your cheeks like a pufferfish, allowing only a small stream of air to escape through your lips.'
    ],
    vocalTip: '• Cerca di mantenere un flusso d\'aria omogeneo\n• Ricorda di buttare fuori l\'aria e prendere un nuovo respiro al cambio di nota.\n• Quando arrivi alle note alte piangi dalle sopracciglia, ossia fai l\'espressione imbronciata.\n• Ricorda che questo è il riscaldamento quindi non dobbiamo performare arrivando a note altissime, sali fin dove trovi comodità e poi riscendi, assicurandoti di passare per entrambi i registri: petto e testa (M1 e M2).',
    vocalTipEn: '• Try to keep a smooth, uniform airflow throughout\n• Remember to release your air and take a new breath at each key change.\n• When reaching high notes, cry from your eyebrows—make a pouting expression.\n• Remember this is a warm-up, so don\'t aim for extreme high notes: ascend as far as comfortable and descend, passing through both registers: chest and head (M1 and M2).'
  },

  // --- 2. VOCALIZZI ---
  {
    id: 'vocalizzo_mmm',
    title: 'MMM',
    category: 'Vocalizzi',
    description: 'Humming a bocca chiusa su scala a 5 note per stimolare la maschera e la vibrazione nasofaringea.',
    scalePattern: 'five_notes',
    allowedPatterns: ['five_notes', 'scale_5_desc', 'gliss_5_1_desc', 'gliss_1_5_1', 'three_notes', 'triad', 'broad_arpeggio', 'arpeggio_531_desc'],
    defaultVowel: 'MMM',
    defaultTempoBpm: 120,
    recommendedStartMidi: 48,
    recommendedEndMidi: 68,
    direction: 'asc_desc',
    instructions: [
      'Fai una M sorridendo, con gli zigomi su',
      'Cerca di sentire la vibrazione nei denti anteriori'
    ],
    instructionsEn: [
      'Make an M sound while smiling, keeping your cheekbones lifted',
      'Try to feel the vibration in your front teeth'
    ],
    vocalTip: '• Presta attenzione a non stringere la mascella\n• Ricorda di buttare fuori l\'aria e prendere un nuovo respiro al cambio di nota.\n• Quando arrivi alle note alte piangi dalle sopracciglia, ossia fai l\'espressione imbronciata.\n• Ricorda che questo è il riscaldamento quindi non dobbiamo performare arrivando a note altissime, sali fin dove trovi comodità e poi riscendi, assicurandoti di passare per entrambi i registri: petto e testa (M1 e M2).',
    vocalTipEn: '• Pay close attention not to clench or tighten your jaw.\n• Remember to release your air and take a new breath at each key change.\n• When reaching high notes, cry from your eyebrows—make a pouting expression.\n• Remember this is a warm-up, so don\'t aim for extreme high notes: ascend as far as comfortable and descend, passing through both registers: chest and head (M1 and M2).'
  },
  {
    id: 'vocalizzo_uuuh',
    title: 'UUUH',
    category: 'Vocalizzi',
    description: 'Vocalizzo sulla vocale scura U per abbassare delicatamente la laringe e ampliare lo spazio faringeo.',
    scalePattern: 'five_notes',
    allowedPatterns: ['five_notes', 'scale_5_desc', 'gliss_5_1_desc', 'gliss_1_5_1', 'three_notes', 'triad', 'broad_arpeggio', 'arpeggio_531_desc'],
    defaultVowel: 'UUUH',
    defaultTempoBpm: 115,
    recommendedStartMidi: 48,
    recommendedEndMidi: 68,
    direction: 'asc_desc',
    instructions: [
      'Esegui il pattern melodico con una U'
    ],
    instructionsEn: [
      'Perform the melody pattern on a U vowel'
    ],
    vocalTip: '• Non stringere le labbra a imbuto stretto; mantieni morbidi gli angoli della bocca.\n• Ricorda di buttare fuori l\'aria e prendere un nuovo respiro al cambio di nota.\n• Quando arrivi alle note alte piangi dalle sopracciglia, ossia fai l\'espressione imbronciata.\n• Ricorda che questo è il riscaldamento quindi non dobbiamo performare arrivando a note altissime, sali fin dove trovi comodità e poi riscendi, assicurandoti di passare per entrambi i registri: petto e testa (M1 e M2).',
    vocalTipEn: '• Do not purse your lips into a tight funnel; keep the corners of your mouth relaxed and soft.\n• Remember to release your air and take a new breath at each key change.\n• When reaching high notes, cry from your eyebrows—make a pouting expression.\n• Remember this is a warm-up, so don\'t aim for extreme high notes: ascend as far as comfortable and descend, passing through both registers: chest and head (M1 and M2).'
  },
  {
    id: 'vocalizzo_ng',
    title: 'NG',
    category: 'Vocalizzi',
    description: 'Risonanza nasale anteriore con la consonante NG (come nella finale di "sing") per isolare il velo del palato.',
    scalePattern: 'gliss_5_1_desc',
    allowedPatterns: ['gliss_5_1_desc', 'siren_glide', 'gliss_1_5_1', 'triad', 'broad_arpeggio', 'arpeggio_531_desc'],
    defaultVowel: 'NG',
    defaultTempoBpm: 120,
    recommendedStartMidi: 48,
    recommendedEndMidi: 68,
    direction: 'asc_desc',
    instructions: [
      'Cerca il suono nasale che avresti se ti fermassi fra la N e la G di una parola, ad esempio "KING" o "CANGURO"',
      'Una volta trovato il suono controlla se è quello giusto tappandoti il naso e provando a far uscire il suono: il suono deve essere totalmente nasale, quindi se tappando il naso il suono NON esce, allora stai facendo giusto'
    ],
    instructionsEn: [
      'Find the nasal sound you get if you pause right between the N and G of a word, such as "KING" or "KANGAROO"',
      'Once found, test if it is correct by pinching your nose and trying to emit the sound: it must be completely nasal, so if pinching your nose stops the sound entirely, you are doing it right'
    ],
    vocalTip: '• Se senti laringe o collo tesi, diminuisci il volume e concentrati unicamente sul flusso nasale.\n• Ricorda di buttare fuori l\'aria e prendere un nuovo respiro al cambio di nota.\n• Quando arrivi alle note alte piangi dalle sopracciglia, ossia fai l\'espressione imbronciata.\n• Ricorda che questo è il riscaldamento quindi non dobbiamo performare arrivando a note altissime, sali fin dove trovi comodità e poi riscendi, assicurandoti di passare per entrambi i registri: petto e testa (M1 e M2).',
    vocalTipEn: '• If your larynx or neck feels tense, lower the volume and focus purely on the nasal airflow.\n• Remember to release your air and take a new breath at each key change.\n• When reaching high notes, cry from your eyebrows—make a pouting expression.\n• Remember this is a warm-up, so don\'t aim for extreme high notes: ascend as far as comfortable and descend, passing through both registers: chest and head (M1 and M2).'
  },
  {
    id: 'vocalizzo_lip_trill_ng_nee',
    title: 'LIP TRILL - NG - NEE',
    category: 'Vocalizzi',
    description: 'Vocalizzo combinato Lip Trill, NG e NEE su arpeggio composto discendente.',
    scalePattern: 'arpeggio_compound_desc',
    allowedPatterns: ['arpeggio_compound_desc'],
    defaultVowel: 'Lip Trill - NG - NEE',
    defaultTempoBpm: 120,
    recommendedStartMidi: 48,
    recommendedEndMidi: 68,
    direction: 'asc_desc',
    instructions: [
      'Esegui il pattern melodico già selezionato passando da Lip Thrill a NG e infine NEE',
      'È un esercizio più complesso degli altri quindi se sei alle prime armi potresti trovare più difficoltà',
      'Quando passi a NEE cerca di mantenere una risonanza verso avanti'
    ],
    instructionsEn: [
      'Perform the selected melody pattern transitioning from Lip Thrill to NG and finally NEE',
      'This exercise is more complex than others, so beginners may find it somewhat harder',
      'When transitioning to NEE, try to keep the vocal resonance directed forward'
    ],
    vocalTip: '• Ricorda di buttare fuori l\'aria e prendere un nuovo respiro al cambio di nota.\n• Quando arrivi alle note alte piangi dalle sopracciglia, ossia fai l\'espressione imbronciata.\n• Ricorda che questo è il riscaldamento quindi non dobbiamo performare arrivando a note altissime, sali fin dove trovi comodità e poi riscendi, assicurandoti di passare per entrambi i registri: petto e testa (M1 e M2).',
    vocalTipEn: '• Remember to release your air and take a new breath at each key change.\n• When reaching high notes, cry from your eyebrows—make a pouting expression.\n• Remember this is a warm-up, so don\'t aim for extreme high notes: ascend as far as comfortable and descend, passing through both registers: chest and head (M1 and M2).'
  },
  {
    id: 'vocalizzo_tz_tz_tze',
    title: 'TZ TZ TZE',
    category: 'Vocalizzi',
    description: 'Glissando discendente 5-1 con il suono TZ TZ TZE per attivare la pressione sottoglottica ed il rilascio.',
    scalePattern: 'gliss_5_1_desc',
    allowedPatterns: ['gliss_5_1_desc'],
    defaultVowel: 'TZ TZ TZE',
    defaultTempoBpm: 120,
    recommendedStartMidi: 48,
    recommendedEndMidi: 68,
    direction: 'asc_desc',
    instructions: [
      'Esercizio molto usato per il riscaldamento dei bambini',
      'Esegui l\'esercizio con il suono di Z che trovi nella parola "PAZZO"',
      'Le prime due Z sono senza nota',
      'Invece TZE dovrai farlo con un glissando',
      'Presta attenzione a non fare un passaggio netto fra le due note di TZE, quindi se hai bisogno fai un glissando più lento'
    ],
    instructionsEn: [
      'A warm-up exercise widely used for children and agile voice release',
      'Perform the exercise with the crisp Z sound found in the Italian word "PAZZO" (ts)',
      'The first two Z sounds are whispered/unpitched',
      'TZE is performed with a smooth glissando',
      'Pay attention not to make an abrupt jump between the two notes of TZE; do a slower glissando if needed'
    ],
    vocalTip: '• Ricorda di buttare fuori l\'aria e prendere un nuovo respiro al cambio di nota.\n• Quando arrivi alle note alte piangi dalle sopracciglia, ossia fai l\'espressione imbronciata.\n• Ricorda che questo è il riscaldamento quindi non dobbiamo performare arrivando a note altissime, sali fin dove trovi comodità e poi riscendi, assicurandoti di passare per entrambi i registri: petto e testa (M1 e M2).',
    vocalTipEn: '• Remember to release your air and take a new breath at each key change.\n• When reaching high notes, cry from your eyebrows—make a pouting expression.\n• Remember this is a warm-up, so don\'t aim for extreme high notes: ascend as far as comfortable and descend, passing through both registers: chest and head (M1 and M2).'
  },
  {
    id: 'vocalizzo_mam_fissa',
    title: 'MAM (1 1 1 1 1)',
    category: 'Vocalizzi',
    description: 'Esercizio a nota fissa su 5 pulsazioni con MAM per stabilizzare la risonanza anteriore ed il controllo del fiato.',
    scalePattern: 'fixed_5_notes',
    allowedPatterns: ['fixed_5_notes'],
    defaultVowel: 'MAM',
    defaultTempoBpm: 110,
    recommendedStartMidi: 48,
    recommendedEndMidi: 68,
    direction: 'asc_desc',
    instructions: [
      'L\'esercizio è composto da una M senza vocale, poi MA, poi una M senza vocale, MA, e si conclude con la M senza vocale.',
      'Fai una M sorridendo, con gli zigomi su e cerca di mantenerli alzati anche quando canti MA, ma aprendo anche verticalmente la bocca.',
      'Cerca di sentire la vibrazione nei denti anteriori e cerca di mantenere quella stessa risonanza della M anche quando canti MA.',
      'Ricorda di buttare fuori l\'aria e prendere un nuovo respiro al cambio di nota.'
    ],
    instructionsEn: [
      'The exercise consists of an M with no vowel, then MA, then an unvoweled M, MA, and ends on an unvoweled M.',
      'Make an M while smiling with cheekbones lifted, keeping them high when singing MA while also opening vertically.',
      'Feel the vibration in your front teeth and maintain that same forward M resonance when singing MA.',
      'Remember to release your air and take a new breath at each key change.'
    ],
    vocalTip: '• Quando arrivi alle note alte piangi dalle sopracciglia, ossia fai l\'espressione imbronciata.\n• Quando arrivi alle note alte può aiutarti fare una A che tende verso una O.\n• Questo esercizio può essere utilizzato anche per allenare il MIX.\n• Se lo stai usando come riscaldamento, prendilo più alla leggera e quindi non salire tanto se vuoi stare in petto, oppure sali fin dove trovi comodità e poi riscendi, assicurandoti di passare per entrambi i registri: petto e testa (M1 e M2).',
    vocalTipEn: '• When reaching high notes, cry from your eyebrows—make a pouting expression.\n• When reaching high notes, singing an A that tilts slightly toward an O can help.\n• This exercise can also be used to train vocal MIX.\n• If used as a warm-up, take it easy: don\'t push too high in chest voice, or ascend comfortably and descend, passing through both chest and head registers (M1 and M2).'
  },
  {
    id: 'vocalizzo_mmm_me',
    title: 'MMM ME',
    category: 'Vocalizzi',
    description: 'Scala a 5 note doppia (12345 432 - 12345 4321): prima frase su MMM mormorato, seconda frase aprendo su ME.',
    scalePattern: 'scale_mmm_me',
    allowedPatterns: ['scale_mmm_me'],
    defaultVowel: 'MMM - ME',
    defaultTempoBpm: 115,
    recommendedStartMidi: 48,
    recommendedEndMidi: 68,
    direction: 'asc_desc',
    instructions: [
      'Canta la prima parte della scala (12345 432) a bocca chiusa "MMM".',
      'Senza interrompere il fiato, prosegui la seconda parte (12345 4321) aprendo la vocale "ME".',
      'Fai una M sorridendo, con gli zigomi su e cerca di mantenerli alzati anche quando canti ME, ma aprendo anche verticalmente la bocca.',
      'Cerca di sentire la vibrazione nei denti anteriori e cerca di mantenere quella stessa risonanza della M anche quando canti ME.',
      'Ricorda di buttare fuori l\'aria e prendere un nuovo respiro al cambio di nota.'
    ],
    instructionsEn: [
      'Sing the first part of the scale (12345 432) on a closed-mouth "MMM".',
      'Without stopping your breath, continue into the second part (12345 4321) opening into the vowel "ME".',
      'Form an M smiling with lifted cheekbones, keeping them raised when singing ME while also opening your mouth vertically.',
      'Try to feel vibration in the front teeth and maintain that same forward M resonance when opening into ME.',
      'Remember to release your air and take a new breath at each key change.'
    ],
    vocalTip: '• Quando arrivi alle note alte piangi dalle sopracciglia, ossia fai l\'espressione imbronciata.\n• Quando arrivi alle note alte può aiutarti anche fare una E che tende verso una A.\n• Questo esercizio può essere utilizzato anche per allenare il MIX.\n• Se lo stai usando come riscaldamento, prendilo più alla leggera e quindi non salire tanto se vuoi stare in petto, oppure sali fin dove trovi comodità e poi riscendi, assicurandoti di passare per entrambi i registri: petto e testa (M1 e M2).',
    vocalTipEn: '• When reaching high notes, cry from your eyebrows—make a pouting expression.\n• When reaching high notes, it can also help to sing an E that tilts slightly toward an A.\n• This exercise can also be used to train vocal MIX.\n• If used as a warm-up, take it easy: don\'t push too high in chest voice, or ascend comfortably and descend, passing through both chest and head registers (M1 and M2).'
  },
  {
    id: 'vocalizzo_mee_151',
    title: 'MEE (1-5-1 Glissando Quinta Corta)',
    titleEn: 'MEE (1-5-1 Short 5th Glissando)',
    category: 'Vocalizzi',
    description: 'Glissando di quinta corta (1-5-1) su MEE per scaldare ed omogeneizzare i registri vocali.',
    scalePattern: 'gliss_1_5_1',
    allowedPatterns: ['gliss_1_5_1', 'gliss_1_5'],
    defaultVowel: 'MEE',
    defaultTempoBpm: 100,
    recommendedStartMidi: 48,
    recommendedEndMidi: 68,
    direction: 'asc_desc',
    instructions: [
      'Esegui l\'esercizio facendo un glissando dalla 1 alla 5 della scala, facendo la seconda nota corta, come nell\'esempio audio',
      'Ricorda di buttare fuori l\'aria e prendere un nuovo respiro al cambio di nota.',
      'Quando arrivi alle note alte piangi dalle sopracciglia, ossia fai l\'espressione imbronciata.'
    ],
    instructionsEn: [
      'Perform the exercise by gliding from 1 to 5 of the scale, making the second note short, as in the audio example.',
      'Remember to release your air and take a new breath at each key change.',
      'When reaching high notes, cry from your eyebrows—make a pouting expression.'
    ],
    vocalTip: '• Questo è il riscaldamento: sali fin dove trovi comodità e poi riscendi, passando per entrambi i registri (petto e testa).\n• Presta attenzione a fare un glissando e non un passaggio netto fra le note',
    vocalTipEn: '• This is a warm-up: ascend comfortably and descend, passing through both registers (chest and head).\n• Pay attention to executing a smooth glissando rather than an abrupt transition between notes.'
  },

  // --- 3. VOCE MISTA ---
  {
    id: 'mix_meee',
    title: 'MEEE',
    titleEn: 'MEEE',
    category: 'Voce Mista',
    description: 'Esercizio in voce mista sul suono MEEE per agganciare la risonanza alta e sostenere il passaggio di registro.',
    descriptionEn: 'Mixed voice exercise on the MEEE sound to engage forward resonance and bridge the vocal registers.',
    scalePattern: 'scale_4_notes',
    allowedPatterns: ['scale_4_notes', 'scale_4_notes_2x', 'five_notes'],
    defaultVowel: 'MEEE',
    defaultTempoBpm: 100,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Esegui l\'esercizio come nell\'esempio audio',
      'Assicurati di tenere alzati gli zigomi ed aprire la bocca verticalmente con la E',
      'Ricorda di buttare fuori l\'aria e prendere un nuovo respiro al cambio di nota.',
      'Quando arrivi alle note alte aggiungi pianto, modifica la vocale verso una A e aggiungi sostegno e ancoraggio'
    ],
    instructionsEn: [
      'Perform the exercise as demonstrated in the audio example',
      'Make sure to keep your cheekbones lifted and open your mouth vertically on the E vowel',
      'Remember to release your air and take a new breath at each key change.',
      'When you reach high notes, add a slight sob/cry sensation, modify the vowel toward an A, and engage breath support and anchoring'
    ],
    vocalTip: '• In questo esercizio vogliamo cercare di non passare in falsetto quando arriviamo alle note difficili, piuttosto applichiamo le tecniche per sviluppare il nostro registro misto e quindi vogliamo avere un suono forte ma senza sforzare.\n• L\'esercizio può essere fatto sia col pattern singolo che con quello doppio. In quello doppio, bisogna cantare il pattern per intero con un unico respiro.',
    vocalTipEn: '• In this exercise we want to avoid flipping into falsetto on difficult notes; instead, apply mixed voice techniques to achieve a strong sound without straining.\n• The exercise can be performed with either the single or double pattern. In the double pattern, sing the entire pattern in one single breath.',
    patternOverrides: {
      scale_4_notes: {
        instructions: [
          'Esegui l\'esercizio come nell\'esempio audio (pattern singolo 1234 321)',
          'Assicurati di tenere alzati gli zigomi ed aprire la bocca verticalmente con la E',
          'Ricorda di buttare fuori l\'aria e prendere un nuovo respiro al cambio di nota.',
          'Quando arrivi alle note alte aggiungi pianto, modifica la vocale verso una A e aggiungi sostegno e ancoraggio'
        ],
        instructionsEn: [
          'Perform the exercise as demonstrated in the audio example (single 1234 321 pattern)',
          'Make sure to keep your cheekbones lifted and open your mouth vertically on the E vowel',
          'Remember to release your air and take a new breath at each key change.',
          'When you reach high notes, add a slight sob/cry sensation, modify the vowel toward an A, and engage breath support and anchoring'
        ],
        vocalTip: '• In questo esercizio vogliamo cercare di non passare in falsetto quando arriviamo alle note difficili, piuttosto applichiamo le tecniche per sviluppare il nostro registro misto e quindi vogliamo avere un suono forte ma senza sforzare.\n• Nel pattern singolo concentrati su ogni emissione con precisione prima di modulare alla tonalità successiva.',
        vocalTipEn: '• In this exercise we want to avoid flipping into falsetto on difficult notes; instead, apply mixed voice techniques to achieve a strong sound without straining.\n• On the single pattern, focus with precision on each repetition before modulating to the next key.'
      },
      scale_4_notes_2x: {
        instructions: [
          'Esegui l\'esercizio come nell\'esempio audio (pattern doppio 1234 321 x2)',
          'Nel pattern doppio, canta l\'intero pattern con un unico respiro.',
          'Assicurati di tenere alzati gli zigomi ed aprire la bocca verticalmente con la E',
          'Ricorda di buttare fuori l\'aria e prendere un nuovo respiro al cambio di nota.',
          'Quando arrivi alle note alte aggiungi pianto, modifica la vocale verso una A e aggiungi sostegno e ancoraggio'
        ],
        instructionsEn: [
          'Perform the exercise as demonstrated in the audio example (double pattern 1234 321 x2)',
          'In the double pattern, sing the entire pattern in one single breath.',
          'Make sure to keep your cheekbones lifted and open your mouth vertically on the E vowel',
          'Remember to release your air and take a new breath at each key change.',
          'When you reach high notes, add a slight sob/cry sensation, modify the vowel toward an A, and engage breath support and anchoring'
        ],
        vocalTip: '• In questo esercizio vogliamo cercare di non passare in falsetto quando arriviamo alle note difficili, piuttosto applichiamo le tecniche per sviluppare il nostro registro misto e quindi vogliamo avere un suono forte ma senza sforzare.\n• Nel pattern doppio, bisogna cantare il pattern per intero con un unico respiro: mantieni il sostegno e l\'ancoraggio costanti per tutta la durata delle due sequenze.',
        vocalTipEn: '• In this exercise we want to avoid flipping into falsetto on difficult notes; instead, apply mixed voice techniques to achieve a strong sound without straining.\n• In the double pattern, sing the full pattern in one breath: keep breath support and body anchoring steady throughout both sequences.'
      },
      five_notes: {
        instructions: [
          'Esegui l\'esercizio come nell\'esempio audio (pattern scala di 5 note 12345 4321)',
          'Assicurati di tenere alzati gli zigomi ed aprire la bocca verticalmente con la E',
          'Ricorda di buttare fuori l\'aria e prendere un nuovo respiro al cambio di nota.',
          'Quando arrivi alle note alte aggiungi pianto, modifica la vocale verso una A e aggiungi sostegno e ancoraggio'
        ],
        instructionsEn: [
          'Perform the exercise as demonstrated in the audio example (5-note scale pattern 12345 4321)',
          'Make sure to keep your cheekbones lifted and open your mouth vertically on the E vowel',
          'Remember to release your air and take a new breath at each key change.',
          'When you reach high notes, add a slight sob/cry sensation, modify the vowel toward an A, and engage breath support and anchoring'
        ],
        vocalTip: '• In questo esercizio vogliamo cercare di non passare in falsetto quando arriviamo alle note difficili, piuttosto applichiamo le tecniche per sviluppare il nostro registro misto e quindi vogliamo avere un suono forte ma senza sforzare.\n• Sulla scala a 5 note mantieni il focus della risonanza anteriore senza allargare o appesantire la voce al vertice.',
        vocalTipEn: '• In this exercise we want to avoid flipping into falsetto on difficult notes; instead, apply mixed voice techniques to achieve a strong sound without straining.\n• On the 5-note scale, maintain forward resonance focus without widening or pushing excess weight at the top.'
      }
    }
  },
  {
    id: 'mix_mime_ma_mo_mu',
    title: 'MI ME MA MO MU',
    titleEn: 'MI ME MA MO MU',
    category: 'Voce Mista',
    description: 'Sequenza di vocali per omogeneizzare il timbro misto attraverso tutti i colori vocalici.',
    descriptionEn: 'Vowel sequence to homogenize mixed voice resonance across all vocal colors.',
    scalePattern: 'scale_4_notes_5x',
    allowedPatterns: ['scale_4_notes_5x'],
    defaultVowel: 'MI ME MA MO MU',
    defaultTempoBpm: 90,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Esegui l\'esercizio come nell\'esempio audio',
      'Assicurati di tenere alzati gli zigomi ed aprire la bocca per tutte le vocali',
      'Ricorda di buttare fuori l\'aria e prendere un nuovo respiro al cambio di nota.',
      'Quando arrivi alle note alte aggiungi pianto, modifica le vocali:\n• la I verso la E\n• la E verso la A\n• la A verso la O\n• la O verso la A (lo so sembra una presa in giro ma non lo è)\n• la U verso la O',
      'Aggiungi anche sostegno e ancoraggio al bisogno.'
    ],
    instructionsEn: [
      'Perform the exercise as demonstrated in the audio example',
      'Make sure to keep your cheekbones lifted and open your mouth vertically for all vowels',
      'Remember to release your air and take a new breath at each key change.',
      'When you reach high notes, add a cry/sob sensation and modify vowels:\n• I toward E\n• E toward A\n• A toward O\n• O toward A (sounds counter-intuitive, but it works!)\n• U toward O',
      'Add breath support and body anchoring as needed.'
    ],
    vocalTip: '• In questo esercizio vogliamo cercare di non passare in falsetto quando arriviamo alle note difficili, piuttosto applichiamo le tecniche per sviluppare il nostro registro misto e quindi vogliamo avere un suono forte ma senza sforzare.\n• Nell\'esercizio bisogna cantare il pattern per intero con un unico respiro.',
    vocalTipEn: '• In this exercise we want to avoid flipping into falsetto on difficult notes; instead, apply mixed voice techniques to achieve a strong sound without straining.\n• In this exercise you must sing the entire pattern in one single breath.',
    patternOverrides: {
      scale_4_notes_5x: {
        instructions: [
          'Esegui l\'esercizio come nell\'esempio audio (sequenza completa da 5 vocali)',
          'Canta l\'intera sequenza (MI, ME, MA, MO, MU) con un unico respiro.',
          'Assicurati di tenere alzati gli zigomi ed aprire la bocca per tutte le vocali',
          'Ricorda di buttare fuori l\'aria e prendere un nuovo respiro al cambio di nota.',
          'Quando arrivi alle note alte aggiungi pianto, modifica le vocali:\n• la I verso la E\n• la E verso la A\n• la A verso la O\n• la O verso la A (lo so sembra una presa in giro ma non lo è)\n• la U verso la O',
          'Aggiungi anche sostegno e ancoraggio al bisogno.'
        ],
        instructionsEn: [
          'Perform the exercise as demonstrated in the audio example (full 5-vowel sequence)',
          'Sing the full sequence (MI, ME, MA, MO, MU) in one single breath.',
          'Make sure to keep your cheekbones lifted and open your mouth vertically for all vowels',
          'Remember to release your air and take a new breath at each key change.',
          'When you reach high notes, add a cry/sob sensation and modify vowels:\n• I toward E\n• E toward A\n• A toward O\n• O toward A\n• U toward O',
          'Add breath support and body anchoring as needed.'
        ],
        vocalTip: '• In questo esercizio vogliamo cercare di non passare in falsetto quando arriviamo alle note difficili, piuttosto applichiamo le tecniche per sviluppare il nostro registro misto e quindi vogliamo avere un suono forte ma senza sforzare.\n• Nell\'esercizio bisogna cantare il pattern per intero con un unico respiro: calibra il fiato fin dalla prima vocale MI per sostenere agilmente fino alla U finale.',
        vocalTipEn: '• In this exercise we want to avoid flipping into falsetto on difficult notes; instead, apply mixed voice techniques to achieve a strong sound without straining.\n• In this exercise you must sing the entire pattern in one single breath: pace your airflow from the initial MI to comfortably support through the final MU.'
      }
    }
  },
  {
    id: 'mix_mum',
    title: 'MUM',
    category: 'Voce Mista',
    description: 'Esercizio a laringe neutra/bassa sul suono MUM per alleggerire la spinta e connettere i registri.',
    scalePattern: 'arpeggio_1358888531',
    allowedPatterns: ['arpeggio_1358888531', 'broad_arpeggio', 'triad', 'arpeggio_531_desc'],
    defaultVowel: 'MUM',
    defaultTempoBpm: 95,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Pronuncia "MUM" mantenendo la gola aperta e rilassata come durante uno sbadiglio leggero.',
      'Pattern 1358888531 (6/8): note della scala nei primi 11 ottavi, al 12° ottavo accordo del giro corrente, al 13° ottavo accordo della tonalità successiva.',
      'Senti la chiusura dolce sia in attacco che in chiusura di parola.'
    ],
    vocalTip: 'Il suono "UM" impedisce alla laringe di salire eccessivamente.'
  },
  {
    id: 'mix_nay',
    title: 'NAY',
    category: 'Voce Mista',
    description: 'Vocalizzo brillante con twang su NAY per superare il passaggio e assottigliare le corde vocali.',
    scalePattern: 'arpeggio_1358888531',
    allowedPatterns: ['arpeggio_1358888531', 'broad_arpeggio', 'three_notes', 'triad', 'arpeggio_531_desc'],
    defaultVowel: 'NAY',
    defaultTempoBpm: 100,
    recommendedStartMidi: 60,
    recommendedEndMidi: 74,
    direction: 'asc_desc',
    instructions: [
      'Usa un timbro "nasale" e squillante (twang) dicendo "NAY".',
      'Pattern 1358888531 (6/8): note della scala nei primi 11 ottavi, al 12° ottavo accordo del giro corrente, al 13° ottavo accordo della tonalità successiva.',
      'Non caricare peso di petto: lascia che il twang faccia il lavoro per te.'
    ],
    vocalTip: 'Immagina il timbro di un bimbo dispettoso o di una strega per attivare lo spessore sottile delle corde.'
  },
  {
    id: 'mix_mee_gliss',
    title: 'MEE (12345 + Glissando)',
    category: 'Voce Mista',
    description: 'Scala 12345 seguita da glissando discendente di ritorno alla prima nota su MEE.',
    scalePattern: 'scale_5_gliss_desc',
    allowedPatterns: ['scale_5_gliss_desc'],
    defaultVowel: 'MEE',
    defaultTempoBpm: 105,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Canta 1 2 3 4 5 e scivola con un glissando continuo di ritorno a 1.',
      'Conserva il timbro stretto e risonante MEE durante la discesa.'
    ],
    vocalTip: 'Il glissando aiuta ad azzerare le rotture tra voce di petto e di testa.'
  },
  {
    id: 'mix_gne_13521',
    title: 'GNE GNE (135 - 31)',
    category: 'Voce Mista',
    description: 'Arpeggio 135 - 31 sul suono nasale e squillante GNE GNE per assottigliare le corde vocali.',
    scalePattern: 'arpeggio_13521',
    allowedPatterns: ['three_notes', 'arpeggio_13521'],
    defaultVowel: 'GNE GNE',
    defaultTempoBpm: 110,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Pronuncia "GNE GNE" con un twang accentuato sull\'arpeggio 1 3 5 3 1.',
      'Lascia che la consonante GN focalizzi il suono direttamente nel naso e nella maschera.'
    ],
    vocalTip: 'Mantieni il suono leggero e tagliente come una risata dispettosa.'
  },
  {
    id: 'mix_ye_13521',
    title: 'YE YE YE (135 - 31)',
    category: 'Voce Mista',
    description: 'Arpeggio 135 - 31 su YE YE YE per un attacco morbido e una risonanza brillante.',
    scalePattern: 'arpeggio_13521',
    allowedPatterns: ['three_notes', 'arpeggio_13521'],
    defaultVowel: 'YE YE YE',
    defaultTempoBpm: 110,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Canta "YE YE YE" sull\'arpeggio 1 3 5 3 1.',
      'Sfrutta l\'attacco della semivocale Y per convogliare l\'aria sul palato duro.'
    ],
    vocalTip: 'L\'attacco in Y evita colpi di glottide e libera le vibrazioni superiori.'
  },
  {
    id: 'mix_mne_fissa',
    title: 'MNE (Nota Fissa)',
    titleEn: 'MNE (Sustained Note)',
    category: 'Voce Mista',
    description: 'Esercizio a nota fissa su MNE per stabilizzare l\'adduzione cordale e la maschera.',
    descriptionEn: 'Sustained note exercise on MNE to stabilize vocal fold adduction and forward mask resonance.',
    scalePattern: 'fixed_3_notes',
    allowedPatterns: ['fixed_3_notes'],
    defaultVowel: 'MNE',
    defaultTempoBpm: 100,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Articola "MNE" tenendo la nota fissa.',
      'Senti la consonante M nasale che si fonde con la vocale E ben focalizzata.'
    ],
    instructionsEn: [
      'Articulate "MNE" holding the sustained note.',
      'Feel the nasal M consonant blend seamlessly into the focused E vowel.'
    ],
    vocalTip: '• Il suono MNE attiva immediatamente l\'assottigliamento delle corde vocali.\n• Mantieni la risonanza anteriore senza spingere aria o forzare la laringe.',
    vocalTipEn: '• The MNE sound immediately engages thin vocal fold edges.\n• Maintain forward resonance without pushing air or forcing the larynx.'
  },
  {
    id: 'mix_mee_1_8_5',
    title: 'MEE (1 8 5 - Petto, Falsetto, Misto)',
    category: 'Voce Mista',
    description: 'Salto 1 -> 8 -> 5 (Do, Do ottava, Sol) per coordinare i tre registri: Petto (1), Falsetto (8), Misto (5).',
    scalePattern: 'arpeggio_185',
    allowedPatterns: ['arpeggio_185'],
    defaultVowel: 'MEE',
    defaultTempoBpm: 95,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Canta la prima nota (1) in voce piena di petto.',
      'Salta all\'ottava (8) in falsetto leggero e rilassato.',
      'Scendi al 5° grado (5) fondendo i due registri in voce mista.'
    ],
    vocalTip: 'Il salto in falsetto libera la laringe prima della sintesi in voce mista sul 5° grado.'
  },
  {
    id: 'mix_mam_fissa',
    title: 'MAM (1 1 1 1 1)',
    titleEn: 'MAM (1 1 1 1 1)',
    category: 'Voce Mista',
    description: '5 ripetizioni a nota fissa su MAM per rinforzare la tenuta del registro misto.',
    descriptionEn: '5 sustained repetitions on MAM to reinforce mixed voice stability.',
    scalePattern: 'fixed_5_notes',
    allowedPatterns: ['fixed_5_notes'],
    defaultVowel: 'MAM',
    defaultTempoBpm: 105,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Ripeti "MAM" per 5 volte sulla stessa nota.',
      'Mantenere la A ben posizionata senza allargare eccessivamente la bocca.'
    ],
    instructionsEn: [
      'Repeat "MAM" 5 times on the same note.',
      'Keep the A vowel well positioned vertically without overly widening the mouth.'
    ],
    vocalTip: '• Controlla che ciascun attacco sia identico al precedente.\n• L\'attacco in M pre-attiva le cavità di risonanza prima di aprire la A.',
    vocalTipEn: '• Check that each onset is identical to the previous one.\n• The M onset pre-activates the resonance cavities before opening the A.'
  },
  {
    id: 'mix_mam_11151',
    title: 'MAM (1 1 1 5 1)',
    titleEn: 'MAM (1 1 1 5 1)',
    category: 'Voce Mista',
    description: 'Tre note fisse sulla base (1 1 1), salto di quinta al 5° grado e ritorno a 1 con MAM.',
    descriptionEn: 'Three sustained root notes (1 1 1), leap of a fifth to the 5th degree, and return to 1 on MAM.',
    scalePattern: 'jump_5_1',
    allowedPatterns: ['jump_5_1'],
    defaultVowel: 'MAM',
    defaultTempoBpm: 105,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Canta 1 1 1 sulla nota base, salta al 5° grado e ritorna a 1.',
      'Usa l\'ancoraggio addominale per sostenere l\'intervallo di quinta.'
    ],
    instructionsEn: [
      'Sing 1 1 1 on the root note, leap to the 5th degree and return to 1.',
      'Use abdominal anchoring and breath support to sustain the interval of a fifth.'
    ],
    vocalTip: '• Mantieniti rilassato sul salto senza spingere la laringe in alto.\n• Non cambiare la forma della bocca durante il salto di quinta.',
    vocalTipEn: '• Stay relaxed on the leap without pushing the larynx upward.\n• Do not alter mouth shape during the leap of a fifth.'
  },
  {
    id: 'mix_he_he_heee_55531',
    title: 'HE HE HEEE (55 531)',
    category: 'Voce Mista',
    description: 'Attacco sul 5° grado (5 5 5) e discesa 3 1 sul suono HE HE HEEE per liberare il registro acuto.',
    scalePattern: 'arpeggio_55531',
    allowedPatterns: ['arpeggio_55531', 'arpeggio_531_desc'],
    defaultVowel: 'HE HE HEEE',
    defaultTempoBpm: 105,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Inizia dal 5° grado dicendo HE HE, poi scendi 5 3 1 su HEEE.',
      'L\'aspirata H iniziale decomprime la glottide evitando tensioni.'
    ],
    vocalTip: 'Usa un fiato leggero e fluido sull\'aspirata iniziale.'
  },
  {
    id: 'mix_mee_gliss_151',
    title: 'Mee (1-5-1 Glissando)',
    category: 'Voce Mista',
    description: 'Glissando lento di quinta (1->5 e 5->1) per omogeneizzare la salita e la discesa.',
    scalePattern: 'gliss_1_5_1',
    allowedPatterns: ['gliss_1_5_1', 'gliss_1_5'],
    defaultVowel: 'MEE',
    defaultTempoBpm: 90,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Esegui un glissando continuo dal 1° al 5° e di nuovo al 1° grado.',
      'Ascolta attentamente per evitare gradini o rotture del timbro.'
    ],
    vocalTip: 'Immagina una linea continua e morbida che collega la nota grave a quella acuta.'
  },
  {
    id: 'mix_eee_fry_55531',
    title: 'E E EEE (55 531 - Attacco Fry)',
    category: 'Voce Mista',
    description: 'Attacco con Vocal Fry sulla nota alta (5 5 5 3 1) per azzerare la tensione cordale prima di cantare.',
    scalePattern: 'arpeggio_55531',
    allowedPatterns: ['arpeggio_55531'],
    defaultVowel: '(Fry) E E EEE',
    defaultTempoBpm: 100,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Fai un piccolo "scricchiolio" in Vocal Fry subito prima di emettere la vocale E sul 5° grado.',
      'Scendi 5 3 1 mantenendo la gola totalmente rilassata.'
    ],
    vocalTip: 'Il vocal fry aiuta le corde a chiudersi dolcemente senza pressione d\'aria eccessiva.'
  },
  {
    id: 'mix_he_he_181_gliss',
    title: 'HE HE (1-8-1 Glissato Lento)',
    category: 'Voce Mista',
    description: 'Glissando lento dell\'ottava (1 -> 8 -> 1) su HE HE per attraversare liberamente tutto il passaggio.',
    scalePattern: 'siren_glide',
    allowedPatterns: ['siren_glide'],
    defaultVowel: 'HE HE',
    defaultTempoBpm: 85,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Scivola dal 1° grado all\'8° e ritorna al 1° con un glissando continuo.',
      'L\'aspirata H ti protegge da strettoie e sforzi laringei.'
    ],
    vocalTip: 'Lascia che la voce sfumi verso la testa man mano che sali verso l\'ottava.'
  },
  {
    id: 'mix_mne_111_5_gliss',
    title: 'MNE (111 5 + Glissando)',
    titleEn: 'MNE (111 5 + Glissando)',
    category: 'Voce Mista',
    description: '3 note fisse (1 1 1), salto al 5° grado e glissando discendente di ritorno alla nota base.',
    descriptionEn: '3 sustained notes (1 1 1), 5th leap and descending glissando returning to the root note.',
    scalePattern: 'jump_5_1',
    allowedPatterns: ['jump_5_1'],
    defaultVowel: 'MNE',
    defaultTempoBpm: 100,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Canta 1 1 1 su MNE, salta al 5° e scivola con un glissando fino al 1°.',
      'Mantieni lo squillo del suono MNE per tutta la discesa.'
    ],
    instructionsEn: [
      'Sing 1 1 1 on MNE, jump to the 5th and slide down with a glissando to the 1st.',
      'Maintain the bright squillo of the MNE sound throughout the descent.'
    ],
    vocalTip: '• Il glissando finale rilassa la muscolatura dopo l\'attacco in salto.\n• Mantieni la risonanza anteriore costante per tutto il passaggio.',
    vocalTipEn: '• The final glissando relaxes the musculature after the leap attack.\n• Maintain consistent forward resonance throughout the entire passage.'
  },

  // --- 3. RISONANZE ---
  {
    id: 'res_gne',
    title: 'GNE GNE',
    titleEn: 'GNE GNE',
    category: 'Risonanze',
    description: 'Esercizio con voce squillante e twang su GNE GNE per proiettare il suono in avanti, ridurre l\'aria, migliorare l\'adduzione cordale e fare le note alte con più leggerezza.',
    descriptionEn: 'Exercise with bright twang voice on GNE GNE to project sound forward, reduce air leakage, improve vocal fold adduction, and reach high notes with greater ease.',
    scalePattern: 'arpeggio_13521',
    allowedPatterns: ['arpeggio_13521', 'three_notes'],
    defaultVowel: 'GNE GNE',
    defaultTempoBpm: 110,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Esegui l\'esercizio con uno dei due pattern melodici a disposizione (135 - 31 arpeggio triade oppure 123 - 21 do re mi).',
      'Canta GNE GNE con una voce squillante, con twang, brutta, da strega (chiamala come vuoi).',
      'Questo suono ci aiuta a proiettare il suono in avanti, ridurre l\'aria, migliorare l\'adduzione cordale e fare le note alte con più leggerezza.'
    ],
    instructionsEn: [
      'Perform the exercise with one of the two available melodic patterns (135 - 31 triad arpeggio or 123 - 21 do re mi).',
      'Sing GNE GNE with a bright, squillante voice, with twang, ugly, like a witch (call it what you like).',
      'This sound helps project the tone forward, reduce breathiness, improve vocal fold adduction, and reach high notes with greater ease.'
    ],
    vocalTip: '• È molto comune diminuire l\'intensità dello squillo man mano che vai avanti: è normale, finché non ti abitui. Quindi puoi provare a registrarti per sentire quando lo diminuisci, ma in ogni caso ci saranno le istruzioni nel player che ogni tanto ti ricorderanno cosa devi fare.\n• Presta attenzione a non fare un suono puramente nasale: il suono deve essere squillante ma non totalmente nel naso.',
    vocalTipEn: '• It is very common to reduce the intensity of the squillo/twang as you progress: this is normal until you get used to it. You can try recording yourself to hear when it drops, but in any case the player reminders will occasionally prompt you on what to do.\n• Pay attention not to make a purely nasal sound: the tone should be bright and squillante, but not completely in the nose.',
    patternOverrides: {
      arpeggio_13521: {
        instructions: [
          'Esegui l\'esercizio sul pattern 135 - 31 (arpeggio triade Do-Mi-Sol-Mi-Do).',
          'Canta GNE GNE con una voce squillante, con twang, brutta, da strega (chiamala come vuoi).',
          'Questo suono ci aiuta a proiettare il suono in avanti, ridurre l\'aria, migliorare l\'adduzione cordale e fare le note alte con più leggerezza.'
        ],
        instructionsEn: [
          'Perform the exercise on the 135 - 31 pattern (triad arpeggio Do-Mi-Sol-Mi-Do).',
          'Sing GNE GNE with a bright, squillante voice, with twang, ugly, like a witch (call it what you like).',
          'This sound helps project the tone forward, reduce breathiness, improve vocal fold adduction, and reach high notes with greater ease.'
        ],
        vocalTip: '• È molto comune diminuire l\'intensità dello squillo man mano che vai avanti: è normale, finché non ti abitui. Quindi puoi provare a registrarti per sentire quando lo diminuisci, ma in ogni caso ci saranno le istruzioni nel player che ogni tanto ti ricorderanno cosa devi fare.\n• Presta attenzione a non fare un suono puramente nasale: il suono deve essere squillante ma non totalmente nel naso.',
        vocalTipEn: '• It is very common to reduce the intensity of the squillo/twang as you progress: this is normal until you get used to it. You can try recording yourself to hear when it drops, but in any case the player reminders will occasionally prompt you on what to do.\n• Pay attention not to make a purely nasal sound: the tone should be bright and squillante, but not completely in the nose.'
      },
      three_notes: {
        instructions: [
          'Esegui l\'esercizio sul pattern 123 - 21 (do re mi - re do).',
          'Canta GNE GNE con una voce squillante, con twang, brutta, da strega (chiamala come vuoi).',
          'Questo suono ci aiuta a proiettare il suono in avanti, ridurre l\'aria, migliorare l\'adduzione cordale e fare le note alte con più leggerezza.'
        ],
        instructionsEn: [
          'Perform the exercise on the 123 - 21 pattern (do-re-mi-re-do).',
          'Sing GNE GNE with a bright, squillante voice, with twang, ugly, like a witch (call it what you like).',
          'This sound helps project the tone forward, reduce breathiness, improve vocal fold adduction, and reach high notes with greater ease.'
        ],
        vocalTip: '• È molto comune diminuire l\'intensità dello squillo man mano che vai avanti: è normale, finché non ti abitui. Quindi puoi provare a registrarti per sentire quando lo diminuisci, ma in ogni caso ci saranno le istruzioni nel player che ogni tanto ti ricorderanno cosa devi fare.\n• Presta attenzione a non fare un suono puramente nasale: il suono deve essere squillante ma non totalmente nel naso.',
        vocalTipEn: '• It is very common to reduce the intensity of the squillo/twang as you progress: this is normal until you get used to it. You can try recording yourself to hear when it drops, but in any case the player reminders will occasionally prompt you on what to do.\n• Pay attention not to make a purely nasal sound: the tone should be bright and squillante, but not completely in the nose.'
      }
    }
  },
  {
    id: 'res_ye',
    title: 'YE YE YE',
    titleEn: 'YE YE YE',
    category: 'Risonanze',
    description: 'Esercizio con voce squillante e twang su YE YE YE per proiettare il suono in avanti, ridurre l\'aria, migliorare l\'adduzione cordale e fare le note alte con più leggerezza.',
    descriptionEn: 'Exercise with bright twang voice on YE YE YE to project sound forward, reduce air leakage, improve vocal fold adduction, and reach high notes with greater ease.',
    scalePattern: 'arpeggio_13521',
    allowedPatterns: ['arpeggio_13521', 'three_notes'],
    defaultVowel: 'YE YE YE',
    defaultTempoBpm: 110,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Esegui l\'esercizio con uno dei due pattern melodici a disposizione (135 - 31 arpeggio triade oppure 123 - 21 do re mi).',
      'Canta YE YE YE con una voce squillante, con twang, brutta, da strega (chiamala come vuoi).',
      'Questo suono ci aiuta a proiettare il suono in avanti, ridurre l\'aria, migliorare l\'adduzione cordale e fare le note alte con più leggerezza.'
    ],
    instructionsEn: [
      'Perform the exercise with one of the two available melodic patterns (135 - 31 triad arpeggio or 123 - 21 do re mi).',
      'Sing YE YE YE with a bright, squillante voice, with twang, ugly, like a witch (call it what you like).',
      'This sound helps project the tone forward, reduce breathiness, improve vocal fold adduction, and reach high notes with greater ease.'
    ],
    vocalTip: '• È molto comune diminuire l\'intensità dello squillo man mano che vai avanti: è normale, finché non ti abitui. Quindi puoi provare a registrarti per sentire quando lo diminuisci, ma in ogni caso ci saranno le istruzioni nel player che ogni tanto ti ricorderanno cosa devi fare.\n• Presta attenzione a non fare un suono puramente nasale: il suono deve essere squillante ma non totalmente nel naso.',
    vocalTipEn: '• It is very common to reduce the intensity of the squillo/twang as you progress: this is normal until you get used to it. You can try recording yourself to hear when it drops, but in any case the player reminders will occasionally prompt you on what to do.\n• Pay attention not to make a purely nasal sound: the tone should be bright and squillante, but not completely in the nose.',
    patternOverrides: {
      arpeggio_13521: {
        instructions: [
          'Esegui l\'esercizio sul pattern 135 - 31 (arpeggio triade Do-Mi-Sol-Mi-Do).',
          'Canta YE YE YE con una voce squillante, con twang, brutta, da strega (chiamala come vuoi).',
          'Questo suono ci aiuta a proiettare il suono in avanti, ridurre l\'aria, migliorare l\'adduzione cordale e fare le note alte con più leggerezza.'
        ],
        instructionsEn: [
          'Perform the exercise on the 135 - 31 pattern (triad arpeggio Do-Mi-Sol-Mi-Do).',
          'Sing YE YE YE with a bright, squillante voice, with twang, ugly, like a witch (call it what you like).',
          'This sound helps project the tone forward, reduce breathiness, improve vocal fold adduction, and reach high notes with greater ease.'
        ],
        vocalTip: '• È molto comune diminuire l\'intensità dello squillo man mano che vai avanti: è normale, finché non ti abitui. Quindi puoi provare a registrarti per sentire quando lo diminuisci, ma in ogni caso ci saranno le istruzioni nel player che ogni tanto ti ricorderanno cosa devi fare.\n• Presta attenzione a non fare un suono puramente nasale: il suono deve essere squillante ma non totalmente nel naso.',
        vocalTipEn: '• It is very common to reduce the intensity of the squillo/twang as you progress: this is normal until you get used to it. You can try recording yourself to hear when it drops, but in any case the player reminders will occasionally prompt you on what to do.\n• Pay attention not to make a purely nasal sound: the tone should be bright and squillante, but not completely in the nose.'
      },
      three_notes: {
        instructions: [
          'Esegui l\'esercizio sul pattern 123 - 21 (do re mi - re do).',
          'Canta YE YE YE con una voce squillante, con twang, brutta, da strega (chiamala come vuoi).',
          'Questo suono ci aiuta a proiettare il suono in avanti, ridurre l\'aria, migliorare l\'adduzione cordale e fare le note alte con più leggerezza.'
        ],
        instructionsEn: [
          'Perform the exercise on the 123 - 21 pattern (do-re-mi-re-do).',
          'Sing YE YE YE with a bright, squillante voice, with twang, ugly, like a witch (call it what you like).',
          'This sound helps project the tone forward, reduce breathiness, improve vocal fold adduction, and reach high notes with greater ease.'
        ],
        vocalTip: '• È molto comune diminuire l\'intensità dello squillo man mano che vai avanti: è normale, finché non ti abitui. Quindi puoi provare a registrarti per sentire quando lo diminuisci, ma in ogni caso ci saranno le istruzioni nel player che ogni tanto ti ricorderanno cosa devi fare.\n• Presta attenzione a non fare un suono puramente nasale: il suono deve essere squillante ma non totalmente nel naso.',
        vocalTipEn: '• It is very common to reduce the intensity of the squillo/twang as you progress: this is normal until you get used to it. You can try recording yourself to hear when it drops, but in any case the player reminders will occasionally prompt you on what to do.\n• Pay attention not to make a purely nasal sound: the tone should be bright and squillante, but not completely in the nose.'
      }
    }
  },
  {
    id: 'res_mne_fissa',
    title: 'MNE (Nota Fissa)',
    titleEn: 'MNE (Sustained Note)',
    category: 'Risonanze',
    description: 'Esercizio a nota fissa su MNE per stabilizzare l\'adduzione cordale e la maschera.',
    descriptionEn: 'Sustained note exercise on MNE to stabilize vocal fold adduction and forward mask resonance.',
    scalePattern: 'fixed_3_notes',
    allowedPatterns: ['fixed_3_notes', 'fixed_5_notes'],
    defaultVowel: 'MNE',
    defaultTempoBpm: 100,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Articola "MNE" tenendo la nota fissa.',
      'Senti la consonante M nasale che si fonde con la vocale E ben focalizzata.'
    ],
    instructionsEn: [
      'Articulate "MNE" holding the sustained note.',
      'Feel the nasal M consonant blend seamlessly into the focused E vowel.'
    ],
    vocalTip: '• Il suono MNE attiva immediatamente l\'assottigliamento delle corde vocali.\n• Mantieni la risonanza anteriore senza spingere aria o forzare la laringe.',
    vocalTipEn: '• The MNE sound immediately engages thin vocal fold edges.\n• Maintain forward resonance without pushing air or forcing the larynx.'
  },
  {
    id: 'res_mne_111_5_gliss',
    title: 'MNE (111 5 + Glissando Quinta)',
    titleEn: 'MNE (111 5 + 5th Glissando)',
    category: 'Risonanze',
    description: '3 note fisse (1 1 1), salto al 5° grado e glissando discendente di ritorno alla nota base.',
    descriptionEn: '3 sustained notes (1 1 1), 5th leap and descending glissando returning to the root note.',
    scalePattern: 'jump_5_1',
    allowedPatterns: ['jump_5_1'],
    defaultVowel: 'MNE',
    defaultTempoBpm: 100,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Canta 1 1 1 su MNE, salta al 5° e scivola con un glissando fino al 1°.',
      'Mantieni lo squillo del suono MNE per tutta la discesa.'
    ],
    instructionsEn: [
      'Sing 1 1 1 on MNE, jump to the 5th and slide down with a glissando to the 1st.',
      'Maintain the bright squillo of the MNE sound throughout the descent.'
    ],
    vocalTip: '• Il glissando finale rilassa la muscolatura dopo l\'attacco in salto.\n• Mantieni la risonanza anteriore costante per tutto il passaggio.',
    vocalTipEn: '• The final glissando relaxes the musculature after the leap attack.\n• Maintain consistent forward resonance throughout the entire passage.'
  },
  {
    id: 'res_mam_fissa',
    title: 'MAM (1 1 1 1 1)',
    titleEn: 'MAM (1 1 1 1 1)',
    category: 'Risonanze',
    description: '5 ripetizioni a nota fissa su MAM per rinforzare la tenuta del registro misto e la risonanza anteriore.',
    descriptionEn: '5 sustained repetitions on MAM to reinforce mixed voice stability and forward resonance.',
    scalePattern: 'fixed_5_notes',
    allowedPatterns: ['fixed_5_notes', 'fixed_3_notes'],
    defaultVowel: 'MAM',
    defaultTempoBpm: 105,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Ripeti "MAM" per 5 volte sulla stessa nota.',
      'Mantenere la A ben posizionata senza allargare eccessivamente la bocca.'
    ],
    instructionsEn: [
      'Repeat "MAM" 5 times on the same note.',
      'Keep the A vowel well positioned vertically without overly widening the mouth.'
    ],
    vocalTip: '• Controlla che ciascun attacco sia identico al precedente.\n• L\'attacco in M pre-attiva le cavità di risonanza prima di aprire la A.',
    vocalTipEn: '• Check that each onset is identical to the previous one.\n• The M onset pre-activates the resonance cavities before opening the A.'
  },
  {
    id: 'res_mam_11151',
    title: 'MAM (1 1 1 5 1)',
    titleEn: 'MAM (1 1 1 5 1)',
    category: 'Risonanze',
    description: 'Tre note fisse sulla base (1 1 1), salto di quinta al 5° grado e ritorno a 1 con MAM.',
    descriptionEn: 'Three sustained root notes (1 1 1), leap of a fifth to the 5th degree, and return to 1 on MAM.',
    scalePattern: 'jump_5_1',
    allowedPatterns: ['jump_5_1'],
    defaultVowel: 'MAM',
    defaultTempoBpm: 105,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Canta 1 1 1 sulla nota base, salta al 5° grado e ritorna a 1.',
      'Usa l\'ancoraggio addominale per sostenere l\'intervallo di quinta.'
    ],
    instructionsEn: [
      'Sing 1 1 1 on the root note, leap to the 5th degree and return to 1.',
      'Use abdominal anchoring and breath support to sustain the interval of a fifth.'
    ],
    vocalTip: '• Mantieniti rilassato sul salto senza spingere la laringe in alto.\n• Non cambiare la forma della bocca durante il salto di quinta.',
    vocalTipEn: '• Stay relaxed on the leap without pushing the larynx upward.\n• Do not alter mouth shape during the leap of a fifth.'
  },
  {
    id: 'res_chicchi',
    title: 'CHICCHI',
    titleEn: 'CHICCHI',
    category: 'Risonanze',
    description: 'Esercizio con voce squillante sul suono CHICCHI per attivare la maschera e stringere i formanti della risonanza in alto.',
    descriptionEn: 'Exercise on CHICCHI to activate mask resonance and focus higher resonant formants with crisp articulation.',
    scalePattern: 'arpeggio_531_desc',
    allowedPatterns: ['arpeggio_531_desc', 'three_notes'],
    defaultVowel: 'CHICCHI',
    defaultTempoBpm: 110,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Esegui l\'esercizio con uno dei due pattern melodici a disposizione.',
      'Canta CHICCHI con una voce squillante, con twang, brutta, da strega (chiamala come vuoi).',
      'Assicurati di far sentire bene le C e le doppie C che in questo caso ci aiutano a togliere l\'ariosità.'
    ],
    instructionsEn: [
      'Perform the exercise with one of the two available melodic patterns.',
      'Sing CHICCHI with a bright, squillante voice, with twang, ugly, like a witch (call it what you like).',
      'Make sure to clearly articulate the C and double C consonants, which in this case help eliminate breathiness.'
    ],
    vocalTip: '• È molto comune diminuire l\'intensità dello squillo man mano che vai avanti: è normale, finché non ti abitui. Quindi puoi provare a registrarti per sentire quando lo diminuisci, ma in ogni caso ci saranno le istruzioni nel player che ogni tanto ti ricorderanno cosa devi fare.',
    vocalTipEn: '• It is very common to reduce the intensity of the squillo/twang as you progress: this is normal until you get used to it. You can try recording yourself to hear when it drops, but in any case the player reminders will occasionally prompt you on what to do.',
    patternOverrides: {
      arpeggio_531_desc: {
        instructions: [
          'Esegui l\'esercizio sul pattern 531 (arpeggio triade discendente Sol-Mi-Do).',
          'Canta CHICCHI con una voce squillante, con twang, brutta, da strega (chiamala come vuoi).',
          'Assicurati di far sentire bene le C e le doppie C che in questo caso ci aiutano a togliere l\'ariosità.'
        ],
        instructionsEn: [
          'Perform the exercise on the 531 pattern (descending triad arpeggio Sol-Mi-Do).',
          'Sing CHICCHI with a bright, squillante voice, with twang, ugly, like a witch (call it what you like).',
          'Make sure to clearly articulate the C and double C consonants, which in this case help eliminate breathiness.'
        ],
        vocalTip: '• È molto comune diminuire l\'intensità dello squillo man mano che vai avanti: è normale, finché non ti abitui. Quindi puoi provare a registrarti per sentire quando lo diminuisci, ma in ogni caso ci saranno le istruzioni nel player che ogni tanto ti ricorderanno cosa devi fare.',
        vocalTipEn: '• It is very common to reduce the intensity of the squillo/twang as you progress: this is normal until you get used to it. You can try recording yourself to hear when it drops, but in any case the player reminders will occasionally prompt you on what to do.'
      },
      three_notes: {
        instructions: [
          'Esegui l\'esercizio sul pattern 123 - 21 (do re mi - re do).',
          'Canta CHICCHI con una voce squillante, con twang, brutta, da strega (chiamala come vuoi).',
          'Assicurati di far sentire bene le C e le doppie C che in questo caso ci aiutano a togliere l\'ariosità.'
        ],
        instructionsEn: [
          'Perform the exercise on the 123 - 21 pattern (do-re-mi-re-do).',
          'Sing CHICCHI with a bright, squillante voice, with twang, ugly, like a witch (call it what you like).',
          'Make sure to clearly articulate the C and double C consonants, which in this case help eliminate breathiness.'
        ],
        vocalTip: '• È molto comune diminuire l\'intensità dello squillo man mano che vai avanti: è normale, finché non ti abitui. Quindi puoi provare a registrarti per sentire quando lo diminuisci, ma in ogni caso ci saranno le istruzioni nel player che ogni tanto ti ricorderanno cosa devi fare.',
        vocalTipEn: '• It is very common to reduce the intensity of the squillo/twang as you progress: this is normal until you get used to it. You can try recording yourself to hear when it drops, but in any case the player reminders will occasionally prompt you on what to do.'
      }
    }
  },
  {
    id: 'res_chiii',
    title: 'CHIII',
    titleEn: 'CHIII',
    category: 'Risonanze',
    description: 'Esercizio legato sul suono CHIII per la brillantezza della vocale I e la focalizzazione anteriore.',
    descriptionEn: 'Legato exercise on the CHIII sound for bright I vowel resonance and focused forward projection.',
    scalePattern: 'arpeggio_531_desc',
    allowedPatterns: ['arpeggio_531_desc', 'three_notes'],
    defaultVowel: 'CHIII',
    defaultTempoBpm: 110,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Esegui l\'esercizio con uno dei due pattern melodici a disposizione.',
      'Canta CHIII con una voce squillante, con twang, brutta, da strega (chiamala come vuoi).',
      'Qui non hai la doppia C che ti aiuta a togliere aria, quindi è compito tuo cercare di mantenere la stessa risonanza squillante e avrai bisogno di concentrarti!'
    ],
    instructionsEn: [
      'Perform the exercise with one of the two available melodic patterns.',
      'Sing CHIII with a bright, squillante voice, with twang, ugly, like a witch (call it what you like).',
      'Here you do not have the double C to help remove air, so it is your job to maintain the same bright squillante resonance and you will need to concentrate!'
    ],
    vocalTip: '• È molto comune diminuire l\'intensità dello squillo man mano che vai avanti: è normale, finché non ti abitui. Quindi puoi provare a registrarti per sentire quando lo diminuisci, ma in ogni caso ci saranno le istruzioni nel player che ogni tanto ti ricorderanno cosa devi fare.',
    vocalTipEn: '• It is very common to reduce the intensity of the squillo/twang as you progress: this is normal until you get used to it. You can try recording yourself to hear when it drops, but in any case the player reminders will occasionally prompt you on what to do.',
    patternOverrides: {
      arpeggio_531_desc: {
        instructions: [
          'Esegui l\'esercizio sul pattern 531 (arpeggio triade discendente legato Sol-Mi-Do).',
          'Canta CHIII con una voce squillante, con twang, brutta, da strega (chiamala come vuoi).',
          'Qui non hai la doppia C che ti aiuta a togliere aria, quindi è compito tuo cercare di mantenere la stessa risonanza squillante e avrai bisogno di concentrarti!'
        ],
        instructionsEn: [
          'Perform the exercise on the 531 pattern (legato descending triad arpeggio Sol-Mi-Do).',
          'Sing CHIII with a bright, squillante voice, with twang, ugly, like a witch (call it what you like).',
          'Here you do not have the double C to help remove air, so it is your job to maintain the same bright squillante resonance and you will need to concentrate!'
        ],
        vocalTip: '• È molto comune diminuire l\'intensità dello squillo man mano che vai avanti: è normale, finché non ti abitui. Quindi puoi provare a registrarti per sentire quando lo diminuisci, ma in ogni caso ci saranno le istruzioni nel player che ogni tanto ti ricorderanno cosa devi fare.',
        vocalTipEn: '• It is very common to reduce the intensity of the squillo/twang as you progress: this is normal until you get used to it. You can try recording yourself to hear when it drops, but in any case the player reminders will occasionally prompt you on what to do.'
      },
      three_notes: {
        instructions: [
          'Esegui l\'esercizio sul pattern 123 - 21 (do re mi - re do).',
          'Canta CHIII con una voce squillante, con twang, brutta, da strega (chiamala come vuoi).',
          'Qui non hai la doppia C che ti aiuta a togliere aria, quindi è compito tuo cercare di mantenere la stessa risonanza squillante e avrai bisogno di concentrarti!'
        ],
        instructionsEn: [
          'Perform the exercise on the 123 - 21 pattern (do-re-mi-re-do).',
          'Sing CHIII with a bright, squillante voice, with twang, ugly, like a witch (call it what you like).',
          'Here you do not have the double C to help remove air, so it is your job to maintain the same bright squillante resonance and you will need to concentrate!'
        ],
        vocalTip: '• È molto comune diminuire l\'intensità dello squillo man mano che vai avanti: è normale, finché non ti abitui. Quindi puoi provare a registrarti per sentire quando lo diminuisci, ma in ogni caso ci saranno le istruzioni nel player che ogni tanto ti ricorderanno cosa devi fare.',
        vocalTipEn: '• It is very common to reduce the intensity of the squillo/twang as you progress: this is normal until you get used to it. You can try recording yourself to hear when it drops, but in any case the player reminders will occasionally prompt you on what to do.'
      }
    }
  },
  {
    id: 'res_ninni_111_333_111',
    title: 'NINNI (111 333 111)',
    titleEn: 'NINNI (111 333 111)',
    category: 'Risonanze',
    description: 'Pattern 111 333 111 su NINNI con voce squillante e twang per proiettare il suono in avanti e stimolare un timbro spigoloso.',
    descriptionEn: 'Pattern 111 333 111 on NINNI with bright twang voice to project sound forward and create an edgy timbre.',
    scalePattern: 'ninni_111_333_111',
    allowedPatterns: ['ninni_111_333_111'],
    defaultVowel: 'NINNI',
    defaultTempoBpm: 110,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Esegui l\'esercizio col pattern melodico a disposizione.',
      'Canta NINNI con una voce squillante, con twang, brutta, da strega (chiamala come vuoi).',
      'Assicurati di far sentire bene le N e le doppie N che in questo caso ci aiutano a proiettare il suono in avanti e avere un suono più spigoloso.'
    ],
    instructionsEn: [
      'Perform the exercise with the available melodic pattern.',
      'Sing NINNI with a bright, squillante voice, with twang, ugly, like a witch (call it what you like).',
      'Make sure to clearly articulate the N and double N consonants, which in this case help project the tone forward and create an edgier sound.'
    ],
    vocalTip: '• È molto comune diminuire l\'intensità dello squillo man mano che vai avanti: è normale, finché non ti abitui. Quindi puoi provare a registrarti per sentire quando lo diminuisci, ma in ogni caso ci saranno le istruzioni nel player che ogni tanto ti ricorderanno cosa devi fare.',
    vocalTipEn: '• It is very common to reduce the intensity of the squillo/twang as you progress: this is normal until you get used to it. You can try recording yourself to hear when it drops, but in any case the player reminders will occasionally prompt you on what to do.'
  },

  // --- 4. AGILITÀ ---
  {
    id: 'agi_ma_mo_ma_1358',
    title: 'MA MO MA (1358 12321 1358)',
    category: 'Agilità',
    description: 'Sequenza rapida combinata: arpeggio di ottava (1358), scala di 3 note (12321) e secondo arpeggio (1358) con cambi vocalici.',
    scalePattern: 'ma_mo_ma_run',
    allowedPatterns: ['ma_mo_ma_run', 'five_notes', 'broad_arpeggio'],
    defaultVowel: 'MA MO MA',
    defaultTempoBpm: 120,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Pronuncia "MA" sull\'arpeggio 1 3 5 8, "MO" sulla scala 1 2 3 2 1 e "MA" sul secondo arpeggio 1 3 5 8.',
      'Mantieni la laringe stabile e la cavità orale flessibile nei repentini cambi vocalici.'
    ],
    vocalTip: 'Sfrutta l\'agilità della lingua e delle labbra senza muovere bruscamente la gola.'
  },

  // --- 5. ADDUZIONE ---
  {
    id: 'add_gne',
    title: 'GNE GNE',
    titleEn: 'GNE GNE',
    category: 'Adduzione',
    description: 'Esercizio con voce squillante e twang su GNE GNE per proiettare il suono in avanti, ridurre l\'aria, stimolare l\'adduzione cordale immediata e fare le note alte con più leggerezza.',
    descriptionEn: 'Exercise with bright twang voice on GNE GNE to project sound forward, eliminate air leakage, stimulate immediate vocal fold adduction, and ease high notes.',
    scalePattern: 'arpeggio_13521',
    allowedPatterns: ['arpeggio_13521', 'three_notes'],
    defaultVowel: 'GNE GNE',
    defaultTempoBpm: 110,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Esegui l\'esercizio con uno dei due pattern melodici a disposizione (135 - 31 arpeggio triade oppure 123 - 21 do re mi).',
      'Canta GNE GNE con una voce squillante, con twang, brutta, da strega (chiamala come vuoi).',
      'Questo suono ci aiuta a proiettare il suono in avanti, ridurre l\'aria, migliorare l\'adduzione cordale e fare le note alte con più leggerezza.'
    ],
    instructionsEn: [
      'Perform the exercise with one of the two available melodic patterns (135 - 31 triad arpeggio or 123 - 21 do re mi).',
      'Sing GNE GNE with a bright, squillante voice, with twang, ugly, like a witch (call it what you like).',
      'This sound helps project the tone forward, reduce breathiness, improve vocal fold adduction, and reach high notes with greater ease.'
    ],
    vocalTip: '• È molto comune diminuire l\'intensità dello squillo man mano che vai avanti: è normale, finché non ti abitui. Quindi puoi provare a registrarti per sentire quando lo diminuisci, ma in ogni caso ci saranno le istruzioni nel player che ogni tanto ti ricorderanno cosa devi fare.\n• Presta attenzione a non fare un suono puramente nasale: il suono deve essere squillante ma non totalmente nel naso.',
    vocalTipEn: '• It is very common to reduce the intensity of the squillo/twang as you progress: this is normal until you get used to it. You can try recording yourself to hear when it drops, but in any case the player reminders will occasionally prompt you on what to do.\n• Pay attention not to make a purely nasal sound: the tone should be bright and squillante, but not completely in the nose.',
    patternOverrides: {
      arpeggio_13521: {
        instructions: [
          'Esegui l\'esercizio sul pattern 135 - 31 (arpeggio triade Do-Mi-Sol-Mi-Do).',
          'Canta GNE GNE con una voce squillante, con twang, brutta, da strega (chiamala come vuoi).',
          'Questo suono ci aiuta a proiettare il suono in avanti, ridurre l\'aria, migliorare l\'adduzione cordale e fare le note alte con più leggerezza.'
        ],
        instructionsEn: [
          'Perform the exercise on the 135 - 31 pattern (triad arpeggio Do-Mi-Sol-Mi-Do).',
          'Sing GNE GNE with a bright, squillante voice, with twang, ugly, like a witch (call it what you like).',
          'This sound helps project the tone forward, reduce breathiness, improve vocal fold adduction, and reach high notes with greater ease.'
        ],
        vocalTip: '• È molto comune diminuire l\'intensità dello squillo man mano che vai avanti: è normale, finché non ti abitui. Quindi puoi provare a registrarti per sentire quando lo diminuisci, ma in ogni caso ci saranno le istruzioni nel player che ogni tanto ti ricorderanno cosa devi fare.\n• Presta attenzione a non fare un suono puramente nasale: il suono deve essere squillante ma non totalmente nel naso.',
        vocalTipEn: '• It is very common to reduce the intensity of the squillo/twang as you progress: this is normal until you get used to it. You can try recording yourself to hear when it drops, but in any case the player reminders will occasionally prompt you on what to do.'
      },
      three_notes: {
        instructions: [
          'Esegui l\'esercizio sul pattern 123 - 21 (do re mi - re do).',
          'Canta GNE GNE con una voce squillante, con twang, brutta, da strega (chiamala come vuoi).',
          'Questo suono ci aiuta a proiettare il suono in avanti, ridurre l\'aria, migliorare l\'adduzione cordale e fare le note alte con più leggerezza.'
        ],
        instructionsEn: [
          'Perform the exercise on the 123 - 21 pattern (do-re-mi-re-do).',
          'Sing GNE GNE with a bright, squillante voice, with twang, ugly, like a witch (call it what you like).',
          'This sound helps project the tone forward, reduce breathiness, improve vocal fold adduction, and reach high notes with greater ease.'
        ],
        vocalTip: '• È molto comune diminuire l\'intensità dello squillo man mano che vai avanti: è normale, finché non ti abitui. Quindi puoi provare a registrarti per sentire quando lo diminuisci, ma in ogni caso ci saranno le istruzioni nel player che ogni tanto ti ricorderanno cosa devi fare.\n• Presta attenzione a non fare un suono puramente nasale: il suono deve essere squillante ma non totalmente nel naso.',
        vocalTipEn: '• It is very common to reduce the intensity of the squillo/twang as you progress: this is normal until you get used to it. You can try recording yourself to hear when it drops, but in any case the player reminders will occasionally prompt you on what to do.'
      }
    }
  },
  {
    id: 'add_ye',
    title: 'YE YE YE',
    titleEn: 'YE YE YE',
    category: 'Adduzione',
    description: 'Esercizio con voce squillante e twang su YE YE YE per proiettare il suono in avanti, ridurre l\'aria, favorire un\'adduzione cordale morbida ma definita e facilitare le note alte.',
    descriptionEn: 'Exercise with bright twang voice on YE YE YE to project sound forward, eliminate air leakage, promote smooth yet defined adduction, and reach high notes with greater ease.',
    scalePattern: 'arpeggio_13521',
    allowedPatterns: ['arpeggio_13521', 'three_notes'],
    defaultVowel: 'YE YE YE',
    defaultTempoBpm: 110,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Esegui l\'esercizio con uno dei due pattern melodici a disposizione (135 - 31 arpeggio triade oppure 123 - 21 do re mi).',
      'Canta YE YE YE con una voce squillante, con twang, brutta, da strega (chiamala come vuoi).',
      'Questo suono ci aiuta a proiettare il suono in avanti, ridurre l\'aria, migliorare l\'adduzione cordale e fare le note alte con più leggerezza.'
    ],
    instructionsEn: [
      'Perform the exercise with one of the two available melodic patterns (135 - 31 triad arpeggio or 123 - 21 do re mi).',
      'Sing YE YE YE with a bright, squillante voice, with twang, ugly, like a witch (call it what you like).',
      'This sound helps project the tone forward, reduce breathiness, improve vocal fold adduction, and reach high notes with greater ease.'
    ],
    vocalTip: '• È molto comune diminuire l\'intensità dello squillo man mano che vai avanti: è normale, finché non ti abitui. Quindi puoi provare a registrarti per sentire quando lo diminuisci, ma in ogni caso ci saranno le istruzioni nel player che ogni tanto ti ricorderanno cosa devi fare.\n• Presta attenzione a non fare un suono puramente nasale: il suono deve essere squillante ma non totalmente nel naso.',
    vocalTipEn: '• It is very common to reduce the intensity of the squillo/twang as you progress: this is normal until you get used to it. You can try recording yourself to hear when it drops, but in any case the player reminders will occasionally prompt you on what to do.\n• Pay attention not to make a purely nasal sound: the tone should be bright and squillante, but not completely in the nose.',
    patternOverrides: {
      arpeggio_13521: {
        instructions: [
          'Esegui l\'esercizio sul pattern 135 - 31 (arpeggio triade Do-Mi-Sol-Mi-Do).',
          'Canta YE YE YE con una voce squillante, con twang, brutta, da strega (chiamala come vuoi).',
          'Questo suono ci aiuta a proiettare il suono in avanti, ridurre l\'aria, migliorare l\'adduzione cordale e fare le note alte con più leggerezza.'
        ],
        instructionsEn: [
          'Perform the exercise on the 135 - 31 pattern (triad arpeggio Do-Mi-Sol-Mi-Do).',
          'Sing YE YE YE with a bright, squillante voice, with twang, ugly, like a witch (call it what you like).',
          'This sound helps project the tone forward, reduce breathiness, improve vocal fold adduction, and reach high notes with greater ease.'
        ],
        vocalTip: '• È molto comune diminuire l\'intensità dello squillo man mano che vai avanti: è normale, finché non ti abitui. Quindi puoi provare a registrarti per sentire quando lo diminuisci, ma in ogni caso ci saranno le istruzioni nel player che ogni tanto ti ricorderanno cosa devi fare.\n• Presta attenzione a non fare un suono puramente nasale: il suono deve essere squillante ma non totalmente nel naso.',
        vocalTipEn: '• It is very common to reduce the intensity of the squillo/twang as you progress: this is normal until you get used to it. You can try recording yourself to hear when it drops, but in any case the player reminders will occasionally prompt you on what to do.'
      },
      three_notes: {
        instructions: [
          'Esegui l\'esercizio sul pattern 123 - 21 (do re mi - re do).',
          'Canta YE YE YE con una voce squillante, con twang, brutta, da strega (chiamala come vuoi).',
          'Questo suono ci aiuta a proiettare il suono in avanti, ridurre l\'aria, migliorare l\'adduzione cordale e fare le note alte con più leggerezza.'
        ],
        instructionsEn: [
          'Perform the exercise on the 123 - 21 pattern (do-re-mi-re-do).',
          'Sing YE YE YE with a bright, squillante voice, with twang, ugly, like a witch (call it what you like).',
          'This sound helps project the tone forward, reduce breathiness, improve vocal fold adduction, and reach high notes with greater ease.'
        ],
        vocalTip: '• È molto comune diminuire l\'intensità dello squillo man mano che vai avanti: è normale, finché non ti abitui. Quindi puoi provare a registrarti per sentire quando lo diminuisci, ma in ogni caso ci saranno le istruzioni nel player che ogni tanto ti ricorderanno cosa devi fare.\n• Presta attenzione a non fare un suono puramente nasale: il suono deve essere squillante ma non totalmente nel naso.',
        vocalTipEn: '• It is very common to reduce the intensity of the squillo/twang as you progress: this is normal until you get used to it. You can try recording yourself to hear when it drops, but in any case the player reminders will occasionally prompt you on what to do.'
      }
    }
  },
  {
    id: 'add_mne_fissa',
    title: 'MNE (Nota Fissa)',
    titleEn: 'MNE (Sustained Note)',
    category: 'Adduzione',
    description: 'Esercizio a nota fissa su MNE per stabilizzare l\'adduzione cordale e la maschera.',
    descriptionEn: 'Sustained note exercise on MNE to stabilize vocal fold adduction and forward mask resonance.',
    scalePattern: 'fixed_3_notes',
    allowedPatterns: ['fixed_3_notes', 'fixed_5_notes'],
    defaultVowel: 'MNE',
    defaultTempoBpm: 100,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Articola "MNE" tenendo la nota fissa.',
      'Senti la consonante M nasale che si fonde con la vocale E ben focalizzata.'
    ],
    instructionsEn: [
      'Articulate "MNE" holding the sustained note.',
      'Feel the nasal M consonant blend seamlessly into the focused E vowel.'
    ],
    vocalTip: '• Il suono MNE attiva immediatamente l\'assottigliamento delle corde vocali.\n• Mantieni la risonanza anteriore senza spingere aria o forzare la laringe.',
    vocalTipEn: '• The MNE sound immediately engages thin vocal fold edges.\n• Maintain forward resonance without pushing air or forcing the larynx.'
  },
  {
    id: 'add_mam_fissa',
    title: 'MAM (1 1 1 1 1)',
    titleEn: 'MAM (1 1 1 1 1)',
    category: 'Adduzione',
    description: '5 ripetizioni a nota fissa su MAM per rinforzare la tenuta dell\'adduzione cordale e del registro misto.',
    descriptionEn: '5 sustained repetitions on MAM to reinforce vocal fold adduction and mixed voice stability.',
    scalePattern: 'fixed_5_notes',
    allowedPatterns: ['fixed_5_notes', 'fixed_3_notes'],
    defaultVowel: 'MAM',
    defaultTempoBpm: 105,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Ripeti "MAM" per 5 volte sulla stessa nota.',
      'Mantenere la A ben posizionata senza allargare eccessivamente la bocca.'
    ],
    instructionsEn: [
      'Repeat "MAM" 5 times on the same note.',
      'Keep the A vowel well positioned vertically without overly widening the mouth.'
    ],
    vocalTip: '• Controlla che ciascun attacco sia identico al precedente.\n• L\'attacco in M pre-attiva le cavità di risonanza prima di aprire la A.',
    vocalTipEn: '• Check that each onset is identical to the previous one.\n• The M onset pre-activates the resonance cavities before opening the A.'
  },
  {
    id: 'add_mam_11151',
    title: 'MAM (1 1 1 5 1)',
    titleEn: 'MAM (1 1 1 5 1)',
    category: 'Adduzione',
    description: 'Tre note fisse sulla base (1 1 1), salto di quinta al 5° grado e ritorno a 1 con MAM per verificare la tenuta cordale in movimento.',
    descriptionEn: 'Three sustained root notes (1 1 1), leap of a fifth to the 5th degree, and return to 1 on MAM.',
    scalePattern: 'jump_5_1',
    allowedPatterns: ['jump_5_1'],
    defaultVowel: 'MAM',
    defaultTempoBpm: 105,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Canta 1 1 1 sulla nota base, salta al 5° grado e ritorna a 1.',
      'Usa l\'ancoraggio addominale per sostenere l\'intervallo di quinta.'
    ],
    instructionsEn: [
      'Sing 1 1 1 on the root note, leap to the 5th degree and return to 1.',
      'Use abdominal anchoring and breath support to sustain the interval of a fifth.'
    ],
    vocalTip: '• Mantieniti rilassato sul salto senza spingere la laringe in alto.\n• Non cambiare la forma della bocca durante il salto di quinta.',
    vocalTipEn: '• Stay relaxed on the leap without pushing the larynx upward.\n• Do not alter mouth shape during the leap of a fifth.'
  },
  {
    id: 'add_chicchi',
    title: 'CHICCHI',
    titleEn: 'CHICCHI',
    category: 'Adduzione',
    description: 'Esercizio con voce squillante sul suono CHICCHI per un\'adduzione nitida guidata dalla consonante occlusiva CH e per togliere l\'ariosità.',
    descriptionEn: 'Exercise with bright twang voice on CHICCHI for crisp adduction guided by the CH stop consonant to eliminate breathiness.',
    scalePattern: 'arpeggio_531_desc',
    allowedPatterns: ['arpeggio_531_desc', 'three_notes'],
    defaultVowel: 'CHICCHI',
    defaultTempoBpm: 110,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Esegui l\'esercizio con uno dei due pattern melodici a disposizione.',
      'Canta CHICCHI con una voce squillante, con twang, brutta, da strega (chiamala come vuoi).',
      'Assicurati di far sentire bene le C e le doppie C che in questo caso ci aiutano a togliere l\'ariosità.'
    ],
    instructionsEn: [
      'Perform the exercise with one of the two available melodic patterns.',
      'Sing CHICCHI with a bright, squillante voice, with twang, ugly, like a witch (call it what you like).',
      'Make sure to clearly articulate the C and double C consonants, which in this case help eliminate breathiness.'
    ],
    vocalTip: '• È molto comune diminuire l\'intensità dello squillo man mano che vai avanti: è normale, finché non ti abitui. Quindi puoi provare a registrarti per sentire quando lo diminuisci, ma in ogni caso ci saranno le istruzioni nel player che ogni tanto ti ricorderanno cosa devi fare.',
    vocalTipEn: '• It is very common to reduce the intensity of the squillo/twang as you progress: this is normal until you get used to it. You can try recording yourself to hear when it drops, but in any case the player reminders will occasionally prompt you on what to do.',
    patternOverrides: {
      arpeggio_531_desc: {
        instructions: [
          'Esegui l\'esercizio sul pattern 531 (arpeggio triade discendente Sol-Mi-Do).',
          'Canta CHICCHI con una voce squillante, con twang, brutta, da strega (chiamala come vuoi).',
          'Assicurati di far sentire bene le C e le doppie C che in questo caso ci aiutano a togliere l\'ariosità.'
        ],
        instructionsEn: [
          'Perform the exercise on the 531 pattern (descending triad arpeggio Sol-Mi-Do).',
          'Sing CHICCHI with a bright, squillante voice, with twang, ugly, like a witch (call it what you like).',
          'Make sure to clearly articulate the C and double C consonants, which in this case help eliminate breathiness.'
        ],
        vocalTip: '• È molto comune diminuire l\'intensità dello squillo man mano che vai avanti: è normale, finché non ti abitui. Quindi puoi provare a registrarti per sentire quando lo diminuisci, ma in ogni caso ci saranno le istruzioni nel player che ogni tanto ti ricorderanno cosa devi fare.',
        vocalTipEn: '• It is very common to reduce the intensity of the squillo/twang as you progress: this is normal until you get used to it. You can try recording yourself to hear when it drops, but in any case the player reminders will occasionally prompt you on what to do.'
      },
      three_notes: {
        instructions: [
          'Esegui l\'esercizio sul pattern 123 - 21 (do re mi - re do).',
          'Canta CHICCHI con una voce squillante, con twang, brutta, da strega (chiamala come vuoi).',
          'Assicurati di far sentire bene le C e le doppie C che in questo caso ci aiutano a togliere l\'ariosità.'
        ],
        instructionsEn: [
          'Perform the exercise on the 123 - 21 pattern (do-re-mi-re-do).',
          'Sing CHICCHI with a bright, squillante voice, with twang, ugly, like a witch (call it what you like).',
          'Make sure to clearly articulate the C and double C consonants, which in this case help eliminate breathiness.'
        ],
        vocalTip: '• È molto comune diminuire l\'intensità dello squillo man mano che vai avanti: è normale, finché non ti abitui. Quindi puoi provare a registrarti per sentire quando lo diminuisci, ma in ogni caso ci saranno le istruzioni nel player che ogni tanto ti ricorderanno cosa devi fare.',
        vocalTipEn: '• It is very common to reduce the intensity of the squillo/twang as you progress: this is normal until you get used to it. You can try recording yourself to hear when it drops, but in any case the player reminders will occasionally prompt you on what to do.'
      }
    }
  },
  {
    id: 'add_chiii',
    title: 'CHIII',
    titleEn: 'CHIII',
    category: 'Adduzione',
    description: 'Esercizio legato sul suono CHIII per mantenere un\'adduzione cordale continua e brillante senza l\'aiuto della doppia consonante.',
    descriptionEn: 'Legato exercise on the CHIII sound to maintain continuous and bright vocal fold adduction without the aid of a double stop consonant.',
    scalePattern: 'arpeggio_531_desc',
    allowedPatterns: ['arpeggio_531_desc', 'three_notes'],
    defaultVowel: 'CHIII',
    defaultTempoBpm: 110,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Esegui l\'esercizio con uno dei due pattern melodici a disposizione.',
      'Canta CHIII con una voce squillante, con twang, brutta, da strega (chiamala come vuoi).',
      'Qui non hai la doppia C che ti aiuta a togliere aria, quindi è compito tuo cercare di mantenere la stessa risonanza squillante e avrai bisogno di concentrarti!'
    ],
    instructionsEn: [
      'Perform the exercise with one of the two available melodic patterns.',
      'Sing CHIII with a bright, squillante voice, with twang, ugly, like a witch (call it what you like).',
      'Here you do not have the double C to help remove air, so it is your job to maintain the same bright squillante resonance and you will need to concentrate!'
    ],
    vocalTip: '• È molto comune diminuire l\'intensità dello squillo man mano che vai avanti: è normale, finché non ti abitui. Quindi puoi provare a registrarti per sentire quando lo diminuisci, ma in ogni caso ci saranno le istruzioni nel player che ogni tanto ti ricorderanno cosa devi fare.',
    vocalTipEn: '• It is very common to reduce the intensity of the squillo/twang as you progress: this is normal until you get used to it. You can try recording yourself to hear when it drops, but in any case the player reminders will occasionally prompt you on what to do.',
    patternOverrides: {
      arpeggio_531_desc: {
        instructions: [
          'Esegui l\'esercizio sul pattern 531 (arpeggio triade discendente legato Sol-Mi-Do).',
          'Canta CHIII con una voce squillante, con twang, brutta, da strega (chiamala come vuoi).',
          'Qui non hai la doppia C che ti aiuta a togliere aria, quindi è compito tuo cercare di mantenere la stessa risonanza squillante e avrai bisogno di concentrarti!'
        ],
        instructionsEn: [
          'Perform the exercise on the 531 pattern (legato descending triad arpeggio Sol-Mi-Do).',
          'Sing CHIII with a bright, squillante voice, with twang, ugly, like a witch (call it what you like).',
          'Here you do not have the double C to help remove air, so it is your job to maintain the same bright squillante resonance and you will need to concentrate!'
        ],
        vocalTip: '• È molto comune diminuire l\'intensità dello squillo man mano che vai avanti: è normale, finché non ti abitui. Quindi puoi provare a registrarti per sentire quando lo diminuisci, ma in ogni caso ci saranno le istruzioni nel player che ogni tanto ti ricorderanno cosa devi fare.',
        vocalTipEn: '• It is very common to reduce the intensity of the squillo/twang as you progress: this is normal until you get used to it. You can try recording yourself to hear when it drops, but in any case the player reminders will occasionally prompt you on what to do.'
      },
      three_notes: {
        instructions: [
          'Esegui l\'esercizio sul pattern 123 - 21 (do re mi - re do).',
          'Canta CHIII con una voce squillante, con twang, brutta, da strega (chiamala come vuoi).',
          'Qui non hai la doppia C che ti aiuta a togliere aria, quindi è compito tuo cercare di mantenere la stessa risonanza squillante e avrai bisogno di concentrarti!'
        ],
        instructionsEn: [
          'Perform the exercise on the 123 - 21 pattern (do-re-mi-re-do).',
          'Sing CHIII with a bright, squillante voice, with twang, ugly, like a witch (call it what you like).',
          'Here you do not have the double C to help remove air, so it is your job to maintain the same bright squillante resonance and you will need to concentrate!'
        ],
        vocalTip: '• È molto comune diminuire l\'intensità dello squillo man mano che vai avanti: è normale, finché non ti abitui. Quindi puoi provare a registrarti per sentire quando lo diminuisci, ma in ogni caso ci saranno le istruzioni nel player che ogni tanto ti ricorderanno cosa devi fare.',
        vocalTipEn: '• It is very common to reduce the intensity of the squillo/twang as you progress: this is normal until you get used to it. You can try recording yourself to hear when it drops, but in any case the player reminders will occasionally prompt you on what to do.'
      }
    }
  },
  {
    id: 'add_ninni_111_333_111',
    title: 'NINNI (111 333 111)',
    titleEn: 'NINNI (111 333 111)',
    category: 'Adduzione',
    description: 'Pattern 111 333 111 su NINNI con voce squillante e twang per proiettare il suono in avanti, alternare gradi e stimolare una salda adduzione.',
    descriptionEn: 'Pattern 111 333 111 on NINNI with bright twang voice to project sound forward and maintain solid vocal fold adduction across intervals.',
    scalePattern: 'ninni_111_333_111',
    allowedPatterns: ['ninni_111_333_111'],
    defaultVowel: 'NINNI',
    defaultTempoBpm: 110,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Esegui l\'esercizio col pattern melodico a disposizione.',
      'Canta NINNI con una voce squillante, con twang, brutta, da strega (chiamala come vuoi).',
      'Assicurati di far sentire bene le N e le doppie N che in questo caso ci aiutano a proiettare il suono in avanti e avere un suono più spigoloso.'
    ],
    instructionsEn: [
      'Perform the exercise with the available melodic pattern.',
      'Sing NINNI with a bright, squillante voice, with twang, ugly, like a witch (call it what you like).',
      'Make sure to clearly articulate the N and double N consonants, which in this case help project the tone forward and create an edgier sound.'
    ],
    vocalTip: '• È molto comune diminuire l\'intensità dello squillo man mano che vai avanti: è normale, finché non ti abitui. Quindi puoi provare a registrarti per sentire quando lo diminuisci, ma in ogni caso ci saranno le istruzioni nel player che ogni tanto ti ricorderanno cosa devi fare.',
    vocalTipEn: '• It is very common to reduce the intensity of the squillo/twang as you progress: this is normal until you get used to it. You can try recording yourself to hear when it drops, but in any case the player reminders will occasionally prompt you on what to do.'
  },
  {
    id: 'add_he_13_15_18',
    title: 'HE (1 3 - 1 5 - 1 8 - Attacco Glottale)',
    category: 'Adduzione',
    description: 'Intervalli progressivi (1-3, 1-5, 1-8) con attacco glottale misurato su HE per sviluppare la reattività adducente.',
    scalePattern: 'jump_13_15_18',
    allowedPatterns: ['jump_13_15_18', 'broad_arpeggio'],
    defaultVowel: 'HE',
    defaultTempoBpm: 95,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Canta 1 -> 3, 1 -> 5, 1 -> 8 (Do Mi, Do Sol, Do Do ottava) pronunciando "HE" su ogni nota.',
      'Esegui un attacco netto e controllato per sollecitare l\'adduzione elastica sulle ampiezze crescenti.'
    ],
    vocalTip: 'L\'attacco in HE deve essere pronto e pulito, senza colpi di gola violenti.'
  },

  // --- 6. ARTICOLAZIONE ---

  // --- 7. ANCORAGGIO ---
  {
    id: 'anc_mam_fissa',
    title: 'MAM (1 1 1 1 1)',
    category: 'Ancoraggio',
    description: 'Nota fissa x5 con MAM per attivare l\'ancoraggio corporeo e la stabilità posturale.',
    scalePattern: 'fixed_5_notes',
    allowedPatterns: ['fixed_5_notes'],
    defaultVowel: 'MAM',
    defaultTempoBpm: 105,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Canta "MAM" 5 volte sulla stessa nota ancorando le spalle e i dorsali.',
      'Senti la radice del suono nel corpo per evitare pressioni alla gola.'
    ],
    vocalTip: 'Attiva la muscolatura del busto a ogni ripetizione.'
  },
  {
    id: 'anc_mam_11151',
    title: 'MAM (1 1 1 5 1)',
    category: 'Ancoraggio',
    description: 'Ancoraggio sulla nota di base (1 1 1) e salto di quinta (5 1) mantenendo il supporto fisico.',
    scalePattern: 'jump_5_1',
    allowedPatterns: ['jump_5_1', 'triad'],
    defaultVowel: 'MAM',
    defaultTempoBpm: 105,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Ripeti 1 1 1 su MAM per stabilizzare l\'ancoraggio, poi esegui il salto al 5° grado.',
      'Mantieni i dorsali e i pettorali attivi durante l\'estensione verso l\'alto.'
    ],
    vocalTip: 'L\'ancoraggio previene la salita indesiderata della laringe sul salto.'
  },
  {
    id: 'anc_he_he_heee_55531',
    title: 'HE HE HEEE (55 531)',
    category: 'Ancoraggio',
    description: 'Rafforzamento dell\'ancoraggio sul 5° grado con attacchi HE HE e discesa 5 3 1 su HEEE.',
    scalePattern: 'arpeggio_55531',
    allowedPatterns: ['arpeggio_55531', 'arpeggio_531_desc'],
    defaultVowel: 'HE HE HEEE',
    defaultTempoBpm: 105,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Esegui due attacchi "HE HE" sul 5° grado e scendi con "HEEE" su 5 3 1.',
      'Sfrutta l\'impulso del fiato per ingaggiare la muscolatura di sostegno.'
    ],
    vocalTip: 'Gli attacchi in HE attivano immediatamente il supporto muscolare profondo.'
  },
  {
    id: 'anc_mee_gliss_151',
    title: 'MEE (1 5 - 5 1 Glissando Lento)',
    category: 'Ancoraggio',
    description: 'Glissando lento di quinta (1-5-1) su MEE per allenare l\'ancoraggio continuo e fluido.',
    scalePattern: 'gliss_1_5_1',
    allowedPatterns: ['gliss_1_5_1', 'gliss_1_5'],
    defaultVowel: 'MEE',
    defaultTempoBpm: 85,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Scivola lentamente dalla fondamentale alla quinta e ritorna su MEE.',
      'Mentre il suono sale, immagina di spingere verso il basso con l\'ancoraggio corporeo.'
    ],
    vocalTip: 'L\'ancoraggio contrario alla direzione del pitch stabilizza il condotto vocale.'
  },
  {
    id: 'anc_eee_fry_55531',
    title: 'E E EEE (55 531 - Attacco Fry)',
    category: 'Ancoraggio',
    description: 'Attacco in Vocal Fry su E E seguito da arpeggio discendente 5 3 1 per connettere corpo e corde vocali.',
    scalePattern: 'arpeggio_55531',
    allowedPatterns: ['arpeggio_55531', 'arpeggio_531_desc'],
    defaultVowel: '(Fry) E E EEE',
    defaultTempoBpm: 100,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Inizia la nota con un leggero crepitio (Vocal Fry) e poi sviluppa la nota piena su 5 3 1.',
      'Il Fry rilassa la gola e attiva il supporto addominale e dorsale.'
    ],
    vocalTip: 'Il Fry permette di agganciare le corde senza alcuna tensione laringea.'
  },
  {
    id: 'anc_he_he_181_gliss',
    title: 'HE HE (1 8 1 Glissato Lento)',
    category: 'Ancoraggio',
    description: 'Sirena/glissato lento di ottava (1-8-1) con "HE HE" per mantenere l\'ancoraggio profondo su un ampio intervallo.',
    scalePattern: 'siren_glide',
    allowedPatterns: ['siren_glide', 'jump_13_15_18'],
    defaultVowel: 'HE HE',
    defaultTempoBpm: 80,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Attacca "HE" sulla nota base e scivola fino all\'ottava superiore e ritorno su "HE".',
      'Mantieni le testa dritta e la schiena espansa durante l\'estensione acuta.'
    ],
    vocalTip: 'Non permettere all\'ancoraggio di mollare nel passaggio all\'acuto.'
  },
  {
    id: 'anc_mne_111_5_gliss',
    title: 'MNE (111 5 + Glissando Quinta)',
    category: 'Ancoraggio',
    description: 'Stabilità sulle note fisse (1 1 1) e salto con glissando al 5° grado su MNE.',
    scalePattern: 'jump_5_1',
    allowedPatterns: ['jump_5_1', 'gliss_1_5'],
    defaultVowel: 'MNE',
    defaultTempoBpm: 100,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Ripeti 1 1 1 e poi fai un glissando fluido verso la quinta nota (5) tornando a 1.',
      'La combinazione di MNE e ancoraggio impedisce irrigidimenti gola.'
    ],
    vocalTip: 'Mantieni l\'appoggio costante durante la salita alla quinta.'
  },

  // --- 8. SOSTEGNO ---

  // --- 9. DINAMICHE ---
  {
    id: 'din_mne_fissa',
    title: 'MNE (Stessa Nota - Controllo Dinamico)',
    category: 'Dinamiche',
    description: 'Lavoro a nota fissa su MNE alternando il piano e il forte per il controllo dell\'intensità.',
    scalePattern: 'fixed_3_notes',
    allowedPatterns: ['fixed_3_notes', 'fixed_5_notes'],
    defaultVowel: 'MNE',
    defaultTempoBpm: 90,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Ripeti 3 volte la stessa nota dicendo "MNE" variando il volume dal piano al forte.',
      'Conserva l\'intonazione e il timbro pulito sia a volume basso che elevato.'
    ],
    vocalTip: 'Non spingere con la gola nel forte e non perdere l\'adduzione nel piano.'
  },
  {
    id: 'din_mee_185',
    title: 'MEE (1 8 5 - Petto, Falsetto, Misto)',
    category: 'Dinamiche',
    description: 'Salto 1 8 5 su MEE gestendo il cambio dinamico e di registro tra voce di petto (1), falsetto (8) e voce mista (5).',
    scalePattern: 'arpeggio_185',
    allowedPatterns: ['arpeggio_185', 'jump_13_15_18'],
    defaultVowel: 'MEE',
    defaultTempoBpm: 95,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Canta 1 (petto, volume pieno), 8 (falsetto, volume piano/leggero), 5 (misto, volume medio/equilibrato).',
      'Controlla il flusso d\'aria per rendere morbido ogni passaggio di registro.'
    ],
    vocalTip: 'Sintonizza la dinamica con il registro per un suono omogeneo.'
  },
  {
    id: 'din_mee_111_falsetto_petto',
    title: 'MEE (111 - Falsetto, Petto, Misto su Nota Fissa)',
    category: 'Dinamiche',
    description: 'Esecuzione sulla medesima nota ripetuta (1 1 1) su MEE cambiando la dinamica e la configurazione di registro (Falsetto -> Petto).',
    scalePattern: 'fixed_3_notes',
    allowedPatterns: ['fixed_3_notes', 'fixed_5_notes'],
    defaultVowel: 'MEE',
    defaultTempoBpm: 85,
    recommendedStartMidi: 60,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Inizia il primo attacco in falsetto leggero, il secondo in voce mista e il terzo in voce di petto piena.',
      'Sperimenta la flessibilità dinamica e timbrica rimanendo sulla stessa nota.'
    ],
    vocalTip: 'Il cambio di massa cordale deve avvenire senza scatti.'
  },
  {
    id: 'din_mam_fissa',
    title: 'MAM (1 1 1 1 1 - Crescendo / Decrescendo)',
    category: 'Dinamiche',
    description: 'Nota fissa x5 su MAM eseguendo un crescendo dal 1° al 3° colpo e decrescendo fino al 5°.',
    scalePattern: 'fixed_5_notes',
    allowedPatterns: ['fixed_5_notes'],
    defaultVowel: 'MAM',
    defaultTempoBpm: 100,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Canta "MAM" 5 volte di seguito aumentando il volume sui primi tre e diminuendolo sui restanti due.',
      'Mantieni l\'appoggio addominale costante durante la sfumatura.'
    ],
    vocalTip: 'Il fiato cresce e diminuisce come un\'onda.'
  },
  {
    id: 'din_mam_11151',
    title: 'MAM (1 1 1 5 1 - Variazione Dinamica)',
    category: 'Dinamiche',
    description: 'Pianissimo sulle note base (1 1 1), forte sul salto (5) e ritorno piano (1).',
    scalePattern: 'jump_5_1',
    allowedPatterns: ['jump_5_1', 'triad'],
    defaultVowel: 'MAM',
    defaultTempoBpm: 105,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Esegui 1 1 1 a volume moderato/piano, spingi al volume forte sul 5° grado e rientra al piano sull\'1.',
      'Sperimenta il contrasto dinamico preciso tra la nota fondamentale e il salto.'
    ],
    vocalTip: 'L\'espansione del volume al 5° grado richiede maggior sostegno dal corpo.'
  },
  {
    id: 'din_mee_gliss_151',
    title: 'MEE (1 5 - 5 1 Glissando Lento Dinamico)',
    category: 'Dinamiche',
    description: 'Glissando lento 1-5-1 su MEE con messa di voce (crescendo nella salita al 5°, decrescendo nella discesa a 1).',
    scalePattern: 'gliss_1_5_1',
    allowedPatterns: ['gliss_1_5_1', 'gliss_1_5'],
    defaultVowel: 'MEE',
    defaultTempoBpm: 80,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Scivola da 1 a 5 crescendo d\'intensità e ritorna a 1 sfumando il suono.',
      'L\'emissione deve rimanere fluida e controlled senza buchi di fiato.'
    ],
    vocalTip: 'Il glissando dinamico perfeziona il controllo della pressione sottoglottica.'
  },

  // --- 10. DEFATICAMENTO ---
  {
    id: 'defaticamento_wee_ottava',
    title: 'WEE OTTAVA',
    category: 'Defaticamento',
    description: 'Glissando morbido di ottava (1-8-1) sulla sillaba WEE per la decompression della laringe e il rilassamento del condotto vocale.',
    scalePattern: 'siren_glide',
    allowedPatterns: ['siren_glide', 'gliss_1_5_1', 'scale_5_desc'],
    defaultVowel: 'WEE',
    defaultTempoBpm: 90,
    recommendedStartMidi: 55,
    recommendedEndMidi: 70,
    direction: 'asc_desc',
    instructions: [
      'Inizia nell\'acuto in modo morbido e privo di pressione.',
      'Scivola delicatamente verso il basso pronunciando "WEE" con la laringe rilassata.',
      'Senti la gola che si decomprime ad ogni scivolata verso il grave.'
    ],
    vocalTip: 'L\'emissione su WEE aiuta a rilassare la laringe e azzerare le tensioni accumulate.'
  },
  {
    id: 'defaticamento_wee_quinta',
    title: 'WEE QUINTA',
    category: 'Defaticamento',
    description: 'Scivolamento controllato di quinta (1-5-1) su WEE per defaticare le corde vocali.',
    scalePattern: 'gliss_1_5_1',
    allowedPatterns: ['siren_glide', 'gliss_1_5_1', 'scale_5_desc'],
    defaultVowel: 'WEE',
    defaultTempoBpm: 95,
    recommendedStartMidi: 55,
    recommendedEndMidi: 70,
    direction: 'asc_desc',
    instructions: [
      'Esegui un glissato morbido di quinta tra la nota fondamentale e la quinta.',
      'Mantieni il suono leggero e sottile su WEE.',
      'Visualizza il suono che scivola senza sforzo.'
    ],
    vocalTip: 'Il glissato di quinta bilancia la pressione d\'aria in modo dolce.'
  },
  {
    id: 'defaticamento_wee_54321',
    title: 'WEE 54321',
    category: 'Defaticamento',
    description: 'Discesa vocale progressiva 5-4-3-2-1 su WEE per ripristinare la posizione di riposo della voce.',
    scalePattern: 'scale_5_desc',
    allowedPatterns: ['siren_glide', 'gliss_1_5_1', 'scale_5_desc'],
    defaultVowel: 'WEE',
    defaultTempoBpm: 100,
    recommendedStartMidi: 55,
    recommendedEndMidi: 70,
    direction: 'asc_desc',
    instructions: [
      'Discendi lungo la scala 5-4-3-2-1 legando le note con morbidezza.',
      'Mantieni l\'emissione rilassata su WEE.',
      'Lascia che ogni nota scenda naturally senza spinta addominale.'
    ],
    vocalTip: 'La scala discendente guida la voce verso il registro grave e il rilassamento.'
  },
  {
    id: 'defaticamento_uuuh_ottava',
    title: 'UUUH OTTAVA',
    category: 'Defaticamento',
    description: 'Vocale scura UUUH su glissato di ottava (1-8-1) per ampliare lo spazio faringeo e rilassare i muscoli laringei.',
    scalePattern: 'siren_glide',
    allowedPatterns: ['siren_glide', 'gliss_1_5_1', 'scale_5_desc'],
    defaultVowel: 'UUUH',
    defaultTempoBpm: 90,
    recommendedStartMidi: 55,
    recommendedEndMidi: 70,
    direction: 'asc_desc',
    instructions: [
      'Crea una cavità orale rotonda e morbida come per accennare uno sbadiglio.',
      'Esegui il glissato di ottava su UUUH sentendo il rilassamento della gola.',
      'Lascia scivolare la voce dall\'acuto al grave in modo fluido.'
    ],
    vocalTip: 'La vocale UUUH abbassa delicatamente la laringe e distende il condotto vocale.'
  },
  {
    id: 'defaticamento_uuuh_quinta',
    title: 'UUUH QUINTA',
    category: 'Defaticamento',
    description: 'Glissando di quinta (1-5-1) su UUUH per il ripristino della morbidezza e dell\'elasticità cordale.',
    scalePattern: 'gliss_1_5_1',
    allowedPatterns: ['siren_glide', 'gliss_1_5_1', 'scale_5_desc'],
    defaultVowel: 'UUUH',
    defaultTempoBpm: 95,
    recommendedStartMidi: 55,
    recommendedEndMidi: 70,
    direction: 'asc_desc',
    instructions: [
      'Scivola da 1 a 5 e ritorna a 1 con la vocale UUUH.',
      'Mantieni le labbra arrotondate in modo confortevole.',
      'Concentrati sulla sensazione di decompression nella parte posteriore del palato.'
    ],
    vocalTip: 'Non stringere le labbra, mantieni morbidi gli angoli della bocca.'
  },
  {
    id: 'defaticamento_uuuh_54321',
    title: 'UUUH 54321',
    category: 'Defaticamento',
    description: 'Scala discendente 5-4-3-2-1 su UUUH per defaticare la laringe in modo progressivo e rilassante.',
    scalePattern: 'scale_5_desc',
    allowedPatterns: ['siren_glide', 'gliss_1_5_1', 'scale_5_desc'],
    defaultVowel: 'UUUH',
    defaultTempoBpm: 100,
    recommendedStartMidi: 55,
    recommendedEndMidi: 70,
    direction: 'asc_desc',
    instructions: [
      'Canta la scala discendente 5-4-3-2-1 con la vocale rotonda UUUH.',
      'Assicurati che non ci sia pressione nell\'emissione.',
      'Ripeti salendo di semitono rimanendo sempre in una zona confortevole.'
    ],
    vocalTip: 'La discesa 54321 su UUUH dona immediato sollievo alla muscolatura vocale.'
  },
  {
    id: 'defaticamento_lip_thrill_cannuccia',
    title: 'LIP THRILL o CANNUCCIA',
    category: 'Defaticamento',
    description: 'Esercizio a tratto vocale semi-occluso (Lip Thrill / Cannuccia) per la decompressione diretta della mucosa cordale.',
    scalePattern: 'siren_glide',
    allowedPatterns: ['siren_glide', 'gliss_1_5_1', 'scale_5_desc'],
    defaultVowel: 'Lip Trill / OOO',
    defaultTempoBpm: 100,
    recommendedStartMidi: 55,
    recommendedEndMidi: 70,
    direction: 'asc_desc',
    instructions: [
      'Scegli tra Lip Thrill o soffio morbido con Cannuccia ("OOO").',
      'Esegui il pattern melodico selezionato avvertendo il bilanciamento della pressione dell\'aria.',
      'Rilassa completamente le guance, la mandibola e il collo.'
    ],
    vocalTip: 'La semi-occlusione del tratto vocale idrata e massaggia delicatamente le corde vocali.'
  }
];
