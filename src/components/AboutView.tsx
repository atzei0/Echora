import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  Heart,
  Star,
  MessageSquare,
  Plus,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Check
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import echoraLogo from '../assets/images/echora_logo.jpeg';
import { DEFAULT_REVIEWS, ReviewItem } from '../data/reviews';
import { ReviewsCarousel } from './ReviewsCarousel';

// Images of Francesca for bio & slideshow
import francescaOriginaleImg from '../assets/images/francesca_originale.png';
import francescaCoachImg from '../assets/images/francesca_vocal_coach_1786203954996.jpg';
import francescaStageImg from '../assets/images/francesca_exact_stage_photo_1786207127777.jpg';
import francescaStageMicImg from '../assets/images/francesca_stage_mic_1786207013067.jpg';
import francescaNielafrehImg from '../assets/images/francesca_nielafreh_mic_1786207249077.jpg';

interface AboutViewProps {
  onNavigate: (tab: string) => void;
}

const SLIDESHOW_PHOTOS = [
  { src: francescaCoachImg, alt: 'Francesca Vocal Coach' },
  { src: francescaStageImg, alt: 'Francesca sul palco' },
  { src: francescaStageMicImg, alt: 'Francesca live set' },
  { src: francescaNielafrehImg, alt: 'Francesca in studio' },
  { src: francescaOriginaleImg, alt: 'Francesca ritratto' },
];

export const AboutView: React.FC<AboutViewProps> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const { user } = useAuth();

  const [reviews, setReviews] = useState<ReviewItem[]>(() => {
    try {
      const saved = localStorage.getItem('echora_reviews_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_REVIEWS;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStudiOpen, setIsStudiOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newTag, setNewTag] = useState('Lezioni di Canto Online');
  const [newComment, setNewComment] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState(false);

  // Slideshow state
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % SLIDESHOW_PHOTOS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) => (prev === 0 ? SLIDESHOW_PHOTOS.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % SLIDESHOW_PHOTOS.length);
  };

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
    if (user && !newFullName) {
      setNewFullName(user.name || '');
    }
    setSubmittedMessage(false);
    setIsModalOpen(true);
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newComment.trim()) return;

    const parts = newFullName.trim().split(' ');
    const publicDisplayName = parts[0] + (parts.length > 1 ? ` ${parts[parts.length - 1].charAt(0).toUpperCase()}.` : '');

    const newRev: ReviewItem = {
      id: `rev-${Date.now()}`,
      author: publicDisplayName,
      rating: newRating,
      date: isEn ? 'Verified Student' : 'Allievo Verificato',
      tag: newTag,
      comment: newComment.trim(),
      likes: 1,
    };

    setReviews([newRev, ...reviews]);
    setSubmittedMessage(true);

    setTimeout(() => {
      setNewFullName('');
      setNewComment('');
      setNewRating(5);
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
                  src={francescaOriginaleImg}
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
                    <p className="font-bold text-white text-xs">{isEn ? 'Continuous Training:' : 'Formazione Continua:'}</p>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      {isEn
                        ? 'Masterclasses and certified training in SOVT techniques, voice recovery, vocal acoustics, and modern voice pedagogies.'
                        : 'Masterclass e percorsi certificati su tecniche SOVT, riabilitazione della voce artistica, acustica vocale e pedagogie del canto moderno.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 3 Riquadri Piccolini delle pietre miliari SOTTO Studi & Formazione */}
            <div className="grid grid-cols-3 gap-2.5 text-center pt-1">
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-sky-400/40 shadow-md space-y-1">
                <span className="text-lg sm:text-xl font-black text-sky-300">2008</span>
                <p className="text-[10px] sm:text-xs text-slate-200 font-bold leading-tight">
                  {isEn ? 'Started studying' : 'Inizio studi'}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-cyan-400/40 shadow-md space-y-1">
                <span className="text-lg sm:text-xl font-black text-cyan-300">2019</span>
                <p className="text-[10px] sm:text-xs text-slate-200 font-bold leading-tight">
                  {isEn ? 'Conservatory Degree' : 'Laurea Conservatorio'}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-indigo-400/40 shadow-md space-y-1">
                <span className="text-lg sm:text-xl font-black text-indigo-300">2021</span>
                <p className="text-[10px] sm:text-xs text-slate-200 font-bold leading-tight">
                  {isEn ? 'Vocal Coaching' : 'Vocal Coaching'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bio Story Section: "LA MIA STORIA E FILOSOFIA" */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
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
                  ? 'I started studying vocal technique in 2010, and in 2019 I graduated in Jazz Singing at the Conservatorio of Cagliari. Since 2021 I teach my students how to tackle and solve their vocal challenges and, above all, give themselves space to make mistakes to learn new things, giving new life to their voice.'
                  : 'Ho iniziato a studiare tecnica vocale nel 2010 e nel 2019 mi sono laureata in Canto Jazz al Conservatorio di Cagliari. Dal 2021 insegno ai miei allievi come affrontare e risolvere i propri problemi vocali e soprattutto come darsi lo spazio di fare errori per imparare cose nuove dando nuova vita alla propria voce.'}
              </p>

              <p>
                {isEn
                  ? 'To this day, I continue to study, experiment, and compare different vocal technique approaches, understanding what truly works and turning everything I learn into something concrete and useful.'
                  : 'Tutt\'ora continuo a studiare, sperimentare e confrontare approcci diversi di tecnica vocale, cercando di capire che cosa funzioni davvero e come trasformare tutto quello che imparo in qualcosa di utile e concreto.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Point 11: Sezione sotto "LA MIA STORIA E FILOSOFIA" con Slideshow foto a sinistra + Testo a destra + Pulsante */}
      <div className="bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-slate-950/95 border border-sky-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Spazio per le foto sulla sinistra: Slideshow automatico */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-3">
            <div className="relative group w-full max-w-sm aspect-[4/5] rounded-3xl overflow-hidden border-2 border-sky-400/50 shadow-2xl bg-slate-950">
              {SLIDESHOW_PHOTOS.map((photo, idx) => (
                <img
                  key={idx}
                  src={photo.src}
                  alt={photo.alt}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                    idx === currentSlideIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                  }`}
                  referrerPolicy="no-referrer"
                />
              ))}

              {/* Navigation Arrows for manual control */}
              <button
                type="button"
                onClick={handlePrevSlide}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/70 hover:bg-slate-900 text-white border border-slate-700/80 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-lg"
                title="Foto precedente"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleNextSlide}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/70 hover:bg-slate-900 text-white border border-slate-700/80 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-lg"
                title="Foto successiva"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Indicator dots at bottom */}
              <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center space-x-1.5 z-10">
                {SLIDESHOW_PHOTOS.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={() => setCurrentSlideIndex(dotIdx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      dotIdx === currentSlideIndex
                        ? 'w-6 bg-sky-400 shadow-md shadow-sky-400/50'
                        : 'w-2 bg-white/60 hover:bg-white'
                    }`}
                    aria-label={`Go to slide ${dotIdx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Paragrafo di testo sulla destra + Pulsante "Vai al mio sito" */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <h3 className="text-2xl sm:text-4xl font-black text-white leading-snug">
              {isEn ? 'My courses' : 'I miei corsi'}
            </h3>

            <p className="text-slate-200 text-base sm:text-lg leading-relaxed font-medium">
              Come Vocal Coach faccio lezioni di canto individuale in presenza e online, in cui lavoriamo sulla tecnica vocale principalmente, ma le lezioni sono costruite su misura dello studente. Sto lavorando anche a corsi di formazione per Home Recording, Creazione di Contenuti e Laboratori di gruppo.
            </p>

            <div className="pt-2">
              <a
                href="https://beacons.ai/nielafreh"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-sky-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>{isEn ? 'Visit my website' : 'Vai al mio sito'}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Point 6 & 7: "Perché ho creato Echora" (con spazio per immagine sulla destra) */}
      <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
        <div className="flex items-center gap-3.5 border-b border-slate-800/80 pb-4">
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Testo a sinistra */}
          <div className="lg:col-span-7 space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
            <p>
              Quando ho iniziato a prendere lezioni di canto mi sono trovata disorientata davanti alla mia voce. Nonostante avessi un'insegnante che mi seguiva non sapevo quali esercizi fare a casa, come farli, per quanto tempo e soprattutto se li si stavo facendo nel modo giusto.
            </p>

            <p>
              Ecco perchè fin dall'inizio del mio lavoro come insegnante ho dato dei materiali ai miei studenti per capire meglio cosa fare a casa e far sì che capissero la loro voce e diventassero indipendenti.
            </p>

            <p>
              Con il tempo poi mi sono resa conto che queste registrazioni potevano diventare qualcosa di più...
            </p>

            <p className="font-bold text-sky-200 text-base sm:text-lg">
              Ed è così che è nato Echora: un luogo in cui raccogliere gli esercizi che facciamo a lezione e trasformarli in un'esperienza di studio il più semplice possibile e guidata!
            </p>
          </div>

          {/* Spazio immagine sulla destra */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative group max-w-xs sm:max-w-sm w-full">
              <div className="absolute -inset-1.5 bg-gradient-to-tr from-sky-500 via-cyan-400 to-indigo-500 rounded-3xl blur-md opacity-40 group-hover:opacity-75 transition duration-500"></div>
              <div className="relative rounded-3xl overflow-hidden border-2 border-sky-400/50 shadow-2xl bg-slate-950 aspect-[4/5]">
                <img
                  src={francescaStageMicImg}
                  alt="Francesca Echora"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Point 8: Sezione “Ci pensa Echora a guidarti!” (UNICO riquadro con elenco puntato e slogan) */}
      <div className="space-y-6">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            {isEn ? 'Echora takes care of guiding you!' : 'Ci pensa Echora a guidarti!'}
          </h2>
        </div>

        {/* Unico Riquadro con Elenco Puntato e Slogan — più largo delle recensioni */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-sky-950/40 border border-sky-400/40 hover:border-sky-400/70 rounded-3xl p-6 sm:p-10 shadow-2xl max-w-6xl mx-auto space-y-8 transition-all">
          <ul className="space-y-5 text-slate-100 text-sm sm:text-lg font-bold">
            <li className="flex items-start gap-3.5">
              <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 border border-sky-400/40 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <span>Non devi pensare a suonare le note perchè te le suona Echora!</span>
            </li>
            <li className="flex items-start gap-3.5">
              <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 border border-sky-400/40 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <span>Non devi ricordarti tutti gli esercizi perchè ce li hai tutti nello stesso posto.</span>
            </li>
            <li className="flex items-start gap-3.5">
              <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 border border-sky-400/40 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <span>Non devi ricordarti ogni dettaglio perchè Echora ti ricorda anche di alzare gli zigomi e piangere!</span>
            </li>
          </ul>

          {/* Slogan inserito nello stesso riquadro */}
          <div className="pt-6 border-t border-sky-500/20 text-center">
            <p className="text-sm sm:text-lg text-sky-300 font-extrabold italic leading-relaxed">
              “Perchè studiare la voce dovrebbe lasciarti più spazio per sperimentare, sbagliare e scoprire tutte le cose fighissime che puoi fare con la tua voce!”
            </p>
          </div>
        </div>
      </div>

      {/* Point 9: Recensioni — Carosello Centrale */}
      <div className="pt-4 border-t border-slate-800/80">
        <ReviewsCarousel
          reviews={reviews}
          onLike={handleLike}
          onOpenReviewModal={handleOpenReviewModal}
          showAddButton={true}
        />
      </div>

      {/* Point 10: Banner “Studia e Canta con me!” posizionato SOTTO la sezione delle recensioni */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border border-sky-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>{isEn ? 'Lessons & Workshops' : 'Lezioni & Laboratori'}</span>
          </div>
          <h3 className="text-2xl sm:text-4xl font-black text-white">
            {isEn ? 'Study & Sing with me!' : 'Studia e Canta con me!'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            {isEn
              ? "Echora does not replace 1:1 lessons but supports your practice between sessions. If you need guidance, you can take lessons with me! Discover all course and workshop info on my website!"
              : "Echora non sostituisce la lezione 1:1 ma ti è da supporto per lo studio fra una lezione e l'altra. Se hai bisogno di una guida, puoi prendere lezioni insieme a me! Scopri tutte le info sui corsi di canto e altri laboratori in presenza e onine, sul mio sito!"}
          </p>
        </div>
        <a
          href="https://beacons.ai/nielafreh"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm sm:text-base shadow-xl shadow-sky-500/25 flex items-center gap-2.5 transition-all hover:scale-105 shrink-0 cursor-pointer"
        >
          <span>{isEn ? 'Visit my website' : 'Vai al mio sito'}</span>
          <ExternalLink className="w-4 h-4" />
        </a>
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
