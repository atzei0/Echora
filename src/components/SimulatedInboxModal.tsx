import React, { useState } from 'react';
import { Mail, X, CheckCircle2, ShieldCheck, Sparkles, Send, ExternalLink, ArrowRight, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SimulatedInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimulatedInboxModal: React.FC<SimulatedInboxModalProps> = ({ isOpen, onClose }) => {
  const { user, verifyEmail } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  if (!isOpen || !user) return null;

  const handleConfirmClick = () => {
    setIsVerifying(true);
    setTimeout(() => {
      verifyEmail();
      setIsVerifying(false);
      setVerifiedSuccess(true);
      setTimeout(() => {
        setVerifiedSuccess(false);
        onClose();
      }, 2500);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden relative">
        
        {/* Header simulating Mail Client */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/40 text-sky-400 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                Simulatore Posta in Arrivo (Echora Mailer)
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Destinatario: {user.email}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email Body Area */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Simulated Email Envelope Header */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-500 font-bold">Da:</span>
              <span className="text-sky-300 font-bold">Echora Vocal Support &lt;no-reply@echora-vocal.com&gt;</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-500 font-bold">A:</span>
              <span className="text-white font-bold">{user.name} &lt;{user.email}&gt;</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-bold">Oggetto:</span>
              <span className="text-amber-300 font-black">🎤 Conferma il tuo Account Echora Vocal Coaching</span>
            </div>
          </div>

          {/* Email Content */}
          <div className="bg-gradient-to-b from-slate-950 to-slate-900 border border-sky-500/30 rounded-2xl p-6 space-y-5 text-slate-300 text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-sky-400 font-black text-lg">
              <span>Echora Vocal App</span>
              <Sparkles className="w-5 h-5" />
            </div>

            <p className="leading-relaxed">
              Ciao <strong className="text-white">{user.firstName || user.name}</strong>,
            </p>

            <p className="leading-relaxed">
              Grazie per esserti registrato su <strong className="text-sky-300">Echora</strong>! Per completare la creazione del tuo profilo cantante, tracciare i tuoi progressi negli acuti e sbloccare tutti i trofei, conferma il tuo indirizzo email.
            </p>

            {/* Simulated Link/Button */}
            <div className="py-3 text-center space-y-3">
              {user.emailVerified || verifiedSuccess ? (
                <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 font-bold text-xs flex items-center justify-center gap-2 animate-bounce">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Email Confermata con Successo! Account Verificato.</span>
                </div>
              ) : (
                <button
                  onClick={handleConfirmClick}
                  disabled={isVerifying}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all transform hover:scale-[1.02]"
                >
                  {isVerifying ? (
                    <span className="animate-pulse">Verifica in corso...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>CLICCA QUI PER CONFERMARE L'EMAIL ({user.email})</span>
                    </>
                  )}
                </button>
              )}

              <p className="text-[11px] text-slate-500">
                Se non hai richiesto questa iscrizione, puoi ignorare questo messaggio.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
              <span>© 2026 Echora Vocal Coaching</span>
              <span className="flex items-center gap-1 text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Protetto con SSL
              </span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500">
            💡 Nota per il test: Questo finestra simula la ricezione dell'email di conferma inviata dal server.
          </p>
        </div>

      </div>
    </div>
  );
};
