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
    vocalTip: '• Cerca di fare uno sbuffo che inizi con la P o con la B a seconda di quello che ti dà meno problemi a far vibrare le labbra.\n• Se non vibrano le labbra prova a mettere le dita al centro delle guance all\'altezza dei pre-molari.\n• Se non ti esce per niente, allenati a sbuffare e basta per almeno una settimana ogni giorno, poi allenati con una nota singola a farla durare tutto il respiro.',
    vocalTipEn: '• Try starting with a flutter/snort that begins with a P or a B sound, depending on which helps your lips vibrate more easily.\n• If your lips don\'t vibrate, try placing your fingers in the center of your cheeks at premolar level.\n• If it doesn\'t work at all, practice just snorting/fluttering every day for at least a week, then practice holding a single note for a full breath.'
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
      'Inserisci una cannuccia tra le labbra sigillando accuratamente la bocca intorno ad essa.',
      'Emetti un suono morbido e continuo attraverso la cannuccia.',
      'Esegui la scala a 5 note avvertendo una piacevole sensazione di decompressione nella gola.'
    ],
    vocalTip: 'Puoi anche immergere l\'estremità della cannuccia in un bicchiere d\'acqua per un effetto di massaggio vocale (Lax Vox).'
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
      'Appoggia delicatamente la punta della lingua sul palato anteriore dietro i denti.',
      'Fai vibrare la lingua con il flusso d\'aria continuo pronunciando "TRRR".',
      'Canta la scala Do-Re-Mi-Fa-Sol-Fa-Mi-Re-Do bilanciando l\'aria.'
    ],
    vocalTip: 'Se il trillo è difficile, mantieni l\'aria abbondante e rilassa completamente il collo.'
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
      'Emetti il suono continuo "VVV" avvertendo la vibrazione costante sulle labbra.',
      'Esegui la scala guidando il fiato in modo fluido e uniforme.'
    ],
    vocalTip: 'Mantieni la vibrazione leggera e costante senza premere i denti sul labbro.'
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
      'Avvicina i denti senza stringerli e posiziona la lingua per emettere il suono "ZZZ".',
      'Conserva un flusso d\'aria misurato e continuo per tutta la scala.',
      'Senti la vibrazione anteriore e la spinta uniforme dell\'addome.'
    ],
    vocalTip: 'Un suono ZZZ ben bilanciato dona grande stabilità al tono vocale.'
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
      'Gonfia le guance come un pesce palla lasciando uscire solo uno spiffero d\'aria dalle labbra.',
      'Canta la scala emettendo un suono morbido ed interno.',
      'Mantieni lo spazio faringeo ampio e rilassato.'
    ],
    vocalTip: 'Questa posizione decomprime le corde vocali e riduce immediatamente le tensioni laringee.'
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
      'Chiudi le labbra in modo morbido senza stringere i denti.',
      'Emetti un suono mormorato "MMM" sentendo la risonanza sulle labbra e sulla maschera.',
      'Canta la scala mantenendo il flusso d\'aria fluido e costante.'
    ],
    vocalTip: 'Visualizza la vibrazione posizionata esattamente dietro le labbra e sugli zigomi.'
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
      'Arrotonda le labbra e crea una cavità orale ampia come per un accenno di sbadiglio.',
      'Canta "UUUH" mantenendo la laringe rilassata e in posizione di riposo.',
      'Sali lungo la scala avvertendo una sensazione di rotondità e profondità nel timbro.'
    ],
    vocalTip: 'Non stringere le labbra a imbuto stretto; mantieni morbidi gli angoli della bocca.'
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
      'Posiziona il dorso della lingua contro il palato molle come pronunciando "KING".',
      'Lascia uscire il suono solo attraverso il naso con un suono "NG" brillante e concentrato.',
      'Esegui la scala avvertendo lo squillo nella parte superiore della maschera.'
    ],
    vocalTip: 'Se senti laringe o collo tesi, diminuisci il volume e concentrati unicamente sul flusso nasale.'
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
      'Esegui il vocalizzo passando da Lip Trill a NG e infine a NEE sull\'arpeggio composto discendente.',
      'Mantieni una risonanza fluida e costante lungo tutto il percorso.'
    ],
    vocalTip: 'L\'alternanza tra Lip Trill, NG e NEE aiuta ad azzerare le tensioni ed equilibrare il flusso d\'aria.'
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
      'Emetti il suono "TZ TZ TZE" eseguendo un glissando discendente morbido dal 5° al 1° grado.',
      'Mantieni la pressione d\'aria costante senza spingere col collo.'
    ],
    vocalTip: 'Il suono consonantico TZ attiva subito la spinta addominale elastica.'
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
      'Ripeti il suono "MAM" per 5 volte mantenendo la stessa nota.',
      'Concentrati sull\'omogeneità del timbro e sull\'attacco vocalico morbido.'
    ],
    vocalTip: 'Fai risuonare la M iniziale sugli zigomi prima di aprire leggermente sulla A.'
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
      'Senza interrompere il fiato, prosegui la seconda parte (12345 4321) aprendo la vocale "ME".'
    ],
    vocalTip: 'Mantieni la stessa risonanza anteriore agganciata dal mormorio MMM anche quando apri in ME.'
  },

  // --- 3. VOCE MISTA ---
  {
    id: 'mix_meee',
    title: 'MEEE',
    category: 'Voce Mista',
    description: 'Esercizio in voce mista sul suono MEEE per agganciare la risonanza alta e sostenere il passaggio di registro.',
    scalePattern: 'scale_4_notes',
    allowedPatterns: ['scale_4_notes', 'scale_4_notes_2x'],
    defaultVowel: 'MEEE',
    defaultTempoBpm: 100,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Inizia la consonante "M" risuonando bene nella maschera.',
      'Apri sulla vocale "EEE" mantenendo il suono focalizzato e stretto, senza urlare.',
      'Esegui la scala 1234 321 portando il suono in alto in modo fluido.'
    ],
    vocalTip: 'Pensa a un timbro luminoso e concentrato sul palato duro.'
  },
  {
    id: 'mix_mime_ma_mo_mu',
    title: 'MI ME MA MO MU',
    category: 'Voce Mista',
    description: 'Sequenza di vocali per omogeneizzare il timbro misto attraverso tutti i colori vocalici.',
    scalePattern: 'scale_4_notes_5x',
    allowedPatterns: ['scale_4_notes_5x'],
    defaultVowel: 'MI ME MA MO MU',
    defaultTempoBpm: 90,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Canta il pattern 1234 321 per 5 volte (MI, ME, MA, MO, MU) in un giro da 6 battute da 4/4.',
      'Nelle prime 5 battute esegui Do Re Mi Fa Mi Re Do (1234 321) per ciascuna vocale.',
      'Nella sesta battuta ascolta l\'accordo di modulazione alla tonalità successiva.'
    ],
    vocalTip: 'La consonante M iniziale ti aiuta ad agganciare la risonanza naso-faringea.'
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
    allowedPatterns: ['scale_5_gliss_desc', 'five_notes'],
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
    allowedPatterns: ['arpeggio_13521', 'triad'],
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
    id: 'mix_gne_12321',
    title: 'GNE GNE (123 21)',
    category: 'Voce Mista',
    description: 'Pattern a 3 note (123 21) su GNE GNE per una transizione fluida e rilassata.',
    scalePattern: 'three_notes',
    allowedPatterns: ['three_notes', 'arpeggio_13521'],
    defaultVowel: 'GNE GNE',
    defaultTempoBpm: 115,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Esegui l\'arpeggio 123 21 pronunciando "GNE GNE".',
      'Sfrutta la vicinanza delle note per non irrigidire l\'apparato vocale.'
    ],
    vocalTip: 'Mantieni la bocca morbida e lo squillo ben concentrato.'
  },
  {
    id: 'mix_ye_13521',
    title: 'YE YE YE (135 - 31)',
    category: 'Voce Mista',
    description: 'Arpeggio 135 - 31 su YE YE YE per un attacco morbido e una risonanza brillante.',
    scalePattern: 'arpeggio_13521',
    allowedPatterns: ['arpeggio_13521', 'triad'],
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
    id: 'mix_ye_12321',
    title: 'YE YE YE (123 21)',
    category: 'Voce Mista',
    description: 'Pattern a 3 note (123 21) su YE YE YE per l\'agilità del registro misto.',
    scalePattern: 'three_notes',
    allowedPatterns: ['three_notes', 'arpeggio_13521'],
    defaultVowel: 'YE YE YE',
    defaultTempoBpm: 115,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Articola "YE YE YE" sulle note 1 2 3 2 1.',
      'Esegui i cambi di nota con estrema morbidezza.'
    ],
    vocalTip: 'Non stringere il collo sul vertice del pattern (nota 3).'
  },
  {
    id: 'mix_mne_fissa',
    title: 'MNE (Nota Fissa)',
    category: 'Voce Mista',
    description: 'Esercizio a nota fissa su MNE per stabilizzare l\'adduzione cordale e la maschera.',
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
    vocalTip: 'Il suono MNE attiva immediatamente l\'assottigliamento delle corde vocali.'
  },
  {
    id: 'mix_mee_1_8_5',
    title: 'MEE (1 8 5 - Petto, Falsetto, Misto)',
    category: 'Voce Mista',
    description: 'Salto 1 -> 8 -> 5 (Do, Do ottava, Sol) per coordinare i tre registri: Petto (1), Falsetto (8), Misto (5).',
    scalePattern: 'arpeggio_185',
    allowedPatterns: ['arpeggio_185', 'broad_arpeggio'],
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
    category: 'Voce Mista',
    description: '5 ripetizioni a nota fissa su MAM per rinforzare la tenuta del registro misto.',
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
    vocalTip: 'Controlla che ciascun attacco sia identico al precedente.'
  },
  {
    id: 'mix_mam_11151',
    title: 'MAM (1 1 1 5 1)',
    category: 'Voce Mista',
    description: 'Tre note fisse sulla base (1 1 1), salto di quinta al 5° grado e ritorno a 1 con MAM.',
    scalePattern: 'jump_5_1',
    allowedPatterns: ['jump_5_1', 'triad'],
    defaultVowel: 'MAM',
    defaultTempoBpm: 105,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Canta 1 1 1 sulla nota base, salta al 5° grado e ritorna a 1.',
      'Usa l\'ancoraggio addominale per sostenere l\'intervallo di quinta.'
    ],
    vocalTip: 'Maniatati rilassato sul salto senza spingere la laringe in alto.'
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
    title: 'MEE (1-5-1 Glissando Lento)',
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
    allowedPatterns: ['arpeggio_55531', 'arpeggio_531_desc'],
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
    id: 'mix_mee_111_falsetto_petto',
    title: 'MEE (111 - Falsetto Petto)',
    category: 'Voce Mista',
    description: '3 note fisse (1 1 1) alternando la percezione dei registri (falsetto -> petto) sulla stessa nota.',
    scalePattern: 'fixed_3_notes',
    allowedPatterns: ['fixed_3_notes', 'fixed_5_notes'],
    defaultVowel: 'MEE',
    defaultTempoBpm: 95,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Canta 3 volte la stessa nota MEE variando l\'intensità dal falsetto piú leggero alla voce di petto.',
      'Sperimenta il punto di equilibrio della voce mista.'
    ],
    vocalTip: 'Varia solo la massa cordale coinvolta, non l\'intonazione della nota.'
  },
  {
    id: 'mix_he_he_181_gliss',
    title: 'HE HE (1-8-1 Glissato Lento)',
    category: 'Voce Mista',
    description: 'Glissando lento dell\'ottava (1 -> 8 -> 1) su HE HE per attraversare liberamente tutto il passaggio.',
    scalePattern: 'siren_glide',
    allowedPatterns: ['siren_glide', 'gliss_1_5_1'],
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
    category: 'Voce Mista',
    description: '3 note fisse (1 1 1), salto al 5° grado e glissando discendente di ritorno alla nota base.',
    scalePattern: 'jump_5_1',
    allowedPatterns: ['jump_5_1', 'triad'],
    defaultVowel: 'MNE',
    defaultTempoBpm: 100,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Canta 1 1 1 su MNE, salta al 5° e scivola con un glissando fino al 1°.',
      'Mantieni lo squillo del suono MNE per tutta la discesa.'
    ],
    vocalTip: 'Il glissando finale rilassa la muscolatura dopo l\'attacco in salto.'
  },

  // --- 3. RISONANZE ---
  {
    id: 'res_gne_13521',
    title: 'GNE GNE (135 - 31)',
    category: 'Risonanze',
    description: 'Arpeggio 135 - 31 su GNE GNE per attivare la risonanza nasale e la focalizzazione anteriore.',
    scalePattern: 'arpeggio_13521',
    allowedPatterns: ['arpeggio_13521', 'triad'],
    defaultVowel: 'GNE GNE',
    defaultTempoBpm: 110,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Pronuncia "GNE GNE" sull\'arpeggio 1 3 5 3 1.',
      'Sfrutta la consonante nasale GN per far risuonare il suono direttamente nella maschera.'
    ],
    vocalTip: 'Senti la vibrazione concentrata negli zigomi e sul naso.'
  },
  {
    id: 'res_gne_12321',
    title: 'GNE GNE (123 21)',
    category: 'Risonanze',
    description: 'Pattern a 3 note 123 21 su GNE GNE per una focalizzazione anteriore senza tensioni.',
    scalePattern: 'three_notes',
    allowedPatterns: ['three_notes', 'arpeggio_13521'],
    defaultVowel: 'GNE GNE',
    defaultTempoBpm: 115,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Canta 1 2 3 2 1 pronunciando "GNE GNE".',
      'Mantieni il suono stretto, squillante e leggero.'
    ],
    vocalTip: 'Non spingere volume: cerca la massima nitidezza del timbro.'
  },
  {
    id: 'res_ye_13521',
    title: 'YE YE YE (135 - 31)',
    category: 'Risonanze',
    description: 'Arpeggio 135 - 31 su YE YE YE per proiettare il suono verso il palato duro.',
    scalePattern: 'arpeggio_13521',
    allowedPatterns: ['arpeggio_13521', 'triad'],
    defaultVowel: 'YE YE YE',
    defaultTempoBpm: 110,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Articola "YE YE YE" sull\'arpeggio 1 3 5 3 1.',
      'Utilizza la Y iniziale per agganciare il suono in alto sul palato duro.'
    ],
    vocalTip: 'La consonante Y canalizza le vibrazioni nella cavità orale anteriore.'
  },
  {
    id: 'res_ye_12321',
    title: 'YE YE YE (123 21)',
    category: 'Risonanze',
    description: 'Pattern 123 21 su YE YE YE per una proiezione vocale brillante e bilanciata.',
    scalePattern: 'three_notes',
    allowedPatterns: ['three_notes', 'arpeggio_13521'],
    defaultVowel: 'YE YE YE',
    defaultTempoBpm: 115,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Esegui 1 2 3 2 1 dicendo "YE YE YE".',
      'Mantieni le labbra rilassate e la lingua morbida.'
    ],
    vocalTip: 'Il movimento della lingua nella Y sblocca l\'emissione.'
  },
  {
    id: 'res_mne_fissa',
    title: 'MNE (Nota Fissa)',
    category: 'Risonanze',
    description: 'Ripetizione a nota fissa su MNE per ancorare la risonanza e la brillantezza.',
    scalePattern: 'fixed_3_notes',
    allowedPatterns: ['fixed_3_notes', 'fixed_5_notes'],
    defaultVowel: 'MNE',
    defaultTempoBpm: 100,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Canta 3 volte la stessa nota dicendo "MNE".',
      'Godi del legame tra la M nasale e la E brillante.'
    ],
    vocalTip: 'La consonante M garantisce la conduzione ossea del suono.'
  },
  {
    id: 'res_mne_111_5_gliss',
    title: 'MNE (111 5) + Glissando Quinta',
    category: 'Risonanze',
    description: 'Tre note fisse (1 1 1), salto al 5° e glissando discendente di ritorno alla nota base.',
    scalePattern: 'jump_5_1',
    allowedPatterns: ['jump_5_1', 'triad'],
    defaultVowel: 'MNE',
    defaultTempoBpm: 100,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Canta 1 1 1 su MNE, salta al 5° e scivola fino al 1°.',
      'Sfrutta la discesa in glissando per allargare lo spazio di risonanza.'
    ],
    vocalTip: 'Il glissando morbido pulisce eventuali ruvidità timbriche.'
  },
  {
    id: 'res_mam_fissa',
    title: 'MAM (1 1 1 1 1)',
    category: 'Risonanze',
    description: '5 battute a nota fissa su MAM per stabilizzare la risonanza anteriore.',
    scalePattern: 'fixed_5_notes',
    allowedPatterns: ['fixed_5_notes', 'fixed_3_notes'],
    defaultVowel: 'MAM',
    defaultTempoBpm: 105,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Ripeti "MAM" 5 volte sulla nota fissa.',
      'Rimani focalizzato sulle vibrazioni labiali e palatali.'
    ],
    vocalTip: 'L\'attacco in M pre-attiva le cavità di risonanza prima di aprire la A.'
  },
  {
    id: 'res_mam_11151',
    title: 'MAM (1 1 1 5 1)',
    category: 'Risonanze',
    description: 'Note fisse sulla base (1 1 1), salto di quinta al 5° grado e ritorno a 1 con MAM.',
    scalePattern: 'jump_5_1',
    allowedPatterns: ['jump_5_1', 'triad'],
    defaultVowel: 'MAM',
    defaultTempoBpm: 105,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Canta 1 1 1 su MAM, salta al 5° e rientra al 1°.',
      'Prepara il salto mantenendo la posizione della maschera alta.'
    ],
    vocalTip: 'Non cambiare la forma della bocca durante il salto di quinta.'
  },
  {
    id: 'res_chicchi_531',
    title: 'CHICCHI (531)',
    category: 'Risonanze',
    description: 'Arpeggio discendente 5 3 1 sul suono nitido CHICCHI per attivare la maschera.',
    scalePattern: 'arpeggio_531_desc',
    allowedPatterns: ['arpeggio_531_desc', 'three_notes'],
    defaultVowel: 'CHICCHI',
    defaultTempoBpm: 110,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Esegui l\'arpeggio 5 3 1 pronunciando "CHICCHI".',
      'Usa l\'attacco secco della CH per centrare l\'energia vocale.'
    ],
    vocalTip: 'La vocale I stringe i formanti della risonanza in alto.'
  },
  {
    id: 'res_chicchi_12321',
    title: 'CHICCHI (123 21)',
    category: 'Risonanze',
    description: 'Pattern 123 21 su CHICCHI per sviluppare agilità e risonanza nei toni medi.',
    scalePattern: 'three_notes',
    allowedPatterns: ['three_notes', 'arpeggio_531_desc'],
    defaultVowel: 'CHICCHI',
    defaultTempoBpm: 115,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Canta 1 2 3 2 1 dicendo "CHICCHI".',
      'Articola chiaramente le consonanti mantenendo il flusso sonoro continuo.'
    ],
    vocalTip: 'Senti la spinta del fiato leggera e direzionata.'
  },
  {
    id: 'res_chiii_531',
    title: 'CHIII (531)',
    category: 'Risonanze',
    description: 'Arpeggio discendente 5 3 1 legato sul suono CHIII per la brillantezza della vocale I.',
    scalePattern: 'arpeggio_531_desc',
    allowedPatterns: ['arpeggio_531_desc', 'three_notes'],
    defaultVowel: 'CHIII',
    defaultTempoBpm: 110,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Canta 5 3 1 prolungando la vocale "CHIII".',
      'Lascia che la I risuoni nitida nel palato molle e nella maschera.'
    ],
    vocalTip: 'Proietta il suono come un raggio di luce sottile.'
  },
  {
    id: 'res_chiii_12321',
    title: 'CHIII (123 21)',
    category: 'Risonanze',
    description: 'Pattern 123 21 su CHIII per canalizzare la risonanza della I alta.',
    scalePattern: 'three_notes',
    allowedPatterns: ['three_notes', 'arpeggio_531_desc'],
    defaultVowel: 'CHIII',
    defaultTempoBpm: 115,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Esegui 1 2 3 2 1 con il suono legato "CHIII".',
      'Rimani sempre agganciato alla risonanza della prima nota.'
    ],
    vocalTip: 'Evita di schiacciare la gola durante la salita.'
  },
  {
    id: 'res_ninni_111_333_111',
    title: 'NINNI (111 333 111)',
    category: 'Risonanze',
    description: 'Pattern 111 333 111 su NINNI per alternare la nota fondamentale ed il terzo grado con risonanza anteriore.',
    scalePattern: 'ninni_111_333_111',
    allowedPatterns: ['ninni_111_333_111', 'three_notes', 'fixed_3_notes'],
    defaultVowel: 'NINNI',
    defaultTempoBpm: 110,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Canta 1 1 1 (Do Do Do), poi 3 3 3 (Mi Mi Mi), poi 1 1 1 (Do Do Do) dicendo "NINNI".',
      'Sfrutta la N iniziale e la I per far risuonare la voce nella maschera ad ogni cambio.'
    ],
    vocalTip: 'Il passaggio tra 111 e 333 allena la stabilità del timbro bilanciato.'
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
    id: 'add_gne_13521',
    title: 'GNE GNE (135 - 31)',
    category: 'Adduzione',
    description: 'Arpeggio 135 - 31 su GNE GNE per stimolare l\'adduzione cordale immediata grazie alle consonanti nasali/occlusive.',
    scalePattern: 'arpeggio_13521',
    allowedPatterns: ['arpeggio_13521', 'triad'],
    defaultVowel: 'GNE GNE',
    defaultTempoBpm: 110,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Pronuncia "GNE GNE" con decisione sull\'arpeggio 1 3 5 3 1.',
      'Sfrutta l\'impatto della consonante GN per favorire la chiusura completa delle corde.'
    ],
    vocalTip: 'L\'attacco in GN azzera la dispersione d\'aria.'
  },
  {
    id: 'add_gne_12321',
    title: 'GNE GNE (123 21)',
    category: 'Adduzione',
    description: 'Pattern 123 21 su GNE GNE per allenare l\'adduzione in intervalli ravvicinati.',
    scalePattern: 'three_notes',
    allowedPatterns: ['three_notes', 'arpeggio_13521'],
    defaultVowel: 'GNE GNE',
    defaultTempoBpm: 115,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Articola "GNE GNE" sulle note 1 2 3 2 1.',
      'Mantieni il suono pulito, focalizzato e privo di fiato parassita.'
    ],
    vocalTip: 'Concentrati sulla compattezza del timbro.'
  },
  {
    id: 'add_ye_13521',
    title: 'YE YE YE (135 - 31)',
    category: 'Adduzione',
    description: 'Arpeggio 135 - 31 su YE YE YE per un\'adduzione morbida ma definita.',
    scalePattern: 'arpeggio_13521',
    allowedPatterns: ['arpeggio_13521', 'triad'],
    defaultVowel: 'YE YE YE',
    defaultTempoBpm: 110,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Canta "YE YE YE" sull\'arpeggio 1 3 5 3 1.',
      'Usa la semivocale Y per agganciare le corde vocali senza sforzo.'
    ],
    vocalTip: 'La Y evita sia l\'attacco glottale duro sia il sospiro.'
  },
  {
    id: 'add_ye_12321',
    title: 'YE YE YE (123 21)',
    category: 'Adduzione',
    description: 'Pattern 123 21 su YE YE YE per consolidare il contatto cordale nei toni medi.',
    scalePattern: 'three_notes',
    allowedPatterns: ['three_notes', 'arpeggio_13521'],
    defaultVowel: 'YE YE YE',
    defaultTempoBpm: 115,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Esegui 1 2 3 2 1 pronunciando "YE YE YE".',
      'Assicurati che ogni nota sia intonata e definita.'
    ],
    vocalTip: 'Mantieni un flusso d\'aria costante sotto l\'attacco.'
  },
  {
    id: 'add_mne_fissa',
    title: 'MNE (Stessa Nota)',
    category: 'Adduzione',
    description: 'Ripetizione a nota fissa su MNE per verificare e stabilizzare la tenuta cordale.',
    scalePattern: 'fixed_3_notes',
    allowedPatterns: ['fixed_3_notes', 'fixed_5_notes'],
    defaultVowel: 'MNE',
    defaultTempoBpm: 100,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Pronuncia "MNE" per 3 volte sulla stessa nota.',
      'Verifica che ogni attacco cordale sia identico e pulito.'
    ],
    vocalTip: 'La sequenza M-N-E assicura il massimo contatto tra le corde vocali.'
  },
  {
    id: 'add_mam_fissa',
    title: 'MAM (1 1 1 1 1)',
    category: 'Adduzione',
    description: '5 ripetizioni a nota fissa su MAM per rinforzare l\'adduzione cordale uniforme.',
    scalePattern: 'fixed_5_notes',
    allowedPatterns: ['fixed_5_notes', 'fixed_3_notes'],
    defaultVowel: 'MAM',
    defaultTempoBpm: 105,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Canta "MAM" 5 volte di seguito sulla medesima nota.',
      'Mantieni l\'attacco preciso senza far sfuggire aria prima del suono.'
    ],
    vocalTip: 'L\'esplosione morbida della M garantisce una chiusura senza traumi.'
  },
  {
    id: 'add_mam_11151',
    title: 'MAM (1 1 1 5 1)',
    category: 'Adduzione',
    description: 'Ancoraggio sulla nota base (1 1 1), salto di quinta al 5° e ritorno a 1 con MAM.',
    scalePattern: 'jump_5_1',
    allowedPatterns: ['jump_5_1', 'triad'],
    defaultVowel: 'MAM',
    defaultTempoBpm: 105,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Ripeti 1 1 1 su MAM, salta al 5° grado e torna alla nota fondamentale.',
      'Manda l\'aria con precisione durante il salto senza perdere l\'adduzione.'
    ],
    vocalTip: 'Non allargare troppo le corde durante l\'intervallo.'
  },
  {
    id: 'add_chicchi_531',
    title: 'CHICCHI (531)',
    category: 'Adduzione',
    description: 'Arpeggio discendente 5 3 1 su CHICCHI per un\'adduzione nitida guidata da consonante occlusiva.',
    scalePattern: 'arpeggio_531_desc',
    allowedPatterns: ['arpeggio_531_desc', 'three_notes'],
    defaultVowel: 'CHICCHI',
    defaultTempoBpm: 110,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Canta 5 3 1 pronunciando "CHICCHI".',
      'Usa l\'attacco breve della CH per chiudere istantaneamente le corde.'
    ],
    vocalTip: 'Il suono CHI attiva l\'adduzione cordale in modo immediato.'
  },
  {
    id: 'add_chicchi_12321',
    title: 'CHICCHI (123 21)',
    category: 'Adduzione',
    description: 'Pattern 123 21 su CHICCHI per rafforzare la tenuta cordale in movimento.',
    scalePattern: 'three_notes',
    allowedPatterns: ['three_notes', 'arpeggio_531_desc'],
    defaultVowel: 'CHICCHI',
    defaultTempoBpm: 115,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Esegui 1 2 3 2 1 articulando "CHICCHI".',
      'Senti la pulizia di ogni singola nota.'
    ],
    vocalTip: 'Evita colpi eccessivi, mantieni l\'attacco elastico.'
  },
  {
    id: 'add_chiii_531',
    title: 'CHIII (531)',
    category: 'Adduzione',
    description: 'Arpeggio 5 3 1 legato su CHIII per mantenere l\'adduzione continua sulla vocale I.',
    scalePattern: 'arpeggio_531_desc',
    allowedPatterns: ['arpeggio_531_desc', 'three_notes'],
    defaultVowel: 'CHIII',
    defaultTempoBpm: 110,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Esegui 5 3 1 prolungando la vocale "CHIII".',
      'Verifica che il suono non presenti velature di aria.'
    ],
    vocalTip: 'La vocale I favorisce il contatto uniforme dei margini cordali.'
  },
  {
    id: 'add_chiii_12321',
    title: 'CHIII (123 21)',
    category: 'Adduzione',
    description: 'Pattern 123 21 su CHIII per un legato adotto e brillante.',
    scalePattern: 'three_notes',
    allowedPatterns: ['three_notes', 'arpeggio_531_desc'],
    defaultVowel: 'CHIII',
    defaultTempoBpm: 115,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Canta 1 2 3 2 1 mantenendo il legato su "CHIII".',
      'Assicurati che non ci sia perdita d\'aria tra un cambio di nota e l\'altro.'
    ],
    vocalTip: 'Guida il fiato senza spingere dalla gola.'
  },
  {
    id: 'add_ninni_111_333_111',
    title: 'NINNI (111 333 111)',
    category: 'Adduzione',
    description: 'Pattern 111 333 111 su NINNI per alternare stabilità e salto d\'intervallo con eccellente adduzione.',
    scalePattern: 'ninni_111_333_111',
    allowedPatterns: ['ninni_111_333_111', 'three_notes', 'fixed_3_notes'],
    defaultVowel: 'NINNI',
    defaultTempoBpm: 110,
    recommendedStartMidi: 58,
    recommendedEndMidi: 72,
    direction: 'asc_desc',
    instructions: [
      'Canta 111 (Do Do Do), 333 (Mi Mi Mi), 111 (Do Do Do) dicendo "NINNI".',
      'La consonante N garantisce un attacco cordale morbido ma perfettamente sigillato.'
    ],
    vocalTip: 'Mantieni l\'adduzione cordale ferma su entrambi i gradi della scala.'
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
