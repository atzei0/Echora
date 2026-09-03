import React, { useState, useEffect } from 'react';
import { Check, Sparkles, ShieldCheck, Zap, Lock, ArrowRight, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

type PlanType = 'trial' | 'monthly' | 'quarterly' | 'annual' | 'test';

interface SubscriptionsViewProps {
  onNavigate: (tab: string) => void;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({ onNavigate }) => {
  const { t, language } = useLanguage();
  const { user, openAuthModal } = useAuth();

  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<boolean>(false);
  const [verifiedStatus, setVerifiedStatus] = useState<any>(null);

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
          try {
            const res = await fetch(`/api/subscription-status?userId=${encodeURIComponent(user.id)}`);
            if (res.ok) {
              const data = await res.json();
              if (data?.isPremium) {
                setVerifiedStatus(data);
              }
            }
          } catch (e) {
            console.warn('Verifica dello stato abbonamento temporaneamente non disponibile:', e);
          }
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

    try {
      // Mark that user actively initiated checkout in this session
      sessionStorage.setItem('echora_pending_checkout', 'true');

      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          plan,
          customerEmail: user.email
        })
      });

      const data = await res.json();

      if (!res.ok) {
        sessionStorage.removeItem('echora_pending_checkout');
        throw new Error(data.error || 'Errore durante la creazione della sessione Stripe Checkout');
      }

      if (data.url) {
        const isIframe = window.self !== window.top;
        if (isIframe) {
          window.open(data.url, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = data.url;
        }
      } else {
        sessionStorage.removeItem('echora_pending_checkout');
        throw new Error('URL di reindirizzamento Stripe non restituito dal server.');
      }
    } catch (err: any) {
      console.error('Errore Checkout Stripe:', err);
      sessionStorage.removeItem('echora_pending_checkout');
      setCheckoutError(err.message || 'Impossibile avviare il pagamento con Stripe.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const isUserPremium = user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trialing' || verifiedStatus?.isPremium;

  return (
    <div className="min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* VERIFIED ACTIVE SUBSCRIPTION BANNER */}
      {isUserPremium && (
        <div className="p-6 rounded-3xl bg-emerald-950/80 border-2 border-emerald-400/80 text-emerald-100 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider mb-1">
                <span>Stato Verificato dal Server (Firebase / Stripe)</span>
              </div>
              <h3 className="text-xl font-black text-white">
                Abbonamento Echora Pro Attivo
              </h3>
              <p className="text-xs text-emerald-200 mt-0.5">
                Piano: <strong className="text-white capitalize">{user?.subscriptionPlan || verifiedStatus?.subscriptionPlan || 'Pro'}</strong> — 
                Valido fino al: <strong className="text-white">{user?.subscriptionPeriodEnd ? new Date(user.subscriptionPeriodEnd).toLocaleDateString('it-IT') : 'Rinnovo Automatico'}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('exercises')}
            className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center gap-2"
          >
            <span>Accedi a tutti i Vocal Workout</span>
            <ArrowRight className="w-4 h-4" />
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

        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          {t('pricingSubtitle')}
        </p>

        {/* Guarantees Callout */}
        <div className="inline-flex items-center justify-center space-x-2 bg-sky-950/60 border border-sky-800/60 px-4 py-2 rounded-2xl text-sky-200 text-xs sm:text-sm font-semibold">
          <Zap className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
          <span>Paga in sicurezza con Stripe — Carta, PayPal e Klarna (Paga in 3 rate)</span>
        </div>
      </div>

      {/* SECTION 1: PROVA 7 GIORNI (€0,99) */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-slate-900 via-amber-950/40 to-slate-900 border-2 border-amber-400/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

          <div className="space-y-4 max-w-xl text-left relative z-10">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] sm:text-xs font-black uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 fill-amber-300" />
              <span>Modalità Consigliata — Prova di 7 Giorni</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Prova Echora per 7 giorni a €0,99
            </h2>

            <p className="text-sm text-amber-100/90 leading-relaxed font-medium">
              Prova Echora per 7 giorni a €0,99. Al termine della prova, si rinnova automaticamente con il piano mensile a €20/mese. Puoi annullare in qualsiasi momento.
            </p>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-200 pt-2">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="font-semibold text-white">
                  {language === 'en' ? 'Full platform access' : 'Accesso completo alla piattaforma'}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="text-amber-300 font-bold">
                  {language === 'en' ? 'Cancel anytime with 1 click!' : 'Annulla quando vuoi con 1 click!'}
                </span>
              </li>
            </ul>
          </div>

          <div className="w-full md:w-auto flex flex-col items-center justify-center space-y-3 relative z-10 shrink-0">
            <div className="text-center">
              <span className="text-4xl sm:text-5xl font-black text-amber-300">€0,99</span>
              <p className="text-xs text-slate-400 font-medium">/ per 7 giorni</p>
            </div>

            <button
              onClick={() => handleInitiateCheckout('trial')}
              disabled={loadingPlan === 'trial'}
              className="w-full sm:w-64 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {loadingPlan === 'trial' ? (
                <RefreshCw className="w-5 h-5 animate-spin text-slate-950" />
              ) : (
                <>
                  <Lock className="w-4 h-4 text-slate-950" />
                  <span>Inizia la Prova a €0,99</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: ACQUISTO DIRETTO (SENZA PROVA) */}
      <div className="space-y-6 pt-6 max-w-6xl mx-auto">
        <div className="text-center space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Oppure Acquista Direttamente un Abbonamento
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Senza periodo di prova: l'abbonamento parte immediatamente al prezzo selezionato.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          
          {/* 1. MONTHLY DIRECT CARD */}
          <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-xl relative group transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white">{t('monthlyPlan')}</h3>
                <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                  Flessibile
                </span>
              </div>

              <div className="flex items-baseline space-x-1">
                <span className="text-4xl font-black text-white">20,00 €</span>
                <span className="text-slate-400 text-xs font-semibold">/ mese</span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Addebito immediato di €20,00/mese. Rinnovo mensile automatico, disdici quando vuoi.
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
                  <span>Acquista Mensile (€20)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* 2. QUARTERLY DIRECT CARD */}
          <div className="bg-gradient-to-b from-slate-900 via-purple-950/30 to-slate-900 border-2 border-purple-400/70 hover:border-purple-300 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-xl relative group transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white">{t('quarterlyPlan')}</h3>
                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/40 text-[10px] font-bold uppercase tracking-wider">
                  Risparmi 15€
                </span>
              </div>

              <div className="flex items-baseline space-x-1">
                <span className="text-4xl font-black text-purple-200">45,00 €</span>
                <span className="text-slate-400 text-xs font-semibold">/ 3 mesi</span>
              </div>

              <p className="text-xs text-purple-200/90 font-medium leading-relaxed">
                {language === 'en'
                  ? 'Immediate charge of €45.00 that renews every 3 months or Pay in 3 installments of €15.00'
                  : 'Addebito immediato di €45,00 che si rinnova ogni 3 mesi o Paga in 3 rate da €15,00'}
              </p>

              <div className="pt-4 border-t border-purple-800/40 space-y-3">
                <p className="text-xs font-bold text-purple-200 uppercase tracking-wider">
                  {language === 'en' ? 'Included in plan:' : 'Incluso nel piano:'}
                </p>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span>{language === 'en' ? 'Full platform access' : 'Accesso completo alla piattaforma'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span>{language === 'en' ? 'Save €15 compared to monthly' : 'Risparmi 15 € rispetto al mensile'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span>{language === 'en' ? 'Pay in installments with Klarna or PayPal' : 'Paga a rate con Klarna o PayPal'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span>{language === 'en' ? 'Automatic renewal every 3 months' : 'Rinnovo automatico ogni 3 mesi'}</span>
                  </li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => handleInitiateCheckout('quarterly')}
              disabled={loadingPlan === 'quarterly'}
              className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              {loadingPlan === 'quarterly' ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  <Lock className="w-4 h-4 text-purple-200" />
                  <span>Acquista Trimestrale (€45)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* 3. ANNUAL DIRECT CARD */}
          <div className="bg-gradient-to-b from-slate-900 via-sky-950/40 to-slate-900 border-2 border-sky-400/80 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-2xl relative group transition-all">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 whitespace-nowrap">
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span>MIGLIOR VALORE (50% OFF)</span>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white">{t('annualPlan')}</h3>
                <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/40 text-[10px] font-black uppercase tracking-wider">
                  Risparmi 120€
                </span>
              </div>

              <div className="flex items-baseline space-x-1">
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-cyan-200 to-white">
                  120,00 €
                </span>
                <span className="text-sky-300 text-xs font-bold">/ anno</span>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-sky-200/90 font-medium leading-relaxed">
                  {language === 'en' ? 'Equivalent to only €10.00/month' : 'Equivalente a soli €10,00/mese'}
                </p>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  {language === 'en' 
                    ? 'Immediate charge of €120.00 that renews annually or Pay in 3 installments of €40.00' 
                    : 'Addebito immediato di €120,00 che si rinnova annualmente o Paga in 3 rate da €40,00'}
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
                      {language === 'en' ? 'Maximum savings (50% OFF)' : 'Massimo risparmio (50% OFF)'}
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
                  <span>Acquista Annuale (€120)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
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
