import React from 'react';
import { NoteNotation, VocalRangeProfile } from '../types';
import { VocalExercisePlayer } from './VocalExercisePlayer';

interface VocalWorkoutViewProps {
  notation: NoteNotation;
  vocalProfile: VocalRangeProfile | null;
  onExerciseComplete: (title: string, durationSec: number) => void;
  onNavigate?: (tab: string, subTool?: string) => void;
  onGoBack?: () => void;
  canGoBack?: boolean;
  backButtonLabel?: string;
}

export const VocalWorkoutView: React.FC<VocalWorkoutViewProps> = ({
  notation,
  vocalProfile,
  onExerciseComplete,
  onNavigate,
  onGoBack,
  canGoBack,
  backButtonLabel,
}) => {
  return (
    <VocalExercisePlayer
      notation={notation}
      vocalProfile={vocalProfile}
      onExerciseComplete={onExerciseComplete}
      allowedCategories={['Voce Mista', 'Risonanze', 'Agilità', 'Adduzione', 'Articolazione', 'Ancoraggio', 'Sostegno', 'Dinamiche']}
      title="Allenamento Vocale"
      sectionBadge="Sezione Allenamento"
      onNavigate={onNavigate}
      onGoBack={onGoBack}
      canGoBack={canGoBack}
      backButtonLabel={backButtonLabel}
    />
  );
};
