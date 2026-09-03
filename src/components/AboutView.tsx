import React, { useState, useEffect } from 'react';
import { Sparkles, Award, CheckCircle2, ArrowRight, BookOpen, Music, Heart, Star, Quote, MessageSquare, Plus, X, ThumbsUp, ShieldCheck, ChevronDown, ExternalLink } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import echoraLogo from '../assets/images/echora_logo.jpeg';

const francescaImg = "/src/assets/images/francesca_originale.png";

interface ReviewItem {
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

const DEFAULT_REVIEWS: ReviewItem[] = [
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

interface AboutViewProps {
  onNavigate: (tab: string) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onNavigate }) => {
  const { t, language } = useLanguage();
  const isEn = language === 'en';
  const { user, openAuthModal } = useAuth();

  const [reviews, setReviews] = useState<ReviewItem[]>(() => {
    try {
      const saved = localStorage.getItem('echora_reviews_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_REVIEWS;
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStudiOpen, setIsStudiOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newTag, setNewTag] = useState('Lezioni di Canto Online');
  const [newComment, setNewComment] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('echora_reviews_v2', JSON.stringify(reviews));
    } catch (e) {
      console.error(e);
    }
  }, [reviews]);

  useEffect(() => {
    if (user && isModalOpen) {
      if (!newFullName) setNewFullName(user.name || '');
    }
  }, [user, isModalOpen]);

  const handleOpenReviewModal = () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    setIsModalOpen(true);
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newComment.trim()) return;

    // Extract first name only for public display
    const rawName = newFullName.trim();
    const firstName = rawName.split(/\s+/)[0] || rawName;

    const item: ReviewItem = {
      id: Date.now().toString(),
      author: firstName,
      rating: newRating,
      date: isEn ? 'Just now' : 'Appena pubblicata',
      tag: newTag,
      comment: newComment.trim(),
      likes: 0,
    };

    setReviews((prev) => [item, ...prev]);
    setNewFullName('');
    setNewComment('');
    setSubmittedMessage(true);
    setTimeout(() => {
      setSubmittedMessage(false);
      setIsModalOpen(false);
    }, 1500);
  };

  const handleLike = (id: string) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, likes: r.likes + 1 } : r))
    );
  };

  return (
    <div className="min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 border border-sky-500/20 p-6 sm:p-10 shadow-2xl space-y-6">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl space-y-6">
          {/* Header row: Photo + Francesca Title + Subtitle */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-sky-500 via-cyan-400 to-blue-600 p-1 shadow-xl shadow-sky-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-full overflow-hidden">
                <img
                  src={francescaImg}
                  alt="Francesca Vocal Coach"
                  className="w-full h-full object-cover object-[35%_50%] scale-125 rounded-full"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight" style={{ fontFamily: "'Amita', cursive, serif" }}>
                Francesca
              </h1>
              <p className="text-xs sm:text-sm font-extrabold text-sky-400 uppercase tracking-wider">
                {isEn ? 'THE SINGER WHO IS JUST AS AWKWARD AS YOU.' : 'LA CANTANTE DISAGIATA QUANTO TE.'}
              </p>
              <p className="text-xs sm:text-sm text-sky-200/90 font-semibold italic">
                {isEn ? 'Singer-Songwriter, Vocal Coach & Founder of Echora' : 'Cantautrice, Vocal Coach e Fondatrice di Echora'}
              </p>
            </div>
          </div>

          {/* Quote */}
          <div className="pt-3 border-t border-sky-500/20">
            <h2 className="text-lg sm:text-2xl text-white tracking-tight leading-snug font-bold" style={{ fontSize: '23px' }}>
              {isEn
                ? '"Freeing your voice means giving yourself permission to make mistakes... and sound a bit terrible."'
                : '"Liberare la tua voce significa darti il permesso di fare errori... e fare anche un po\' schifo."'}
            </h2>
          </div>
        </div>
      </div>

      {/* Main Bio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Profile Card / Fast Stats */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden group space-y-6">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80 z-10"></div>
          
          <div className="relative z-20 space-y-5">
            {/* Insegnamento & Attività */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-slate-200 text-xs sm:text-sm space-y-2">
              <p className="font-bold text-sky-300 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-sky-400" /> {isEn ? 'Activities & Teaching:' : 'Attività & Insegnamento:'}
              </p>
              <p className="leading-snug">{isEn ? 'Online & In-person Vocal Coach in Sardinia since 2021.' : 'Vocal Coach Online e in Sardegna dal 2021.'}</p>
              <p className="leading-snug">{isEn ? 'Modern Singing Teacher for children & adults in private & civic music schools.' : 'Docente di Canto Moderno per bambini e adulti in scuole civiche e private.'}</p>
            </div>

            {/* Menu a scomparsa: Studi & Formazione */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-slate-200 text-xs sm:text-sm space-y-3">
              <button
                type="button"
                onClick={() => setIsStudiOpen(!isStudiOpen)}
                className="w-full flex items-center justify-between font-bold text-sky-300 text-xs sm:text-sm cursor-pointer select-none group"
              >
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-sky-400" /> {isEn ? 'Studies & Training:' : 'Studi & Formazione:'}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400 group-hover:text-sky-300 transition-colors">
                  {isStudiOpen ? (isEn ? 'Hide' : 'Nascondi') : (isEn ? 'Show' : 'Mostra')}
                  <ChevronDown className={`w-4 h-4 text-sky-400 transition-transform duration-200 ${isStudiOpen ? 'rotate-180' : ''}`} />
                </span>
              </button>
              
              {isStudiOpen && (
                <div className="pt-3 border-t border-slate-700/60 space-y-3 text-slate-200 animate-fadeIn">
                  <div className="space-y-1">
                    <p className="font-bold text-white text-xs uppercase tracking-wider">{isEn ? 'Pre-Academic Training' : 'Formazione pre-accademica'}</p>
                    <ul className="list-disc list-inside text-slate-300 space-y-0.5 text-xs pl-1">
                      <li>{isEn ? 'Classical Guitar 2008' : 'Chitarra classica 2008'}</li>
                      <li>{isEn ? 'Drums 2010' : 'Batteria 2010'}</li>
                      <li>{isEn ? 'Singing 2010' : 'Canto 2010'}</li>
                    </ul>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-slate-700/50">
                    <p className="font-bold text-white text-xs">{isEn ? 'Bachelor\'s Degree in Jazz Singing (2016 - 2019)' : 'Laurea Triennale in Canto Jazz (2016 - 2019)'}</p>
                    <p className="text-slate-300 text-xs">Conservatorio di Musica "G.P. da Palestrina" Cagliari</p>
                    <p className="text-sky-400 font-bold text-xs">{isEn ? 'Grade: 110/110 with Honors' : 'Votazione: 110/110'}</p>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-slate-700/50">
                    <p className="font-bold text-white text-xs uppercase tracking-wider">{isEn ? 'Masterclasses & Workshops (2016 - 2019)' : 'Masterclass e seminari (2016 - 2019)'}</p>
                    <ul className="list-disc list-inside text-slate-300 space-y-0.5 text-xs pl-1 leading-relaxed">
                      <li>{isEn ? 'Vocal Masterclass with Gianna Montecalvo' : 'Masterclass di canto con Gianna Montecalvo'}</li>
                      <li>{isEn ? 'Vocal Masterclass with Cheryl Porter' : 'Masterclass di canto con Cheryl Porter'}</li>
                      <li>{isEn ? 'Singing Technique & Interpretation Masterclass with Liane Carroll - 2017' : 'Masterclass di Canto, Tecnica e Interpretazione con Liane Carroll - 2017'}</li>
                      <li>{isEn ? 'TC Helicon Loop Station Course with Giuliana Lostia - 2018' : 'Corso Loop Station TC Helicon - Scuola Civica di Quartu con Giuliana Lostia - 2018'}</li>
                      <li>{isEn ? 'Sardinian Folk Singing Masterclass with Claudia Aru - 2018' : 'Masterclass di Canto Sardo con Claudia Aru - 2018'}</li>
                      <li>{isEn ? 'Indian Music Masterclass with Varijashree Venugopal - 2018' : 'Masterclass di Musica Indiana con Varijashree Venugopal - 2018'}</li>
                      <li>{isEn ? 'Reaper DAW Masterclass with Francesco Bonalume - 2019' : 'Masterclass Reaperiani con Francesco Bonalume 2019'}</li>
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-slate-700/50">
                    <p className="font-semibold text-slate-200 text-xs">
                      {isEn ? 'Private lessons program with Sergio Calafiura 2025' : 'Percorso di lezioni private con Sergio Calafiura 2025'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="relative z-20 grid grid-cols-3 gap-2 pt-5 border-t border-slate-800/80 text-center">
            <div className="p-3 rounded-xl bg-slate-800/50">
              <p className="text-xl sm:text-2xl font-black text-sky-400">2010</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{isEn ? 'Started Studies' : 'Inizio Studi'}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/50">
              <p className="text-xl sm:text-2xl font-black text-cyan-400">2019</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{isEn ? 'Jazz Degree' : 'Laurea Canto Jazz'}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/50">
              <p className="text-xl sm:text-2xl font-black text-emerald-400">2021</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{isEn ? 'Vocal Coaching' : 'Vocal Coaching'}</p>
            </div>
          </div>
        </div>

        {/* Detailed Story / Bio */}
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="space-y-4">
            <h3 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-sky-400" />
              <span>{isEn ? 'My Story & Philosophy' : 'La mia storia e filosofia'}</span>
            </h3>

            <div className="space-y-3.5 text-slate-300 text-sm sm:text-base leading-relaxed">
              <p className="font-bold text-sky-300 text-base">{isEn ? 'Hi! I\'m Francesca.' : 'Ciao! Sono Francesca.'}</p>
              
              <p className="font-semibold text-white">{isEn ? 'I\'m a Singer-Songwriter and Vocal Coach.' : 'Sono una Cantautrice e Vocal Coach.'}</p>

              <p>
                {isEn
                  ? 'I started studying vocal technique in 2010, and in 2019 I graduated in Jazz Singing at the Conservatorio of Cagliari. Since 2021 I teach singers how to manage their voice, overcome vocal obstacles, and above all, give themselves space to make mistakes, learn new things, and bring new life to their voice.'
                  : 'Ho iniziato a studiare tecnica vocale nel 2010 e nel 2019 mi sono laureata in Canto Jazz al Conservatorio di Cagliari. Dal 2021 insegno alle persone cosa fare della propria voce, come affrontare e risolvere i propri problemi vocali e, soprattutto, come darsi lo spazio di fare errori per imparare cose nuove e dare nuova vita alla propria voce.'}
              </p>

              <p>
                {isEn
                  ? 'Over the years I continue to study, experiment, and compare different vocal methodologies, understanding what truly works and turning everything I learn into something concrete and useful.'
                  : 'Negli anni continuo a studiare, sperimentare e confrontare approcci diversi, cercando di capire che cosa funzioni davvero e come trasformare tutto quello che imparo in qualcosa di utile e concreto.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Perché ho creato Echora - Full Width Section */}
      <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-900/90 border border-slate-800/90 hover:border-sky-500/30 transition-all rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-sky-400/60 shadow-lg shadow-sky-500/30 bg-slate-950 shrink-0">
              <img
                src={echoraLogo}
                alt="Echora Logo"
                className="w-full h-full object-cover scale-110"
                referrerPolicy="no-referrer"
              />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
              <span>{isEn ? 'Why I Created Echora' : 'Perché ho creato Echora'}</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start text-slate-300 text-sm sm:text-base leading-relaxed">
            <div className="space-y-3.5">
              <p>
                {isEn
                  ? 'Right from my earliest singing lessons, I recorded custom practice exercises for my students so they had audio tools to practice with at home.'
                  : 'Fin dall\'inizio delle mie lezioni ho iniziato a registrare gli esercizi per i miei studenti, così che avessero del materiale con cui studiare a casa.'}
              </p>

              <p>
                {isEn
                  ? 'I did it because I know firsthand what it feels like to feel lost in front of your own voice: not knowing which exercises to do, how to execute them, for how long, and whether you are doing them correctly.'
                  : 'L\'ho fatto anche perché io per prima so cosa significa essere disorientata davanti alla propria voce: non sapere quali esercizi fare, come farli, per quanto tempo e soprattutto se li si sta facendo nel modo giusto.'}
              </p>

              <p>
                {isEn
                  ? 'Over time I realized those audio recordings could become something much bigger.'
                  : 'Con il tempo mi sono resa conto che quelle registrazioni potevano diventare qualcosa di più.'}
              </p>

              <p className="font-semibold text-sky-200">
                {isEn
                  ? 'And that is how Echora was born: a space to gather all our lesson exercises and transform them into a simple, guided practice app.'
                  : 'Ed è così che è nato Echora: un luogo in cui raccogliere gli esercizi che facciamo a lezione e trasformarli in un\'esperienza di studio semplice e guidata.'}
              </p>
            </div>

            <div className="space-y-4 bg-slate-950/60 p-5 sm:p-6 rounded-2xl border border-slate-800/80">
              <ul className="space-y-2.5 text-slate-200 text-sm sm:text-base font-medium">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0" />
                  <span>{isEn ? 'You don\'t have to worry about playing piano notes.' : 'Non devi pensare a suonare le note.'}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0" />
                  <span>{isEn ? 'You don\'t have to memorize every single vocal exercise.' : 'Non devi ricordarti tutti gli esercizi.'}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0" />
                  <span>{isEn ? 'You don\'t have to stress over technical details.' : 'Non devi ricordarti ogni dettaglio.'}</span>
                </li>
              </ul>

              <div className="text-center py-2">
                <span className="inline-block text-base sm:text-lg font-black text-sky-300 bg-sky-950/80 border border-sky-500/40 px-5 py-2.5 rounded-xl shadow-lg">
                  {isEn ? 'Echora takes care of guiding you.' : 'Echora pensa a guidarti.'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300">
                {isEn
                  ? 'It accompanies you step by step during the exercise, and even reminds you to lift your cheekbones when needed!'
                  : 'Ti accompagna durante l\'esercizio e, quando serve, ti ricorda persino di alzare gli zigomi.'}
              </p>
            </div>
          </div>

          <p className="font-medium text-slate-200 bg-slate-800/40 p-4 sm:p-5 rounded-xl border border-slate-700/50 leading-relaxed text-sm sm:text-base text-center max-w-4xl mx-auto mt-4">
            {isEn
              ? 'Because studying your voice should leave you more space to listen, experiment, make mistakes, and discover all the awesome things your voice can do.'
              : 'Perché studiare la voce dovrebbe lasciarti più spazio per ascoltare, sperimentare, sbagliare e scoprire tutte le cose fighissime che puoi fare con la tua voce.'}
          </p>
        </div>

        <div className="pt-6 border-t border-slate-800/80 flex items-center justify-center">
          <button
            onClick={() => onNavigate('pricing')}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-sky-500/25 flex items-center gap-2 transition-all group cursor-pointer"
          >
            <span>{isEn ? 'Choose the Annual Plan' : 'Scegli il piano annuale'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Three Pillars Section */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">{t('aboutPillarsTitle')}</h2>
          <p className="text-xs sm:text-sm text-slate-400">Un approccio integrato che unisce scienza vocale, ascolto e tecnologia.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3 hover:border-sky-500/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">{t('pillar1Title')}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{t('pillar1Desc')}</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3 hover:border-cyan-500/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
              <Music className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">{t('pillar2Title')}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{t('pillar2Desc')}</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3 hover:border-indigo-500/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">{t('pillar3Title')}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{t('pillar3Desc')}</p>
          </div>
        </div>
      </div>

      {/* Section: Lezioni di Canto & Laboratori con Francesca */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border border-sky-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>{isEn ? 'Lessons & Workshops' : 'Lezioni & Laboratori'}</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white">
            {isEn ? 'Study & Sing with Francesca' : 'Studia e Canta con Francesca'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            {isEn
              ? 'Want 1-on-1 vocal coaching or to participate in live or online singing workshops? Discover courses and book your session on Beacons.'
              : 'Vuoi prendere lezioni di canto con me o partecipare ai laboratori di canto in presenza e online? Scopri tutte le info, i corsi e prenota la tua sessione su Beacons.'}
          </p>
        </div>
        <a
          href="https://beacons.ai/nielafreh"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-sky-500/25 flex items-center gap-2.5 transition-all hover:scale-105 shrink-0 cursor-pointer"
        >
          <span>{isEn ? 'Book Lessons or Workshops' : 'Prendi Lezioni o Laboratori con Me'}</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Reviews & Testimonials Section */}
      <div className="space-y-8 pt-8 border-t border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{isEn ? 'What people say about Francesca & Echora' : 'Dicono di Francesca ed Echora'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {isEn ? 'Reviews & Testimonials' : 'Recensioni & Testimonianze'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {isEn
                ? 'Discover experiences from students and singers who studied with me and train with the Echora app'
                : 'Scopri le esperienze degli allievi e cantanti che hanno studiato con me e che si allenano con l\'app Echora'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenReviewModal}
            className="self-start sm:self-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isEn ? 'Leave a Review' : 'Lascia una Recensione'}</span>
          </button>
        </div>

        {/* Average Rating Bar (shown if reviews exist) */}
        {reviews.length > 0 && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 flex items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-amber-400 text-2xl sm:text-3xl font-black">
                <span>{avgRating}</span>
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
              <div className="h-8 w-px bg-slate-800 hidden sm:block"></div>
              <div className="text-xs sm:text-sm text-slate-300 font-medium">
                {isEn ? 'Average rating based on' : 'Valutazione media basata su'}{' '}
                <span className="text-white font-bold">
                  {reviews.length} {isEn ? 'reviews' : 'recensioni'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Reviews Cards Grid or Empty State */}
        {reviews.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
              <Star className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h4 className="text-lg font-bold text-white">
                {isEn ? 'No reviews yet' : 'Nessuna recensione ancora presente'}
              </h4>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {isEn
                  ? 'Log in to your account and share your feedback on Francesca\'s vocal lessons and the Echora web app.'
                  : 'Effettua l\'accesso e condividi la tua recensione sulle lezioni di canto con Francesca e sulla web app Echora.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenReviewModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-xs sm:text-sm shadow-lg cursor-pointer active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{isEn ? 'Leave the First Review' : 'Lascia la prima recensione'}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4 transition-all hover:translate-y-[-2px] relative group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-white text-sm flex items-center gap-1.5">
                        <span>{rev.author}</span>
                      </h4>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold text-sky-300 shrink-0">
                      {rev.tag}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-[10px] text-slate-400 ml-2">
                      {rev.date}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed italic relative pl-3 border-l-2 border-sky-500/40 whitespace-pre-line">
                    "{isEn && rev.commentEn ? rev.commentEn : rev.comment}"
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end text-[11px] text-slate-400">
                  <button
                    type="button"
                    onClick={() => handleLike(rev.id)}
                    className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <ThumbsUp className="w-3 h-3 text-sky-400" />
                    <span>{isEn ? 'Helpful' : 'Utile'} ({rev.likes})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal / Popup for Adding Review */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-5">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-sky-400" />
                <span>{isEn ? 'Leave Your Review' : 'Lascia la tua Recensione'}</span>
              </h3>
              <p className="text-xs text-slate-400">
                {isEn
                  ? 'Share your experience with Francesca and the Echora web app.'
                  : 'Racconta la tua esperienza di studio con Francesca e con la web app Echora.'}
              </p>
            </div>

            {submittedMessage ? (
              <div className="p-6 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-center text-sm font-bold space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <p className="text-base">{isEn ? 'Thank you so much!' : 'Grazie di cuore!'}</p>
                <p className="text-xs font-normal text-slate-300">
                  {isEn ? 'Your review has been published successfully.' : 'La tua recensione è stata pubblicata con successo.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleAddReview} className="space-y-4 text-xs sm:text-sm">
                <div className="space-y-1">
                  <label className="block text-slate-300 font-bold">
                    {isEn ? 'Full Name (First and Last Name)' : 'Nome e Cognome'}
                  </label>
                  <p className="text-[11px] text-sky-400 font-medium">
                    {isEn
                      ? 'ℹ️ Only your first name will be displayed publicly to protect your privacy.'
                      : 'ℹ️ Verrà pubblicato solo il tuo nome per tutelare la tua privacy.'}
                  </p>
                  <input
                    type="text"
                    required
                    placeholder={isEn ? 'e.g. Marco Rossi' : 'Es. Marco Rossi'}
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-2.5 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">{isEn ? 'Category' : 'Categoria'}</label>
                  <select
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-2.5 text-white outline-none cursor-pointer font-semibold"
                  >
                    <option value="Lezioni di Canto Online">Lezioni di Canto Online</option>
                    <option value="Lezioni di Canto in Presenza">Lezioni di Canto in Presenza</option>
                    <option value="Echora">Echora</option>
                    <option value="Laboratori">Laboratori</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">{isEn ? 'Rating (Stars)' : 'Valutazione (Stelle)'}</label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewRating(star)}
                        className="p-1 transition-transform hover:scale-110 cursor-pointer"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">{isEn ? 'Your Review' : 'La tua recensione'}</label>
                  <textarea
                    required
                    rows={4}
                    placeholder={isEn ? 'Write here your experience...' : 'Scrivi qui la tua esperienza con il corso o con l\'app...'}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl p-3.5 text-white outline-none resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                  >
                    {isEn ? 'Cancel' : 'Annulla'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold shadow-lg cursor-pointer"
                  >
                    {isEn ? 'Submit Review' : 'Pubblica Recensione'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


