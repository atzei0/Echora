import React from 'react';
import { Sparkles, Check, X, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string | null;
  onNavigateToPricing: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  message,
  onNavigateToPricing,
}) => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
      <div 
        className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-sky-400/50 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 space-y-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow backdrop accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800/80 transition-colors cursor-pointer"
          aria-label="Chiudi popup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-3 pt-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-sky-500/20 via-cyan-500/20 to-indigo-500/20 border border-sky-400/50 flex items-center justify-center text-sky-400 shadow-lg shadow-sky-500/20">
            <Sparkles className="w-7 h-7 text-sky-400" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {isEn ? 'Choose Your Echora Subscription' : 'Scegli il tuo abbonamento Echora'}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            {message || (isEn
              ? 'To unlock this exercise, advanced patterns, and guided routines, choose one of Echora\'s flexible plans.'
              : 'Per accedere a questo esercizio, agli arpeggi avanzati e alle routine guidate, scegli uno dei piani di abbonamento Echora.')}
          </p>
        </div>

        {/* Two Mini Plan Previews */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {/* Mensile */}
          <div className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isEn ? 'Monthly Plan' : 'Piano Mensile'}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white">5,00 €</span>
                <span className="text-xs text-slate-400">/ {isEn ? 'month' : 'mese'}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              {isEn ? 'Flexible, cancel anytime with one click.' : 'Flessibile, disdici quando vuoi con un click.'}
            </p>
          </div>

          {/* Annuale */}
          <div className="bg-gradient-to-b from-sky-950/50 to-slate-950/80 border border-sky-400/60 rounded-2xl p-4 space-y-2 relative flex flex-col justify-between">
            <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-sky-400 to-cyan-400 text-slate-950 font-black text-[9px] uppercase tracking-wider">
              {isEn ? '2 MONTHS FOR €0!' : 'DUE MESI A 0€!'}
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-sky-300 uppercase tracking-wider">
                {isEn ? 'Annual Plan' : 'Piano Annuale'}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white">50,00 €</span>
                <span className="text-xs text-sky-300 font-medium">/ {isEn ? 'year' : 'anno'}</span>
              </div>
            </div>
            <p className="text-[11px] text-sky-200/80 leading-tight">
              {isEn ? 'Pay today and forget about it for the year.' : 'Lo paghi oggi e te ne dimentichi per tutto l\'anno.'}
            </p>
          </div>
        </div>

        {/* Free Content Reminder Callout */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            {isEn
              ? 'Remember: Lip Thrill 12345, the Vocal Range Test, and the Pitch Tuner remain completely free for you.'
              : 'Ricorda: il Lip Thrill 12345, il Test dell\'Estensione Vocale e il Test dell\'Intonazione rimangono sempre gratuiti per te.'}
          </span>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={onNavigateToPricing}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-sm shadow-xl shadow-sky-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <span>{isEn ? 'View Plans & Subscribe' : 'Scegli il tuo abbonamento'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            {isEn ? 'Continue exploring free content' : 'Continua a esplorare i contenuti gratuiti'}
          </button>
        </div>
      </div>
    </div>
  );
};
