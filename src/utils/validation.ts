/**
 * Validation and sanitization helpers for Echora client inputs.
 * Preserves legitimate characters (apostrophes, quotes, accented characters)
 * while enforcing strict type, length, format, and URL safety rules.
 */

export const INPUT_LIMITS = {
  NAME_MIN: 1,
  NAME_MAX: 80,
  EMAIL_MAX: 254,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 128,
  VOCAL_LEVEL_MAX: 80,
  ROUTINE_NAME_MAX: 100,
  ROUTINE_DESC_MAX: 300,
  VOWEL_MAX: 40,
  REVIEW_NAME_MAX: 80,
  REVIEW_COMMENT_MIN: 5,
  REVIEW_COMMENT_MAX: 1200,
  RECORDING_NAME_MAX: 100,
  RECORDING_NOTE_MAX: 500,
  SEARCH_MAX: 100,
  AVATAR_MAX_BYTES: 350 * 1024, // <350 KB so Firestore 1 MiB doc limit is safely respected
  DEMO_AUDIO_MAX_BYTES: 10 * 1024 * 1024, // 10 MB
  EXERCISE_ID_MAX: 128,
} as const;

export const ALLOWED_VOCAL_LEVELS = new Set([
  'Allievo / Cantante',
  'Allievo Francesca',
  'Allievo Canto Moderno',
  'Cantante Autodidatta',
  'Corista / Cantante Jazz',
  'Insegnante / Vocal Coach',
]);

export const ALLOWED_REVIEW_TAGS = new Set([
  'Lezioni di Canto Online',
  'Lezioni di Canto in Presenza',
  'Echora',
  'Laboratori',
]);

export const ALLOWED_AUDIO_EXTENSIONS = new Set([
  'mp3',
  'wav',
  'm4a',
  'webm',
  'ogg',
  'mp4',
]);

export const ALLOWED_AVATAR_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

/**
 * Removes dangerous control characters (NUL, C0/C1 control chars) while keeping
 * standard whitespace (\n, \r, \t) and all printable Unicode (apostrophes, accents, emojis).
 */
export function sanitizePlainText(value: unknown, maxLength: number, allowNewlines = false): string {
  if (typeof value !== 'string') return '';
  const pattern = allowNewlines
    ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
    : /[\u0000-\u001F\u007F]/g;
  const cleaned = value.replace(pattern, '').trim();
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) : cleaned;
}

export function isValidEmail(email: string): boolean {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > INPUT_LIMITS.EMAIL_MAX) return false;
  return /^[^\s@<>()[\]\\,;:\s"]+@[^\s@<>()[\]\\,;:\s"]+\.[^\s@<>()[\]\\,;:\s"]{2,}$/.test(trimmed);
}

export function validateSignupPassword(password: string): { valid: boolean; error?: string } {
  if (typeof password !== 'string') {
    return { valid: false, error: 'Inserisci una password valida.' };
  }
  if (password.length < INPUT_LIMITS.PASSWORD_MIN) {
    return { valid: false, error: `La password deve contenere almeno ${INPUT_LIMITS.PASSWORD_MIN} caratteri.` };
  }
  if (password.length > INPUT_LIMITS.PASSWORD_MAX) {
    return { valid: false, error: `La password non può superare ${INPUT_LIMITS.PASSWORD_MAX} caratteri.` };
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return { valid: false, error: 'La password deve contenere almeno una lettera e un numero.' };
  }
  return { valid: true };
}

export function validatePersonName(name: string, fieldLabel = 'Nome'): { valid: boolean; cleaned: string; error?: string } {
  const cleaned = sanitizePlainText(name, INPUT_LIMITS.NAME_MAX, false);
  if (cleaned.length < INPUT_LIMITS.NAME_MIN) {
    return { valid: false, cleaned, error: `${fieldLabel} obbligatorio.` };
  }
  if (/[<>]/.test(cleaned)) {
    return { valid: false, cleaned, error: `${fieldLabel} contiene caratteri non consentiti.` };
  }
  return { valid: true, cleaned };
}

/**
 * Ensures Stripe redirects only navigate to official Stripe Checkout or Billing Portal origins.
 */
export function isTrustedStripeRedirectUrl(url: unknown): url is string {
  if (typeof url !== 'string' || !url.trim()) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    return (
      parsed.hostname === 'checkout.stripe.com' ||
      parsed.hostname === 'billing.stripe.com'
    );
  } catch {
    return false;
  }
}

/**
 * Ensures avatar URLs stored or rendered are safe HTTPS URLs or small safe raster data URLs.
 */
export function isSafeAvatarUrl(url: unknown): boolean {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('https://')) {
    return trimmed.length <= 2048;
  }
  if (/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(trimmed)) {
    return trimmed.length <= 500_000;
  }
  return false;
}
