import React, { useState, useEffect } from 'react';
import { Sparkles, Send, Bot, User, BookOpen, Clock, Play, RefreshCw, AlertCircle } from 'lucide-react';
import { CustomRoutine, VocalRangeProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface AICoachPanelProps {
  vocalProfile: VocalRangeProfile | null;
}

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

export const AICoachPanel: React.FC<AICoachPanelProps> = ({ vocalProfile }) => {
  const { t, language } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'routine_generator'>('chat');

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: t('coachWelcome'),
    },
  ]);

  // Update initial message when language switches
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].sender === 'ai') {
        return [{ sender: 'ai', text: t('coachWelcome') }];
      }
      return prev;
    });
  }, [language]);

  const [inputText, setInputText] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Routine Generator State
  const [goal, setGoal] = useState('Riscaldamento rapido 10 minuti');
  const [availableTime, setAvailableTime] = useState(10);
  const [generatedRoutine, setGeneratedRoutine] = useState<CustomRoutine | null>(null);
  const [isGeneratingRoutine, setIsGeneratingRoutine] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const quickPrompts = [
    t('q1'),
    t('q2'),
    t('q3'),
    t('q4'),
  ];


  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend || inputText;
    if (!messageText.trim() || isChatLoading) return;

    const newMessages: ChatMessage[] = [...messages, { sender: 'user', text: messageText }];
    setMessages(newMessages);
    setInputText('');
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/vocal-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          voiceType: vocalProfile?.voiceCategory || 'Non specificato',
          vocalRange: vocalProfile ? `${vocalProfile.lowestNote} - ${vocalProfile.highestNote}` : 'Non specificato',
        }),
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        setMessages([...newMessages, { sender: 'ai', text: data.reply }]);
      } else {
        setMessages([
          ...newMessages,
          {
            sender: 'ai',
            text: `⚠️ ${data.error || 'Si è verificato un errore nella risposta del Coach AI.'}`,
          },
        ]);
      }
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          sender: 'ai',
          text: '⚠️ Impossibile connettersi al server del Coach Vocale. Verifica la connessione internet.',
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleGenerateRoutine = async () => {
    setIsGeneratingRoutine(true);
    setGenError(null);

    try {
      const res = await fetch('/api/generate-routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          availableTimeMinutes: availableTime,
          voiceType: vocalProfile?.voiceCategory || 'Generico',
        }),
      });

      const data = await res.json();
      if (res.ok && data.routine) {
        setGeneratedRoutine(data.routine);
      } else {
        setGenError(data.error || 'Impossibile generare la routine.');
      }
    } catch (err: any) {
      setGenError('Errore di connessione durante la generazione.');
    } finally {
      setIsGeneratingRoutine(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Sub-tab switcher */}
      <div className="flex space-x-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 w-fit">
        <button
          onClick={() => setActiveSubTab('chat')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 ${
            activeSubTab === 'chat'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Chiedi al Coach AI</span>
        </button>

        <button
          onClick={() => setActiveSubTab('routine_generator')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 ${
            activeSubTab === 'routine_generator'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Generatore Routine Su Misura</span>
        </button>
      </div>

      {/* CHAT TAB */}
      {activeSubTab === 'chat' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          {/* Quick Prompt Chips */}
          <div className="flex overflow-x-auto space-x-2 pb-2 scrollbar-none">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="bg-slate-800/80 hover:bg-slate-800 text-indigo-300 hover:text-white px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border border-indigo-500/20 transition-colors shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Window */}
          <div className="h-[420px] bg-slate-950 p-4 rounded-2xl border border-slate-800 overflow-y-auto space-y-4 scrollbar-none">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start space-x-3 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            ))}

            {isChatLoading && (
              <div className="flex items-center space-x-2 text-indigo-400 text-xs italic">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Il Coach Vocale sta elaborando i consigli per te...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Fai una domanda sulla tua voce o sulla tecnica vocale..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={isChatLoading || !inputText.trim()}
              className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl transition-all shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* ROUTINE GENERATOR TAB */}
      {activeSubTab === 'routine_generator' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Generatore AI di Scheda di Allenamento Vocale</span>
            </h3>
            <p className="text-xs text-slate-400">
              L'Intelligenza Artificiale compone una routine personalizzata passo dopo passo in base al tuo tempo ed obiettivo!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Obiettivo Principale</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Riscaldamento rapido 10 minuti">Riscaldamento rapido prima delle prove (10m)</option>
                  <option value="Acuti brillanti senza sforzo">Acuti brillanti senza sforzare la gola</option>
                  <option value="Agilità vocale e riff/runs">Agilità vocale, riff e fioriture pop/R&B</option>
                  <option value="Passaggio di registro e voce mista">Padronanza del passaggio di registro (Mix voice)</option>
                  <option value="Defaticamento dopo concerto">Defaticamento vocale e recupero dalla stanchezza</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Tempo a disposizione (Minuti)</label>
                <input
                  type="number"
                  min="5"
                  max="45"
                  value={availableTime}
                  onChange={(e) => setAvailableTime(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateRoutine}
              disabled={isGeneratingRoutine}
              className="w-full py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white font-black text-sm rounded-2xl shadow-xl hover:brightness-110 transition-all flex items-center justify-center space-x-2"
            >
              {isGeneratingRoutine ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Composizione Scheda in Corso...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Genera Routine Personalizzata con Gemini AI</span>
                </>
              )}
            </button>

            {genError && (
              <div className="p-3 bg-rose-950 border border-rose-800 text-rose-200 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{genError}</span>
              </div>
            )}
          </div>

          {/* Render Generated Routine Card */}
          {generatedRoutine && (
            <div className="bg-slate-900 border border-purple-500/40 rounded-3xl p-6 shadow-2xl space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-2xl font-black text-white mt-1">{generatedRoutine.routineName}</h3>
                <p className="text-slate-400 text-xs sm:text-sm mt-1">{generatedRoutine.description}</p>
              </div>

              {/* Steps List */}
              <div className="space-y-4">
                {generatedRoutine.steps.map((step, idx) => (
                  <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-300 text-sm">
                        Fase {idx + 1}: {step.title}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{step.instruction}</p>

                    <div className="flex flex-wrap gap-2 pt-2 text-[11px]">
                      <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800 text-slate-400">
                        Vocale: <strong className="text-white">{step.vowel}</strong>
                      </span>
                      <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800 text-slate-400">
                        Focus: <strong className="text-indigo-300">{step.focus}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
