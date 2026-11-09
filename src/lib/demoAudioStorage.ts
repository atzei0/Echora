// Server & Client audio demo storage for vocal exercises

let manifestCache: Record<string, { url: string; filename: string; updatedAt: number }> | null = null;
let lastManifestFetch = 0;

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

function isValidAudioData(val: string | null): boolean {
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

export function getCandidateExerciseKeys(exerciseId: string, allowedPatterns?: string[]): string[] {
  const safeId = exerciseId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const baseId = safeId.includes('__') ? safeId.split('__')[0] : safeId;
  const currentPattern = safeId.includes('__') ? safeId.split('__')[1] : null;

  const candidates: string[] = [];
  const add = (k: string) => {
    if (k && !candidates.includes(k)) {
      candidates.push(k);
    }
  };

  // 1. Exact key first
  add(safeId);

  // 2. Base ID
  add(baseId);

  // 3. Stripped bare name (without mix_, vocalizzo_, res_, add_, sovt_)
  const bareName = baseId.replace(/^(mix_|vocalizzo_|res_|add_|sovt_)/, '');
  add(bareName);
  add(`mix_${bareName}`);
  add(`res_${bareName}`);
  add(`add_${bareName}`);
  add(`vocalizzo_${bareName}`);

  // 4. If there's a pattern, try stripped variants with the pattern
  if (currentPattern) {
    add(`${bareName}__${currentPattern}`);
    add(`mix_${bareName}__${currentPattern}`);
    add(`res_${bareName}__${currentPattern}`);
    add(`add_${bareName}__${currentPattern}`);
    add(`vocalizzo_${bareName}__${currentPattern}`);
  }

  // 5. If other patterns exist for this exercise, try them as fallback candidates
  if (allowedPatterns && allowedPatterns.length > 0) {
    for (const pat of allowedPatterns) {
      add(`${baseId}__${pat}`);
      add(`${bareName}__${pat}`);
      add(`mix_${bareName}__${pat}`);
      add(`res_${bareName}__${pat}`);
      add(`add_${bareName}__${pat}`);
    }
  }

  // 6. Equivalence / Rename clusters (covers all past & present exercise names)
  const aliasClusters: string[][] = [
    ['lip_thrill_warmup', 'sovt_lip_trill', 'lip_trill', 'trillo_labbra'],
    ['lip_thrill_warmup__five_notes', 'sovt_lip_trill__five_notes'],
    ['vocalizzo_mam_fissa', 'mix_mam_fissa', 'mix_mam_fissa__fixed_5_notes', 'mam_fissa', 'mix_mam_11111', 'mam_11111', 'res_mam_fissa', 'res_mam_fissa__fixed_5_notes', 'add_mam_fissa', 'add_mam_fissa__fixed_5_notes', 'add_mam_fissa__fixed_3_notes'],
    ['vocalizzo_mee_151', 'vocalizzo_mee_151__gliss_1_5_1', 'mix_mee_gliss_151', 'mix_mee_gliss_151__gliss_1_5_1', 'mee_151', 'mee_glissando_quinta_corta'],
    ['mix_gne_13521', 'mix_gne_12321', 'mix_gne_13531', 'mix_gne', 'gne_gne', 'mix_gne_13521__arpeggio_13521', 'mix_gne_13521__three_notes', 'res_gne', 'res_gne_13521', 'res_gne_12321', 'res_gne__arpeggio_13521', 'res_gne__three_notes', 'add_gne', 'add_gne_13521', 'add_gne_12321', 'add_gne__arpeggio_13521', 'add_gne__three_notes'],
    ['mix_ye_13521', 'mix_ye_12321', 'mix_ye_13531', 'mix_ye', 'ye_ye_ye', 'mix_ye_13521__arpeggio_13521', 'mix_ye_13521__three_notes', 'res_ye', 'res_ye_13521', 'res_ye_12321', 'res_ye__arpeggio_13521', 'res_ye__three_notes', 'add_ye', 'add_ye_13521', 'add_ye_12321', 'add_ye__arpeggio_13521', 'add_ye__three_notes'],
    ['mix_meee', 'vocalizzo_mee', 'mix_mee', 'meee', 'mix_meee__scale_4_notes', 'mix_meee__five_notes', 'mix_meee__scale_4_notes_2x', 'meee_12345'],
    ['mix_mime_ma_mo_mu', 'vocalizzo_mime_ma_mo_mu', 'mime_ma_mo_mu', 'mix_mime_ma_mo_mu__scale_4_notes_5x', 'mix_mime_ma_mo_mu__scale_4_notes'],
    ['mix_mum', 'mum', 'vocalizzo_mum', 'mix_mum__arpeggio_1358888531', 'mix_mum__broad_arpeggio'],
    ['mix_nay', 'nay', 'vocalizzo_nay', 'mix_nay__arpeggio_1358888531', 'mix_nay__broad_arpeggio'],
    ['mix_mne_fissa', 'mne_fissa', 'mix_mne', 'mix_mne_fissa__fixed_3_notes', 'res_mne_fissa', 'res_mne_fissa__fixed_3_notes', 'add_mne_fissa', 'add_mne_fissa__fixed_3_notes', 'add_mne_fissa__fixed_5_notes'],
    ['mix_mee_1_8_5', 'mee_185', 'mix_mee_185', 'mix_mee_1_8_5__arpeggio_185'],
    ['mix_mam_11151', 'mam_11151', 'mix_mam_jump', 'mix_mam_11151__jump_5_1', 'res_mam_11151', 'res_mam_11151__jump_5_1', 'add_mam_11151', 'add_mam_11151__jump_5_1'],
    ['mix_he_he_heee_55531', 'he_he_heee_55531', 'mix_he_he', 'mix_he_he_heee_55531__arpeggio_55531'],
    ['mix_eee_fry_55531', 'eee_fry_55531', 'mix_eee_fry', 'mix_eee_fry_55531__arpeggio_55531'],
    ['mix_he_he_181_gliss', 'he_he_181_gliss', 'mix_he_he_gliss', 'mix_he_he_181_gliss__siren_glide'],
    ['mix_mne_111_5_gliss', 'mne_111_5_gliss', 'mix_mne_gliss', 'mix_mne_111_5_gliss__jump_5_1', 'res_mne_111_5_gliss', 'res_mne_111_5_gliss__jump_5_1'],
    ['res_chicchi', 'res_chicchi_531', 'res_chicchi_12321', 'chicchi', 'chicchi_531', 'res_chicchi__arpeggio_531_desc', 'res_chicchi__three_notes', 'add_chicchi', 'add_chicchi_531', 'add_chicchi_12321', 'add_chicchi__arpeggio_531_desc', 'add_chicchi__three_notes'],
    ['res_chiii', 'res_chiii_531', 'res_chiii_12321', 'chiii', 'chiii_531', 'res_chiii__arpeggio_531_desc', 'res_chiii__three_notes', 'add_chiii', 'add_chiii_531', 'add_chiii_12321', 'add_chiii__arpeggio_531_desc', 'add_chiii__three_notes'],
    ['res_ninni_111_333_111', 'add_ninni_111_333_111', 'ninni_111_333_111', 'ninni', 'res_ninni_111_333_111__ninni_111_333_111', 'add_ninni_111_333_111__ninni_111_333_111'],
    ['mix_mee_gliss', 'mee_gliss', 'mix_mee_12345_glissando', 'mix_mee_gliss__scale_5_gliss_desc'],
  ];

  for (const cluster of aliasClusters) {
    if (cluster.some(item => candidates.includes(item) || item.includes(bareName) || (bareName.length >= 3 && item.includes(bareName)))) {
      for (const item of cluster) {
        add(item);
      }
    }
  }

  return candidates;
}

export function searchLocalStorageForAudio(exerciseId: string, allowedPatterns?: string[]): string | null {
  try {
    const candidates = getCandidateExerciseKeys(exerciseId, allowedPatterns);
    const prefixes = [
      'echora_demo_audio_',
      'demo_audio_',
      'vocalis_demo_audio_',
      'audio_demo_',
      'demo_',
      'echora_demo_',
      ''
    ];

    // 1. Direct candidate check in localStorage with all known prefixes
    for (const prefix of prefixes) {
      for (const key of candidates) {
        const fullKey = prefix ? `${prefix}${key}` : key;
        const local = localStorage.getItem(fullKey);
        if (isValidAudioData(local)) {
          return local!;
        }
      }
    }

    // 2. Check practice recordings array (vocalis_recordings / echora_recordings)
    const baseId = (exerciseId.includes('__') ? exerciseId.split('__')[0] : exerciseId)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/^(mix|vocalizzo)/, '');

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;

      if (k.includes('recordings') || k.includes('vocalis_recordings')) {
        try {
          const raw = localStorage.getItem(k);
          if (raw && raw.startsWith('[')) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
              for (const item of arr) {
                if (item && item.audioData && isValidAudioData(item.audioData)) {
                  const title = (item.exerciseTitle || item.exerciseId || item.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                  if (title.includes(baseId) || (baseId.length >= 3 && title.includes(baseId))) {
                    return item.audioData;
                  }
                }
              }
            }
          }
        } catch {}
      }
    }

    // 3. Fuzzy search across ALL keys in localStorage for any audio data
    if (baseId.length >= 3) {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;

        const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanKey.includes(baseId)) {
          const val = localStorage.getItem(k);
          if (isValidAudioData(val)) {
            return val!;
          }
        }
      }
    }
  } catch (e) {
    console.warn('searchLocalStorageForAudio error:', e);
  }
  return null;
}

export async function getDemoAudio(exerciseId: string, allowedPatterns?: string[]): Promise<string | null> {
  const candidates = getCandidateExerciseKeys(exerciseId, allowedPatterns);
  const manifest = await fetchDemoManifest();

  // 1. Check server manifest for exact key first, then other candidates
  for (const key of candidates) {
    if (manifest[key]?.url) {
      return `${manifest[key].url}?t=${manifest[key].updatedAt || 1}`;
    }
  }

  // 2. Check localStorage (direct candidate list + fuzzy search)
  const localMatch = searchLocalStorageForAudio(exerciseId, allowedPatterns);
  if (localMatch) {
    return localMatch;
  }

  // 3. Fallback direct HEAD check on static mp3 files on server (must be real audio)
  for (const key of candidates) {
    try {
      const headMp3 = await fetch(`/audio/demos/${key}.mp3`, { method: 'HEAD' });
      const ct = headMp3.headers.get('content-type') || '';
      if (headMp3.ok && (ct.includes('audio') || ct.includes('octet-stream'))) {
        return `/audio/demos/${key}.mp3`;
      }
    } catch {}
  }

  return null;
}

export async function saveDemoAudioOnServer(
  exerciseId: string,
  audioBlob: Blob,
  extension = 'webm'
): Promise<string> {
  const safeId = exerciseId.replace(/[^a-zA-Z0-9_-]/g, '_');

  // Convert Blob to Base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(audioBlob);
  });

  // Always cache in localStorage across candidate keys as resilient immediate client backup
  try {
    const candidates = getCandidateExerciseKeys(safeId);
    for (const key of candidates) {
      localStorage.setItem(`echora_demo_audio_${key}`, base64Data);
    }
  } catch {}

  // 1. Save on backend filesystem (public/audio/demos/)
  try {
    const res = await fetch('/api/admin/save-demo-audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        exerciseId: safeId,
        base64Data,
        extension,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      manifestCache = null; // Invalidate manifest cache so it refreshes
      return `${data.url}?t=${Date.now()}`;
    }
  } catch (err) {
    console.warn('Could not save to backend server, using resilient local cache:', err);
  }

  return URL.createObjectURL(audioBlob);
}

export async function deleteDemoAudioOnServer(exerciseId: string): Promise<void> {
  const safeId = exerciseId.replace(/[^a-zA-Z0-9_-]/g, '_');

  try {
    await fetch(`/api/admin/delete-demo-audio/${encodeURIComponent(safeId)}`, {
      method: 'DELETE',
    });
    manifestCache = null;
  } catch (err) {
    console.warn('Error deleting demo audio on server:', err);
  }

  try {
    localStorage.removeItem(`echora_demo_audio_${safeId}`);
  } catch {}
}
