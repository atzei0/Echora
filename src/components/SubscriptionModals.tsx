import React from 'react';
import { Calendar, AlertTriangle, CheckCircle2, RefreshCw, X, ShieldCheck } from 'lucide-react';

export const formatSubscriptionPlanName = (plan?: string | null): string => {
  if (plan === 'monthly') return 'Abbonamento Echora — Mensile';
  if (plan === 'annual') return 'Abbonamento Echora — Annuale';
  if (plan === 'quarterly') return 'Abbonamento Echora — Trimestrale';
  if (plan === 'trial') return 'Abbonamento Echora — Prova';
  if (plan === 'coach_unlimited') return 'Accesso Coach Autorizzato';
  return 'Abbonamento Echora';
};

export const formatPlanPriceLabel = (plan?: string | null): string => {
  if (plan === 'monthly') return '5,00 € / mese';
  if (plan === 'annual') return '50,00 € / anno';
  if (plan === 'quarterly') return '45,00 € / 3 mesi';
  return '—';
};

export const formatEuroCents = (cents?: number | null): string => {
  if (typeof cents !== 'number' || Number.isNaN(cents)) return '—';
  return (cents / 100).toLocaleString('it-IT', {
    style: 'currency',
    currency: 'EUR',
  });
};

export const formatDateIt = (iso?: string | null): string => {
  if (!iso) return 'Non disponibile';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Non disponibile';
  return d.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Rome',
  });
};

interface PlanSwitchConfirmModalProps {
  isOpen: boolean;
  currentPlan?: string | null;
  targetPlan: 'monthly' | 'annual';
  currentPeriodEnd?: string | null;
  hasActiveDiscountOrUncertain?: boolean;
  isSubmitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const PlanSwitchConfirmModal: React.FC<PlanSwitchConfirmModalProps> = ({
  isOpen,
  currentPlan,
  targetPlan,
  currentPeriodEnd,
  hasActiveDiscountOrUncertain = false,
  isSubmitting,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  const endDateStr = formatDateIt(currentPeriodEnd);
  const targetAmountStr = hasActiveDiscountOrUncertain
    ? 'Importo da verificare (eventuale sconto ricorrente applicato)'
    : targetPlan === 'annual'
      ? '50,00 €'
      : '5,00 €';
  const targetPriceSummary = hasActiveDiscountOrUncertain
    ? 'Importo da verificare (listino ' + (targetPlan === 'annual' ? '50,00 € / anno' : '5,00 € / mese') + ')'
    : targetPlan === 'annual'
      ? '50,00 € / anno'
      : '5,00 € / mese';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
      onClick={() => !isSubmitting && onClose()}
    >
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-sky-400/60 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
          aria-label="Chiudi finestra"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3.5 pr-6">
          <div className="w-11 h-11 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">
              Conferma Cambio Piano
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Il cambio verrà programmato alla scadenza del periodo già pagato, senza alcun addebito immediato e senza creare un secondo abbonamento.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400">Piano attuale attivo:</span>
            <strong className="text-white text-right">{formatSubscriptionPlanName(currentPlan)}</strong>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400">Scadenza periodo già pagato:</span>
            <strong className="text-white">{endDateStr}</strong>
          </div>
          <div className="border-t border-slate-800 pt-2.5 flex items-center justify-between gap-2">
            <span className="text-slate-400">Nuovo piano selezionato:</span>
            <strong className="text-sky-300 text-right">{formatSubscriptionPlanName(targetPlan)}</strong>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400">Data di attivazione nuovo piano:</span>
            <strong className="text-emerald-300">{endDateStr}</strong>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400">Data dell&apos;addebito:</span>
            <strong className="text-white">{endDateStr}</strong>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400">Importo alla data di attivazione:</span>
            <strong className="text-sky-300">{targetPriceSummary}</strong>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
            <span className="text-slate-400">Addebito immediato oggi:</span>
            <strong className="text-emerald-400">0,00 €</strong>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-200 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Il tuo {formatSubscriptionPlanName(currentPlan)} resterà attivo fino al <strong>{endDateStr}</strong>. Solo a partire dal <strong>{endDateStr}</strong> inizierà {formatSubscriptionPlanName(targetPlan)} con addebito di <strong>{targetAmountStr}</strong>.
          </span>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            <span>Conferma cambio piano</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface CancelRenewalConfirmModalProps {
  isOpen: boolean;
  currentPlan?: string | null;
  currentPeriodEnd?: string | null;
  isSubmitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const CancelRenewalConfirmModal: React.FC<CancelRenewalConfirmModalProps> = ({
  isOpen,
  currentPlan,
  currentPeriodEnd,
  isSubmitting,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  const endDateStr = formatDateIt(currentPeriodEnd);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
      onClick={() => !isSubmitting && onClose()}
    >
      <div
        className="relative w-full max-w-md bg-slate-900 border border-amber-400/60 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
          aria-label="Chiudi finestra"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3.5 pr-6">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">
              Conferma Annullamento Rinnovo
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Stai per disattivare il rinnovo automatico per <strong>{formatSubscriptionPlanName(currentPlan)}</strong>.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2 text-xs text-slate-300 leading-relaxed">
          <p>
            • Il tuo abbonamento e tutte le funzionalità incluse resteranno regolarmente attivi fino al <strong className="text-white">{endDateStr}</strong>.
          </p>
          <p>
            • Alla data del <strong className="text-white">{endDateStr}</strong> l&apos;abbonamento terminerà automaticamente.
          </p>
          <p>
            • <strong className="text-emerald-300">Nessun altro addebito verrà effettuato</strong> su Stripe.
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            Mantieni rinnovo
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
            <span>Conferma annullamento</span>
          </button>
        </div>
      </div>
    </div>
  );
};
