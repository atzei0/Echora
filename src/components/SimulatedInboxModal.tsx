import React, { useState } from 'react';
import { Mail, X, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SimulatedInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimulatedInboxModal: React.FC<SimulatedInboxModalProps> = ({ isOpen, onClose }) => {
  const { user, verifyEmail, sendConfirmationEmail } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleCheckVerification = async () => {
    setIsVerifying(true);
    setStatusMessage(null);
    const verified = await verifyEmail();
    setIsVerifying(false);
    if (verified) {
      setStatusMessage('Email verificata con successo!');
      setTimeout(() => {
        setStatusMessage(null);
        onClose();
      }, 2000);
    } else {
      setStatusMessage('Verifica non ancora completata. Clicca sul link ricevuto nella tua casella di posta Firebase e riprova.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden relative">
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/40 text-sky-400 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                Verifica Indirizzo Email (Firebase Auth)
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

        <div className="p-6 sm:p-8 space-y-5">
          <div className="bg-gradient-to-b from-slate-950 to-slate-900 border border-sky-500/30 rounded-2xl p-6 space-y-4 text-slate-300 text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-sky-400 font-black text-lg">
              <span>Echora Vocal App</span>
              <Sparkles className="w-5 h-5" />
            </div>

            <p className="leading-relaxed">
              Ciao <strong className="text-white">{user.firstName || user.name}</strong>, per verificare il tuo account controlla la tua casella di posta e clicca sul link di verifica inviato da Firebase per <strong className="text-sky-300">{user.email}</strong>.
            </p>

            {statusMessage && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 font-semibold">
                {statusMessage}
              </div>
            )}

            <div className="py-2 space-y-3">
              {user.emailVerified ? (
                <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 font-bold text-xs flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Email Verificata con Successo!</span>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={() => sendConfirmationEmail()}
                    className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs cursor-pointer transition-colors"
                  >
                    Invia Nuova Email di Verifica
                  </button>
                  <button
                    type="button"
                    onClick={handleCheckVerification}
                    disabled={isVerifying}
                    className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isVerifying ? 'Controllo...' : 'Ho Cliccato sul Link'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
              <span>© 2026 Echora Vocal Coaching</span>
              <span className="flex items-center gap-1 text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verifica Crittografica Firebase
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
