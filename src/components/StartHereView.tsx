import React from 'react';
import { NoteNotation, VocalRangeProfile } from '../types';
import {
  Sparkles,
  Activity,
  ArrowRight,
  Flame,
  Heart,
  Lightbulb,
  ExternalLink,
  BookOpen,
  Sliders
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import francescaImg from '../assets/images/Documentazione Francesca Atzei x Claudia Bozzato-25.jpg';
import studiaCantaImg from '../assets/images/IMG_8169.jpg';

interface StartHereViewProps {
  notation: NoteNotation;
  vocalProfile: VocalRangeProfile | null;
  onSaveProfile: (profile: VocalRangeProfile) => void;
  onNavigate: (tab: string, subTool?: 'range' | 'tuner' | 'breathing' | 'routine' | 'tempo', fromLabel?: string) => void;
  activeSubTool?: 'range' | 'tuner' | 'breathing' | 'routine' | 'tempo';
  onSubToolChange?: (subTool: 'range' | 'tuner' | 'breathing' | 'routine' | 'tempo') => void;
}

export const StartHereView: React.FC<StartHereViewProps> = ({
  onNavigate,
}) => {
  const { t, language } = useLanguage();
  const isEn = language === 'en';

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 pb-20 space-y-12 sm:space-y-16">
      {/* Header Banner & Hero */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-cyan-950 border-b border-sky-400/70 py-8 sm:py-12 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Animated Hero Title */}
          <div className="overflow-hidden">
            <h1
              className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight animate-[fadeIn_0.9s_ease-out_forwards] transform transition-all duration-700"
              style={{ fontFamily: "'Amita', cursive, serif" }}
            >
              {isEn ? 'Welcome to Echora!' : 'Benvenutə in Echora!'}
            </h1>
          </div>

          {/* Welcome Text Block */}
          <div className="bg-slate-900/80 border border-sky-400/40 rounded-2xl sm:rounded-3xl p-5 sm:p-8 space-y-4 shadow-xl backdrop-blur-sm">
            <p className="text-xs sm:text-base text-slate-200 font-medium leading-relaxed">
              {t('welcomeP1')}
            </p>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t('welcomeP2')}
            </p>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t('welcomeP3')}
            </p>

            <div className="pt-3 border-t border-slate-800/80 space-y-1">
              <p className="text-xs sm:text-base font-extrabold text-sky-300">
                {t('welcomeP4')}
              </p>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {t('welcomeP5')}
              </p>
            </div>
          </div>

          {/* Sezione “Chi sono” nella Home */}
          <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-sky-500/30 hover:border-sky-400/60 transition-all rounded-3xl p-6 sm:p-10 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Testo a sinistra */}
              <div className="lg:col-span-7 space-y-4 text-left">
                <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-300 text-xs font-bold uppercase tracking-wider">
                  <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                  <span>{isEn ? 'About Me' : 'Chi sono'}</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl sm:text-3xl font-black text-white">
                    {isEn ? 'Hi! I\'m Francesca.' : 'Ciao! Sono Francesca.'}
                  </h3>
                  <p className="text-sky-300 font-bold text-sm sm:text-base">
                    {isEn
                      ? 'I am a Singer-Songwriter, Vocal Coach and Content Creator.'
                      : 'Sono una Cantautrice, Vocal Coach e Content Creator.'}
                  </p>
                </div>

                <div className="space-y-3 text-slate-300 text-xs sm:text-sm leading-relaxed">
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

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('about')}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-sky-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <span>{isEn ? 'More about me...' : 'Altro su di me...'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Foto sulla destra */}
              <div className="lg:col-span-5 flex justify-center lg:justify-end">
                <div className="relative group max-w-xs sm:max-w-sm w-full">
                  <div className="absolute -inset-1.5 bg-gradient-to-tr from-sky-500 via-cyan-400 to-indigo-500 rounded-3xl blur-md opacity-40 group-hover:opacity-75 transition duration-500"></div>
                  <div className="relative rounded-3xl overflow-hidden border-2 border-sky-400/50 shadow-2xl bg-slate-950 aspect-[4/5]">
                    <img
                      src={francescaImg}
                      alt="Francesca Vocal Coach"
                      className="w-full h-full object-cover object-[50%_25%] group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400/80 italic text-center mt-2.5 font-medium tracking-wide">
                    {isEn ? 'Photo by Claudia Bozzato' : 'Fotografia di Claudia Bozzato'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Come usare Echora per la mia voce? */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 space-y-6 shadow-2xl">
            <div className="border-b border-slate-800 pb-4 space-y-1">
              <h2 className="text-xl sm:text-3xl font-black text-white">
                {isEn ? 'How to use Echora for my voice?' : 'Come usare Echora per la mia voce?'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                {t('structureSubtitle')}
              </p>
            </div>

            {/* 4 Phases & Tools Grid — stesso stile grafico e stesso tipo di riquadri */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
              {/* Phase 1: Riscaldamento */}
              <div className="bg-slate-950/80 border border-[#fa83b5]/40 rounded-2xl p-5 space-y-4 hover:border-[#fa83b5]/80 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-[#fa83b5]">
                    <Flame className="w-5 h-5 text-[#fa83b5]" />
                    <h3 className="text-lg font-black text-white">{t('phase1Title')}</h3>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {t('phase1Desc1')}
                  </p>
                  <p className="text-xs font-bold text-pink-300 bg-pink-950/30 p-2.5 rounded-xl border border-pink-800/40">
                    {t('phase1Desc2')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('exercises')}
                  className="w-full mt-4 py-2.5 rounded-xl bg-[#fa83b5]/30 hover:bg-[#fa83b5] text-pink-100 hover:text-white border border-[#fa83b5]/50 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{t('step1Btn')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Phase 2: Allenamento */}
              <div className="bg-slate-950/80 border border-cyan-500/30 rounded-2xl p-5 space-y-4 hover:border-cyan-400/60 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-cyan-400">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-lg font-black text-white">{t('phase2Title')}</h3>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                    {t('phase2Desc')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('workout')}
                  className="w-full mt-4 py-2.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600 text-cyan-200 hover:text-white border border-cyan-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{t('step2Btn')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Phase 3: Defaticamento */}
              <div className="bg-slate-950/80 border border-[#34D399]/40 rounded-2xl p-5 space-y-4 hover:border-[#34D399]/80 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-[#34D399]">
                    <Heart className="w-5 h-5 text-[#34D399]" />
                    <h3 className="text-lg font-black text-white">{t('phase3Title')}</h3>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                    {t('phase3Desc1')}
                  </p>
                  <p className="text-xs font-bold text-emerald-300 bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-800/40">
                    {t('phase3Desc2')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('cooldown')}
                  className="w-full mt-4 py-2.5 rounded-xl bg-[#34D399]/30 hover:bg-[#34D399] text-emerald-100 hover:text-slate-950 border border-[#34D399]/50 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{t('step3Btn')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Riquadro 4: Altri strumenti che puoi usare in Echora (stesso stile grafico) */}
              <div className="bg-slate-950/80 border border-sky-400/40 rounded-2xl p-5 space-y-4 hover:border-sky-400/80 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sky-400">
                    <Sliders className="w-5 h-5 text-sky-400" />
                    <h3 className="text-lg font-black text-white">
                      {isEn ? 'Other tools you can use in Echora' : 'Altri strumenti che puoi usare in Echora'}
                    </h3>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
                    <li className="flex items-start gap-1.5">
                      <span className="text-sky-400 font-bold">•</span>
                      <span>
                        <strong className="text-white">{isEn ? 'Range: ' : 'Estensione: '}</strong>
                        {isEn
                          ? 'test your vocal range to calibrate your exercises or just out of curiosity and to see your progress over time'
                          : 'testa la tua estensione vocale per regolarti con gli esercizi o solo per curiosità e per vedere i tuoi progressi nel tempo'}
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-sky-400 font-bold">•</span>
                      <span>
                        <strong className="text-white">{isEn ? 'Pitch: ' : 'Intonazione: '}</strong>
                        {isEn ? 'games to test and train your intonation' : 'giochi per testare e allenare l\'intonazione'}
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-sky-400 font-bold">•</span>
                      <span>
                        <strong className="text-white">{isEn ? 'Breathing: ' : 'Respirazione: '}</strong>
                        {isEn ? 'well, this one speaks for itself' : 'beh, si spiega da sè questo'}
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-sky-400 font-bold">•</span>
                      <span>
                        <strong className="text-white">{isEn ? 'Tempo: ' : 'Tempo: '}</strong>
                        {isEn ? 'games and exercises to improve your rhythm' : 'giochi ed esercizi per migliorare il ritmo'}
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-sky-400 font-bold">•</span>
                      <span>
                        <strong className="text-white">{isEn ? 'Routine Generator: ' : 'Generatore di routine: '}</strong>
                        {isEn
                          ? 'choose your goals and you will be assigned an exercise routine curated by me, or select your favorite exercises from Echora and save them in a preset so you always have them ready'
                          : 'scegli i tuoi obiettivi e ti verrà assegnata una routine di esercizi selezionata da me, oppure seleziona i tuoi esercizi preferiti da Echora e salvali in un preset in modo da averceli sempre pronti'}
                      </span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('tools', 'range')}
                  className="w-full mt-4 py-2.5 rounded-xl bg-sky-500/30 hover:bg-sky-500 text-sky-100 hover:text-white border border-sky-500/50 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{isEn ? 'Go to other Tools' : 'Vai agli altri Strumenti'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Il consiglio più importante — Piccolo, sobrio, colori discreti e senza 100 colori */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-left space-y-2 max-w-4xl mx-auto shadow-md">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs sm:text-sm">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{t('goldenAdviceTitle')}</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t('goldenAdviceP1')}
            </p>

            <p className="text-xs text-slate-400 leading-relaxed">
              {t('goldenAdviceP3')}
            </p>
          </div>
        </div>
      </div>

      {/* Banner: “Studia e Canta con me!” */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
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
      </div>
    </div>
  );
};

