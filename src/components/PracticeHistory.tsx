import React from 'react';
import { PracticeSession, SavedRecording } from '../types';
import { AudioRecorder } from './AudioRecorder';
import { BookOpen, Calendar, Clock, Award, Trash2, Play } from 'lucide-react';

interface PracticeHistoryProps {
  sessions: PracticeSession[];
  recordings: SavedRecording[];
  onSaveRecording: (recording: SavedRecording) => void;
  onDeleteRecording: (id: string) => void;
  streak: number;
  totalMinutes: number;
}

export const PracticeHistory: React.FC<PracticeHistoryProps> = ({
  sessions,
  recordings,
  onSaveRecording,
  onDeleteRecording,
  streak,
  totalMinutes,
}) => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xl">
            🔥
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Serie di Allenamento</span>
            <span className="text-2xl font-black text-white">{streak} Giorni</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Tempo Totale Canto</span>
            <span className="text-2xl font-black text-white">{totalMinutes} Minuti</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-black text-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Esercizi Completati</span>
            <span className="text-2xl font-black text-white">{sessions.length} Sessioni</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Audio Recorder & Saved Takes */}
        <div className="space-y-6">
          <AudioRecorder onSaveRecording={onSaveRecording} />

          {/* Saved Recordings List */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Memo Vocali Registrati ({recordings.length})</span>
            </h3>

            {recordings.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">
                Nessun memo vocale ancora registrato. Registra la tua prima prova sopra!
              </p>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto scrollbar-none">
                {recordings.map((rec) => (
                  <div key={rec.id} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-300">{rec.exerciseTitle}</span>
                      <span className="text-slate-500 text-[10px]">{rec.date}</span>
                    </div>

                    <audio src={rec.audioBlobUrl} controls className="w-full h-8" />

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 italic">"{rec.note}"</span>
                      <button
                        onClick={() => onDeleteRecording(rec.id)}
                        className="text-rose-400 hover:text-rose-300 p-1"
                        title="Elimina"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Logged Practice Sessions */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span>Storico Sessioni di Canto</span>
          </h3>

          {sessions.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4 text-center">
              Nessuna sessione registrata. Inizia ad allenarti nella sezione "Esercizi Vocali"!
            </p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-none">
              {sessions.map((sess) => (
                <div key={sess.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {sess.exercisesCompleted.join(', ')}
                    </span>
                    <span className="text-[10px] text-slate-400">{sess.date}</span>
                  </div>
                  <span className="text-xs font-black text-indigo-400 bg-indigo-950 px-2.5 py-1 rounded-lg border border-indigo-800">
                    +{Math.max(1, Math.round(sess.durationMinutes))} min
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
