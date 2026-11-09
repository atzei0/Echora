import React, { useState, useRef } from 'react';
import { Mic, Square, Play, Pause, Trash2, Save, Volume2, Upload, AlertTriangle, HelpCircle } from 'lucide-react';
import { SavedRecording } from '../types';

interface AudioRecorderProps {
  onSaveRecording: (recording: SavedRecording) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onSaveRecording }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTimeSec, setRecordingTimeSec] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [exerciseName, setExerciseName] = useState('Esercizio Vocale');
  const [takeNote, setTakeNote] = useState('');
  const [recorderError, setRecorderError] = useState<string | null>(null);
  const [isMicBlocked, setIsMicBlocked] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const startRecording = async () => {
    setRecorderError(null);
    setIsMicBlocked(false);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('La registrazione audio dal browser non è supportata su questo dispositivo. Puoi comunque caricare un file audio.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTimeSec(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTimeSec((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('AudioRecorder mic error:', err);
      const isPerm = 
        err?.name === 'NotAllowedError' || 
        err?.name === 'PermissionDeniedError' ||
        (typeof err?.message === 'string' && /permission|denied|not allowed/i.test(err.message));

      if (isPerm) {
        setIsMicBlocked(true);
        setRecorderError('Accesso al microfono bloccato dal browser (Permesso negato). Sbloccalo dall\'icona lucchetto/impostazioni nella barra in alto, oppure carica direttamente un file audio qui sotto.');
      } else {
        setRecorderError(err?.message || 'Impossibile accedere al microfono.');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setRecordingTimeSec(10);
    setExerciseName(file.name.replace(/\.[^/.]+$/, ''));
    setRecorderError(null);
    setIsMicBlocked(false);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const handleSave = () => {
    if (!audioUrl) return;

    const newRec: SavedRecording = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('it-IT') + ' ' + new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      exerciseTitle: exerciseName || 'Registrazione Canto',
      durationSeconds: recordingTimeSec,
      audioBlobUrl: audioUrl,
      note: takeNote || 'Nessuna nota aggiuntiva.',
    };

    onSaveRecording(newRec);
    setAudioUrl(null);
    setTakeNote('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Mic className="w-4 h-4 text-rose-400" />
          <span>Registratore Memo Vocali</span>
        </h3>
        {isRecording && (
          <span className="text-xs font-bold text-rose-400 animate-pulse flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Registrazione: {recordingTimeSec}s
          </span>
        )}
      </div>

      {recorderError && (
        <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="font-semibold leading-snug">{recorderError}</span>
          </div>
          {isMicBlocked && (
            <div className="pt-2 border-t border-rose-500/20 text-[11px] text-slate-300 space-y-1">
              <p>💡 <strong>Come sbloccare:</strong> Clicca sul lucchetto o sulle impostazioni sito nella barra degli indirizzi in alto, imposta <em>Microfono</em> su <em>Consenti</em> e ricarica.</p>
              <p>In alternativa, puoi caricare direttamente una registrazione audio qui sotto senza usare il microfono del browser!</p>
            </div>
          )}
        </div>
      )}

      {/* Hidden file input for uploading audio files */}
      <input
        type="file"
        ref={fileInputRef}
        accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
        onChange={handleFileUpload}
        className="hidden"
      />

      {!isRecording && !audioUrl && (
        <div className="space-y-3">
          <button
            onClick={startRecording}
            className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Mic className="w-5 h-5" />
            <span>Registra una Prova Vocale</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 text-slate-300 hover:text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            <span>Carica file audio (MP3 / WAV / M4A)</span>
          </button>
        </div>
      )}

      {isRecording && (
        <button
          onClick={stopRecording}
          className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2 animate-pulse cursor-pointer"
        >
          <Square className="w-5 h-5 fill-current" />
          <span>Interrompi Registrazione</span>
        </button>
      )}

      {audioUrl && (
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <span className="text-xs font-semibold text-emerald-400 block">✓ Registrazione Pronta</span>
          <audio src={audioUrl} controls className="w-full" />

          <div className="space-y-2 pt-2">
            <input
              type="text"
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              placeholder="Nome brano o esercizio..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
            />
            <input
              type="text"
              value={takeNote}
              onChange={(e) => setTakeNote(e.target.value)}
              placeholder="Note personali (es. ottima risonanza sul Si3)..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
            />
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1"
            >
              <Save className="w-4 h-4" />
              <span>Salva nel Diario</span>
            </button>
            <button
              onClick={() => setAudioUrl(null)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
            >
              Scarta
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
