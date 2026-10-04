export interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  date: string;
  dateEn?: string;
  tag: string;
  tagEn?: string;
  comment: string;
  commentEn?: string;
  likes: number;
}

export const DEFAULT_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-silvia-g',
    author: 'Silvia G.',
    rating: 5,
    date: 'Recensione Allievo',
    dateEn: 'Student Review',
    tag: 'Lezioni di Canto Online',
    tagEn: 'Online Singing Lessons',
    comment: "Penso che Francesca sia un'insegnante meravigliosa. Ho iniziato un percorso con lei da ormai 2 mesi e sento di essere migliorata notevolmente, ti insegna ad ascoltarti e a conoscere bene la tua voce. Utilizza un linguaggio super semplice e ti fa capire tutto al meglio. Mi sento di consigliarla a chiunque come insegnante ma anche come persona, chi ti infonde tranquillità nel fare ciò che ti spaventa e soprattutto che ti mette a tuo agio è la cosa più importante per quanto mi riguarda e lei è la persona indicata!\n\nTutta meritata!",
    commentEn: "I think Francesca is a wonderful teacher. I started studying with her 2 months ago and I already feel significantly improved; she teaches you to listen to yourself and truly know your voice. She uses super simple, clear language and makes everything easy to understand. I highly recommend her to anyone both as a coach and as a person — someone who instills calm in doing what scares you and makes you feel completely at ease is the most important thing, and she is the absolute right person!\n\nFully deserved!",
    likes: 12,
  },
  {
    id: 'rev-diletta-g',
    author: 'Diletta G.',
    rating: 5,
    date: 'Recensione Allievo',
    dateEn: 'Student Review',
    tag: 'Lezioni di Canto Online',
    tagEn: 'Online Singing Lessons',
    comment: "Potrei dirti ti ringrazio perché mi stai insegnando la tecnica del canto, ma questo non ti renderebbe giustizia, perché per quanto sia indispensabile e tu sia sempre molto competente in questo, da insegnante so che non è solo questo a rendere bravo un insegnante.\n\nQuindi ti dico che ti ringrazio per aver reso possibile il sogno che avevo fin da quando avevo 5 anni - cantare. Mi stai aiutando a tirare fuori la mia voce, quella che ho sempre soffocato per vergogna (sto imparando persino a fregarmene di cosa potrebbero pensare i miei vicini!)\n\nTutto questo senza mai giudicarmi, ma trovando sempre la soluzione adatta a me. Questo è ciò che mi ha fatto subito fidare di te e per una persona diffidente e con una cattiva esperienza passata in ambito musicale, questo è tutt'altro che scontato. Quindi, semplicemente, grazie!",
    commentEn: "I could say thank you for teaching me vocal technique, but that wouldn't do you justice — because as essential as technique is and as competent as you are, as a teacher myself I know that's not the only thing that makes a great instructor.\n\nSo I thank you for making the dream I had since I was 5 years old possible: singing. You are helping me bring out my real voice, which I always smothered out of embarrassment (I'm even learning not to care what neighbors might think!)\n\nAll of this without ever judging me, but always finding the right tailored solution for me. This made me trust you immediately, and for someone distrustful with bad past music experiences, that is anything but given. So, simply, thank you!",
    likes: 18,
  },
  {
    id: 'rev-chiara-m',
    author: 'Chiara M.',
    rating: 5,
    date: 'Recensione Allievo',
    dateEn: 'Student Review',
    tag: 'Lezioni di Canto Online',
    tagEn: 'Online Singing Lessons',
    comment: "Grazie perché mi hai guidata in questo mio percorso con grande professionalità, dedizione, serietà e, nello stesso tempo, rendendo lo studio leggero, rilassante e spontaneo, senza mai farmi sentire quella sensazione di \"obbligo\" che spesso può emergere durante lo studio di una nuova disciplina.\n\nGrazie per le importanti nozioni che mi hai lasciato, per le spiegazioni fornite sempre in maniera chiara, utilizzando metafore semplici che hanno aiutato a capire senza alcun problema i movimenti e gli esercizi da eseguire.\n\nGrazie per la pazienza ed il sostegno emotivo e la comprensione quando ci sono state \"quelle giornate no\" in cui, comunque, mi hai guidata a fare altre tipologie di esercizio in modo da valorizzare ogni lezione facendomi sentire sempre a mio agio e mai \"indietro\".\n\nMa, soprattutto, grazie perché sei una persona meravigliosa, disponibile, gentile ed è stato un piacere affrontare questo percorso insieme.",
    commentEn: "Thank you for guiding me with great professionalism, dedication, and care, while simultaneously keeping our practice lighthearted, relaxing, and spontaneous, never making me feel that sense of \"chore\" that often arises when learning a new discipline.\n\nThank you for the essential knowledge you shared, for explaining concepts clearly using simple metaphors that helped me easily understand movements and exercises.\n\nThank you for your patience, emotional support, and understanding on \"off days\", adapting exercises so every lesson was valuable, keeping me comfortable and never feeling left behind.\n\nAbove all, thank you for being a wonderful, available, and kind person — it's a true pleasure taking this journey together.",
    likes: 15,
  },
  {
    id: 'rev-giulia-m',
    author: 'Giulia M.',
    rating: 5,
    date: 'Recensione Allievo',
    dateEn: 'Student Review',
    tag: 'Lezioni di Canto Online',
    tagEn: 'Online Singing Lessons',
    comment: "Dopo molte perplessità dovute alle mie insicurezze e al fatto che mi sentivo vecchia per ricominciare a prendere lezioni a 34 anni, sono ormai arrivata a iniziare il quarto percorso argento.\n\nLo consiglierei a chiunque, Francesca ha un ottimo metodo di insegnamento che non annoia mai e soprattutto che permette di scegliere liberamente quale canzoni studiare, assecondando anche le idee più pazze!\n\nHo già imparato moltissime cose sempre con il sorriso e sentendomi sempre a mio agio e penso di aver già fatto moltissimi progressi su quelli che erano i miei obiettivi iniziali, anche se ho ancora molto da studiare!\n\nOrmai è uno dei miei momenti preferiti della settimana e non lo mollo più, grazie Franci!",
    commentEn: "After many doubts due to my insecurities and feeling too old to restart singing lessons at 34, I am now starting my fourth course!\n\nI would recommend her to anyone. Francesca has a great teaching method that never gets boring, and above all allows you to freely choose which songs to study, welcoming even the craziest ideas!\n\nI have already learned so much always with a smile and feeling completely at ease, making immense progress towards my goals even though I still have a lot to study!\n\nIt is now one of my favorite moments of the week and I'm not letting go, thank you Franci!",
    likes: 14,
  },
];
