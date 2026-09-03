import React, { useState, useEffect } from 'react';
import { Exercise, ExerciseCategory, ScalePatternId } from '../types';
import { VOCAL_EXERCISES } from '../data/exercises';
import { ALL_SCALE_PATTERNS, getScalePatternLabel } from '../data/scalePatterns';
import { useLanguage } from '../context/LanguageContext';
import { useRoutineQueue, RoutineQueueItem } from '../context/RoutineQueueContext';
import {
  Play,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Save,
  CheckCircle2,
  Music,
  Zap,
  Mic,
  Activity,
  Heart,
  Wind,
  Target,
  Sliders,
  Copy,
  Clock,
  AlertCircle,
  FolderOpen,
  HelpCircle,
  ListPlus,
  RefreshCw,
  Info
} from 'lucide-react';

export interface CustomExerciseStep {
  id: string;
  exerciseId: string;
  title: string;
  category: ExerciseCategory;
  scalePattern: ScalePatternId;
  vowel: string;
  bpm: number;
  targetTab: 'warmup' | 'exercises' | 'workout' | 'cooldown';
  customNotes?: string;
}

export interface SavedCustomRoutine {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  steps: CustomExerciseStep[];
}

const STORAGE_KEY = 'echora_saved_custom_routines';
const ACTIVE_ROUTINE_KEY = 'echora_active_custom_routine_id';

const createInitialBlankRoutine = (isEn: boolean, index = 1): SavedCustomRoutine => ({
  id: `custom_routine_${Date.now()}`,
  name: isEn ? `My Custom Routine ${index}` : `La Mia Routine ${index}`,
  description: isEn ? 'Personalized exercise sequence' : 'Componi la tua sequenza di esercizi',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  steps: [],
});

interface CustomRoutineBuilderProps {
  onNavigate: (tab: string, subTool?: 'range' | 'tuner' | 'breathing' | 'routine', fromLabel?: string) => void;
}

export const CustomRoutineBuilder: React.FC<CustomRoutineBuilderProps> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const { startRoutineQueue } = useRoutineQueue();

  // Load saved routines from localStorage (strictly user-created routines, no presets)
  const [savedRoutines, setSavedRoutines] = useState<SavedCustomRoutine[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const userOnly = parsed.filter(
            (r) => r && r.id && !r.id.startsWith('preset_') && !r.id.includes('preset')
          );
          if (userOnly.length > 0) return userOnly;
        }
      }
    } catch (e) {
      console.error('Error loading custom routines:', e);
    }
    return [createInitialBlankRoutine(language === 'en')];
  });

  const [selectedRoutineId, setSelectedRoutineId] = useState<string>(() => {
    try {
      const activeId = localStorage.getItem(ACTIVE_ROUTINE_KEY);
      if (activeId && savedRoutines.some((r) => r.id === activeId)) return activeId;
    } catch {}
    return savedRoutines[0]?.id || '';
  });

  const currentRoutine =
    savedRoutines.find((r) => r.id === selectedRoutineId) || savedRoutines[0] || createInitialBlankRoutine(isEn);

  // Routine editing state
  const [routineName, setRoutineName] = useState<string>(currentRoutine?.name || '');
  const [routineDesc, setRoutineDesc] = useState<string>(currentRoutine?.description || '');
  const [steps, setSteps] = useState<CustomExerciseStep[]>(currentRoutine?.steps || []);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<boolean>(false);

  // Sync state when selectedRoutineId changes
  useEffect(() => {
    if (currentRoutine) {
      setRoutineName(currentRoutine.name);
      setRoutineDesc(currentRoutine.description || '');
      setSteps(currentRoutine.steps || []);
      try {
        localStorage.setItem(ACTIVE_ROUTINE_KEY, currentRoutine.id);
      } catch {}
    }
  }, [selectedRoutineId]);

  // Save current routine to localStorage
  const handleSaveRoutine = () => {
    const updatedRoutine: SavedCustomRoutine = {
      ...currentRoutine,
      name: routineName.trim() || (isEn ? 'My Custom Routine' : 'La Mia Routine Personalizzata'),
      description: routineDesc.trim(),
      updatedAt: Date.now(),
      steps,
    };

    const updatedList = savedRoutines.map((r) => (r.id === updatedRoutine.id ? updatedRoutine : r));
    setSavedRoutines(updatedList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 2500);
    } catch (e) {
      console.error('Error saving routine:', e);
    }
  };

  // Create new blank routine
  const handleCreateNewRoutine = () => {
    const newRoutine = createInitialBlankRoutine(isEn, savedRoutines.length + 1);
    const updated = [...savedRoutines, newRoutine];
    setSavedRoutines(updated);
    setSelectedRoutineId(newRoutine.id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Duplicate current routine
  const handleDuplicateRoutine = () => {
    const dupId = `custom_routine_${Date.now()}`;
    const duplicated: SavedCustomRoutine = {
      ...currentRoutine,
      id: dupId,
      name: `${routineName} (${isEn ? 'Copy' : 'Copia'})`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      steps: steps.map((s) => ({ ...s, id: `step_${Date.now()}_${Math.random().toString(36).substring(2, 6)}` })),
    };

    const updated = [...savedRoutines, duplicated];
    setSavedRoutines(updated);
    setSelectedRoutineId(dupId);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Delete routine
  const handleDeleteRoutine = (idToDelete: string) => {
    if (savedRoutines.length <= 1) {
      alert(isEn ? 'You must keep at least one routine.' : 'Devi mantenere almeno una routine nella lista.');
      return;
    }
    const updated = savedRoutines.filter((r) => r.id !== idToDelete);
    setSavedRoutines(updated);
    setSelectedRoutineId(updated[0].id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Step operations: Move Up, Move Down, Remove, Update
  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= steps.length) return;
    const newSteps = [...steps];
    const [moved] = newSteps.splice(index, 1);
    newSteps.splice(newIndex, 0, moved);
    setSteps(newSteps);
  };

  const handleRemoveStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps);
  };

  const handleUpdateStep = (index: number, updates: Partial<CustomExerciseStep>) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    setSteps(newSteps);
  };

  // Add exercise from modal
  const handleAddExerciseToRoutine = (ex: Exercise) => {
    let defaultTargetTab: 'warmup' | 'exercises' | 'workout' | 'cooldown' = 'workout';
    if (ex.category === 'SOVT' || ex.category === 'Vocalizzi') defaultTargetTab = 'exercises';
    else if (ex.category === 'Defaticamento') defaultTargetTab = 'cooldown';

    const newStep: CustomExerciseStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      exerciseId: ex.id,
      title: ex.title,
      category: ex.category,
      scalePattern: ex.scalePattern,
      vowel: ex.defaultVowel || 'A',
      bpm: ex.defaultTempoBpm || 120,
      targetTab: defaultTargetTab,
    };

    setSteps([...steps, newStep]);
    setShowAddModal(false);
  };

  // START / PLAY SEQUENTIAL ROUTINE
  const handleStartCustomRoutine = (startIndex = 0) => {
    if (steps.length === 0) return;

    // Auto-save changes first
    handleSaveRoutine();

    // Convert steps to RoutineQueueItem format
    const queueSteps: RoutineQueueItem[] = steps.map((s) => ({
      id: s.id,
      title: s.title,
      duration: '',
      vowel: s.vowel,
      focus: s.category,
      category: s.category,
      scalePattern: s.scalePattern,
      exerciseId: s.exerciseId,
      targetTab: s.targetTab,
      bpm: s.bpm,
      items: [`Suono: ${s.vowel}`, `Tempo: ${s.bpm} BPM`, `Categoria: ${s.category}`],
    }));

    startRoutineQueue(routineName.trim() || (isEn ? 'Custom Routine' : 'Routine Personalizzata'), isEn ? 'Custom' : 'Personalizzata', queueSteps, startIndex);

    // Navigate to first exercise tab
    const targetTab = queueSteps[startIndex]?.targetTab || 'exercises';
    onNavigate(targetTab, 'routine', isEn ? 'Custom Routine Builder' : 'Costruisci la tua Routine');
  };

  // Filtered exercises for Add Modal
  const categoriesList: { id: string; label: string }[] = [
    { id: 'ALL', label: isEn ? 'All Exercises' : 'Tutti gli Esercizi' },
    { id: 'SOVT', label: 'SOVT' },
    { id: 'Vocalizzi', label: isEn ? 'Vocalizations' : 'Vocalizzi' },
    { id: 'Agilità', label: isEn ? 'Agility' : 'Agilità' },
    { id: 'Risonanze', label: isEn ? 'Resonance' : 'Risonanza' },
    { id: 'Voce Mista', label: isEn ? 'Mixed Voice' : 'Voce Mista' },
    { id: 'Adduzione', label: isEn ? 'Cord Closure' : 'Adduzione' },
    { id: 'Defaticamento', label: isEn ? 'Cooldown' : 'Defaticamento' },
  ];

  const filteredExercises = VOCAL_EXERCISES.filter((ex) => {
    const matchesCat =
      selectedCategoryFilter === 'ALL' ||
      ex.category === selectedCategoryFilter ||
      (selectedCategoryFilter === 'Voce Mista' && ex.category === 'MIX');
    const matchesSearch =
      searchQuery.trim() === '' ||
      ex.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ex.description && ex.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ex.defaultVowel && ex.defaultVowel.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Info & Selector */}
      <div className="bg-slate-900 border border-sky-400/70 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden space-y-5">
        <div className="absolute top-0 right-0 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/20 shrink-0">
              <Sliders className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span>{isEn ? 'Build Your Custom Routine' : 'Costruisci la tua Routine'}</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                {isEn
                  ? 'Select and arrange your favorite exercises to play them consecutively without searching every day.'
                  : 'Scegli e componi la tua sequenza di esercizi per metterli in play uno dopo l\'altro ogni giorno senza doverli cercare ad uno ad uno.'}
              </p>
            </div>
          </div>

          {/* Routine Switcher / New Routine Button */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="relative min-w-[200px]">
              <select
                value={selectedRoutineId}
                onChange={(e) => setSelectedRoutineId(e.target.value)}
                className="w-full bg-slate-950 border border-sky-500/50 rounded-xl px-3.5 py-2 text-xs font-bold text-sky-200 focus:outline-none focus:border-sky-400 cursor-pointer appearance-none pr-8"
              >
                {savedRoutines.map((r) => (
                  <option key={r.id} value={r.id} className="bg-slate-900 text-white font-bold py-1.5">
                    {r.name} ({r.steps?.length || 0} es.)
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-sky-400">
                <FolderOpen className="w-3.5 h-3.5" />
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateNewRoutine}
              className="px-3 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/50 text-sky-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title={isEn ? 'Create new blank routine' : 'Crea nuova routine vuota'}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isEn ? 'New' : 'Nuova'}</span>
            </button>

            <button
              type="button"
              onClick={handleDuplicateRoutine}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title={isEn ? 'Duplicate current routine' : 'Duplica questa routine'}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{isEn ? 'Duplicate' : 'Duplica'}</span>
            </button>

            {savedRoutines.length > 1 && (
              <button
                type="button"
                onClick={() => handleDeleteRoutine(currentRoutine.id)}
                className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 hover:text-red-100 transition-all cursor-pointer"
                title={isEn ? 'Delete routine' : 'Elimina routine'}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Routine Name & Quick Meta Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span>{isEn ? 'Routine Name' : 'Nome della Routine'}</span>
            </label>
            <input
              type="text"
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              placeholder={isEn ? 'e.g. My Morning Warmup' : 'es. La Mia Routine del Mattino'}
              className="w-full bg-slate-950 border border-slate-800 focus:border-sky-400 focus:ring-1 focus:ring-sky-400 rounded-xl px-3.5 py-2.5 text-sm font-extrabold text-white outline-none"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={handleSaveRoutine}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4 text-sky-400" />
              <span>{saveSuccessNotice ? (isEn ? 'Saved!' : 'Salvata!') : (isEn ? 'Save' : 'Salva')}</span>
            </button>

            <button
              type="button"
              onClick={() => handleStartCustomRoutine(0)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02]"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>{isEn ? 'Play All' : 'Avvia Routine'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Routine Steps Sequence List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-sky-400" />
              <span>{isEn ? 'Exercise Sequence' : 'Sequenza Esercizi in Coda'}</span>
            </h3>
            <span className="text-xs font-extrabold text-sky-300 bg-sky-950 px-2.5 py-0.5 rounded-full border border-sky-800">
              {steps.length} {isEn ? 'exercises' : 'esercizi'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>{isEn ? 'Add Exercise' : 'Aggiungi Esercizio +'}</span>
          </button>
        </div>

        {/* Steps List */}
        <div className="space-y-3.5">
          {steps.length === 0 ? (
            <div className="p-8 sm:p-12 rounded-2xl bg-slate-950/80 border border-dashed border-sky-500/40 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/30">
                <Music className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h4 className="text-base sm:text-lg font-black text-white">
                  {isEn ? 'No exercises in this routine yet' : 'Nessun esercizio presente in questa routine'}
                </h4>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {isEn
                    ? 'Add your first vocal exercise by clicking the button below to start building your personalized routine.'
                    : 'Questa routine è vuota. Clicca sul pulsante qui sotto per aggiungere il tuo primo esercizio (SOVT, Vocalizzi, Voce Mista, Agilità, Risonanze o Defaticamento).'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-black text-sm shadow-xl shadow-sky-500/25 inline-flex items-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <Plus className="w-5 h-5 text-slate-950" />
                <span>{isEn ? 'Add First Exercise' : 'Aggiungi il Primo Esercizio +'}</span>
              </button>
            </div>
          ) : (
            steps.map((step, idx) => {
              const exInfo = VOCAL_EXERCISES.find((e) => e.id === step.exerciseId) || VOCAL_EXERCISES[0];
              const allowedPatterns = exInfo.allowedPatterns || [step.scalePattern];

              return (
                <div
                  key={step.id}
                  className="bg-slate-950/90 border border-slate-800 hover:border-sky-500/40 rounded-2xl p-4 sm:p-5 transition-all space-y-3 shadow-lg"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Left: Index + Title + Category */}
                    <div className="flex items-start space-x-3">
                      <span className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-300 font-black text-xs flex items-center justify-center border border-sky-400/40 shrink-0 mt-0.5">
                        {idx + 1}
                      </span>

                      <div className="space-y-1">
                        <div className="flex items-center flex-wrap gap-2">
                          <h4 className="font-extrabold text-white text-sm sm:text-base">{step.title}</h4>
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-sky-300 border border-slate-700">
                            {step.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1">{exInfo.description}</p>
                      </div>
                    </div>

                    {/* Right: Quick Play Step + Move Up / Down + Delete */}
                    <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartCustomRoutine(idx)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 hover:text-white text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer"
                        title={isEn ? 'Play from this step' : 'Metti in play da questo esercizio'}
                      >
                        <Play className="w-3 h-3 fill-emerald-300" />
                        <span>{isEn ? 'Play from here' : 'Play da qui'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveStep(idx, 'up')}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          idx === 0
                            ? 'border-slate-800 text-slate-700 cursor-not-allowed'
                            : 'border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                        }`}
                        title={isEn ? 'Move Up' : 'Sposta Su'}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        disabled={idx === steps.length - 1}
                        onClick={() => handleMoveStep(idx, 'down')}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          idx === steps.length - 1
                            ? 'border-slate-800 text-slate-700 cursor-not-allowed'
                            : 'border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                        }`}
                        title={isEn ? 'Move Down' : 'Sposta Giù'}
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveStep(idx)}
                        className="p-1.5 rounded-lg border border-red-900/60 bg-red-950/30 text-red-400 hover:text-red-200 hover:bg-red-900/60 transition-all cursor-pointer"
                        title={isEn ? 'Remove exercise' : 'Rimuovi esercizio'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Sub Controls: Pattern, Sound / Vowel, Tempo BPM */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2.5 border-t border-slate-800/80">
                    {/* Melodic Pattern Select */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Music className="w-3 h-3 text-sky-400" /> {isEn ? 'Pattern' : 'Pattern Melodico'}
                      </label>
                      <select
                        value={step.scalePattern}
                        onChange={(e) => handleUpdateStep(idx, { scalePattern: e.target.value as ScalePatternId })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-sky-400 cursor-pointer truncate"
                      >
                        {ALL_SCALE_PATTERNS.filter(
                          (p) => allowedPatterns.length === 0 || allowedPatterns.includes(p.id) || p.id === step.scalePattern
                        ).map((p) => (
                          <option key={p.id} value={p.id}>
                            {getScalePatternLabel(p, language)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Vowel / Sound */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Mic className="w-3 h-3 text-pink-400" /> {isEn ? 'Sound / Vowel' : 'Suono / Vocale'}
                      </label>
                      <input
                        type="text"
                        value={step.vowel}
                        onChange={(e) => handleUpdateStep(idx, { vowel: e.target.value })}
                        placeholder="es. MEEE, MUM"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-bold text-pink-300 focus:outline-none focus:border-pink-400"
                      />
                    </div>

                    {/* Tempo BPM */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400" /> {isEn ? 'Tempo' : 'Velocità'} ({step.bpm} BPM)
                      </label>
                      <input
                        type="range"
                        min={70}
                        max={180}
                        step={5}
                        value={step.bpm}
                        onChange={(e) => handleUpdateStep(idx, { bpm: Number(e.target.value) })}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 mt-2"
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Big Bottom Play Button */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-sky-400" />
            <span>{isEn ? 'Add Another Exercise' : 'Aggiungi Altro Esercizio'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleStartCustomRoutine(0)}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer hover:scale-105"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>{isEn ? 'Start Sequential Playback' : 'Metti in Play uno dopo l\'altro'}</span>
          </button>
        </div>
      </div>

      {/* Modal: Add Exercise from Library */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-6 animate-fadeIn">
          <div className="bg-slate-900 border border-sky-400/80 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <ListPlus className="w-5 h-5 text-sky-400" />
                  <span>{isEn ? 'Add Exercise to Your Routine' : 'Scegli Esercizio da Aggiungere'}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  {isEn
                    ? 'Click on any exercise to add it to your custom sequence.'
                    : 'Clicca su un esercizio per inserirlo nella tua routine.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Search and Category Filter */}
            <div className="p-3 sm:p-4 border-b border-slate-800 space-y-3 bg-slate-950/60">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isEn ? 'Search exercise by name or vowel (e.g. MUM, Lip Thrill, Agility)...' : 'Cerca esercizio per nome o suono (es. MUM, Lip Thrill, Agilità)...'}
                className="w-full bg-slate-900 border border-slate-800 focus:border-sky-400 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold text-white outline-none"
              />

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {categoriesList.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(cat.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategoryFilter === cat.id
                        ? 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/20'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Exercise List Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar">
              {filteredExercises.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs sm:text-sm">
                  {isEn ? 'No exercises found.' : 'Nessun esercizio trovato con i filtri selezionati.'}
                </div>
              ) : (
                filteredExercises.map((ex) => (
                  <div
                    key={ex.id}
                    onClick={() => handleAddExerciseToRoutine(ex)}
                    className="bg-slate-950/90 border border-slate-800 hover:border-sky-400 p-3.5 sm:p-4 rounded-2xl transition-all cursor-pointer group flex items-center justify-between gap-3 shadow-md hover:bg-slate-900"
                  >
                    <div className="space-y-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-sm group-hover:text-sky-300 transition-colors">
                          {ex.title}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
                          {ex.category}
                        </span>
                        {ex.defaultVowel && (
                          <span className="text-[10px] font-bold text-pink-300 bg-pink-950/40 px-2 py-0.5 rounded border border-pink-800/40">
                            {ex.defaultVowel}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-snug line-clamp-2">{ex.description}</p>
                    </div>

                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl bg-sky-500/20 group-hover:bg-sky-500 text-sky-300 group-hover:text-slate-950 font-black text-xs transition-all flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Add' : 'Aggiungi'}</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Disclaimer Note */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex items-start gap-3 shadow-lg">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed">
            <strong className="text-amber-300 font-bold">Nota bene:</strong> questa routine è generica e non è pensata per i tuoi bisogni specifici, è sempre bene farsi seguire da un insegnante.
          </p>
        </div>
      </div>
    </div>
  );
};
