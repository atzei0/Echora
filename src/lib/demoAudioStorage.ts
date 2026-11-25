// Persistent cloud and server storage for Echora vocal exercise demo recordings
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from './firebase';
import { INPUT_LIMITS, ALLOWED_AUDIO_EXTENSIONS } from '../utils/validation';

let manifestCache: Record<string, { url: string; filename: string; updatedAt: number }> | null = null;
let lastManifestFetch = 0;

// In-memory cache for instant playback and zero latency during session
const memoryAudioCache = new Map<string, string>();

const SAFE_KEY_REGEX = /^[a-zA-Z0-9_-]{1,160}$/;

/**
 * Generates the strictly sanitized, unique identifier for an exercise demo.
 * When a pattern is selected, key is strictly `${exerciseId}__${patternId}`.
 * When no pattern is selected, key is strictly `${exerciseId}`.
 */
export function getExactKey(exerciseId: string, patternId?: string | null): string {
  const safeEx = (exerciseId || '').trim().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, INPUT_LIMITS.EXERCISE_ID_MAX);
  if (!safeEx) return '';
  if (patternId && patternId.trim()) {
    const safePat = patternId.trim().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
    return `${safeEx}__${safePat}`.slice(0, 160);
  }
  return safeEx;
}

/**
 * Fetches the static server manifest of pre-bundled and server-transcoded demo files.
 */
export async function fetchDemoManifest(): Promise<Record<string, { url: string; filename: string; updatedAt: number }>> {
  const now = Date.now();
  if (manifestCache && now - lastManifestFetch < 10000) {
    return manifestCache;
  }

  try {
    const res = await fetch('/api/demo-audio-manifest');
    if (res.ok) {
      const data = await res.json();
      manifestCache = data.demos || {};
      lastManifestFetch = now;
      return manifestCache!;
    }
  } catch (err) {
    console.warn('Could not fetch server demo audio manifest:', err);
  }

  return manifestCache || {};
}

function isValidAudioData(val: string | null | undefined): boolean {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return false;
  if (trimmed.startsWith('data:audio/') || trimmed.startsWith('data:application/octet-stream')) {
    return trimmed.length > 50 && trimmed.length <= 1_400_000;
  }
  if (trimmed.startsWith('/') || trimmed.startsWith('https://')) {
    return trimmed.length <= 2048;
  }
  return false;
}

/**
 * Retrieves the official audio recording for an exercise.
 *
 * Strict Retrieval Policy:
 * 1. Checks memory cache for the exactKey.
 * 2. Checks persistent Firestore cloud database (`demo_audio_recordings/${exactKey}`).
 * 3. Checks static pre-bundled server manifest for exactKey.
 * 4. If exactKey is pattern-specific (e.g. `res_gne__three_notes`) and no pattern recording exists,
 *    checks if the base exercise itself (`res_gne`) has a recording in Firestore or manifest.
 * 5. NEVER performs fuzzy substring searches.
 * 6. NEVER falls back to practice history recordings or unrelated exercises.
 * 7. If no recording exists, returns null.
 */
export async function getDemoAudio(exactKey: string, baseExerciseId?: string): Promise<string | null> {
  if (!exactKey || !SAFE_KEY_REGEX.test(exactKey)) return null;

  // 1. In-memory session cache
  if (memoryAudioCache.has(exactKey)) {
    const cached = memoryAudioCache.get(exactKey);
    if (isValidAudioData(cached)) return cached!;
  }

  // 2. Persistent Firestore cloud database check for exactKey
  try {
    const docRef = doc(db, 'demo_audio_recordings', exactKey);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (isValidAudioData(data?.audioData)) {
        memoryAudioCache.set(exactKey, data.audioData);
        return data.audioData;
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `demo_audio_recordings/${exactKey}`);
  }

  // 3. Static server manifest check for exactKey
  const manifest = await fetchDemoManifest();
  if (manifest[exactKey]?.url && manifest[exactKey].url.startsWith('/')) {
    const url = `${manifest[exactKey].url}?t=${manifest[exactKey].updatedAt || 1}`;
    memoryAudioCache.set(exactKey, url);
    return url;
  }

  // 4. If exactKey is pattern-specific (e.g., contains "__"), check if base exercise has an audio
  if (baseExerciseId && baseExerciseId !== exactKey) {
    const safeBase = getExactKey(baseExerciseId);
    if (!safeBase || !SAFE_KEY_REGEX.test(safeBase)) return null;

    // 4a. Check memory cache for base
    if (memoryAudioCache.has(safeBase)) {
      const cached = memoryAudioCache.get(safeBase);
      if (isValidAudioData(cached)) return cached!;
    }

    // 4b. Check Firestore for safeBase
    try {
      const snapBase = await getDoc(doc(db, 'demo_audio_recordings', safeBase));
      if (snapBase.exists()) {
        const data = snapBase.data();
        if (isValidAudioData(data?.audioData)) {
          memoryAudioCache.set(safeBase, data.audioData);
          return data.audioData;
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `demo_audio_recordings/${safeBase}`);
    }

    // 4c. Check manifest for safeBase
    if (manifest[safeBase]?.url && manifest[safeBase].url.startsWith('/')) {
      const url = `${manifest[safeBase].url}?t=${manifest[safeBase].updatedAt || 1}`;
      memoryAudioCache.set(safeBase, url);
      return url;
    }
  }

  return null;
}

/**
 * Saves a demo audio recording persistently to Firestore and synchronizes with the server.
 * Associated exclusively and strictly with `exactKey`.
 */
export async function saveDemoAudio(
  exactKey: string,
  audioBlob: Blob,
  authorEmail?: string,
  extension = 'webm'
): Promise<string> {
  const safeId = getExactKey(exactKey);
  if (!safeId || !SAFE_KEY_REGEX.test(safeId)) {
    throw new Error('Identificatore esercizio non valido.');
  }

  const normalizedExt = (extension || 'webm').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!ALLOWED_AUDIO_EXTENSIONS.has(normalizedExt)) {
    throw new Error('Formato audio non supportato. Formati consentiti: MP3, WAV, M4A, WebM, OGG.');
  }

  if (audioBlob.size <= 0 || audioBlob.size > INPUT_LIMITS.DEMO_AUDIO_MAX_BYTES) {
    throw new Error('Dimensione file audio non valida (massimo 10 MB).');
  }

  // Convert Blob to Base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(audioBlob);
  });

  if (!base64Data.startsWith('data:audio/') && !base64Data.startsWith('data:video/') && !base64Data.startsWith('data:application/octet-stream')) {
    throw new Error('Il file selezionato non è un file audio valido.');
  }

  const exerciseId = safeId.includes('__') ? safeId.split('__')[0] : safeId;
  const patternId = safeId.includes('__') ? safeId.split('__')[1] : null;

  let firestoreSaved = false;
  // 1. Save to Persistent Firestore Cloud Database (enforce doc payload size <= 1,000,000 bytes for rules)
  if (base64Data.length <= 980_000) {
    try {
      const docRef = doc(db, 'demo_audio_recordings', safeId);
      await setDoc(docRef, {
        key: safeId,
        exerciseId,
        patternId,
        audioData: base64Data,
        extension: normalizedExt,
        updatedAt: Date.now(),
        authorEmail: authorEmail || null,
      });
      firestoreSaved = true;
    } catch (firestoreErr) {
      handleFirestoreError(firestoreErr, OperationType.WRITE, `demo_audio_recordings/${safeId}`);
    }
  }

  // 2. Sync to backend server for disk MP3 transcoding and static hosting (requires Coach Bearer Token)
  const token = await auth.currentUser?.getIdToken().catch(() => null);
  if (!token) {
    if (!firestoreSaved) {
      throw new Error('Sessione scaduta o non autorizzata. Effettua nuovamente il login come Coach.');
    }
    memoryAudioCache.set(safeId, base64Data);
    return base64Data;
  }

  const res = await fetch('/api/admin/save-demo-audio', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      exerciseId: safeId,
      base64Data,
      extension: normalizedExt,
    }),
  });

  if (!res.ok) {
    const errPayload = await res.json().catch(() => ({}));
    if (res.status === 401 || res.status === 403) {
      throw new Error(errPayload.error || 'Non autorizzato al salvataggio delle registrazioni demo.');
    }
    if (!firestoreSaved) {
      throw new Error(errPayload.error || 'Errore nel salvataggio dell\'audio demo.');
    }
  } else {
    const data = await res.json();
    manifestCache = null;
    if (data.url && typeof data.url === 'string' && data.url.startsWith('/')) {
      const publicUrl = `${data.url}?t=${Date.now()}`;
      memoryAudioCache.set(safeId, publicUrl);
      return publicUrl;
    }
  }

  memoryAudioCache.set(safeId, base64Data);
  return base64Data;
}

/**
 * Deletes an official audio demo permanently from Firestore and the server.
 */
export async function deleteDemoAudio(exactKey: string): Promise<void> {
  const safeId = getExactKey(exactKey);
  if (!safeId || !SAFE_KEY_REGEX.test(safeId)) {
    throw new Error('Identificatore esercizio non valido.');
  }

  // 1. Delete from Firestore
  try {
    const docRef = doc(db, 'demo_audio_recordings', safeId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `demo_audio_recordings/${safeId}`);
  }

  // 2. Clear memory cache
  memoryAudioCache.delete(safeId);

  // 3. Delete from backend server
  const token = await auth.currentUser?.getIdToken().catch(() => null);
  if (!token) {
    throw new Error('Sessione non autorizzata per l\'eliminazione.');
  }

  const res = await fetch(`/api/admin/delete-demo-audio/${encodeURIComponent(safeId)}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok && res.status !== 404) {
    const errPayload = await res.json().catch(() => ({}));
    throw new Error(errPayload.error || 'Errore durante l\'eliminazione della registrazione demo.');
  }
  manifestCache = null;
}
