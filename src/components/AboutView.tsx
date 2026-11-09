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
import img0751 from '../assets/images/IMG_0751.JPG';

// 14 slideshow images in exact requested order
import slide1_4333 from '../assets/images/IMG_4333.JPG';
import slide2_8169 from '../assets/images/IMG_8169.jpg';
import slide3_5422 from '../assets/images/IMG_5422.JPG';
import slide4_screenOct from '../assets/images/Screenshot 2026-10-08 alle 19.58.53.PNG';
import slide5_6290 from '../assets/images/IMG_6290.JPG';
import slide6_5642 from '../assets/images/IMG_5642.JPG';
import slide7_0251 from '../assets/images/IMG_0251.jpg';
import slide8_6294 from '../assets/images/IMG_6294.JPG';
import slide9_claudia38 from '../assets/images/Documentazione Francesca Atzei x Claudia Bozzato-38.JPG';
import slide10_5806 from '../assets/images/580690070_1253345773268417_7549702597151187449_n.jpg';
import slide11_b28d from '../assets/images/b28dbbdd-42c3-40a8-a5f3-6c49fbc883ec.JPG';
import slide12_4652 from '../assets/images/IMG_4652.JPG';
import slide13_screenAug from '../assets/images/Screenshot 2026-08-30 alle 00.01.40.png';
import slide14_8459 from '../assets/images/8459d579-6c74-4ddc-9fd9-cf38b09e32cc.JPG';

// Studia e canta con me banner image (IMG_8169)
const studiaCantaImg = slide2_8169;

interface AboutViewProps {
  onNavigate: (tab: string) => void;
}

interface SlidePhoto {
  src: string;
  alt: string;
  position?: string;
  credit?: string;
  creditEn?: string;
}

const SLIDESHOW_PHOTOS: SlidePhoto[] = [
  { src: slide1_4333, alt: 'Francesca Atzei - I miei corsi 1' },
  { src: slide2_8169, alt: 'Francesca Atzei - I miei corsi 2' },
  { src: slide3_5422, alt: 'Francesca Atzei - I miei corsi 3' },
  { src: slide4_screenOct, alt: 'Francesca Atzei - I miei corsi 4' },
  { src: slide5_6290, alt: 'Francesca Atzei - I miei corsi 5' },
  { src: slide6_5642, alt: 'Francesca Atzei - I miei corsi 6' },
  { src: slide7_0251, alt: 'Francesca Atzei - I miei corsi 7' },
  { src: slide8_6294, alt: 'Francesca Atzei - I miei corsi 8' },
  {
    src: slide9_claudia38,
    alt: 'Francesca Atzei - Fotografia di Claudia Bozzato',
    credit: 'Fotografia di Claudia Bozzato',
    creditEn: 'Photography by Claudia Bozzato'
  },
  { src: slide10_5806, alt: 'Francesca Atzei - I miei corsi 10' },
  { src: slide11_b28d, alt: 'Francesca Atzei - I miei corsi 11' },
  { src: slide12_4652, alt: 'Francesca Atzei - I miei corsi 12' },
  { src: slide13_screenAug, alt: 'Francesca Atzei - I miei corsi 13' },
  { src: slide14_8459, alt: 'Francesca Atzei - I miei corsi 14' }
];

export const AboutView: React.FC<AboutViewProps> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const { user } = useAuth();

  const [reviews, setReviews] = useState<ReviewItem[]>(() => {
    try {
      const saved = localStorage.getItem('echora_reviews_v8');
      if (saved) return JSON.parse(saved);

      // Migration: merge any custom reviews from previous versions with updated DEFAULT_REVIEWS
      const savedPrev =
        localStorage.getItem('echora_reviews_v7') ||
        localStorage.getItem('echora_reviews_v6') ||
        localStorage.getItem('voxey_reviews_v6') ||
        localStorage.getItem('echora_reviews_v5') ||
        localStorage.getItem('echora_reviews_v4') ||
        localStorage.getItem('echora_reviews_v3') ||
        localStorage.getItem('echora_reviews_v2');
      if (savedPrev) {
        const parsed = JSON.parse(savedPrev);
        const userAdded = Array.isArray(parsed)
          ? parsed.filter((r: ReviewItem) => !DEFAULT_REVIEWS.some((d) => d.id === r.id))
          : [];
        return [...DEFAULT_REVIEWS, ...userAdded];
      }
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
      localStorage.setItem('echora_reviews_v8', JSON.stringify(reviews));
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
                  className="w-full h-full object-cover object-[55%_35%] scale-110 rounded-full"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/francesca_originale.png';
                  }}
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

      {/* Bio Story Section: "LA MIA STORIA E FILOSOFIA" with IMG_0751 blended seamlessly on the right */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-sky-500/30 shadow-2xl min-h-[460px] flex items-center">
        {/* Foto IMG_0751 sulla destra con sfumatura morbida verso sinistra */}
        <div className="absolute right-0 top-0 bottom-0 w-full sm:w-3/5 lg:w-1/2 h-full overflow-hidden pointer-events-none select-none">
          <img
            src={img0751}
            alt="Francesca - La mia storia e filosofia"
            className="w-full h-full object-cover object-right sm:object-center"
            style={{
              maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 20%, rgba(0,0,0,0.85) 45%, black 70%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 20%, rgba(0,0,0,0.85) 45%, black 70%)'
            }}
          />
          {/* Sfumatura di supporto per garantire contrasto e fusione perfetta col background slate-900 */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/60 to-transparent sm:via-slate-900/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent sm:hidden" />
        </div>

        {/* Blocco di testo a sinistra, scritto sopra lo sfondo/sfumatura senza coprire il soggetto */}
        <div className="relative z-10 p-6 sm:p-10 lg:p-12 max-w-full sm:max-w-xl lg:max-w-2xl space-y-4">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-sky-400" />
            <span>{isEn ? 'My Story & Philosophy' : 'La mia storia e filosofia'}</span>
          </h3>

          <div className="space-y-3.5 text-slate-200 text-sm sm:text-base leading-relaxed">
            <p className="font-bold text-sky-300 text-base sm:text-lg">{isEn ? 'Hi! I\'m Francesca.' : 'Ciao! Sono Francesca.'}</p>
            
            <p className="font-semibold text-white">{isEn ? 'I\'m a Singer-Songwriter and Vocal Coach.' : 'Sono una Cantautrice e Vocal Coach.'}</p>

            <p className="drop-shadow-sm">
              {isEn
                ? 'I started studying vocal technique in 2010, and in 2019 I graduated in Jazz Singing at the Conservatorio of Cagliari. Since 2021 I teach my students how to tackle and solve their vocal challenges and, above all, give themselves space to make mistakes to learn new things, giving new life to their voice.'
                : 'Ho iniziato a studiare tecnica vocale nel 2010 e nel 2019 mi sono laureata in Canto Jazz al Conservatorio di Cagliari. Dal 2021 insegno ai miei allievi come affrontare e risolvere i propri problemi vocali e soprattutto come darsi lo spazio di fare errori per imparare cose nuove dando nuova vita alla propria voce.'}
            </p>

            <p className="drop-shadow-sm">
              {isEn
                ? 'To this day, I continue to study, experiment, and compare different vocal technique approaches, understanding what truly works and turning everything I learn into something concrete and useful.'
                : 'Tutt\'ora continuo a studiare, sperimentare e confrontare approcci diversi di tecnica vocale, cercando di capire che cosa funzioni davvero e come trasformare tutto quello che imparo in qualcosa di utile e concreto.'}
            </p>
          </div>
        </div>
      </div>

      {/* Sezione Attività & Insegnamento + Studi & Formazione: Larga a schermo */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Attività & Insegnamento */}
          <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-slate-200 space-y-3">
            <p className="font-bold text-sky-300 flex items-center gap-2 text-base">
              <Heart className="w-5 h-5 text-sky-400" /> {isEn ? 'Activities & Teaching:' : 'Attività & Insegnamento:'}
            </p>
            <p className="text-sm sm:text-base leading-relaxed">{isEn ? 'Online & In-person Vocal Coach in Sardinia since 2021.' : 'Vocal Coach Online e in Sardegna dal 2021.'}</p>
            <p className="text-sm sm:text-base leading-relaxed">{isEn ? 'Modern Singing Teacher for children & adults in private & civic music schools.' : 'Docente di Canto Moderno per bambini e adulti in scuole civiche e private.'}</p>
          </div>

          {/* Menu a scomparsa: Studi & Formazione */}
          <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-slate-200 space-y-3">
            <button
              type="button"
              onClick={() => setIsStudiOpen(!isStudiOpen)}
              className="w-full flex items-center justify-between font-bold text-sky-300 text-base cursor-pointer select-none group"
            >
              <span className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sky-400" /> {isEn ? 'Studies & Training:' : 'Studi & Formazione:'}
              </span>
              <span className="flex items-center gap-1 text-xs font-medium text-slate-400 group-hover:text-sky-300 transition-colors">
                {isStudiOpen ? (isEn ? 'Hide details' : 'Nascondi dettagli') : (isEn ? 'Show details' : 'Mostra dettagli')}
                <ChevronDown className={`w-4 h-4 text-sky-400 transition-transform duration-200 ${isStudiOpen ? 'rotate-180' : ''}`} />
              </span>
            </button>
            
            {/* Quando la tendina è chiusa, mostra comunque i titoli delle sezioni */}
            {!isStudiOpen && (
              <div className="pt-2.5 border-t border-slate-700/50 space-y-1.5 text-xs sm:text-sm text-slate-300 animate-fadeIn">
                <div className="flex items-center gap-2 text-slate-200 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0"></span>
                  <span>{isEn ? 'Pre-Academic Training' : 'Formazione pre-accademica'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-200 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                  <span>{isEn ? 'Bachelor\'s Degree in Jazz Singing (110/110)' : 'Laurea Triennale in Canto Jazz (110/110)'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-200 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></span>
                  <span>{isEn ? 'Continuous Training' : 'Formazione Continua'}</span>
                </div>
              </div>
            )}

            {/* Quando la tendina è aperta, mostra tutti i dettagli completi */}
            {isStudiOpen && (
              <div className="pt-3 border-t border-slate-700/60 space-y-3 text-slate-200 animate-fadeIn">
                <div className="space-y-1">
                  <p className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                    {isEn ? 'Pre-Academic Training' : 'Formazione pre-accademica'}
                  </p>
                  <ul className="list-disc list-inside text-slate-300 space-y-0.5 text-xs pl-2">
                    <li>{isEn ? 'Classical Guitar 2008' : 'Chitarra classica 2008'}</li>
                    <li>{isEn ? 'Drums 2010' : 'Batteria 2010'}</li>
                    <li>{isEn ? 'Singing 2010' : 'Canto 2010'}</li>
                  </ul>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-700/50">
                  <p className="font-bold text-white text-xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    {isEn ? 'Bachelor\'s Degree in Jazz Singing (2016 - 2019)' : 'Laurea Triennale in Canto Jazz (2016 - 2019)'}
                  </p>
                  <p className="text-slate-300 text-xs pl-2">Conservatorio di Musica "G.P. da Palestrina" Cagliari</p>
                  <p className="text-sky-400 font-bold text-xs pl-2">{isEn ? 'Grade: 110/110 with Honors' : 'Votazione: 110/110'}</p>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-700/50">
                  <p className="font-bold text-white text-xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                    {isEn ? 'Continuous Training:' : 'Formazione Continua:'}
                  </p>
                  <p className="text-slate-300 text-xs leading-relaxed pl-2">
                    {isEn
                      ? 'Masterclasses and certified training in SOVT techniques, voice recovery, vocal acoustics, and modern voice pedagogies.'
                      : 'Masterclass e percorsi certificati su tecniche SOVT, riabilitazione della voce artistica, acustica vocale e pedagogie del canto moderno.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3 Riquadri Piccolini delle pietre miliari SOTTO Studi & Formazione - Larga a schermo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center pt-2">
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-sky-400/40 shadow-md space-y-1">
            <span className="text-2xl font-black text-sky-300">2008</span>
            <p className="text-xs text-slate-200 font-bold leading-tight">
              {isEn ? 'Started studying' : 'Inizio studi'}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-cyan-400/40 shadow-md space-y-1">
            <span className="text-2xl font-black text-cyan-300">2019</span>
            <p className="text-xs text-slate-200 font-bold leading-tight">
              {isEn ? 'Conservatory Degree' : 'Laurea Conservatorio'}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-indigo-400/40 shadow-md space-y-1">
            <span className="text-2xl font-black text-indigo-300">2021</span>
            <p className="text-xs text-slate-200 font-bold leading-tight">
              {isEn ? 'Vocal Coaching' : 'Vocal Coaching'}
            </p>
          </div>
        </div>
      </div>

      {/* Point 11: Sezione "I miei corsi" con Slideshow foto a SINISTRA sfumato e testo a DESTRA */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-sky-500/30 shadow-2xl min-h-[460px] flex items-center justify-end group">
        {/* Slideshow foto sulla SINISTRA con sfumatura morbida verso DESTRA (senza bordi rigidi) */}
        <div className="absolute left-0 top-0 bottom-0 w-full sm:w-3/5 lg:w-1/2 h-full overflow-hidden select-none">
          {SLIDESHOW_PHOTOS.map((photo, idx) => (
            <img
              key={idx}
              src={photo.src}
              alt={photo.alt}
              className={`absolute inset-0 w-full h-full object-cover ${photo.position || 'object-center'} transition-opacity duration-1000 ${
                idx === currentSlideIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
              }`}
              style={{
                maskImage: 'linear-gradient(to left, transparent 0%, rgba(0,0,0,0.4) 20%, rgba(0,0,0,0.85) 45%, black 70%)',
                WebkitMaskImage: 'linear-gradient(to left, transparent 0%, rgba(0,0,0,0.4) 20%, rgba(0,0,0,0.85) 45%, black 70%)'
              }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/francesca_originale.png';
              }}
            />
          ))}

          {/* Sfumatura di supporto verso destra per fusione continua col background */}
          <div className="absolute inset-0 bg-gradient-to-l from-slate-900 via-slate-900/60 to-transparent sm:via-slate-900/20 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent sm:hidden pointer-events-none" />

          {/* Navigation Arrows for manual control */}
          <button
            type="button"
            onClick={handlePrevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/70 hover:bg-slate-900 text-white border border-slate-700/80 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xl z-20"
            title="Foto precedente"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleNextSlide}
            className="absolute right-4 sm:right-auto sm:left-[calc(100%-4rem)] top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/70 hover:bg-slate-900 text-white border border-slate-700/80 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xl z-20"
            title="Foto successiva"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indicator dots at bottom (senza numero 1/14) */}
          <div className="absolute bottom-4 left-0 right-0 sm:right-auto sm:w-full flex flex-col items-center justify-center gap-1.5 z-20 px-4">
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {SLIDESHOW_PHOTOS.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => setCurrentSlideIndex(dotIdx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    dotIdx === currentSlideIndex
                      ? 'w-5 bg-sky-400 shadow-md shadow-sky-400/50'
                      : 'w-1.5 bg-white/50 hover:bg-white'
                  }`}
                  aria-label={`Go to slide ${dotIdx + 1}`}
                />
              ))}
            </div>

            {SLIDESHOW_PHOTOS[currentSlideIndex].credit && (
              <p className="text-[11px] text-slate-300 drop-shadow italic text-center font-medium tracking-wide">
                {isEn ? SLIDESHOW_PHOTOS[currentSlideIndex].creditEn : SLIDESHOW_PHOTOS[currentSlideIndex].credit}
              </p>
            )}
          </div>
        </div>

        {/* Paragrafo di testo sulla DESTRA + Pulsante "Vai al mio sito" */}
        <div className="relative z-10 p-6 sm:p-10 lg:p-12 max-w-full sm:max-w-xl lg:max-w-2xl ml-auto space-y-6 text-left">
          <h3 className="text-2xl sm:text-4xl font-black text-white leading-snug">
            {isEn ? 'My courses' : 'I miei corsi'}
          </h3>

          <p className="text-slate-200 text-base sm:text-lg leading-relaxed font-medium drop-shadow-sm">
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

      {/* Point 6 & 7: "Perché ho creato Echora" con Titolo posizionato ESATTAMENTE sulla sfumatura tra il blu e l'immagine */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-sky-500/30 shadow-2xl p-6 sm:p-10 space-y-8">
        
        {/* Banner copertina con Titolo adagiato proprio sulla sfumatura lenta tra lo sfondo blu e la foto */}
        <div className="relative -mx-6 sm:-mx-10 -mt-6 sm:-mt-10 w-[calc(100%+3rem)] sm:w-[calc(100%+5rem)] h-80 sm:h-96 md:h-[420px] lg:h-[480px] overflow-hidden select-none">
          <img
            src={slide9_claudia38}
            alt="Francesca - Perché ho creato Echora"
            className="w-full h-full object-cover object-[50%_25%]"
            style={{
              maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.15) 10%, rgba(0,0,0,0.45) 25%, rgba(0,0,0,0.85) 45%, black 65%, black 80%, rgba(0,0,0,0.6) 90%, transparent 100%), linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 4%, black 15%, black 85%, rgba(0,0,0,0.4) 96%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.15) 10%, rgba(0,0,0,0.45) 25%, rgba(0,0,0,0.85) 45%, black 65%, black 80%, rgba(0,0,0,0.6) 90%, transparent 100%), linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 4%, black 15%, black 85%, rgba(0,0,0,0.4) 96%, transparent 100%)',
              maskComposite: 'intersect',
              WebkitMaskComposite: 'destination-in'
            }}
          />

          {/* Sfumatura morbida di supporto dall'alto per fusione lenta e vellutata col blu slate-900 */}
          <div className="absolute inset-x-0 top-0 h-44 sm:h-52 bg-gradient-to-b from-slate-900 via-slate-900/60 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent pointer-events-none" />

          {/* TITOLO: posizionato esattamente sulla porzione in cui si sfuma lentamente fra il blu e l'immagine */}
          <div className="absolute top-8 sm:top-14 inset-x-0 px-4 text-center z-10 pointer-events-none">
            <h3 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
              <span>{isEn ? 'Why I Created Echora' : 'Perché ho creato Echora'}</span>
            </h3>
          </div>

          {/* Credito foto discreto in basso a destra */}
          <div className="absolute bottom-3 right-6 sm:right-10 z-10">
            <span className="text-[11px] text-slate-200 italic font-medium drop-shadow-md bg-slate-950/60 px-2.5 py-1 rounded-md backdrop-blur-xs">
              {isEn ? 'Photography by Claudia Bozzato' : 'Fotografia di Claudia Bozzato'}
            </span>
          </div>
        </div>

        {/* Testo narrativo SOTTO */}
        <div className="max-w-4xl mx-auto space-y-4 text-slate-200 text-sm sm:text-base leading-relaxed pt-1">
          <p className="drop-shadow-sm">
            Quando ho iniziato a prendere lezioni di canto mi sono trovata disorientata davanti alla mia voce. Nonostante avessi un'insegnante che mi seguiva non sapevo quali esercizi fare a casa, come farli, per quanto tempo e soprattutto se li si stavo facendo nel modo giusto.
          </p>

          <p className="drop-shadow-sm">
            Ecco perchè fin dall'inizio del mio lavoro come insegnante ho dato dei materiali ai miei studenti per capire meglio cosa fare a casa e far sì che capissero la loro voce e diventassero indipendenti.
          </p>

          <p className="drop-shadow-sm">
            Con il tempo poi mi sono resa conto che queste registrazioni potevano diventare qualcosa di più...
          </p>

          <div className="p-4 sm:p-5 rounded-2xl bg-sky-950/40 border border-sky-500/30">
            <p className="font-bold text-sky-200 text-base sm:text-lg">
              Ed è così che è nato Echora: un luogo in cui raccogliere gli esercizi che facciamo a lezione e trasformarli in un'esperienza di studio il più semplice possibile e guidata!
            </p>
          </div>
        </div>
      </div>

      {/* Point 8: Sezione “Ci pensa Echora a guidarti!” con Titolo DENTRO il pannello */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-sky-950/40 border border-sky-400/40 hover:border-sky-400/70 rounded-3xl p-6 sm:p-10 shadow-2xl max-w-6xl mx-auto space-y-8 transition-all">
        {/* Titolo DENTRO il pannello */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            {isEn ? 'Echora takes care of guiding you!' : 'Ci pensa Echora a guidarti!'}
          </h2>
        </div>

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
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border border-sky-500/40 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6 text-center sm:text-left">
          <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden border-2 border-sky-400/40 shadow-xl shrink-0 bg-slate-950 group">
            <img
              src={studiaCantaImg}
              alt={isEn ? 'Study & Sing with me' : 'Studia e Canta con me'}
              className="w-full h-full object-cover object-[50%_40%] group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>{isEn ? 'Lessons & Workshops' : 'Lezioni & Laboratori'}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">
              {isEn ? 'Study & Sing with me!' : 'Studia e Canta con me!'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              {isEn
                ? "Echora does not replace 1:1 lessons but supports your practice between sessions. If you need guidance, you can take lessons with me! Discover all course and workshop info on my website!"
                : "Echora non sostituisce la lezione 1:1 ma ti è da supporto per lo studio fra una lezione e l'altra. Se hai bisogno di una guida, puoi prendere lezioni insieme a me! Scopri tutte le info sui corsi di canto e altri laboratori in presenza e onine, sul mio sito!"}
            </p>
          </div>
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
