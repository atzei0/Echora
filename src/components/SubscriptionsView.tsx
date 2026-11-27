import React, { useState, useEffect, useRef } from 'react';
import {
  Check,
  Sparkles,
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Calendar,
  XCircle,
  ShieldAlert,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { isTrustedStripeRedirectUrl } from '../utils/validation';
import type { CheckoutReturnInfo } from '../App';
import {
  PlanSwitchConfirmModal,
  formatSubscriptionPlanName,
  formatPlanPriceLabel,
  formatEuroCents,
  formatDateIt,
} from './SubscriptionModals';

type PlanType = 'monthly' | 'annual';

interface CheckoutBindingRecord {
  sessionId: string;
  uid: string;
  email?: string;
  plan: PlanType;
  createdAt: number;
}

const CHECKOUT_BINDING_KEY = 'echora_checkout_binding';

interface SubscriptionsViewProps {
  onNavigate: (tab: string) => void;
  checkoutReturnInfo?: CheckoutReturnInfo | null;
  onClearCheckoutReturn?: () => void;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({
  onNavigate,
  checkoutReturnInfo,
  onClearCheckoutReturn,
}) => {
  const { t, language } = useLanguage();
  const {
    user,
    isAuthReady,
    isCoach,
    isSubscribed,
    openAuthModal,
    refreshSubscriptionStatus,
  } = useAuth();

  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null);
  const [confirmSwitchTarget, setConfirmSwitchTarget] = useState<PlanType | null>(null);
  const [cancelingPending, setCancelingPending] = useState<boolean>(false);
  const [openingPortal, setOpeningPortal] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutIdentityError, setCheckoutIdentityError] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [verifyingCheckout, setVerifyingCheckout] = useState<boolean>(false);
  const [checkoutVerifiedSuccess, setCheckoutVerifiedSuccess] = useState<boolean>(false);
  const [pendingLoginForCheckout, setPendingLoginForCheckout] = useState<boolean>(false);

  const verifiedSessionHandledRef = useRef<string | null>(null);

  useEffect(() => {
    if (!checkoutReturnInfo || !isAuthReady) return;

    if (checkoutReturnInfo.status === 'cancelled') {
      try {
        sessionStorage.removeItem(CHECKOUT_BINDING_KEY);
      } catch {}
      setCheckoutError('Pagamento annullato. Nessun addebito è stato effettuato.');
      onClearCheckoutReturn?.();
      return;
    }

    const sessionId = checkoutReturnInfo.sessionId;
    if (!sessionId) {
      setCheckoutError(
        'Identificativo della sessione Stripe mancante al ritorno dal pagamento. Verifica lo stato del tuo abbonamento nel profilo.'
      );
      onClearCheckoutReturn?.();
      return;
    }

    if (!user?.id) {
      setPendingLoginForCheckout(true);
      setCheckoutIdentityError(
        'Sessione non autenticata al ritorno da Stripe. Accedi manualmente con l\'account che ha avviato il pagamento per completare la verifica.'
      );
      return;
    }

    const verificationKey = `${sessionId}:${user.id}`;
    if (verifiedSessionHandledRef.current === verificationKey) {
      return;
    }
    verifiedSessionHandledRef.current = verificationKey;
    setPendingLoginForCheckout(false);

    const verifyCheckoutOwnershipAndActivate = async () => {
      setVerifyingCheckout(true);
      setCheckoutError(null);
      setCheckoutIdentityError(null);
      setCheckoutVerifiedSuccess(false);

      try {
        // 1. Controllo locale di coerenza rispetto alla sessione avviata nel browser
        let localBinding: CheckoutBindingRecord | null = null;
        try {
          const raw = sessionStorage.getItem(CHECKOUT_BINDING_KEY);
          if (raw) {
            localBinding = JSON.parse(raw) as CheckoutBindingRecord;
          }
        } catch {}

        if (
          localBinding &&
          localBinding.sessionId === sessionId &&
          localBinding.uid &&
          localBinding.uid !== user.id
        ) {
          setCheckoutIdentityError(
            `Errore di sicurezza: il pagamento è stato avviato con un account diverso (${localBinding.email || localBinding.uid}) rispetto all'utente attualmente autenticato (${user.email}). La procedura è stata bloccata per proteggere l'isolamento degli account.`
          );
          onClearCheckoutReturn?.();
          return;
        }

        // 2. Verifica crittografica lato server su Stripe (confronto UID autenticato vs client_reference_id/metadata)
        const token = await auth.currentUser?.getIdToken(true);
        if (!token) {
          setCheckoutIdentityError(
            'Sessione di autenticazione non valida. Effettua nuovamente il login con il tuo account.'
          );
          return;
        }

        const res = await fetch(
          `/api/verify-checkout-session?session_id=${encodeURIComponent(sessionId)}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (!res.ok || data.verified !== true) {
          if (
            res.status === 403 ||
            data?.errorCode === 'CHECKOUT_IDENTITY_MISMATCH' ||
            data?.errorCode === 'CHECKOUT_IDENTITY_MISSING'
          ) {
            setCheckoutIdentityError(
              data?.error ||
                'Errore di sicurezza: questa sessione di pagamento appartiene a un altro account. Nessun abbonamento è stato associato.'
            );
          } else {
            setCheckoutError(
              data?.error || 'Impossibile verificare la sessione di pagamento su Stripe.'
            );
          }
          onClearCheckoutReturn?.();
          return;
        }

        try {
          sessionStorage.removeItem(CHECKOUT_BINDING_KEY);
        } catch {}

        await refreshSubscriptionStatus(true);
        if (auth.currentUser?.uid !== user.id) {
          setCheckoutIdentityError(
            'Cambio account rilevato durante la verifica del pagamento. Operazione interrotta.'
          );
          onClearCheckoutReturn?.();
          return;
        }
        setCheckoutVerifiedSuccess(true);
        setActionSuccessMessage(
          `${formatSubscriptionPlanName(data.subscriptionPlan)} attivato e verificato per ${user.email}.`
        );
        onClearCheckoutReturn?.();
      } catch (err: any) {
        console.error('Errore verifica ritorno Checkout:', err);
        setCheckoutError(
          err?.message || 'Errore durante la verifica della sessione di pagamento.'
        );
      } finally {
        setVerifyingCheckout(false);
      }
    };

    verifyCheckoutOwnershipAndActivate();
  }, [checkoutReturnInfo, isAuthReady, user?.id]);

  const handleInitiateCheckout = async (plan: PlanType) => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    setLoadingPlan(plan);
    setCheckoutError(null);
    setCheckoutIdentityError(null);
    setActionSuccessMessage(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('Sessione di autenticazione scaduta o non valida. Effettua nuovamente il login.');
      }

      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Errore durante la creazione della sessione Stripe Checkout');
      }

      if (data.scheduled) {
        await refreshSubscriptionStatus(true);
        setActionSuccessMessage(
          data.message ||
            `Cambio piano verso ${formatSubscriptionPlanName(data.pendingPlan)} programmato per il ${formatDateIt(data.pendingPlanStartsAt)}. Nessun addebito immediato.`
        );
        return;
      }

      if (data.url && isTrustedStripeRedirectUrl(data.url)) {
        if (data.sessionId) {
          try {
            const binding: CheckoutBindingRecord = {
              sessionId: data.sessionId,
              uid: user.id,
              email: user.email,
              plan,
              createdAt: Date.now(),
            };
            sessionStorage.setItem(CHECKOUT_BINDING_KEY, JSON.stringify(binding));
          } catch {}
        }

        const isIframe = window.self !== window.top;
        if (isIframe) {
          window.open(data.url, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = data.url;
        }
      } else {
        throw new Error('URL di reindirizzamento Stripe non valido o non restituito dal server.');
      }
    } catch (err: any) {
      console.error('Errore Checkout Stripe:', err);
      setCheckoutError(err.message || 'Impossibile avviare il pagamento con Stripe.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleConfirmSchedulePlanChange = async () => {
    if (!confirmSwitchTarget) return;
    if (!user) {
      setConfirmSwitchTarget(null);
      openAuthModal('login');
      return;
    }

    const newPlan = confirmSwitchTarget;
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: newPlan }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Impossibile programmare il cambio piano.');
      }

      await refreshSubscriptionStatus(true);
      setConfirmSwitchTarget(null);
      setActionSuccessMessage(
        data.message ||
          `Cambio al piano ${formatSubscriptionPlanName(newPlan)} programmato con attivazione dal ${formatDateIt(data.pendingPlanStartsAt)}. Nessun addebito immediato.`
      );
    } catch (err: any) {
      console.error('Errore programmazione cambio piano:', err);
      setCheckoutError(err.message || 'Errore durante la programmazione del cambio piano.');
      setConfirmSwitchTarget(null);
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
          Authorization: `Bearer ${token}`,
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

  const handleOpenPaymentRecoveryPortal = async () => {
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
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Impossibile aprire la pagina di aggiornamento pagamento.');
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
      setCheckoutError(err.message || 'Errore durante l\'apertura dell\'aggiornamento pagamento.');
    } finally {
      setOpeningPortal(false);
    }
  };

  const isUserSubscribed = !isCoach && isSubscribed;
  const currentPlanKey = user?.subscriptionPlan || null;
  const pendingPlanKey = user?.pendingPlan || null;
  const isPaymentPastDue =
    !isCoach &&
    (user?.subscriptionStatus === 'past_due' ||
      user?.subscriptionStatus === 'incomplete' ||
      user?.subscriptionStatus === 'unpaid');

  const hasDiscountOrUncertain = Boolean(
    user?.nextChargeAmountUncertain ||
    (typeof user?.nextChargeAmount === 'number' &&
      ((currentPlanKey === 'monthly' && !pendingPlanKey && user.nextChargeAmount < 500) ||
        (currentPlanKey === 'annual' && !pendingPlanKey && user.nextChargeAmount < 5000)))
  );

  const nextChargeAmountDisplay = user?.cancelAtPeriodEnd
    ? '0,00 € (rinnovo annullato)'
    : user?.nextChargeAmountUncertain
      ? 'Importo da verificare'
      : typeof user?.nextChargeAmount === 'number'
        ? formatEuroCents(user.nextChargeAmount)
        : 'Importo da verificare';

  const nextChargeDateDisplay = user?.cancelAtPeriodEnd
    ? 'Nessun altro addebito'
    : formatDateIt(user?.nextChargeDate || user?.pendingPlanStartsAt || user?.subscriptionPeriodEnd);

  const currentPeriodEndStr = formatDateIt(user?.subscriptionPeriodEnd);

  return (
    <div className="min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

      {/* SECURITY IDENTITY MISMATCH BLOCKING ERROR */}
      {checkoutIdentityError && (
        <div className="p-6 rounded-3xl bg-red-950/90 border-2 border-red-500 text-red-100 shadow-2xl space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-400/50 flex items-center justify-center text-red-300 shrink-0">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-white">
                Verifica Identità Checkout Bloccata
              </h3>
              <p className="text-xs sm:text-sm text-red-200 leading-relaxed">
                {checkoutIdentityError}
              </p>
              {pendingLoginForCheckout && !user && (
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="mt-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Accedi con l&apos;account corretto
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VERIFYING CHECKOUT RETURN */}
      {verifyingCheckout && (
        <div className="p-6 rounded-3xl bg-blue-950/80 border border-blue-400/80 text-blue-100 shadow-2xl flex items-center gap-4">
          <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin shrink-0" />
          <div>
            <h3 className="text-lg font-black text-white">Verifica sessione Stripe in corso...</h3>
            <p className="text-xs text-blue-200">
              Controlliamo l&apos;identità dell&apos;account e sincronizziamo il tuo abbonamento Echora con Firebase.
            </p>
          </div>
        </div>
      )}

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
            className="px-6 py-3 rounded-2xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer"
          >
            <span>Accedi a tutti i Vocal Workout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* VERIFIED ACTIVE STUDENT SUBSCRIPTION BANNER */}
      {isUserSubscribed && (
        <div className="p-6 rounded-3xl bg-emerald-950/80 border-2 border-emerald-400/80 text-emerald-100 shadow-2xl space-y-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                  <span>
                    {user?.cancelAtPeriodEnd
                      ? 'Abbonamento Attivo — Rinnovo Automatico Annullato'
                      : 'Abbonamento Verificato (Stripe / Firebase)'}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white">
                  {formatSubscriptionPlanName(currentPlanKey)} ({formatPlanPriceLabel(currentPlanKey)})
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2 text-xs text-emerald-200 pt-1">
                  <div>
                    <span className="text-emerald-300/80 block text-[11px]">Data di inizio</span>
                    <strong className="text-white">{formatDateIt(user?.subscriptionPeriodStart)}</strong>
                  </div>
                  <div>
                    <span className="text-emerald-300/80 block text-[11px]">Fine del periodo pagato</span>
                    <strong className="text-white">{currentPeriodEndStr}</strong>
                  </div>
                  <div>
                    <span className="text-emerald-300/80 block text-[11px]">Prossima data di addebito</span>
                    <strong className="text-white">{nextChargeDateDisplay}</strong>
                  </div>
                  <div>
                    <span className="text-emerald-300/80 block text-[11px]">Importo prossimo addebito</span>
                    <strong className="text-white">{nextChargeAmountDisplay}</strong>
                  </div>
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

          {user?.cancelAtPeriodEnd && !pendingPlanKey && (
            <div className="p-4 rounded-2xl bg-amber-950/50 border border-amber-400/50 text-xs text-amber-100">
              Il rinnovo automatico è stato annullato. Il tuo <strong>{formatSubscriptionPlanName(currentPlanKey)}</strong> resta attivo fino al <strong>{currentPeriodEndStr}</strong>. Nessun altro addebito verrà effettuato.
            </div>
          )}

          {pendingPlanKey && (
            <div className="p-4 rounded-2xl bg-slate-950/75 border border-sky-400/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1.5 text-xs">
                  <p className="font-black text-sky-300 uppercase tracking-wider text-[11px]">
                    Cambio Piano Programmato alla Scadenza (Nessun Addebito Anticipato)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1 text-slate-200">
                    <span>
                      Piano attuale attivo: <strong className="text-white">{formatSubscriptionPlanName(currentPlanKey)}</strong>
                    </span>
                    <span>
                      Scadenza piano attuale: <strong className="text-white">{currentPeriodEndStr}</strong>
                    </span>
                    <span>
                      Nuovo piano programmato: <strong className="text-sky-300">{formatSubscriptionPlanName(pendingPlanKey)}</strong>
                    </span>
                    <span>
                      Data di attivazione nuovo piano: <strong className="text-emerald-300">{formatDateIt(user?.pendingPlanStartsAt || user?.subscriptionPeriodEnd)}</strong>
                    </span>
                    <span>
                      Prossima data e importo addebito: <strong className="text-sky-300">{formatDateIt(user?.pendingPlanStartsAt || user?.subscriptionPeriodEnd)} • {user?.nextChargeAmountUncertain || typeof user?.pendingPlanAmount !== 'number' ? 'Importo da verificare' : formatEuroCents(user.pendingPlanAmount)}</strong>
                    </span>
                  </div>
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
                L&apos;ultimo addebito automatico su Stripe risulta non riuscito (stato: <strong>{user?.subscriptionStatus}</strong>).
                {pendingPlanKey
                  ? ` Il passaggio al piano ${formatSubscriptionPlanName(pendingPlanKey)} non è stato completato per mancato pagamento.`
                  : ''}
              </p>
              <p className="text-amber-300/80">
                Aggiorna il metodo di pagamento per riattivare il tuo abbonamento Echora ed evitare l&apos;interruzione definitiva.
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenPaymentRecoveryPortal}
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

      {/* ACTION / VERIFICATION SUCCESS CONFIRMATION */}
      {(actionSuccessMessage || checkoutVerifiedSuccess) && actionSuccessMessage && (
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

        <div className="inline-flex items-center justify-center space-x-2 bg-sky-950/60 border border-sky-800/60 px-4 py-2 rounded-2xl text-sky-200 text-xs sm:text-sm font-semibold">
          <Zap className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
          <span>Paga in sicurezza con Stripe — Carta, PayPal e Klarna (Paga in 3 rate)</span>
        </div>
      </div>

      {/* SUBSCRIPTION PLANS: ABBONAMENTO ECHORA — MENSILE & ANNUALE */}
      <div className="space-y-6 pt-4 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">

          {/* 1. ABBONAMENTO ECHORA — MENSILE */}
          <div
            className={`bg-slate-900/90 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xl relative group transition-all ${
              isUserSubscribed && currentPlanKey === 'monthly'
                ? 'border-2 border-emerald-400/80'
                : 'border border-slate-800 hover:border-slate-700'
            }`}
          >
            {isUserSubscribed && currentPlanKey === 'monthly' && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-lg whitespace-nowrap">
                Il tuo piano attuale
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xl font-black text-white">Abbonamento Echora — Mensile</h3>
                <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-wider shrink-0">
                  Flessibile
                </span>
              </div>

              <div className="flex items-baseline space-x-1">
                <span className="text-4xl font-black text-white">5,00 €</span>
                <span className="text-slate-400 text-xs font-semibold">/ mese</span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {isUserSubscribed && currentPlanKey === 'annual'
                  ? `Il tuo abbonamento annuale rimane attivo fino al ${currentPeriodEndStr}. Passando al mensile, l'abbonamento mensile (5,00 € / mese) inizierà e verrà addebitato dal ${currentPeriodEndStr}.`
                  : 'Addebito immediato di €5,00/mese. Rinnovo mensile automatico, annulli quando vuoi.'}
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
                      {language === 'en' ? 'Cancel renewal anytime with 1 click!' : 'Annulla il rinnovo quando vuoi con 1 click!'}
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {isUserSubscribed ? (
              <button
                type="button"
                onClick={() => setConfirmSwitchTarget('monthly')}
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
                    <span>Il tuo piano attuale</span>
                  </>
                ) : pendingPlanKey === 'monthly' ? (
                  <>
                    <Calendar className="w-4 h-4 text-sky-400" />
                    <span>Passaggio programmato ({formatDateIt(user?.pendingPlanStartsAt || user?.subscriptionPeriodEnd)})</span>
                  </>
                ) : pendingPlanKey ? (
                  <span>Annulla prima il cambio programmato</span>
                ) : user?.cancelAtPeriodEnd ? (
                  <span>Rinnovo annullato (attivo fino al {currentPeriodEndStr})</span>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 text-sky-400" />
                    <span>Passa al mensile</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleInitiateCheckout('monthly')}
                disabled={loadingPlan === 'monthly'}
                className="w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs sm:text-sm border border-slate-700 flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {loadingPlan === 'monthly' ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-sky-400" />
                    <span>Acquista mensile</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>

          {/* 2. ABBONAMENTO ECHORA — ANNUALE */}
          <div
            className={`bg-gradient-to-b from-slate-900 via-sky-950/40 to-slate-900 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-2xl relative group transition-all ${
              isUserSubscribed && currentPlanKey === 'annual'
                ? 'border-2 border-emerald-400/80'
                : 'border-2 border-sky-400/80'
            }`}
          >
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 whitespace-nowrap">
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span>
                {isUserSubscribed && currentPlanKey === 'annual'
                  ? 'IL TUO PIANO ATTUALE'
                  : 'DUE MESI A 0€!'}
              </span>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xl font-black text-white">Abbonamento Echora — Annuale</h3>
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
                  {isUserSubscribed && currentPlanKey === 'monthly'
                    ? `Il tuo piano mensile rimane attivo fino al ${currentPeriodEndStr}. Passando all'annuale, l'abbonamento annuale (50,00 €) inizierà e verrà addebitato il ${currentPeriodEndStr}. Nessun addebito oggi.`
                    : language === 'en'
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

            {isUserSubscribed ? (
              <button
                type="button"
                onClick={() => setConfirmSwitchTarget('annual')}
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
                    <span>Il tuo piano attuale</span>
                  </>
                ) : pendingPlanKey === 'annual' ? (
                  <>
                    <Calendar className="w-4 h-4 text-slate-950" />
                    <span>Passaggio programmato ({formatDateIt(user?.pendingPlanStartsAt || user?.subscriptionPeriodEnd)})</span>
                  </>
                ) : pendingPlanKey ? (
                  <span>Annulla prima il cambio programmato</span>
                ) : user?.cancelAtPeriodEnd ? (
                  <span>Rinnovo annullato (attivo fino al {currentPeriodEndStr})</span>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 text-slate-950" />
                    <span>Passa all&apos;annuale</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleInitiateCheckout('annual')}
                disabled={loadingPlan === 'annual'}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-sky-500/30 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loadingPlan === 'annual' ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-slate-950" />
                    <span>Acquista annuale</span>
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

      {/* EXPLICIT PLAN SWITCH CONFIRMATION MODAL */}
      <PlanSwitchConfirmModal
        isOpen={Boolean(confirmSwitchTarget)}
        currentPlan={currentPlanKey}
        targetPlan={confirmSwitchTarget || 'annual'}
        currentPeriodEnd={user?.subscriptionPeriodEnd}
        hasActiveDiscountOrUncertain={hasDiscountOrUncertain}
        isSubmitting={Boolean(loadingPlan)}
        onConfirm={handleConfirmSchedulePlanChange}
        onClose={() => setConfirmSwitchTarget(null)}
      />
    </div>
  );
};
