import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Mic, Square, RotateCcw, Trash2, Download, Volume2, Check, X, Sparkles, Upload, FileAudio, AlertTriangle, HelpCircle } from 'lucide-react';
import { getDemoAudio, saveDemoAudioOnServer, deleteDemoAudioOnServer, getCandidateExerciseKeys, searchLocalStorageForAudio } from '../lib/demoAudioStorage';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

interface ExerciseDemoAudioPlayerProps {
  exerciseId: string;
  patternId?: string;
  patternName?: string;
  allowedPatterns?: string[];
  exerciseTitle: string;
  accentText?: string;
  accentBorder?: string;
  accentBg?: string;
}

export const ExerciseDemoAudioPlayer: React.FC<ExerciseDemoAudioPlayerProps> = ({
  exerciseId,
  patternId,
  patternName,
  allowedPatterns,
  exerciseTitle,
  accentText = 'text-sky-400',
}) => {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const { user } = useAuth();

  const effectiveDemoKey = patternId ? `${exerciseId}__${patternId}` : exerciseId;

  // Author / Admin permission check: Francesca, dev mode or AI Studio dev host can record/edit audio demos
  const isDevHost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('ais-dev-') ||
    window.location.hostname.includes('run.app') ||
    window.location.hostname.includes('googleusercontent.com') ||
    window.location.hostname.includes('web.app') ||
    window.location.hostname.includes('firebaseapp.com')
  );

  const canManageDemos = Boolean(
    import.meta.env.DEV ||
    isDevHost ||
    (user && (
      user.email?.toLowerCase().includes('francesca') ||
      user.id?.toLowerCase().includes('francesca')
    ))
  );

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Recorder states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordedDuration, setRecordedDuration] = useState<number>(0);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewExtension, setPreviewExtension] = useState<string>('webm');
  const [recorderError, setRecorderError] = useState<string | null>(null);
  const [isMicBlocked, setIsMicBlocked] = useState<boolean>(false);
  const [showMicGuide, setShowMicGuide] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // References to avoid stale closures and runaway timers
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load existing demo audio whenever effectiveDemoKey changes
  useEffect(() => {
    let isMounted = true;
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setPlaybackProgress(0);
    setAudioDuration(0);

    getDemoAudio(effectiveDemoKey, allowedPatterns).then((url) => {
      if (isMounted) {
        if (url) {
          setAudioUrl(url);
          if (audioPlayerRef.current) {
            audioPlayerRef.current.src = url;
            audioPlayerRef.current.load();
          }
          // If loaded from browser localStorage, auto-sync to backend so it persists as .mp3 on disk
          if (url.startsWith('data:audio') && canManageDemos) {
            try {
              fetch(url)
                .then((r) => r.blob())
                .then((blob) => {
                  saveDemoAudioOnServer(effectiveDemoKey, blob).catch(() => {});
                })
                .catch(() => {});
            } catch {}
          }
        } else {
          setAudioUrl(null);
        }
      }
    });

    return () => {
      isMounted = false;
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      cleanupRecorder();
    };
  }, [effectiveDemoKey, allowedPatterns, canManageDemos]);

  const cleanupRecorder = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    mediaRecorderRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  };

  // Playback control
  const togglePlay = () => {
    if (!audioUrl) return;

    if (!audioPlayerRef.current) {
      const el = new Audio(audioUrl);
      audioPlayerRef.current = el;
      el.onended = handleAudioEnded;
      el.ontimeupdate = handleTimeUpdate;
      el.onerror = () => {
        console.warn('Audio demo loading error, trying local fallback');
        const localFallback = searchLocalStorageForAudio(effectiveDemoKey, allowedPatterns);
        if (localFallback && localFallback !== el.src) {
          setAudioUrl(localFallback);
          el.src = localFallback;
          el.load();
          el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
          return;
        }
        setIsPlaying(false);
      };
    }

    const audio = audioPlayerRef.current;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // Ensure source is correctly aligned with audioUrl
      const cleanTarget = audioUrl;
      const currentSrcPath = audio.src.split('?')[0];
      const targetSrcPath = cleanTarget.split('?')[0];

      if (!audio.src || !currentSrcPath.endsWith(targetSrcPath)) {
        audio.src = cleanTarget;
        audio.load();
      }
      try {
        audio.currentTime = 0;
      } catch {}

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((e) => {
            console.warn('Initial playback attempt note:', e);
            // If url was webm, fallback to mp3
            if (audioUrl.includes('.webm')) {
              const mp3Url = audioUrl.replace('.webm', '.mp3');
              setAudioUrl(mp3Url);
              audio.src = mp3Url;
              audio.load();
              audio
                .play()
                .then(() => setIsPlaying(true))
                .catch((err) => {
                  console.warn('Fallback playback error:', err);
                  setIsPlaying(false);
                });
            } else {
              // Try local storage fallback if network failed
              const localFallback = searchLocalStorageForAudio(effectiveDemoKey, allowedPatterns);
              if (localFallback && localFallback !== audio.src) {
                setAudioUrl(localFallback);
                audio.src = localFallback;
                audio.load();
                audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
                return;
              }
              setIsPlaying(false);
            }
          });
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioPlayerRef.current) {
      const cur = audioPlayerRef.current.currentTime;
      const dur = audioPlayerRef.current.duration;
      if (dur && !Number.isNaN(dur) && Number.isFinite(dur)) {
        setAudioDuration(dur);
        setPlaybackProgress((cur / dur) * 100);
      } else {
        setPlaybackProgress(cur > 0 ? 50 : 0);
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setPlaybackProgress(0);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.currentTime = 0;
    }
  };

  // Recording methods
  const startRecording = async () => {
    cleanupRecorder();
    setRecorderError(null);
    setIsMicBlocked(false);
    setPreviewBlob(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    chunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          isEn
            ? 'Microphone recording is not supported in this browser. You can still upload an audio file below.'
            : 'La registrazione da microfono non è supportata dal browser. Puoi comunque caricare un file audio qui sotto.'
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        // Stop audio tracks only after onstop fires so chunks are completely collected
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        if (chunksRef.current.length === 0) {
          setRecorderError(isEn ? 'No audio data captured. Please try again.' : 'Nessun dato audio catturato. Riprova a registrare.');
          return;
        }

        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size < 100) {
          setRecorderError(isEn ? 'Recording too short or silent. Please speak/sing clearly.' : 'Registrazione troppo breve o vuota. Prova a cantare o fare il suono per almeno 2-3 secondi.');
          return;
        }

        const url = URL.createObjectURL(blob);
        setPreviewBlob(blob);
        setPreviewUrl(url);
        setPreviewExtension(mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm');
      };

      // Start recording with timeslice (chunks every 200ms)
      recorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);

      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordingSeconds(elapsed);
      }, 500);
    } catch (err: any) {
      console.warn('Recording initialization error:', err);
      const isPerm =
        err?.name === 'NotAllowedError' ||
        err?.name === 'PermissionDeniedError' ||
        err?.name === 'SecurityError' ||
        (typeof err?.message === 'string' && /permission|denied|not allowed/i.test(err.message));

      if (isPerm) {
        setIsMicBlocked(true);
        setRecorderError(
          isEn
            ? 'Microphone access was blocked by your browser (Permission denied).'
            : 'Accesso al microfono bloccato dal browser (Permesso negato).'
        );
      } else {
        setRecorderError(
          err.message || (isEn ? 'Microphone permission denied.' : 'Accesso al microfono non concesso o non disponibile.')
        );
      }
      cleanupRecorder();
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setRecordedDuration(recordingSeconds || 1);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.requestData();
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('Error stopping media recorder:', e);
      }
    }

    // Do NOT stop stream tracks here synchronously: let recorder.onstop stop them after emitting chunks!
    setIsRecording(false);
  };

  // File upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || 'mp3';
    const blob = file;
    const url = URL.createObjectURL(blob);

    setPreviewBlob(blob);
    setPreviewUrl(url);
    setPreviewExtension(ext);
    setRecordedDuration(5);
    setRecorderError(null);
  };

  const handleSaveDemo = async () => {
    if (!previewBlob) return;
    setIsSaving(true);
    setRecorderError(null);

    try {
      const savedUrl = await saveDemoAudioOnServer(effectiveDemoKey, previewBlob, previewExtension);
      setAudioUrl(savedUrl);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = savedUrl;
        audioPlayerRef.current.load();
      }
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsSaving(false);
        setIsModalOpen(false);
        setPreviewBlob(null);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
      }, 1200);
    } catch (e: any) {
      console.error('Save demo error:', e);
      setRecorderError(isEn ? 'Error saving audio to server.' : 'Errore nel salvataggio dell\'audio sul server.');
      setIsSaving(false);
    }
  };

  const handleDeleteDemo = async () => {
    if (confirm(isEn ? 'Delete this audio demo?' : 'Eliminare questa registrazione audio demo?')) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setIsPlaying(false);
      await deleteDemoAudioOnServer(effectiveDemoKey);
      setAudioUrl(null);
      setIsModalOpen(false);
    }
  };

  const formatSec = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // If user is a normal student/visitor and NO audio demo exists yet: show nothing
  if (!audioUrl && !canManageDemos) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Audio element */}
      {audioUrl && (
        <audio
          ref={audioPlayerRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleAudioEnded}
          onError={() => {
            console.warn('Audio tag encountered error loading source');
            setIsPlaying(false);
          }}
          preload="auto"
        />
      )}

      {/* Main Bar: Senti come suona: */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-md flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-300 shrink-0">
          <Volume2 className={`w-3.5 h-3.5 ${accentText}`} />
          <span>{isEn ? 'Hear How It Sounds:' : 'Senti come suona:'}</span>
        </div>

        {patternName && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-sky-300 border border-slate-700 max-w-[170px] truncate shrink-0" title={patternName}>
            {patternName}
          </span>
        )}

        {audioUrl ? (
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isPlaying
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'
              }`}
              title={isPlaying ? (isEn ? 'Pause demo' : 'Pausa demo') : (isEn ? 'Play demo' : 'Ascolta esempio')}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span className="font-mono text-[11px]">In Riproduzione...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
                  <span>{isEn ? 'Listen' : 'Ascolta'}</span>
                </>
              )}
            </button>

            {/* Admin-only: Edit or Re-record button */}
            {canManageDemos && (
              <button
                onClick={() => {
                  cleanupRecorder();
                  setIsModalOpen(true);
                }}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700/50 cursor-pointer"
                title="Modifica o ri-registra esempio (Coach)"
              >
                <Mic className="w-3.5 h-3.5 text-sky-400" />
              </button>
            )}
          </div>
        ) : (
          /* Admin-only: Button when no demo audio exists yet */
          canManageDemos && (
            <button
              onClick={() => {
                cleanupRecorder();
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-sky-500/20 to-blue-500/20 hover:from-sky-500/30 hover:to-blue-500/30 text-sky-300 border border-sky-400/30 text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
            >
              <Mic className="w-3.5 h-3.5 text-rose-400" />
              <span>+ Registra Esempio (Coach)</span>
            </button>
          )
        )}
      </div>

      {/* ADMIN-ONLY RECORDING & UPLOAD MODAL */}
      {isModalOpen && canManageDemos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-slate-100">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Registrazione Esempio Ufficiale
                </span>
                <h3 className="text-lg font-black text-white mt-0.5">
                  {exerciseTitle}
                </h3>
                {patternName && (
                  <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sky-950/80 border border-sky-700/60 text-sky-300 text-[11px] font-bold">
                    <span>Pattern: {patternName}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  cleanupRecorder();
                  setIsModalOpen(false);
                  setPreviewBlob(null);
                  if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                  }
                }}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {patternName ? (
                <>
                  Registra o carica un breve esempio vocale (3–8 secondi) per il pattern <strong className="text-sky-300">{patternName}</strong>.
                  Verrà salvato sul server e sarà ascoltabile da <strong>tutti gli utenti</strong> quando selezionano questo pattern melodico.
                </>
              ) : (
                <>
                  Registra o carica un breve esempio vocale (3–8 secondi) per questo esercizio.
                  Verrà salvato sul server e sarà ascoltabile da <strong>tutti gli utenti</strong> nella sezione &quot;Senti come suona&quot;.
                </>
              )}
            </p>

            {recorderError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs space-y-1.5">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="font-semibold leading-snug">{recorderError}</span>
                </div>
              </div>
            )}

            {isMicBlocked && (
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                    Come riattivare il microfono nel browser:
                  </span>
                  <button
                    onClick={() => startRecording()}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold text-[11px] border border-amber-400/40 cursor-pointer transition-colors"
                  >
                    Riprova ora
                  </button>
                </div>

                <ul className="space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
                  <li>
                    🌐 <strong className="text-white">Google Chrome / Edge / Firefox:</strong> Clicca sull&apos;icona a sinistra dell&apos;indirizzo web (icona dei cursori 🎛️ o lucchetto 🔒) ➔ trova <strong>Microfono</strong> ➔ seleziona <strong>&quot;Consenti&quot;</strong> ➔ ricarica la pagina.
                  </li>
                  <li>
                    🍎 <strong className="text-white">Safari (iPhone / iPad / Mac):</strong> Tocca <strong>&quot;aA&quot;</strong> nella barra degli indirizzi ➔ <em>Impostazioni sito web</em> ➔ <em>Microfono</em> ➔ <em>Consenti</em>.
                  </li>
                  <li>
                    💻 <strong className="text-white">Impostazioni Computer (Mac/Windows):</strong> Verifica che il tuo browser abbia il permesso di usare il microfono in <em>Impostazioni di Sistema ➔ Privacy e Sicurezza ➔ Microfono</em>.
                  </li>
                </ul>

                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/70 text-slate-200 text-[11px] flex items-center gap-2">
                  <span className="text-base shrink-0">💡</span>
                  <span>
                    <strong>Alternativa veloce:</strong> Puoi usare il pulsante <strong className="text-sky-300">&quot;Carica File Audio&quot;</strong> qui sotto per caricare una nota vocale registrata dal tuo telefono o computer (MP3, WAV, M4A, WebM)!
                  </span>
                </div>
              </div>
            )}

            {saveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Audio demo salvato con successo sul server! Sarà disponibile per tutti.</span>
              </div>
            )}

            {/* Mode 1: Initial Actions (Record or Upload) */}
            {!isRecording && !previewBlob && (
              <div className="space-y-4">
                <button
                  onClick={startRecording}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-sm shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Mic className="w-5 h-5" />
                  <span>Avvia Registrazione Microfono</span>
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-800" />
                  <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-slate-500">oppure</span>
                  <div className="flex-grow border-t border-slate-800" />
                </div>

                {/* Upload File */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-sky-400" />
                  <span>Carica File Audio (MP3 / WAV / M4A)</span>
                </button>
              </div>
            )}

            {/* Mode 2: Active Recording */}
            {isRecording && (
              <div className="bg-slate-950 p-5 rounded-2xl border border-rose-500/50 text-center space-y-4 shadow-inner">
                <div className="flex items-center justify-center gap-2 text-rose-400">
                  <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-xs font-black uppercase tracking-widest">
                    Registrazione in corso...
                  </span>
                </div>
                <div className="text-4xl font-black text-white font-mono">
                  {formatSec(recordingSeconds)}
                </div>
                <p className="text-[11px] text-slate-400">
                  Fai il suono o canta l&apos;esempio (consigliati 3–6 secondi)
                </p>
                <button
                  onClick={stopRecording}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Ferma Registrazione e Ascolta</span>
                </button>
              </div>
            )}

            {/* Mode 3: Preview & Confirmation */}
            {!isRecording && previewBlob && previewUrl && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    Anteprima Registrazione Pronta
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {formatSec(recordedDuration)}
                  </span>
                </div>

                <audio
                  src={previewUrl}
                  controls
                  className="w-full h-10 accent-sky-500 rounded-lg"
                />

                <div className="flex items-center gap-2 pt-1">
                  <button
                    disabled={isSaving}
                    onClick={handleSaveDemo}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSaving ? 'Salvataggio in corso...' : 'Salva Come Esempio'}</span>
                  </button>

                  <button
                    onClick={startRecording}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1 transition-colors border border-slate-700 cursor-pointer"
                    title="Rifai la registrazione"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Existing Audio options in modal */}
            {audioUrl && !previewBlob && (
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="text-slate-500 text-[11px]">Esempio attualmente registrato</span>
                <button
                  onClick={handleDeleteDemo}
                  className="flex items-center gap-1 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Elimina registrazione</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
