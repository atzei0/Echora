import React, { createContext, useContext, useState, useEffect } from 'react';
import { ScalePatternId, ExerciseCategory } from '../types';

export interface RoutineQueueItem {
  id?: string;
  title: string;
  duration: string;
  vowel: string;
  focus: string;
  instruction?: string;
  items?: string[];
  targetTab: 'warmup' | 'exercises' | 'workout' | 'cooldown';
  scalePattern?: ScalePatternId;
  exerciseId?: string;
  category?: ExerciseCategory;
  bpm?: number;
}

export interface RoutineQueueState {
  routineName: string;
  routineLevel: string;
  steps: RoutineQueueItem[];
  currentIndex: number;
}

interface RoutineQueueContextType {
  activeRoutineQueue: RoutineQueueState | null;
  startRoutineQueue: (routineName: string, routineLevel: string, steps: RoutineQueueItem[], startIndex?: number) => void;
  goToNextExercise: () => RoutineQueueItem | null;
  goToPrevExercise: () => RoutineQueueItem | null;
  goToStepIndex: (index: number) => RoutineQueueItem | null;
  clearRoutineQueue: () => void;
  currentStep: RoutineQueueItem | null;
  hasNextExercise: boolean;
  hasPrevExercise: boolean;
}

const RoutineQueueContext = createContext<RoutineQueueContextType | undefined>(undefined);

export const RoutineQueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRoutineQueue, setActiveRoutineQueue] = useState<RoutineQueueState | null>(() => {
    try {
      const saved = sessionStorage.getItem('echora_active_routine_queue');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (activeRoutineQueue) {
        sessionStorage.setItem('echora_active_routine_queue', JSON.stringify(activeRoutineQueue));
      } else {
        sessionStorage.removeItem('echora_active_routine_queue');
      }
    } catch (e) {
      console.error('Error saving routine queue to sessionStorage', e);
    }
  }, [activeRoutineQueue]);

  const startRoutineQueue = (
    routineName: string,
    routineLevel: string,
    steps: RoutineQueueItem[],
    startIndex = 0
  ) => {
    setActiveRoutineQueue({
      routineName,
      routineLevel,
      steps,
      currentIndex: Math.max(0, Math.min(startIndex, steps.length - 1)),
    });
  };

  const goToNextExercise = (): RoutineQueueItem | null => {
    if (!activeRoutineQueue) return null;
    if (activeRoutineQueue.currentIndex < activeRoutineQueue.steps.length - 1) {
      const nextIndex = activeRoutineQueue.currentIndex + 1;
      setActiveRoutineQueue({
        ...activeRoutineQueue,
        currentIndex: nextIndex,
      });
      return activeRoutineQueue.steps[nextIndex] || null;
    }
    return null;
  };

  const goToPrevExercise = (): RoutineQueueItem | null => {
    if (!activeRoutineQueue) return null;
    if (activeRoutineQueue.currentIndex > 0) {
      const prevIndex = activeRoutineQueue.currentIndex - 1;
      setActiveRoutineQueue({
        ...activeRoutineQueue,
        currentIndex: prevIndex,
      });
      return activeRoutineQueue.steps[prevIndex] || null;
    }
    return null;
  };

  const goToStepIndex = (index: number): RoutineQueueItem | null => {
    if (!activeRoutineQueue || index < 0 || index >= activeRoutineQueue.steps.length) return null;
    setActiveRoutineQueue({
      ...activeRoutineQueue,
      currentIndex: index,
    });
    return activeRoutineQueue.steps[index] || null;
  };

  const clearRoutineQueue = () => {
    setActiveRoutineQueue(null);
  };

  const currentStep = activeRoutineQueue
    ? activeRoutineQueue.steps[activeRoutineQueue.currentIndex] || null
    : null;

  const hasNextExercise = activeRoutineQueue
    ? activeRoutineQueue.currentIndex < activeRoutineQueue.steps.length - 1
    : false;

  const hasPrevExercise = activeRoutineQueue
    ? activeRoutineQueue.currentIndex > 0
    : false;

  return (
    <RoutineQueueContext.Provider
      value={{
        activeRoutineQueue,
        startRoutineQueue,
        goToNextExercise,
        goToPrevExercise,
        goToStepIndex,
        clearRoutineQueue,
        currentStep,
        hasNextExercise,
        hasPrevExercise,
      }}
    >
      {children}
    </RoutineQueueContext.Provider>
  );
};

export const useRoutineQueue = () => {
  const context = useContext(RoutineQueueContext);
  if (!context) {
    throw new Error('useRoutineQueue must be used within a RoutineQueueProvider');
  }
  return context;
};
