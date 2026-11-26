import React, { useState, useEffect } from 'react';
import { Check, Sparkles, ShieldCheck, Zap, Lock, ArrowRight, RefreshCw, CheckCircle2, AlertCircle, Calendar, XCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { isTrustedStripeRedirectUrl } from '../utils/validation';

type PlanType = 'trial' | 'monthly' | 'quarterly' | 'annual' | 'test';

const formatPlanLabel = (plan?: string | null): string => {
  if (plan === 'monthly') return 'Mensile (5,00 € / mese)';
  if (plan === 'annual') return 'Annuale (50,00 € / anno)';
  if (plan === 'quarterly') return 'Trimestrale';
  if (plan === 'trial') return 'Prova';
  if (plan === 'coach_unlimited') return 'Coach Illimitato';
  return plan || 'Pro';
};

const formatEuroCents = (cents?: number | null): string => {
  if (typeof cents !== 'number' || Number.isNaN(cents)) return '—';
  return (cents / 100).toLocaleString('it-IT', {
    style: 'currency',
    currency: 'EUR',
  });
};

const formatDateIt = (iso?: string | null): string => {
  if (!iso) return 'Rinnovo Automatico';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Rinnovo Automatico';
  return d.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

interface SubscriptionsViewProps {
  onNavigate: (tab: string) => void;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({ onNavigate }) => {
  const { t, language } = useLanguage();
  const { user, isCoach, isSubscribed, openAuthModal, refreshSubscriptionStatus } = useAuth();

  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null);
  const [cancelingPending, setCancelingPending] = useState<boolean>(false);
  const [openingPortal, setOpeningPortal] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<boolean>(false);

  useEffect(() => {
    const handleHashChange = async () => {
      const hash = window.location.hash;
      const search = window.location.search;
      const hasSessionId = hash.includes('session_id=') || search.includes('session_id=');
      const isPendingCheckout = sessionStorage.getItem('echora_pending_checkout') === 'true';

      // Only show banner if user actively initiated checkout in this browser session AND returned with session_id
      if (isPendingCheckout && hasSessionId) {
        sessionStorage.removeItem('echora_pending_checkout');
        setSuccessBanner(true);
        if (user?.id) {
          await refreshSubscriptionStatus(true).catch(() => null);
        }
      } else {
        setSuccessBanner(false);
      }

      // Always clean up residual URL parameters/hash from browser bar
      if (hasSessionId || hash.includes('payment-')) {
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [user?.id]);

  const handleInitiateCheckout = async (plan: PlanType) => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    setLoadingPlan(plan);
    setCheckoutError(null);
    setActionSuccessMessage(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('Sessione di autenticazione scaduta o non valida. Effettua nuovamente il login.');
      }

      sessionStorage.setItem('echora_pending_checkout', 'true');

      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan,
        })
      });

      const data = await res.json();

      if (!res.ok) {
        sessionStorage.removeItem('echora_pending_checkout');
        throw new Error(data.error || 'Errore durante la creazione della sessione Stripe Checkout');
      }

      if (data.scheduled) {
        sessionStorage.removeItem('echora_pending_checkout');
        await refreshSubscriptionStatus(true);
        setActionSuccessMessage(
          data.message ||
            `Cambio piano verso ${formatPlanLabel(data.pendingPlan)} programmato per il ${formatDateIt(data.pendingPlanStartsAt)}. Nessun addebito immediato.`
        );
        return;
      }

      if (data.url && isTrustedStripeRedirectUrl(data.url)) {
        const isIframe = window.self !== window.top;
        if (isIframe) {
          window.open(data.url, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = data.url;
        }
      } else {
        sessionStorage.removeItem('echora_pending_checkout');
        throw new Error('URL di reindirizzamento Stripe non valido o non restituito dal server.');
      }
    } catch (err: any) {
      console.error('Errore Checkout Stripe:', err);
      sessionStorage.removeItem('echora_pending_checkout');
      setCheckoutError(err.message || 'Impossibile avviare il pagamento con Stripe.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleSchedulePlanChange = async (newPlan: 'monthly' | 'annual') => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    setLoadingPlan(newPlan);
    setCheckoutError(null);
    setActionSuccessMessage(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('Sessione di autenticazione scaduta o non valida. Effettua nuovamente il login.');
      }

      const res = await fetch('/api/schedule-plan-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: newPlan }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Impossibile programmare il cambio piano.');
      }

      await refreshSubscriptionStatus(true);
      setActionSuccessMessage(
        data.message ||
          `Cambio al piano ${formatPlanLabel(newPlan)} programmato per il ${formatDateIt(data.pendingPlanStartsAt)}. Nessun addebito immediato.`
      );
    } catch (err: any) {
      console.error('Errore programmazione cambio piano:', err);
      setCheckoutError(err.message || 'Errore durante la programmazione del cambio piano.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleCancelScheduledChange = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    setCancelingPending(true);
    setCheckoutError(null);
    setActionSuccessMessage(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('Sessione di autenticazione scaduta o non valida. Effettua nuovamente il login.');
      }

      const res = await fetch('/api/cancel-scheduled-plan-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Impossibile annullare il cambio piano programmato.');
      }

      await refreshSubscriptionStatus(true);
      setActionSuccessMessage(
        data.message || 'Cambio piano programmato annullato. Il tuo abbonamento attuale rimane regolarmente attivo.'
      );
    } catch (err: any) {
      console.error('Errore annullamento cambio piano:', err);
      setCheckoutError(err.message || 'Errore durante l\'annullamento del cambio programmato.');
    } finally {
      setCancelingPending(false);
    }
  };

  const handleOpenCustomerPortal = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    setOpeningPortal(true);
    setCheckoutError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('Sessione di autenticazione scaduta.');
      }
      const res = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Impossibile aprire il portale clienti Stripe.');
      }
      if (data.url && isTrustedStripeRedirectUrl(data.url)) {
        const isIframe = window.self !== window.top;
        if (isIframe) {
          window.open(data.url, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = data.url;
        }
      }
    } catch (err: any) {
      setCheckoutError(err.message || 'Errore durante l\'apertura del portale Stripe.');
    } finally {
      setOpeningPortal(false);
    }
  };

  const isUserPremium = !isCoach && isSubscribed;
  const currentPlanKey = user?.subscriptionPlan;
  const pendingPlanKey = user?.pendingPlan || null;
  const isPaymentPastDue =
    !isCoach &&
    (user?.subscriptionStatus === 'past_due' ||
      user?.subscriptionStatus === 'incomplete' ||
      user?.subscriptionStatus === 'unpaid');
  const nextChargeDisplay = user?.cancelAtPeriodEnd
    ? 'Nessun addebito (disdetta a fine periodo)'
    : typeof user?.nextChargeAmount === 'number'
      ? formatEuroCents(user.nextChargeAmount)
      : pendingPlanKey === 'annual'
        ? '50,00 €'
        : pendingPlanKey === 'monthly'
          ? '5,00 €'
          : currentPlanKey === 'annual'
            ? '50,00 €'
            : currentPlanKey === 'monthly'
              ? '5,00 €'
              : '—';

  return (
    <div className="min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* COACH AUTHORIZED ACCESS BANNER */}
      {isCoach && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/90 via-indigo-950/90 to-slate-900 border-2 border-purple-400/80 text-purple-100 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/50 flex items-center justify-center text-purple-300 flex-shrink-0">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-wider mb-1">
                <span>Account Coach Autorizzato — Accesso Illimitato Verificato</span>
              </div>
              <h3 className="text-xl font-black text-white">
                Accesso Completo Coach Echora Attivo
              </h3>
              <p className="text-xs text-purple-200 mt-0.5">
                Account autorizzato: <strong className="text-white">{user?.email || 'francesca.atzei0@gmail.com'}</strong> —
                Stato: <strong className="text-purple-300">Accesso Completo Senza Abbonamento</strong>
              </p>
              <p className="text-[11px] text-purple-300/80 mt-1">
                Hai permessi completi per visualizzare, creare, modificare ed eliminare esercizi, registrazioni demo, routine personalizzate e testare liberamente ogni funzione.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('exercises')}
            className="px-6 py-3 rounded-2xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 flex-shrink-0"
          >
            <span>Accedi a tutti i Vocal Workout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* VERIFIED ACTIVE STUDENT SUBSCRIPTION BANNER */}
      {isUserPremium && (
        <div className="p-6 rounded-3xl bg-emerald-950/80 border-2 border-emerald-400/80 text-emerald-100 shadow-2xl space-y-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                  <span>Stato Verificato dal Server (Firebase / Stripe)</span>
                </div>
                <h3 className="text-xl font-black text-white">
                  Abbonamento Echora Pro Attivo
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-1 text-xs text-emerald-200 pt-1">
                  <p>
                    Piano attuale: <strong className="text-white">{formatPlanLabel(currentPlanKey)}</strong>
                  </p>
                  <p>
                    Valido fino al: <strong className="text-white">{formatDateIt(user?.subscriptionPeriodEnd)}</strong>
                  </p>
                  <p>
                    Prossimo addebito: <strong className="text-white">{nextChargeDisplay}</strong>
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('exercises')}
              className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer"
            >
              <span>Accedi a tutti i Vocal Workout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {pendingPlanKey && (
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-sky-400/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-black text-sky-300 uppercase tracking-wider text-[11px]">
                    Cambio Piano Programmato a Scadenza (Nessun Addebito Anticipato)
                  </p>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-slate-200">
                    <span>
                      Nuovo piano programmato: <strong className="text-white">{formatPlanLabel(pendingPlanKey)}</strong>
                    </span>
                    <span>
                      Data del cambio: <strong className="text-white">{formatDateIt(user?.pendingPlanStartsAt || user?.subscriptionPeriodEnd)}</strong>
                    </span>
                    <span>
                      Importo prossimo addebito: <strong className="text-sky-300">{formatEuroCents(user?.pendingPlanAmount ?? (pendingPlanKey === 'annual' ? 5000 : 500))}</strong>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Mantieni il tuo piano attuale ({formatPlanLabel(currentPlanKey)}) e l'accesso completo Pro fino alla data del cambio.
                  </p>
                </div>
              </div>

              <button
                onClick={handleCancelScheduledChange}
                disabled={cancelingPending}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50 flex-shrink-0 cursor-pointer"
              >
                {cancelingPending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>Annulla cambio programmato</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* PAYMENT FAILED / PAST DUE BANNER */}
      {isPaymentPastDue && (
        <div className="p-6 rounded-3xl bg-amber-950/80 border-2 border-amber-400/80 text-amber-100 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <AlertCircle className="w-7 h-7 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h3 className="text-lg font-black text-white">
                Pagamento del Rinnovo o Cambio Piano Non Riuscito
              </h3>
              <p className="text-amber-200">
                L'ultimo addebito automatico su Stripe risulta non riuscito (stato: <strong>{user?.subscriptionStatus}</strong>).
                {pendingPlanKey
                  ? ` Il passaggio al piano ${formatPlanLabel(pendingPlanKey)} non è stato completato per mancato pagamento.`
                  : ''}
              </p>
              <p className="text-amber-300/80">
                Aggiorna il metodo di pagamento nel portale Stripe per riattivare l'accesso Pro ed evitare la cancellazione definitiva.
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenCustomerPortal}
            disabled={openingPortal}
            className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 flex-shrink-0 disabled:opacity-50 cursor-pointer"
          >
            {openingPortal ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>Aggiorna Metodo di Pagamento</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* PAYMENT SUCCESS CONFIRMATION BANNER */}
      {successBanner && !isUserPremium && (
        <div className="p-6 rounded-3xl bg-blue-950/80 border border-blue-400/80 text-blue-100 shadow-2xl flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
            <div>
              <h3 className="text-lg font-black text-white">Conferma Pagamento in corso...</h3>
              <p className="text-xs text-blue-200">Stiamo aggiornando il tuo profilo tramite il Webhook Stripe. L'accesso verrà sbloccato tra pochi istanti.</p>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULED CHANGE ACTION CONFIRMATION */}
      {actionSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-100 text-xs font-semibold flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* ERROR NOTICE */}
      {checkoutError && (
        <div className="p-4 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs font-semibold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span>{checkoutError}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-300 text-xs font-bold tracking-wide uppercase">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span>{t('pricingTitle')}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight" style={{ fontSize: '44px' }}>
          {language === 'en' ? 'Choose the Perfect Plan for Your Voice' : 'Scegli il Piano Perfetto per la Tua Voce'}
        </h1>

        {/* Guarantees Callout */}
        <div className="inline-flex items-center justify-center space-x-2 bg-sky-950/60 border border-sky-800/60 px-4 py-2 rounded-2xl text-sky-200 text-xs sm:text-sm font-semibold">
          <Zap className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
          <span>Paga in sicurezza con Stripe — Carta, PayPal e Klarna (Paga in 3 rate)</span>
        </div>
      </div>

      {/* SUBSCRIPTION PLANS: MENSILE (5€) & ANNUALE (50€) */}
      <div className="space-y-6 pt-4 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          
          {/* 1. MONTHLY PLAN CARD */}
          <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xl relative group transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white">{t('monthlyPlan')}</h3>
                <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                  Flessibile
                </span>
              </div>

              <div className="flex items-baseline space-x-1">
                <span className="text-4xl font-black text-white">5,00 €</span>
                <span className="text-slate-400 text-xs font-semibold">/ mese</span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Addebito immediato di €5,00/mese. Rinnovo mensile automatico, disdici quando vuoi.
              </p>

              <div className="pt-4 border-t border-slate-800 space-y-3">
                <p className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  {language === 'en' ? 'Included in plan:' : 'Incluso nel piano:'}
                </p>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-sky-400 flex-shrink-0" />
                    <span>{language === 'en' ? 'Full platform access' : 'Accesso completo alla piattaforma'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-sky-400 flex-shrink-0" />
                    <span className="text-sky-300 font-bold">
                      {language === 'en' ? 'Cancel anytime with 1 click!' : 'Annulla quando vuoi con 1 click!'}
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {isUserPremium ? (
              <button
                onClick={() => handleSchedulePlanChange('monthly')}
                disabled={
                  loadingPlan === 'monthly' ||
                  currentPlanKey === 'monthly' ||
                  pendingPlanKey === 'monthly' ||
                  Boolean(pendingPlanKey) ||
                  Boolean(user?.cancelAtPeriodEnd)
                }
                className="w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs sm:text-sm border border-slate-700 flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loadingPlan === 'monthly' ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : currentPlanKey === 'monthly' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Piano Attuale Attivo</span>
                  </>
                ) : pendingPlanKey === 'monthly' ? (
                  <>
                    <Calendar className="w-4 h-4 text-sky-400" />
                    <span>Cambio Già Programmato ({formatDateIt(user?.pendingPlanStartsAt || user?.subscriptionPeriodEnd)})</span>
                  </>
                ) : pendingPlanKey ? (
                  <span>Annulla prima il cambio programmato</span>
                ) : user?.cancelAtPeriodEnd ? (
                  <span>Rinnovo disattivato a scadenza</span>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 text-sky-400" />
                    <span>Passa al Mensile a Scadenza (0 € oggi)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => handleInitiateCheckout('monthly')}
                disabled={loadingPlan === 'monthly'}
                className="w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs sm:text-sm border border-slate-700 flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {loadingPlan === 'monthly' ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-sky-400" />
                    <span>Acquista Mensile (€5)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>

          {/* 2. ANNUAL PLAN CARD */}
          <div className="bg-gradient-to-b from-slate-900 via-sky-950/40 to-slate-900 border-2 border-sky-400/80 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-2xl relative group transition-all">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 whitespace-nowrap">
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span>DUE MESI A 0€!</span>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white">{t('annualPlan')}</h3>
              </div>

              <div className="flex items-baseline space-x-1">
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-cyan-200 to-white">
                  50,00 €
                </span>
                <span className="text-sky-300 text-xs font-bold">/ anno</span>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-sky-200/90 font-medium leading-relaxed">
                  {language === 'en' ? 'Two months for €0!' : 'Due mesi a 0€!'}
                </p>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  {language === 'en' 
                    ? 'Immediate charge of €50.00 that renews annually or Pay in 3 installments of €16.67' 
                    : 'Addebito immediato di €50,00 che si rinnova annualmente o Paga in 3 rate da €16,67'}
                </p>
              </div>

              <div className="pt-4 border-t border-sky-800/40 space-y-3">
                <p className="text-xs font-bold text-sky-300 uppercase tracking-wider">
                  {language === 'en' ? 'Included in plan:' : 'Incluso nel piano:'}
                </p>
                <ul className="space-y-2.5 text-xs text-slate-200">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span>{language === 'en' ? 'Full platform access' : 'Accesso completo alla piattaforma'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span className="font-semibold text-white">
                      {language === 'en' ? 'Pay today and forget about it for the whole year' : 'Lo paghi oggi e te ne dimentichi per tutto l\'anno'}
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span>{language === 'en' ? 'Pay in installments with Klarna or PayPal' : 'Paga a rate con Klarna o PayPal'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span>{language === 'en' ? 'Automatic annual renewal' : 'Rinnovo automatico annualmente'}</span>
                  </li>
                </ul>
              </div>
            </div>

            {isUserPremium ? (
              <button
                onClick={() => handleSchedulePlanChange('annual')}
                disabled={
                  loadingPlan === 'annual' ||
                  currentPlanKey === 'annual' ||
                  pendingPlanKey === 'annual' ||
                  Boolean(pendingPlanKey) ||
                  Boolean(user?.cancelAtPeriodEnd)
                }
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-sky-500/30 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loadingPlan === 'annual' ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                ) : currentPlanKey === 'annual' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-slate-950" />
                    <span>Piano Attuale Attivo</span>
                  </>
                ) : pendingPlanKey === 'annual' ? (
                  <>
                    <Calendar className="w-4 h-4 text-slate-950" />
                    <span>Cambio Già Programmato ({formatDateIt(user?.pendingPlanStartsAt || user?.subscriptionPeriodEnd)})</span>
                  </>
                ) : pendingPlanKey ? (
                  <span>Annulla prima il cambio programmato</span>
                ) : user?.cancelAtPeriodEnd ? (
                  <span>Rinnovo disattivato a scadenza</span>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 text-slate-950" />
                    <span>Passa all'Annuale a Scadenza (0 € oggi)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => handleInitiateCheckout('annual')}
                disabled={loadingPlan === 'annual'}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-sky-500/30 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loadingPlan === 'annual' ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-slate-950" />
                    <span>Acquista Annuale (€50)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      </div>

      {/* FOOTER GUARANTEE & SECURITY INFORMATION */}
      <div className="max-w-4xl mx-auto p-6 rounded-3xl bg-slate-900/80 border border-slate-800 text-center space-y-3 shadow-lg">
        <div className="flex items-center justify-center space-x-2 text-emerald-400 font-bold text-sm">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Infrastruttura di Pagamento Server-Authoritative conforme PCI-DSS</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-2xl mx-auto">
          Tutti i pagamenti e gli abbonamenti vengono elaborati direttamente dai server sicuri di Stripe. 
          Echora non memorizza né ha accesso ai dati sensibili della tua carta. 
          Lo stato del tuo account viene sincronizzato in modo sicuro tramite Webhook direttamente nel database Firebase Firestore.
        </p>
      </div>

    </div>
  );
};
