// Persistent cloud and server storage for Echora vocal exercise demo recordings
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

let manifestCache: Record<string, { url: string; filename: string; updatedAt: number }> | null = null;
let lastManifestFetch = 0;

// In-memory cache for instant playback and zero latency during session
const memoryAudioCache = new Map<string, string>();

/**
 * Generates the strictly sanitized, unique identifier for an exercise demo.
 * When a pattern is selected, key is strictly `${exerciseId}__${patternId}`.
 * When no pattern is selected, key is strictly `${exerciseId}`.
 */
export function getExactKey(exerciseId: string, patternId?: string | null): string {
  const safeEx = (exerciseId || '').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  if (patternId && patternId.trim()) {
    const safePat = patternId.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${safeEx}__${safePat}`;
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
  if (trimmed.startsWith('data:audio') || trimmed.startsWith('data:application/octet-stream')) {
    return trimmed.length > 50;
  }
  if (trimmed.startsWith('blob:') || trimmed.startsWith('/') || trimmed.startsWith('http')) {
    return true;
  }
  return trimmed.length > 50;
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
  if (!exactKey) return null;

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
    console.warn(`Firestore read attempt for ${exactKey}:`, err);
  }

  // 3. Static server manifest check for exactKey
  const manifest = await fetchDemoManifest();
  if (manifest[exactKey]?.url) {
    const url = `${manifest[exactKey].url}?t=${manifest[exactKey].updatedAt || 1}`;
    memoryAudioCache.set(exactKey, url);
    return url;
  }

  // 4. If exactKey is pattern-specific (e.g., contains "__"), check if base exercise has an audio
  if (baseExerciseId && baseExerciseId !== exactKey) {
    const safeBase = getExactKey(baseExerciseId);

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
    } catch {}

    // 4c. Check manifest for safeBase
    if (manifest[safeBase]?.url) {
      const url = `${manifest[safeBase].url}?t=${manifest[safeBase].updatedAt || 1}`;
      memoryAudioCache.set(safeBase, url);
      return url;
    }
  }

  // No audio exists for this specific exercise
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
  const safeId = exactKey.replace(/[^a-zA-Z0-9_-]/g, '_');

  // Convert Blob to Base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(audioBlob);
  });

  const exerciseId = safeId.includes('__') ? safeId.split('__')[0] : safeId;
  const patternId = safeId.includes('__') ? safeId.split('__')[1] : null;

  // 1. Save to Persistent Firestore Cloud Database
  try {
    const docRef = doc(db, 'demo_audio_recordings', safeId);
    await setDoc(docRef, {
      key: safeId,
      exerciseId,
      patternId,
      audioData: base64Data,
      extension,
      updatedAt: Date.now(),
      authorEmail: authorEmail || null,
    });
  } catch (firestoreErr) {
    console.error('Firestore demo audio save error:', firestoreErr);
    // If not authenticated or Firestore write blocked, we continue so the local server can still receive it
  }

  // 2. Cache in-memory for instant playback
  memoryAudioCache.set(safeId, base64Data);

  // 3. Sync to backend server for disk MP3 transcoding and static hosting
  try {
    const token = await auth.currentUser?.getIdToken().catch(() => null);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/admin/save-demo-audio', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        exerciseId: safeId,
        base64Data,
        extension,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      manifestCache = null; // Invalidate cache so fresh manifest is fetched
      if (data.url) {
        const publicUrl = `${data.url}?t=${Date.now()}`;
        memoryAudioCache.set(safeId, publicUrl);
        return publicUrl;
      }
    }
  } catch (err) {
    console.warn('Backend server disk sync note (Firestore already persisted):', err);
  }

  return base64Data;
}

/**
 * Deletes an official audio demo permanently from Firestore and the server.
 */
export async function deleteDemoAudio(exactKey: string): Promise<void> {
  const safeId = exactKey.replace(/[^a-zA-Z0-9_-]/g, '_');

  // 1. Delete from Firestore
  try {
    const docRef = doc(db, 'demo_audio_recordings', safeId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore delete demo audio error:', err);
  }

  // 2. Clear memory cache
  memoryAudioCache.delete(safeId);

  // 3. Delete from backend server
  try {
    const token = await auth.currentUser?.getIdToken().catch(() => null);
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    await fetch(`/api/admin/delete-demo-audio/${encodeURIComponent(safeId)}`, {
      method: 'DELETE',
      headers,
    });
    manifestCache = null;
  } catch (err) {
    console.warn('Error deleting demo audio on server:', err);
  }
}
