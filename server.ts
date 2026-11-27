import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { execFileSync } from "child_process";
import dotenv from "dotenv";
import Stripe from "stripe";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

dotenv.config();

const app = express();
const PORT = 3000;
app.disable("x-powered-by");

/* =========================================================
   CONFIG & SECURITY HELPERS (Official Stripe Price IDs)
   ========================================================= */

const PLAN_CONFIG = {
  monthly: {
    priceId: "price_1Ug3yHRzCXUCCVE5q85otTNc",
    amount: 500,
    interval: "month" as const,
    intervalCount: 1,
    label: "Abbonamento Echora — Mensile",
    description: "5,00 €/mese",
  },
  annual: {
    priceId: "price_1Ug3z6RzCXUCCVE5EqELjmy8",
    amount: 5000,
    interval: "year" as const,
    intervalCount: 1,
    label: "Abbonamento Echora — Annuale",
    description: "50,00 €/anno",
  },
} as const;

const LEGACY_QUARTERLY_AMOUNT = 4500;

type PaidPlan = keyof typeof PLAN_CONFIG;

export function formatDateRomeIt(dateInput: Date | string | number): string {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Rome",
  });
}

const ALLOWED_EXERCISE_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;
const ALLOWED_AUDIO_EXTENSIONS = new Set(["webm", "mp3", "wav", "ogg", "m4a", "mp4"]);
const MAX_DEMO_AUDIO_BYTES = 10 * 1024 * 1024; // 10 MB max

function getSafeAppUrl(req?: express.Request): string {
  const configured = process.env.APP_URL?.trim();
  if (configured) {
    try {
      const parsed = new URL(configured);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return parsed.origin;
      }
    } catch {
      console.warn("APP_URL non valido ignorato.");
    }
  }

  if (req) {
    const forwardedHost = (req.headers["x-forwarded-host"] as string | undefined)?.split(",")[0]?.trim();
    const host = (forwardedHost || req.headers.host || "").trim();
    const protoHeader = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0]?.trim();
    const proto = protoHeader === "https" || req.secure ? "https" : "http";
    if (host && /^[a-zA-Z0-9.-]+(:\d{1,5})?$/.test(host)) {
      return `${proto}://${host}`;
    }
  }

  return `http://localhost:${PORT}`;
}

function getClientIp(req: express.Request): string {
  const xff = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim();
  return xff || req.ip || req.socket?.remoteAddress || "unknown";
}

/* =========================================================
   HTTP SECURITY HEADERS, ORIGIN CHECK & RATE LIMITER
   ========================================================= */

app.use((req, res, next) => {
  // Never set X-Frame-Options because preview runs inside AI Studio iFrame
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), camera=(), microphone=(self)");
  res.setHeader("X-DNS-Prefetch-Control", "off");

  if (req.path.startsWith("/api/") && req.path !== "/api/demo-audio-manifest") {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  }
  next();
});

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function createRateLimiter(bucketPrefix: string, maxRequests: number, windowMs: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const now = Date.now();
    if (rateLimitStore.size > 5000) {
      for (const [k, v] of rateLimitStore.entries()) {
        if (v.resetAt <= now) rateLimitStore.delete(k);
      }
    }

    const key = `${bucketPrefix}:${getClientIp(req)}`;
    const entry = rateLimitStore.get(key);
    if (!entry || entry.resetAt <= now) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= maxRequests) {
      const retryAfterSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSec));
      return res.status(429).json({
        error: "Troppe richieste in un breve intervallo. Riprova tra qualche secondo.",
      });
    }

    entry.count += 1;
    return next();
  };
}

const apiGeneralLimiter = createRateLimiter("api", 120, 60_000);
const apiSensitiveLimiter = createRateLimiter("sensitive", 25, 60_000);

app.use("/api", (req, res, next) => {
  if (req.path === "/webhook" || req.path === "/health") {
    return next();
  }
  return apiGeneralLimiter(req, res, next);
});

const verifySameOriginOnApi: express.RequestHandler = (req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) {
    return next();
  }

  try {
    const originUrl = new URL(origin);
    const reqHost = (
      (req.headers["x-forwarded-host"] as string | undefined)?.split(",")[0] ||
      req.headers.host ||
      ""
    ).trim().toLowerCase();

    if (reqHost && originUrl.host.toLowerCase() === reqHost) {
      return next();
    }

    const configuredAppUrl = process.env.APP_URL?.trim();
    if (configuredAppUrl) {
      try {
        if (new URL(configuredAppUrl).origin === originUrl.origin) {
          return next();
        }
      } catch {}
    }

    if (
      process.env.NODE_ENV !== "production" &&
      (originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1")
    ) {
      return next();
    }

    return res.status(403).json({ error: "Origine della richiesta non autorizzata." });
  } catch {
    return res.status(403).json({ error: "Header Origin non valido." });
  }
};

/* =========================================================
   STRIPE WEBHOOK RAW BODY
   Deve essere prima di express.json()
   ========================================================= */

app.use(
  "/api/webhook",
  express.raw({
    type: "*/*",
    limit: "2mb",
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

/* =========================================================
   STANDARD JSON & STATIC AUDIO
   ========================================================= */

app.use(express.json({ limit: "16mb" }));
app.use(express.urlencoded({ limit: "16mb", extended: true }));
app.use(
  "/audio",
  express.static(path.join(process.cwd(), "public", "audio"), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".mp3")) {
        res.setHeader("Content-Type", "audio/mpeg");
      } else if (filePath.endsWith(".webm")) {
        res.setHeader("Content-Type", "audio/webm");
      } else if (filePath.endsWith(".ogg")) {
        res.setHeader("Content-Type", "audio/ogg");
      } else if (filePath.endsWith(".wav")) {
        res.setHeader("Content-Type", "audio/wav");
      } else if (filePath.endsWith(".m4a") || filePath.endsWith(".mp4")) {
        res.setHeader("Content-Type", "audio/mp4");
      }
      res.setHeader("Accept-Ranges", "bytes");
    },
  }),
  // Prevent missing audio files from falling through to Vite SPA index.html
  (_req, res) => {
    res.status(404).type("application/json").json({ error: "Audio demo non trovato." });
  }
);

/* =========================================================
   STRIPE CLIENT
   ========================================================= */

function getStripe(): Stripe | null {
  let secretKey = (
    process.env.STRIPE_SECRET_KEY ||
    process.env.STRIPE_SECRET ||
    process.env.STRIPE_KEY
  )?.trim();

  if (secretKey) {
    if (
      (secretKey.startsWith('"') && secretKey.endsWith('"')) ||
      (secretKey.startsWith("'") && secretKey.endsWith("'"))
    ) {
      secretKey = secretKey.slice(1, -1).trim();
    }
  }

  if (
    !secretKey ||
    secretKey === "sk_test_..." ||
    secretKey === "MY_STRIPE_SECRET_KEY"
  ) {
    return null;
  }

  return new Stripe(secretKey);
}

/* =========================================================
   FIREBASE ADMIN
   ========================================================= */

function getAdminDb() {
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.VITE_FIREBASE_PROJECT_ID ||
    "gen-lang-client-0054933986";

  const dbId =
    process.env.FIREBASE_DATABASE_ID ||
    process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
    process.env.VITE_FIREBASE_DATABASE_ID ||
    "ai-studio-echoradeploy-9b95225c-27f6-4733-b92a-916cea167cc6";

  if (getApps().length === 0) {
    try {
      if (process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(
          process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT
        );

        initializeApp({
          credential: cert(serviceAccount),
          projectId,
        });
      } else {
        initializeApp({
          projectId,
        });
      }
    } catch (e) {
      console.warn("Firebase Admin Init warning:", e);
    }
  }

  const defaultApp = getApps()[0];

  if (!defaultApp) {
    return null;
  }

  return dbId && dbId !== "(default)"
    ? getFirestore(defaultApp, dbId)
    : getFirestore(defaultApp);
}

function getAdminAuth() {
  getAdminDb();
  const defaultApp = getApps()[0];
  if (!defaultApp) {
    return null;
  }
  return getAuth(defaultApp);
}

/* =========================================================
   AUTHENTICATION MIDDLEWARE (FIREBASE ID TOKEN)
   ========================================================= */

interface AuthenticatedRequest extends express.Request {
  user?: {
    uid: string;
    email?: string;
    emailVerified: boolean;
    name?: string;
  };
}

const AUTHORIZED_COACH_EMAILS = new Set([
  "francesca.atzei0@gmail.com",
]);

function isAuthorizedCoach(email?: string, emailVerified?: boolean): boolean {
  if (!email || emailVerified !== true) return false;
  const cleanEmail = email.trim().toLowerCase();
  if (AUTHORIZED_COACH_EMAILS.has(cleanEmail)) return true;
  if (process.env.COACH_EMAIL && cleanEmail === process.env.COACH_EMAIL.trim().toLowerCase()) return true;
  return false;
}

const requireAuth = async (
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Autenticazione richiesta: token Bearer mancante o non valido.",
    });
  }

  const idToken = authHeader.slice("Bearer ".length).trim();

  if (!idToken || idToken.length > 8192) {
    return res.status(401).json({
      error: "Autenticazione richiesta: token Bearer non valido.",
    });
  }

  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    console.error("Auth error: Firebase Admin Auth non inizializzato.");
    return res.status(500).json({
      error: "Servizio di autenticazione temporaneamente non disponibile.",
    });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    if (!decodedToken?.uid) {
      return res.status(401).json({
        error: "Token di autenticazione non valido o scaduto.",
      });
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: Boolean(decodedToken.email_verified),
      name: decodedToken.name,
    };
    return next();
  } catch (err: any) {
    console.warn("Verifica crittografica Firebase ID Token fallita:", err?.code || "invalid_token");
    return res.status(401).json({
      error: "Token di autenticazione non valido o scaduto.",
    });
  }
};

const requireCoachAuth = async (
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  await requireAuth(req, res, () => {
    if (!isAuthorizedCoach(req.user?.email, req.user?.emailVerified)) {
      return res.status(403).json({
        error: "Accesso negato: operazione riservata esclusivamente all'account Coach verificato.",
      });
    }
    next();
  });
};

/* =========================================================
   IN-MEMORY FALLBACK & STRIPE EVENT DEDUPLICATION
   ========================================================= */

const subscriptionsMap = new Map<
  string,
  {
    subscriptionStatus: string;
    subscriptionPlan?: string | null;
    subscriptionPeriodStart?: string | null;
    subscriptionPeriodEnd?: string | null;
    cancelAtPeriodEnd?: boolean;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;

    pendingPlan?: PaidPlan | null;
    pendingPlanAmount?: number | null;
    pendingPlanPaymentIntentId?: string | null;
    pendingPlanStartsAt?: string | null;
    pendingPlanInvoiceItemId?: string | null;
    stripeScheduleId?: string | null;
    lastStripeEventCreated?: number;

    updatedAt: string;
  }
>();

const processedStripeEvents = new Map<string, number>();
const inFlightStripeEvents = new Map<string, { ownerId: string; expiresAtMs: number }>();

function getWebhookLockLeaseMs(): number {
  const parsed = Number(process.env.ECHORA_WEBHOOK_LEASE_MS);
  if (Number.isFinite(parsed) && parsed >= 20) {
    return Math.floor(parsed);
  }
  return 90_000;
}

class FirestoreUnavailableError extends Error {
  statusCode = 503;
  constructor(
    message = "Database Firestore non disponibile. Impossibile verificare o salvare in sicurezza lo stato dell'abbonamento."
  ) {
    super(message);
    this.name = "FirestoreUnavailableError";
  }
}

class WebhookLockLostError extends Error {
  statusCode = 409;
  constructor(eventId: string) {
    super(`Lock webhook scaduto o riassegnato per l'evento ${eventId}.`);
    this.name = "WebhookLockLostError";
  }
}

interface StripeEventLockResult {
  acquired: boolean;
  alreadyProcessed: boolean;
  inProgress: boolean;
  ownerId: string | null;
  acquiredFirestoreLock: boolean;
  attempt: number;
}

function recordProcessedEventMemory(eventId: string) {
  if (processedStripeEvents.size >= 5000) {
    const oldestKey = processedStripeEvents.keys().next().value;
    if (oldestKey) processedStripeEvents.delete(oldestKey);
  }
  processedStripeEvents.set(eventId, Date.now());
}

/* =========================================================
   FIRESTORE HELPERS
   ========================================================= */

async function safeFirestoreSet(
  userId: string,
  data: Record<string, any>,
  throwOnError = false
) {
  try {
    const db = getAdminDb();

    if (!db) {
      if (throwOnError) {
        throw new FirestoreUnavailableError();
      }
      return;
    }

    await db
      .collection("users")
      .doc(userId)
      .set(data, { merge: true });
  } catch (e: any) {
    console.warn("Firestore Admin sync note:", e?.code || e?.message || "sync_error");
    if (throwOnError) {
      if (e instanceof FirestoreUnavailableError) throw e;
      throw new FirestoreUnavailableError(
        "Errore di comunicazione con Firestore durante il salvataggio dello stato abbonamento."
      );
    }
  }
}

async function safeFirestoreGetState(
  userId: string
): Promise<{ available: boolean; data: Record<string, any> | null }> {
  try {
    const db = getAdminDb();

    if (db) {
      const docSnap = await db
        .collection("users")
        .doc(userId)
        .get();

      return {
        available: true,
        data: docSnap.exists ? (docSnap.data() || null) : null,
      };
    }
  } catch (e: any) {
    console.warn("Firestore Admin read note:", e?.code || e?.message || "read_error");
  }

  return { available: false, data: null };
}

async function safeFirestoreGet(
  userId: string
): Promise<Record<string, any> | null> {
  const state = await safeFirestoreGetState(userId);
  if (!state.available) {
    throw new FirestoreUnavailableError();
  }
  return state.data;
}

async function acquireStripeEventLock(
  event: Stripe.Event
): Promise<StripeEventLockResult> {
  const nowMs = Date.now();
  const leaseMs = getWebhookLockLeaseMs();
  const ownerId = crypto.randomUUID();
  const leaseExpiresAtMs = nowMs + leaseMs;

  const localInFlight = inFlightStripeEvents.get(event.id);
  if (localInFlight && localInFlight.expiresAtMs > nowMs) {
    return {
      acquired: false,
      alreadyProcessed: false,
      inProgress: true,
      ownerId: null,
      acquiredFirestoreLock: false,
      attempt: 0,
    };
  }

  // Synchronous in-process guard prevents same-instance parallel webhook races before await
  inFlightStripeEvents.set(event.id, { ownerId, expiresAtMs: leaseExpiresAtMs });

  try {
    const db = getAdminDb();
    if (!db) {
      if (inFlightStripeEvents.get(event.id)?.ownerId === ownerId) {
        inFlightStripeEvents.delete(event.id);
      }
      throw new FirestoreUnavailableError();
    }

    const docRef = db.collection("stripe_webhook_events").doc(event.id);
    const txResult = await db.runTransaction(async (tx: any) => {
      const snap = await tx.get(docRef);
      if (snap.exists) {
        const data = snap.data() || {};
        if (data.status === "processed") {
          return {
            acquired: false,
            alreadyProcessed: true,
            inProgress: false,
            ownerId: null,
            acquiredFirestoreLock: false,
            attempt: Number(data.attempt) || 1,
          } satisfies StripeEventLockResult;
        }

        const existingLeaseExpiresAtMs =
          typeof data.leaseExpiresAtMs === "number"
            ? data.leaseExpiresAtMs
            : data.startedAt
              ? new Date(data.startedAt).getTime() + leaseMs
              : 0;

        if (data.status === "processing" && existingLeaseExpiresAtMs > nowMs) {
          return {
            acquired: false,
            alreadyProcessed: false,
            inProgress: true,
            ownerId: null,
            acquiredFirestoreLock: false,
            attempt: Number(data.attempt) || 1,
          } satisfies StripeEventLockResult;
        }

        // Expired lease or abandoned lock: atomic takeover by new ownerId
        const nextAttempt = (typeof data.attempt === "number" ? data.attempt : 1) + 1;
        tx.set(
          docRef,
          {
            eventId: event.id,
            type: event.type,
            created: event.created,
            status: "processing",
            ownerId,
            previousOwnerId: data.ownerId || null,
            attempt: nextAttempt,
            startedAt: new Date(nowMs).toISOString(),
            startedAtMs: nowMs,
            leaseExpiresAtMs,
            recoveredAt: new Date(nowMs).toISOString(),
          },
          { merge: true }
        );
        return {
          acquired: true,
          alreadyProcessed: false,
          inProgress: false,
          ownerId,
          acquiredFirestoreLock: true,
          attempt: nextAttempt,
        } satisfies StripeEventLockResult;
      }

      tx.set(docRef, {
        eventId: event.id,
        type: event.type,
        created: event.created,
        status: "processing",
        ownerId,
        previousOwnerId: null,
        attempt: 1,
        startedAt: new Date(nowMs).toISOString(),
        startedAtMs: nowMs,
        leaseExpiresAtMs,
      });
      return {
        acquired: true,
        alreadyProcessed: false,
        inProgress: false,
        ownerId,
        acquiredFirestoreLock: true,
        attempt: 1,
      } satisfies StripeEventLockResult;
    });

    if (!txResult.acquired) {
      if (inFlightStripeEvents.get(event.id)?.ownerId === ownerId) {
        inFlightStripeEvents.delete(event.id);
      }
      if (txResult.alreadyProcessed) {
        recordProcessedEventMemory(event.id);
      }
    }

    return txResult;
  } catch (err: any) {
    if (inFlightStripeEvents.get(event.id)?.ownerId === ownerId) {
      inFlightStripeEvents.delete(event.id);
    }
    if (err instanceof FirestoreUnavailableError) {
      throw err;
    }
    console.warn("Webhook lock transaction failed:", err?.code || err?.message || err);
    throw new FirestoreUnavailableError(
      "Impossibile acquisire il lock Firestore per il webhook Stripe."
    );
  }
}

async function assertWebhookLockStillOwned(
  eventId: string,
  lock: StripeEventLockResult
): Promise<void> {
  const db = getAdminDb();
  if (!db) {
    throw new FirestoreUnavailableError();
  }
  const snap = await db.collection("stripe_webhook_events").doc(eventId).get();
  if (!snap.exists) {
    throw new WebhookLockLostError(eventId);
  }
  const data = snap.data() || {};
  if (data.status !== "processing" || data.ownerId !== lock.ownerId) {
    throw new WebhookLockLostError(eventId);
  }
}

async function commitWebhookUserUpdateAndMarkProcessed(
  userId: string,
  event: Stripe.Event,
  lock: StripeEventLockResult,
  userUpdate: Record<string, any>,
  extraMeta?: Record<string, any>
): Promise<{ stale: boolean }> {
  const db = getAdminDb();
  if (!db) {
    throw new FirestoreUnavailableError();
  }
  const eventRef = db.collection("stripe_webhook_events").doc(event.id);
  const userRef = db.collection("users").doc(userId);

  const txResult = await db.runTransaction(async (tx: any) => {
    const eventSnap = await tx.get(eventRef);
    if (!eventSnap.exists) {
      throw new WebhookLockLostError(event.id);
    }
    const eventData = eventSnap.data() || {};
    if (eventData.status !== "processing" || eventData.ownerId !== lock.ownerId) {
      throw new WebhookLockLostError(event.id);
    }

    const userSnap = await tx.get(userRef);
    const currentUserData = userSnap.exists ? (userSnap.data() || {}) : {};
    const currentLastCreated =
      typeof currentUserData.lastStripeEventCreated === "number"
        ? currentUserData.lastStripeEventCreated
        : 0;

    if (currentLastCreated > event.created) {
      tx.set(
        eventRef,
        {
          eventId: event.id,
          type: event.type,
          created: event.created,
          status: "processed",
          ownerId: lock.ownerId,
          processedAt: new Date().toISOString(),
          staleSkipped: true,
        },
        { merge: true }
      );
      return { stale: true, mergedUser: null };
    }

    tx.set(userRef, userUpdate, { merge: true });
    tx.set(
      eventRef,
      {
        eventId: event.id,
        type: event.type,
        created: event.created,
        status: "processed",
        ownerId: lock.ownerId,
        processedAt: new Date().toISOString(),
        ...(extraMeta || {}),
      },
      { merge: true }
    );
    return {
      stale: false,
      mergedUser: { ...currentUserData, ...userUpdate },
    };
  });

  if (inFlightStripeEvents.get(event.id)?.ownerId === lock.ownerId) {
    inFlightStripeEvents.delete(event.id);
  }
  recordProcessedEventMemory(event.id);
  if (!txResult.stale && txResult.mergedUser) {
    subscriptionsMap.set(userId, normalizeSubscriptionDataFromDb(txResult.mergedUser));
  }
  return { stale: txResult.stale };
}

async function markStripeEventProcessed(
  event: Stripe.Event,
  lock: StripeEventLockResult,
  extraMeta?: Record<string, any>
): Promise<void> {
  const db = getAdminDb();
  if (!db) {
    throw new FirestoreUnavailableError();
  }
  const eventRef = db.collection("stripe_webhook_events").doc(event.id);
  await db.runTransaction(async (tx: any) => {
    const snap = await tx.get(eventRef);
    if (!snap.exists) {
      throw new WebhookLockLostError(event.id);
    }
    const data = snap.data() || {};
    if (data.status !== "processing" || data.ownerId !== lock.ownerId) {
      throw new WebhookLockLostError(event.id);
    }
    tx.set(
      eventRef,
      {
        eventId: event.id,
        type: event.type,
        created: event.created,
        status: "processed",
        ownerId: lock.ownerId,
        processedAt: new Date().toISOString(),
        ...(extraMeta || {}),
      },
      { merge: true }
    );
  });
  if (inFlightStripeEvents.get(event.id)?.ownerId === lock.ownerId) {
    inFlightStripeEvents.delete(event.id);
  }
  recordProcessedEventMemory(event.id);
}

async function releaseStripeEventLockOnError(
  eventId: string,
  lock: StripeEventLockResult
): Promise<void> {
  if (lock.ownerId && inFlightStripeEvents.get(eventId)?.ownerId === lock.ownerId) {
    inFlightStripeEvents.delete(eventId);
  }
  processedStripeEvents.delete(eventId);
  if (!lock.acquiredFirestoreLock || !lock.ownerId) return;
  try {
    const db = getAdminDb();
    if (db) {
      const eventRef = db.collection("stripe_webhook_events").doc(eventId);
      await db.runTransaction(async (tx: any) => {
        const snap = await tx.get(eventRef);
        if (!snap.exists) return;
        const data = snap.data() || {};
        if (data.status === "processing" && data.ownerId === lock.ownerId) {
          tx.delete(eventRef);
        }
      });
    }
  } catch {
    // Ignore cleanup errors
  }
}

async function checkStripeCustomerOwnership(
  stripe: Stripe,
  userId: string,
  candidateCustomerId?: string | null
): Promise<{ validCustomerId?: string; conflict: boolean }> {
  if (!candidateCustomerId) {
    return { validCustomerId: undefined, conflict: false };
  }

  const db = getAdminDb();
  if (!db) {
    throw new FirestoreUnavailableError();
  }

  const ownersSnap = await db
    .collection("users")
    .where("stripeCustomerId", "==", candidateCustomerId)
    .limit(2)
    .get();

  const conflictingDoc = ownersSnap.docs.find((d) => d.id !== userId);
  if (conflictingDoc) {
    console.warn(
      `Security block: Stripe customer ${candidateCustomerId} appartiene a un altro UID (${conflictingDoc.id}) su Firestore.`
    );
    return { validCustomerId: undefined, conflict: true };
  }

  try {
    const customer = await stripe.customers.retrieve(candidateCustomerId);
    if ((customer as Stripe.DeletedCustomer).deleted) {
      return { validCustomerId: undefined, conflict: false };
    }
    const metaUid = (customer as Stripe.Customer).metadata?.userId;
    if (metaUid && metaUid !== userId) {
      console.warn(
        `Security block: Stripe customer ${candidateCustomerId} metadata.userId (${metaUid}) != ${userId}.`
      );
      return { validCustomerId: undefined, conflict: true };
    }
    return { validCustomerId: customer.id, conflict: false };
  } catch {
    return { validCustomerId: undefined, conflict: false };
  }
}

async function findUserIdByStripeCustomerId(
  customerId: string | undefined,
  stripe: Stripe
): Promise<string | undefined> {
  if (!customerId) return undefined;

  const db = getAdminDb();
  if (!db) {
    throw new FirestoreUnavailableError();
  }

  const snap = await db
    .collection("users")
    .where("stripeCustomerId", "==", customerId)
    .limit(2)
    .get();

  if (snap.docs.length > 1) {
    console.warn(
      `Security block: Stripe customer ${customerId} associato a più documenti utente su Firestore.`
    );
    return undefined;
  }

  let dbUserId: string | undefined = snap.docs[0]?.id;
  let stripeMetaUserId: string | undefined;

  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (!(customer as Stripe.DeletedCustomer).deleted) {
      stripeMetaUserId = (customer as Stripe.Customer).metadata?.userId || undefined;
    }
  } catch {
    // Ignore retrieve failure
  }

  if (dbUserId && stripeMetaUserId && dbUserId !== stripeMetaUserId) {
    console.warn(
      `Security block: conflitto ownership customer ${customerId} tra Firestore (${dbUserId}) e Stripe metadata (${stripeMetaUserId}).`
    );
    return undefined;
  }

  return dbUserId || stripeMetaUserId;
}

async function resolveStrictUserIdForSubscription(
  explicitMetadataUserId: string | undefined,
  customerId: string | undefined,
  stripe: Stripe
): Promise<string | undefined> {
  const customerUserId = await findUserIdByStripeCustomerId(customerId, stripe);
  if (explicitMetadataUserId && customerUserId && explicitMetadataUserId !== customerUserId) {
    console.warn(
      `Security block: conflitto UID tra metadata subscription (${explicitMetadataUserId}) e Stripe customer (${customerUserId}).`
    );
    return undefined;
  }
  return explicitMetadataUserId || customerUserId;
}

async function getVerifiedStripeCustomerForUser(
  stripe: Stripe,
  userId: string,
  candidateCustomerId?: string | null
): Promise<string | undefined> {
  const ownership = await checkStripeCustomerOwnership(stripe, userId, candidateCustomerId);
  return ownership.validCustomerId;
}

/* =========================================================
   FIREBASE DATA HELPERS
   ========================================================= */

function normalizeSubscriptionDataFromDb(dbData: Record<string, any>) {
  return {
    subscriptionStatus:
      dbData.subscriptionStatus || "inactive",

    subscriptionPlan:
      dbData.subscriptionPlan,

    subscriptionPeriodStart:
      dbData.subscriptionPeriodStart,

    subscriptionPeriodEnd:
      dbData.subscriptionPeriodEnd,

    cancelAtPeriodEnd:
      Boolean(dbData.cancelAtPeriodEnd),

    stripeCustomerId:
      dbData.stripeCustomerId,

    stripeSubscriptionId:
      dbData.stripeSubscriptionId,

    pendingPlan:
      dbData.pendingPlan,

    pendingPlanAmount:
      dbData.pendingPlanAmount,

    pendingPlanPaymentIntentId:
      dbData.pendingPlanPaymentIntentId,

    pendingPlanStartsAt:
      dbData.pendingPlanStartsAt,

    pendingPlanInvoiceItemId:
      dbData.pendingPlanInvoiceItemId,

    stripeScheduleId:
      dbData.stripeScheduleId,

    lastStripeEventCreated:
      typeof dbData.lastStripeEventCreated === "number" ? dbData.lastStripeEventCreated : 0,

    updatedAt:
      dbData.updatedAt || new Date().toISOString(),
  };
}

async function getSubscriptionData(userId: string) {
  // Authoritative fail-closed Firestore lookup: never authorize from warm cache if Firestore is unavailable
  const dbState = await safeFirestoreGetState(userId);

  if (!dbState.available) {
    throw new FirestoreUnavailableError();
  }

  if (!dbState.data) {
    subscriptionsMap.delete(userId);
    return null;
  }

  const data = normalizeSubscriptionDataFromDb(dbState.data);
  subscriptionsMap.set(userId, data);
  return data;
}

function isPaidPlan(
  plan: string | undefined | null
): plan is PaidPlan {
  return plan === "monthly" || plan === "annual";
}

class PlanChangeError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

const activePlanChangeUsers = new Set<string>();

function getSubscriptionPeriodStartTs(subscription: Stripe.Subscription): number | undefined {
  return (
    (subscription as any).current_period_start ||
    subscription.items?.data?.[0]?.current_period_start ||
    (subscription as any).start_date ||
    subscription.created
  );
}

function getSubscriptionPeriodEndTs(subscription: Stripe.Subscription): number | undefined {
  return (
    (subscription as any).current_period_end ||
    subscription.items?.data?.[0]?.current_period_end ||
    (subscription as any).trial_end
  );
}

function getNextChargeDate(
  periodEndIso: string | undefined | null,
  pendingPlanStartsAt: string | undefined | null,
  cancelAtPeriodEnd: boolean,
  status: string | undefined | null
): string | null {
  if (cancelAtPeriodEnd) return null;
  if (status !== "active" && status !== "trialing") return null;
  return pendingPlanStartsAt || periodEndIso || null;
}

async function findActiveStripeSubscriptionForUser(
  stripe: Stripe,
  userId: string,
  currentData: any
): Promise<Stripe.Subscription | null> {
  if (currentData?.stripeSubscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(currentData.stripeSubscriptionId, {
        expand: ["items.data.price", "discounts", "discounts.source.coupon"],
      });
      if (
        (sub.status === "active" || sub.status === "trialing") &&
        (!sub.metadata?.userId || sub.metadata.userId === userId)
      ) {
        return sub;
      }
    } catch {}
  }

  const verifiedCustomerId = await getVerifiedStripeCustomerForUser(
    stripe,
    userId,
    currentData?.stripeCustomerId
  );
  if (verifiedCustomerId) {
    try {
      const list = await stripe.subscriptions.list({
        customer: verifiedCustomerId,
        status: "all",
        limit: 10,
        expand: ["data.items.data.price", "data.discounts", "data.discounts.source.coupon"],
      });
      const activeSub = list.data.find(
        (s) =>
          (s.status === "active" || s.status === "trialing") &&
          (!s.metadata?.userId || s.metadata.userId === userId)
      );
      if (activeSub) return activeSub;
    } catch {}
  }

  if (/^[a-zA-Z0-9_-]{4,128}$/.test(userId) && typeof stripe.customers?.search === "function") {
    try {
      const searched = await stripe.customers.search({
        query: `metadata['userId']:'${userId}'`,
        limit: 5,
      });
      for (const cust of searched.data || []) {
        const list = await stripe.subscriptions.list({
          customer: cust.id,
          status: "all",
          limit: 10,
          expand: ["data.items.data.price", "data.discounts", "data.discounts.source.coupon"],
        });
        const activeSub = list.data.find(
          (s) =>
            (s.status === "active" || s.status === "trialing") &&
            (!s.metadata?.userId || s.metadata.userId === userId)
        );
        if (activeSub) return activeSub;
      }
    } catch {}
  }

  return null;
}

function derivePlanFromPrice(
  price: Stripe.Price | string | null | undefined
): PaidPlan | undefined {
  if (!price) {
    return undefined;
  }
  const priceId = typeof price === "string" ? price : price.id;
  if (priceId === PLAN_CONFIG.monthly.priceId) {
    return "monthly";
  }
  if (priceId === PLAN_CONFIG.annual.priceId) {
    return "annual";
  }
  if (typeof price !== "object") {
    return undefined;
  }
  const metaPlan = price.metadata?.echoraPlan;
  if (isPaidPlan(metaPlan)) {
    return metaPlan;
  }
  const interval = price.recurring?.interval;
  const intervalCount = price.recurring?.interval_count ?? 1;
  const unitAmount = price.unit_amount;
  if (interval === "year" && intervalCount === 1 && unitAmount === PLAN_CONFIG.annual.amount) {
    return "annual";
  }
  if (interval === "month" && intervalCount === 1 && unitAmount === PLAN_CONFIG.monthly.amount) {
    return "monthly";
  }
  return undefined;
}

function derivePlanFromSubscription(subscription: Stripe.Subscription): string | undefined {
  const price = subscription.items?.data?.[0]?.price;
  const fromItem = derivePlanFromPrice(price);
  if (fromItem) return fromItem;
  if (price && typeof price === "object") {
    const legacyMeta = price.metadata?.echoraPlan;
    if (legacyMeta === "quarterly") return "quarterly";
    if (
      price.recurring?.interval === "month" &&
      (price.recurring?.interval_count ?? 1) === 3 &&
      price.unit_amount === LEGACY_QUARTERLY_AMOUNT
    ) {
      return "quarterly";
    }
  }
  const metaPlan = subscription.metadata?.plan;
  return typeof metaPlan === "string" && metaPlan ? metaPlan : undefined;
}

function getBasePlanAmount(
  plan: string | undefined | null,
  subscription?: Stripe.Subscription | null
): number | null {
  if (isPaidPlan(plan)) return PLAN_CONFIG[plan].amount;
  if (plan === "quarterly") return LEGACY_QUARTERLY_AMOUNT;
  if (plan === "trial") return PLAN_CONFIG.monthly.amount;
  const price = subscription?.items?.data?.[0]?.price;
  if (price && typeof price === "object" && typeof price.unit_amount === "number") {
    return price.unit_amount;
  }
  return null;
}

function getNextChargeAmount(
  subscriptionPlan: string | undefined | null,
  pendingPlan: string | undefined | null,
  pendingPlanAmount: number | undefined | null,
  cancelAtPeriodEnd: boolean
): number | null {
  if (cancelAtPeriodEnd) return 0;
  if (pendingPlan) {
    if (typeof pendingPlanAmount === "number" && pendingPlanAmount >= 0) {
      return pendingPlanAmount;
    }
    return null;
  }
  if (isPaidPlan(subscriptionPlan)) {
    return PLAN_CONFIG[subscriptionPlan].amount;
  }
  if (subscriptionPlan === "quarterly") {
    return LEGACY_QUARTERLY_AMOUNT;
  }
  if (subscriptionPlan === "trial") {
    return PLAN_CONFIG.monthly.amount;
  }
  return null;
}

interface ResolvedDiscountInfo {
  phase1Entry: Stripe.SubscriptionScheduleUpdateParams.Phase.Discount;
  discountId: string | null;
  couponId: string | null;
  promoCodeId: string | null;
  coupon: Stripe.Coupon | null;
  endTs: number | null;
  startTs: number | null;
}

function addMonthsUnixTs(startTs: number, months: number): number {
  const d = new Date(startTs * 1000);
  d.setUTCMonth(d.getUTCMonth() + months);
  return Math.floor(d.getTime() / 1000);
}

async function resolveDiscountDetails(
  stripe: Stripe,
  rawEntry: any,
  subDiscountById: Map<string, any>
): Promise<ResolvedDiscountInfo | null> {
  if (!rawEntry) return null;

  let discountId: string | null = null;
  let couponObj: any = null;
  let couponId: string | null = null;
  let promoCodeId: string | null = null;
  let endTs: number | null = null;
  let startTs: number | null = null;

  if (typeof rawEntry === "string") {
    discountId = rawEntry;
  } else if (rawEntry.object === "discount" || rawEntry.source) {
    discountId = typeof rawEntry.id === "string" ? rawEntry.id : null;
    endTs = typeof rawEntry.end === "number" ? rawEntry.end : null;
    startTs = typeof rawEntry.start === "number" ? rawEntry.start : null;
    const rawCoupon = rawEntry.source?.coupon ?? rawEntry.coupon;
    if (rawCoupon && typeof rawCoupon === "object") {
      couponObj = rawCoupon;
      couponId = rawCoupon.id || null;
    } else if (typeof rawCoupon === "string") {
      couponId = rawCoupon;
    }
    if (rawEntry.promotion_code) {
      promoCodeId =
        typeof rawEntry.promotion_code === "string"
          ? rawEntry.promotion_code
          : rawEntry.promotion_code.id || null;
    }
  } else {
    if (rawEntry.discount) {
      if (typeof rawEntry.discount === "string") {
        discountId = rawEntry.discount;
      } else if (typeof rawEntry.discount === "object") {
        discountId = rawEntry.discount.id || null;
        endTs = typeof rawEntry.discount.end === "number" ? rawEntry.discount.end : null;
        startTs = typeof rawEntry.discount.start === "number" ? rawEntry.discount.start : null;
        const rawC = rawEntry.discount.source?.coupon ?? rawEntry.discount.coupon;
        if (rawC && typeof rawC === "object") {
          couponObj = rawC;
          couponId = rawC.id || null;
        } else if (typeof rawC === "string") {
          couponId = rawC;
        }
      }
    }
    if (rawEntry.coupon) {
      if (typeof rawEntry.coupon === "string") {
        couponId = rawEntry.coupon;
      } else if (typeof rawEntry.coupon === "object") {
        couponObj = rawEntry.coupon;
        couponId = rawEntry.coupon.id || null;
      }
    }
    if (rawEntry.promotion_code) {
      if (typeof rawEntry.promotion_code === "string") {
        promoCodeId = rawEntry.promotion_code;
      } else if (typeof rawEntry.promotion_code === "object") {
        promoCodeId = rawEntry.promotion_code.id || null;
        const promoCoupon =
          rawEntry.promotion_code.coupon || rawEntry.promotion_code.promotion?.coupon;
        if (promoCoupon && typeof promoCoupon === "object") {
          couponObj = promoCoupon;
          couponId = promoCoupon.id || null;
        } else if (typeof promoCoupon === "string" && !couponId) {
          couponId = promoCoupon;
        }
      }
    }
  }

  // Merge expanded Discount info from subscription.discounts if matched by ID
  if (discountId && subDiscountById.has(discountId)) {
    const matched = subDiscountById.get(discountId);
    if (endTs === null && typeof matched.end === "number") endTs = matched.end;
    if (startTs === null && typeof matched.start === "number") startTs = matched.start;
    const matchedCoupon = matched.source?.coupon ?? matched.coupon;
    if (!couponObj && matchedCoupon && typeof matchedCoupon === "object") {
      couponObj = matchedCoupon;
      couponId = matchedCoupon.id || couponId;
    } else if (!couponId && typeof matchedCoupon === "string") {
      couponId = matchedCoupon;
    }
    if (!promoCodeId && matched.promotion_code) {
      promoCodeId =
        typeof matched.promotion_code === "string"
          ? matched.promotion_code
          : matched.promotion_code.id || null;
    }
  } else if (!discountId && couponId) {
    // Try matching by couponId on active subscription discounts to recover end/start timestamps
    for (const matched of subDiscountById.values()) {
      const matchedCoupon = matched.source?.coupon ?? matched.coupon;
      const mId = typeof matchedCoupon === "string" ? matchedCoupon : matchedCoupon?.id;
      if (mId === couponId) {
        discountId = matched.id || null;
        if (endTs === null && typeof matched.end === "number") endTs = matched.end;
        if (startTs === null && typeof matched.start === "number") startTs = matched.start;
        if (!couponObj && matchedCoupon && typeof matchedCoupon === "object") {
          couponObj = matchedCoupon;
        }
        break;
      }
    }
  }

  // Fallback lookups if coupon object still not expanded
  if (!couponObj && couponId && typeof stripe.coupons?.retrieve === "function") {
    try {
      couponObj = await stripe.coupons.retrieve(couponId);
    } catch {}
  }

  if (!couponObj && promoCodeId && typeof stripe.promotionCodes?.retrieve === "function") {
    try {
      const promo: any = await stripe.promotionCodes.retrieve(promoCodeId, {
        expand: ["coupon"],
      });
      const promoCoupon = promo?.coupon || promo?.promotion?.coupon;
      if (promoCoupon && typeof promoCoupon === "object") {
        couponObj = promoCoupon;
        couponId = promoCoupon.id || couponId;
      } else if (typeof promoCoupon === "string") {
        couponId = promoCoupon;
        if (typeof stripe.coupons?.retrieve === "function") {
          try {
            couponObj = await stripe.coupons.retrieve(couponId);
          } catch {}
        }
      }
    } catch {}
  }

  let phase1Entry: Stripe.SubscriptionScheduleUpdateParams.Phase.Discount | null = null;
  if (discountId) {
    phase1Entry = { discount: discountId };
  } else if (couponId) {
    phase1Entry = { coupon: couponId };
  } else if (promoCodeId) {
    phase1Entry = { promotion_code: promoCodeId };
  }

  if (!phase1Entry) return null;

  return {
    phase1Entry,
    discountId,
    couponId,
    promoCodeId,
    coupon: couponObj,
    endTs,
    startTs,
  };
}

function applyCouponToCents(baseCents: number, coupon: any): number | null {
  if (!coupon || typeof coupon !== "object") return null;
  if (typeof coupon.percent_off === "number" && coupon.percent_off >= 0) {
    return Math.max(0, Math.round(baseCents * (1 - coupon.percent_off / 100)));
  }
  if (typeof coupon.amount_off === "number" && coupon.amount_off >= 0) {
    if (coupon.currency && String(coupon.currency).toLowerCase() !== "eur") {
      return null;
    }
    return Math.max(0, baseCents - coupon.amount_off);
  }
  return null;
}

function isDiscountActiveForPhaseAt(
  info: ResolvedDiscountInfo,
  targetStartTs: number,
  options?: { onceConsumed?: boolean }
): "include" | "exclude" | "uncertain" {
  const coupon = info.coupon;
  if (!coupon) return "uncertain";

  if (coupon.duration === "once") {
    return options?.onceConsumed ? "exclude" : "include";
  }
  if (coupon.duration === "forever") {
    return "include";
  }
  if (coupon.duration === "repeating") {
    if (typeof info.endTs === "number") {
      return info.endTs > targetStartTs ? "include" : "exclude";
    }
    if (
      typeof info.startTs === "number" &&
      typeof coupon.duration_in_months === "number" &&
      coupon.duration_in_months > 0
    ) {
      const computedEnd = addMonthsUnixTs(info.startTs, coupon.duration_in_months);
      return computedEnd > targetStartTs ? "include" : "exclude";
    }
    return "uncertain";
  }
  return "uncertain";
}

function buildSubscriptionDiscountMap(subscription?: Stripe.Subscription | null): Map<string, any> {
  const map = new Map<string, any>();
  if (!subscription) return map;
  const list = [
    ...(Array.isArray((subscription as any).discounts) ? (subscription as any).discounts : []),
    ...((subscription as any).discount ? [(subscription as any).discount] : []),
  ];
  for (const d of list) {
    if (d && typeof d === "object" && typeof d.id === "string") {
      map.set(d.id, d);
    }
  }
  return map;
}

async function evaluateSchedulePhaseDiscounts(
  stripe: Stripe,
  subscription: Stripe.Subscription,
  rawPhaseDiscounts: any[],
  targetStartTs: number,
  options: { onceConsumed: boolean }
): Promise<{
  phaseDiscounts: Stripe.SubscriptionScheduleUpdateParams.Phase.Discount[];
  activeCoupons: Stripe.Coupon[];
  uncertain: boolean;
}> {
  const subDiscountById = buildSubscriptionDiscountMap(subscription);
  const phaseDiscounts: Stripe.SubscriptionScheduleUpdateParams.Phase.Discount[] = [];
  const activeCoupons: Stripe.Coupon[] = [];
  let uncertain = false;

  for (const raw of rawPhaseDiscounts) {
    const info = await resolveDiscountDetails(stripe, raw, subDiscountById);
    if (!info) {
      uncertain = true;
      continue;
    }

    const decision = isDiscountActiveForPhaseAt(info, targetStartTs, options);
    if (decision === "exclude") {
      continue;
    }
    if (decision === "uncertain") {
      uncertain = true;
      // Do NOT blindly re-create unknown coupons on Phase 2 (could re-apply a `once` coupon)
      continue;
    }

    // Verified recurring discount (`forever` or active `repeating`)
    if (info.discountId) {
      phaseDiscounts.push({ discount: info.discountId });
    } else if (info.couponId) {
      phaseDiscounts.push({ coupon: info.couponId });
    } else if (info.promoCodeId) {
      phaseDiscounts.push({ promotion_code: info.promoCodeId });
    }

    if (info.coupon) {
      activeCoupons.push(info.coupon);
    } else {
      uncertain = true;
    }
  }

  return { phaseDiscounts, activeCoupons, uncertain };
}

function computeDiscountedAmountFromCoupons(
  baseAmount: number | null,
  coupons: Stripe.Coupon[],
  uncertainFlag: boolean
): { amount: number | null; uncertain: boolean } {
  if (uncertainFlag || baseAmount === null) {
    return { amount: null, uncertain: true };
  }
  let current = baseAmount;
  for (const coupon of coupons) {
    const next = applyCouponToCents(current, coupon);
    if (next === null) {
      return { amount: null, uncertain: true };
    }
    current = next;
  }
  return { amount: current, uncertain: false };
}

async function resolveNextChargeForActiveSubscription(
  stripe: Stripe,
  subscription: Stripe.Subscription,
  currentPlan: string | undefined | null,
  pendingPlan: string | undefined | null,
  pendingPlanAmount: number | undefined | null,
  liveSchedule: Stripe.SubscriptionSchedule | null,
  cancelAtPeriodEnd: boolean
): Promise<{ amount: number | null; uncertain: boolean }> {
  if (cancelAtPeriodEnd) {
    return { amount: 0, uncertain: false };
  }
  if (subscription.status !== "active" && subscription.status !== "trialing") {
    return { amount: null, uncertain: false };
  }

  // Case 1: Scheduled future plan change (Phase 2)
  if (pendingPlan) {
    const baseAmount = getBasePlanAmount(pendingPlan);
    if (liveSchedule) {
      const curPhase = liveSchedule.current_phase;
      const nextPhase = curPhase
        ? (liveSchedule.phases || []).find((p) => p.start_date >= curPhase.end_date)
        : undefined;
      if (nextPhase) {
        const rawNextDiscounts = Array.isArray((nextPhase as any).discounts)
          ? (nextPhase as any).discounts
          : [];
        if (rawNextDiscounts.length === 0) {
          return baseAmount !== null
            ? { amount: baseAmount, uncertain: false }
            : { amount: null, uncertain: true };
        }
        const evaluated = await evaluateSchedulePhaseDiscounts(
          stripe,
          subscription,
          rawNextDiscounts,
          nextPhase.start_date,
          { onceConsumed: false }
        );
        return computeDiscountedAmountFromCoupons(
          baseAmount,
          evaluated.activeCoupons,
          evaluated.uncertain
        );
      }
    }

    if (typeof pendingPlanAmount === "number" && pendingPlanAmount >= 0) {
      return { amount: pendingPlanAmount, uncertain: false };
    }
    return { amount: null, uncertain: true };
  }

  // Case 2: Standard renewal of current plan
  const baseAmount = getBasePlanAmount(currentPlan, subscription);
  const rawSubDiscounts = [
    ...(Array.isArray((subscription as any).discounts) ? (subscription as any).discounts : []),
    ...((subscription as any).discount ? [(subscription as any).discount] : []),
  ].filter(Boolean);

  const customerObj =
    subscription.customer && typeof subscription.customer === "object"
      ? (subscription.customer as any)
      : null;
  const hasCustomerDiscount = Boolean(customerObj && !customerObj.deleted && customerObj.discount);

  if (rawSubDiscounts.length === 0 && !hasCustomerDiscount) {
    return baseAmount !== null
      ? { amount: baseAmount, uncertain: false }
      : { amount: null, uncertain: true };
  }

  // Prefer Stripe's authoritative invoice preview when discounts exist
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;
  if (customerId && typeof (stripe.invoices as any)?.createPreview === "function") {
    try {
      const preview = await stripe.invoices.createPreview({
        customer: customerId,
        subscription: subscription.id,
      });
      if (typeof preview?.amount_due === "number" && preview.amount_due >= 0) {
        return { amount: preview.amount_due, uncertain: false };
      }
    } catch {
      // Fall back to deterministic coupon evaluation below
    }
  }

  // Deterministic evaluation when invoice preview is unavailable or fails
  if (hasCustomerDiscount && rawSubDiscounts.length === 0) {
    return { amount: null, uncertain: true };
  }

  const nextBillingTs =
    getSubscriptionPeriodEndTs(subscription) || Math.floor(Date.now() / 1000) + 1;
  const subDiscountById = buildSubscriptionDiscountMap(subscription);
  const activeCoupons: Stripe.Coupon[] = [];
  let uncertain = false;

  for (const raw of rawSubDiscounts) {
    const info = await resolveDiscountDetails(stripe, raw, subDiscountById);
    if (!info || !info.coupon) {
      uncertain = true;
      break;
    }
    const decision = isDiscountActiveForPhaseAt(info, nextBillingTs, {
      onceConsumed: Boolean(subscription.latest_invoice),
    });
    if (decision === "exclude") {
      continue;
    }
    if (decision === "uncertain") {
      uncertain = true;
      break;
    }
    activeCoupons.push(info.coupon);
  }

  return computeDiscountedAmountFromCoupons(baseAmount, activeCoupons, uncertain);
}

/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

/* =========================================================
   CREATE STRIPE CHECKOUT SESSION
   ========================================================= */

app.post("/api/create-checkout-session", verifySameOriginOnApi, apiSensitiveLimiter, requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({
        error: "Utente non autenticato",
      });
    }

    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({
        error: "Corpo della richiesta non valido.",
      });
    }

    const { plan } = req.body;

    let customerEmail =
      req.user?.email ||
      (typeof req.body.customerEmail === "string" ? req.body.customerEmail.trim() : undefined);

    if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      customerEmail = undefined;
    }

    if (!customerEmail) {
      const dbProfile = await safeFirestoreGet(userId);
      if (dbProfile?.email && typeof dbProfile.email === "string") {
        customerEmail = dbProfile.email.trim();
      }
    }

    if (!isPaidPlan(plan)) {
      return res.status(400).json({
        error: "Piano non valido. I piani disponibili sono esclusivamente mensile e annuale.",
      });
    }

    const appUrl = getSafeAppUrl(req);

    const stripe = getStripe();

    if (!stripe) {
      return res.status(503).json({
        error:
          "Servizio pagamenti temporaneamente non configurato.",
      });
    }

    /*
     * Prima controlliamo se l'utente possiede già
     * una subscription attiva o in trial.
     *
     * Questo permette al frontend attuale di rimanere
     * invariato.
     */

    const currentData =
      await getSubscriptionData(userId);

    // Verifica sia i dati locali/Firestore sia Stripe live per evitare la creazione di una seconda sottoscrizione
    const liveExistingSubscription = await findActiveStripeSubscriptionForUser(
      stripe,
      userId,
      currentData
    );

    if (liveExistingSubscription) {
      const liveCustomerId =
        typeof liveExistingSubscription.customer === "string"
          ? liveExistingSubscription.customer
          : liveExistingSubscription.customer?.id;
      const syncedStartTs = getSubscriptionPeriodStartTs(liveExistingSubscription);
      const syncedEndTs = getSubscriptionPeriodEndTs(liveExistingSubscription);
      const syncedPlan = derivePlanFromSubscription(liveExistingSubscription);
      const syncedInfo: Record<string, any> = {
        subscriptionStatus: liveExistingSubscription.status,
        ...(syncedPlan ? { subscriptionPlan: syncedPlan } : {}),
        ...(syncedStartTs ? { subscriptionPeriodStart: new Date(syncedStartTs * 1000).toISOString() } : {}),
        ...(syncedEndTs ? { subscriptionPeriodEnd: new Date(syncedEndTs * 1000).toISOString() } : {}),
        cancelAtPeriodEnd: Boolean(liveExistingSubscription.cancel_at_period_end),
        stripeCustomerId: liveCustomerId || currentData?.stripeCustomerId || null,
        stripeSubscriptionId: liveExistingSubscription.id,
        updatedAt: new Date().toISOString(),
      };
      await safeFirestoreSet(userId, syncedInfo, true);
      subscriptionsMap.set(userId, {
        ...(currentData || {}),
        ...syncedInfo,
      } as any);

      const result = await executeSchedulePlanChange(stripe, userId, plan);
      return res.json(result);
    }

    /* =====================================================
       NUOVO ABBONAMENTO CON PRICE ID UFFICIALI STRIPE
       ===================================================== */

    const selectedConfig = PLAN_CONFIG[plan];
    const verifiedCustomerId = await getVerifiedStripeCustomerForUser(
      stripe,
      userId,
      currentData?.stripeCustomerId
    );

    const sessionParams:
      Stripe.Checkout.SessionCreateParams = {
      payment_method_types: [
        "card",
        "paypal",
        "klarna",
      ],

      line_items: [
        {
          price: selectedConfig.priceId,
          quantity: 1,
        },
      ],

      mode: "subscription",

      allow_promotion_codes: true,

      subscription_data: {
        metadata: {
          userId,
          plan,
        },
      },

      client_reference_id: userId,

      ...(verifiedCustomerId
        ? { customer: verifiedCustomerId }
        : { customer_email: customerEmail || undefined }),

      metadata: {
        userId,
        plan,
      },

      success_url:
        `${appUrl}/#payment-success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,

      cancel_url:
        `${appUrl}/#payment-cancelled`,
    };

    const session =
      await stripe.checkout.sessions.create(
        sessionParams
      );

    return res.json({
      url: session.url,
      sessionId: session.id,
      uid: userId,
    });
  } catch (err: any) {
    if (err instanceof PlanChangeError || err instanceof FirestoreUnavailableError) {
      return res.status(err.statusCode).json({
        error: err.message,
      });
    }

    console.error(
      "Errore creazione Stripe Checkout Session:",
      err?.message || err
    );

    return res.status(500).json({
      error: "Impossibile avviare il Checkout al momento. Riprova tra qualche istante.",
    });
  }
});

/* =========================================================
   CREATE CUSTOMER PORTAL SESSION
   ========================================================= */

app.post("/api/create-portal-session", verifySameOriginOnApi, apiSensitiveLimiter, requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({
        error: "Utente non autenticato",
      });
    }

    const appUrl = getSafeAppUrl(req);

    const stripe = getStripe();

    if (!stripe) {
      return res.status(503).json({
        error: "Servizio pagamenti temporaneamente non configurato.",
      });
    }

    const currentData = await getSubscriptionData(userId);
    let customerId: string | undefined;

    if (currentData?.stripeCustomerId) {
      const ownership = await checkStripeCustomerOwnership(
        stripe,
        userId,
        currentData.stripeCustomerId
      );
      if (ownership.conflict) {
        return res.status(403).json({
          error: "Errore di sicurezza: l'account cliente Stripe risulta associato a un altro utente.",
        });
      }
      customerId = ownership.validCustomerId;
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user?.email || undefined,
        metadata: {
          userId,
        },
      });

      customerId = customer.id;

      const subInfo = {
        stripeCustomerId: customerId,
        updatedAt: new Date().toISOString(),
      };

      await safeFirestoreSet(userId, subInfo, true);

      subscriptionsMap.set(userId, {
        ...(currentData || { subscriptionStatus: "inactive" }),
        ...subInfo,
      } as any);
    }

    const portalSession =
      await stripe.billingPortal.sessions.create({
        customer: customerId,

        return_url:
          `${appUrl}/#profile`,
      });

    return res.json({
      url: portalSession.url,
    });
  } catch (err: any) {
    if (err instanceof FirestoreUnavailableError) {
      return res.status(err.statusCode).json({
        error: err.message,
      });
    }

    console.error(
      "Errore creazione Stripe Portal Session:",
      err?.message || err
    );

    return res.status(500).json({
      error: "Impossibile accedere al portale di gestione abbonamento. Riprova tra qualche istante.",
    });
  }
});

/* =========================================================
   SCHEDULE FUTURE PLAN (STRIPE SUBSCRIPTION SCHEDULES)
   ========================================================= */

async function scheduleFuturePlan(
  stripe: Stripe,
  userId: string,
  subscription: Stripe.Subscription,
  newPlan: PaidPlan
) {
  const config = PLAN_CONFIG[newPlan];

  if (subscription.status !== "active" && subscription.status !== "trialing") {
    throw new PlanChangeError(
      400,
      "L'abbonamento attuale non è attivo. Regolarizza o riattiva l'abbonamento prima di cambiare piano."
    );
  }

  if (subscription.cancel_at_period_end) {
    throw new PlanChangeError(
      400,
      "Il rinnovo del tuo abbonamento è stato annullato alla scadenza. Non è possibile programmare un cambio piano su un abbonamento con rinnovo disattivato."
    );
  }

  const currentPlan = derivePlanFromSubscription(subscription);
  if (currentPlan === newPlan && (subscription.status === "active" || subscription.status === "trialing")) {
    throw new PlanChangeError(400, "Sei già abbonato a questo piano.");
  }

  const currentPeriodStartTs = getSubscriptionPeriodStartTs(subscription);
  const currentPeriodEndTs = getSubscriptionPeriodEndTs(subscription);
  if (!currentPeriodEndTs) {
    throw new Error("Impossibile determinare la fine del periodo attuale.");
  }

  let scheduleId: string | null = null;
  let createdNewSchedule = false;
  const existingScheduleRef = (subscription as any).schedule;

  if (existingScheduleRef) {
    const candidateId =
      typeof existingScheduleRef === "string"
        ? existingScheduleRef
        : existingScheduleRef.id;

    if (candidateId) {
      const existingSchedule = await stripe.subscriptionSchedules.retrieve(candidateId);
      if (existingSchedule.status === "active" || existingSchedule.status === "not_started") {
        const currentPhaseEnd = existingSchedule.current_phase?.end_date || currentPeriodEndTs;
        const futurePhases = (existingSchedule.phases || []).filter(
          (p) => p.start_date >= currentPhaseEnd
        );
        if (futurePhases.length > 0) {
          throw new PlanChangeError(
            409,
            "Esiste già un cambio piano programmato su Stripe. Annulla prima quello esistente se desideri cambiarlo."
          );
        }
        scheduleId = existingSchedule.id;
      }
    }
  }

  if (!scheduleId) {
    const createdSchedule = await stripe.subscriptionSchedules.create({
      from_subscription: subscription.id,
    });
    scheduleId = createdSchedule.id;
    createdNewSchedule = true;
  }

  try {
    const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);
    const currentPhase = schedule.current_phase;

    if (!currentPhase) {
      throw new Error("Impossibile determinare la fase attuale della subscription.");
    }

    const currentPhaseStart = currentPhase.start_date;
    const currentPhaseEnd = currentPhase.end_date;
    const activePhase =
      (schedule.phases || []).find(
        (p) => p.start_date === currentPhaseStart && p.end_date === currentPhaseEnd
      ) || schedule.phases?.[schedule.phases.length - 1];

    const currentItem = activePhase?.items?.[0] || subscription.items?.data?.[0];
    const currentPrice = currentItem?.price;
    if (!currentPrice) {
      throw new Error("Impossibile determinare il prezzo attuale della subscription.");
    }

    const currentPriceId =
      typeof currentPrice === "string" ? currentPrice : currentPrice.id;
    const currentQuantity = currentItem?.quantity ?? 1;

    const subDiscountById = buildSubscriptionDiscountMap(subscription);
    const rawActiveDiscounts =
      Array.isArray((activePhase as any)?.discounts) && (activePhase as any).discounts.length > 0
        ? (activePhase as any).discounts
        : Array.isArray((subscription as any).discounts)
          ? (subscription as any).discounts
          : (subscription as any).discount
            ? [(subscription as any).discount]
            : [];

    const phase1Discounts: Stripe.SubscriptionScheduleUpdateParams.Phase.Discount[] = [];
    for (const raw of rawActiveDiscounts) {
      const info = await resolveDiscountDetails(stripe, raw, subDiscountById);
      if (info?.phase1Entry) {
        phase1Discounts.push(info.phase1Entry);
      }
    }

    // Phase 2 must NEVER re-apply `once` coupons consumed in Phase 1; preserve only `forever` or still-valid `repeating` discounts
    const phase2Eval = await evaluateSchedulePhaseDiscounts(
      stripe,
      subscription,
      rawActiveDiscounts,
      currentPhaseEnd,
      { onceConsumed: true }
    );
    const phase2Discounts = phase2Eval.phaseDiscounts;
    const phase2Charge = computeDiscountedAmountFromCoupons(
      config.amount,
      phase2Eval.activeCoupons,
      phase2Eval.uncertain
    );

    const phases: Stripe.SubscriptionScheduleUpdateParams.Phase[] = [
      {
        start_date: currentPhaseStart,
        end_date: currentPhaseEnd,
        items: [
          {
            price: currentPriceId,
            quantity: currentQuantity,
          },
        ],
        ...(phase1Discounts.length > 0 ? { discounts: phase1Discounts } : {}),
        proration_behavior: "none",
        ...(activePhase?.trial_end ? { trial_end: activePhase.trial_end } : {}),
        metadata: {
          userId,
          ...(currentPlan ? { plan: currentPlan } : {}),
        },
      },
      {
        start_date: currentPhaseEnd,
        duration: {
          interval: config.interval,
          interval_count: config.intervalCount,
        },
        billing_cycle_anchor: "phase_start",
        items: [
          {
            price: config.priceId,
            quantity: 1,
          },
        ],
        ...(phase2Discounts.length > 0 ? { discounts: phase2Discounts } : {}),
        proration_behavior: "none",
        metadata: {
          userId,
          plan: newPlan,
          ...(currentPlan ? { scheduledFromPlan: currentPlan } : {}),
        },
      },
    ];

    await stripe.subscriptionSchedules.update(scheduleId, {
      phases,
      end_behavior: "release",
      proration_behavior: "none",
      metadata: {
        userId,
        scheduledPlan: newPlan,
        ...(currentPlan ? { previousPlan: currentPlan } : {}),
        subscriptionId: subscription.id,
      },
    });

    const periodStartIso = new Date((currentPeriodStartTs || currentPhaseStart) * 1000).toISOString();
    const startsAt = new Date(currentPhaseEnd * 1000).toISOString();
    const pendingData: Record<string, any> = {
      ...(currentPlan ? { subscriptionPlan: currentPlan } : {}),
      subscriptionPeriodStart: periodStartIso,
      subscriptionPeriodEnd: startsAt,
      pendingPlan: newPlan,
      pendingPlanAmount: phase2Charge.amount,
      pendingPlanPaymentIntentId: null,
      pendingPlanStartsAt: startsAt,
      pendingPlanInvoiceItemId: null,
      stripeScheduleId: scheduleId,
      updatedAt: new Date().toISOString(),
    };

    await safeFirestoreSet(userId, pendingData, true);

    subscriptionsMap.set(userId, {
      ...(subscriptionsMap.get(userId) || {
        subscriptionStatus: subscription.status,
        updatedAt: new Date().toISOString(),
      }),
      ...pendingData,
    } as any);

    return {
      scheduled: true,
      scheduleId,
      currentPlan: currentPlan || null,
      subscriptionPeriodStart: periodStartIso,
      subscriptionPeriodEnd: startsAt,
      pendingPlan: newPlan,
      pendingPlanAmount: phase2Charge.amount,
      pendingPlanStartsAt: startsAt,
      nextChargeDate: startsAt,
      nextChargeAmount: phase2Charge.amount,
      nextChargeAmountUncertain: phase2Charge.uncertain,
    };
  } catch (err) {
    if (createdNewSchedule && scheduleId) {
      try {
        await stripe.subscriptionSchedules.release(scheduleId);
      } catch {}
    }
    throw err;
  }
}

async function executeSchedulePlanChange(
  stripe: Stripe,
  userId: string,
  newPlan: PaidPlan
) {
  if (activePlanChangeUsers.has(userId)) {
    throw new PlanChangeError(
      409,
      "Un'operazione di cambio piano è già in corso. Attendi qualche secondo."
    );
  }

  activePlanChangeUsers.add(userId);
  try {
    const currentData = await getSubscriptionData(userId);
    if (!currentData?.stripeSubscriptionId) {
      throw new PlanChangeError(
        400,
        "Nessun abbonamento Stripe attivo trovato per questo account."
      );
    }

    if (currentData.pendingPlan) {
      throw new PlanChangeError(
        409,
        `Hai già programmato il passaggio al piano ${currentData.pendingPlan}. Annulla prima il cambio programmato se desideri selezionare un altro piano.`
      );
    }

    const subscription = await stripe.subscriptions.retrieve(
      currentData.stripeSubscriptionId,
      { expand: ["items.data.price", "discounts", "discounts.source.coupon"] }
    );

    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id;

    if (
      (currentData.stripeCustomerId && customerId && currentData.stripeCustomerId !== customerId) ||
      (subscription.metadata?.userId && subscription.metadata.userId !== userId)
    ) {
      throw new PlanChangeError(
        403,
        "Verifica proprietà abbonamento fallita."
      );
    }

    return await scheduleFuturePlan(stripe, userId, subscription, newPlan);
  } finally {
    activePlanChangeUsers.delete(userId);
  }
}

/* =========================================================
   CANCEL / CLEAN FUTURE PLAN
   ========================================================= */

async function cancelPendingPlan(
  stripe: Stripe,
  userId: string,
  data: any,
  liveSubscription?: Stripe.Subscription | null,
  options?: { skipFirestoreWrite?: boolean }
) {
  const attachedScheduleRef = (liveSubscription as any)?.schedule;
  const attachedScheduleId =
    typeof attachedScheduleRef === "string"
      ? attachedScheduleRef
      : attachedScheduleRef?.id;

  const scheduleId = data?.stripeScheduleId || attachedScheduleId;

  if (!data?.pendingPlan && !scheduleId) {
    return;
  }

  // Legacy defensive cleanup only if an old upfront payment intent or invoice item existed
  if (data?.pendingPlanPaymentIntentId) {
    try {
      await stripe.refunds.create({
        payment_intent: data.pendingPlanPaymentIntentId,
      });
    } catch (refundError: any) {
      console.log(
        "Refund pending plan note:",
        refundError?.message || refundError
      );
    }
  }

  if (data?.pendingPlanInvoiceItemId) {
    try {
      await stripe.invoiceItems.del(data.pendingPlanInvoiceItemId);
    } catch (invoiceError: any) {
      console.log(
        "Delete pending invoice item note:",
        invoiceError?.message || invoiceError
      );
    }
  }

  // Release the Subscription Schedule without canceling the active subscription
  if (scheduleId) {
    try {
      const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);
      if (schedule.status === "active" || schedule.status === "not_started") {
        await stripe.subscriptionSchedules.release(scheduleId);
      }
    } catch (scheduleError: any) {
      console.log(
        "Release schedule note:",
        scheduleError?.message || scheduleError
      );
    }
  }

  const clearData = {
    pendingPlan: null,
    pendingPlanAmount: null,
    pendingPlanPaymentIntentId: null,
    pendingPlanStartsAt: null,
    pendingPlanInvoiceItemId: null,
    stripeScheduleId: null,
    updatedAt: new Date().toISOString(),
  };

  if (!options?.skipFirestoreWrite) {
    await safeFirestoreSet(userId, clearData, true);

    const existing = subscriptionsMap.get(userId);
    if (existing) {
      subscriptionsMap.set(userId, {
        ...existing,
        ...clearData,
      } as any);
    }
  }
}

app.post(
  "/api/schedule-plan-change",
  verifySameOriginOnApi,
  apiSensitiveLimiter,
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: "Utente non autenticato" });
      }

      if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
        return res.status(400).json({ error: "Corpo della richiesta non valido." });
      }

      const plan = req.body?.plan ?? req.body?.newPlan;
      if (!isPaidPlan(plan)) {
        return res.status(400).json({ error: "Piano non valido per il cambio programmato." });
      }

      const stripe = getStripe();
      if (!stripe) {
        return res.status(503).json({
          error: "Servizio pagamenti temporaneamente non configurato.",
        });
      }

      const result = await executeSchedulePlanChange(stripe, userId, plan);
      return res.json(result);
    } catch (err: any) {
      if (err instanceof PlanChangeError || err instanceof FirestoreUnavailableError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      console.error("Errore programmazione cambio piano:", err?.message || err);
      return res.status(500).json({
        error: "Impossibile programmare il cambio piano al momento. Riprova tra qualche istante.",
      });
    }
  }
);

app.post(
  "/api/cancel-scheduled-plan-change",
  verifySameOriginOnApi,
  apiSensitiveLimiter,
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: "Utente non autenticato" });
    }

    if (activePlanChangeUsers.has(userId)) {
      return res.status(409).json({
        error: "Un'operazione di modifica piano è già in corso. Attendi qualche secondo.",
      });
    }

    activePlanChangeUsers.add(userId);
    try {
      const stripe = getStripe();
      if (!stripe) {
        return res.status(503).json({
          error: "Servizio pagamenti temporaneamente non configurato.",
        });
      }

      const currentData = await getSubscriptionData(userId);
      if (!currentData) {
        return res.status(404).json({ error: "Nessun dato abbonamento trovato." });
      }

      let liveSubscription: Stripe.Subscription | null = null;
      if (currentData.stripeSubscriptionId) {
        liveSubscription = await stripe.subscriptions.retrieve(
          currentData.stripeSubscriptionId,
          { expand: ["items.data.price", "discounts", "discounts.source.coupon"] }
        );
        const customerId =
          typeof liveSubscription.customer === "string"
            ? liveSubscription.customer
            : liveSubscription.customer?.id;
        if (
          (currentData.stripeCustomerId && customerId && currentData.stripeCustomerId !== customerId) ||
          (liveSubscription.metadata?.userId && liveSubscription.metadata.userId !== userId)
        ) {
          return res.status(403).json({ error: "Verifica proprietà abbonamento fallita." });
        }
      }

      const attachedSchedule = (liveSubscription as any)?.schedule;
      if (!currentData.pendingPlan && !currentData.stripeScheduleId && !attachedSchedule) {
        return res.status(400).json({
          error: "Non è presente alcun cambio piano programmato da annullare.",
        });
      }

      await cancelPendingPlan(stripe, userId, currentData, liveSubscription);

      const refreshed = await getSubscriptionData(userId);
      const currentPlan = liveSubscription
        ? derivePlanFromSubscription(liveSubscription) || refreshed?.subscriptionPlan || null
        : refreshed?.subscriptionPlan || null;

      const nextCharge = liveSubscription
        ? await resolveNextChargeForActiveSubscription(
            stripe,
            liveSubscription,
            currentPlan,
            null,
            null,
            null,
            Boolean(refreshed?.cancelAtPeriodEnd)
          )
        : {
            amount: getNextChargeAmount(
              currentPlan,
              null,
              null,
              Boolean(refreshed?.cancelAtPeriodEnd)
            ),
            uncertain: false,
          };

      return res.json({
        canceled: true,
        subscriptionStatus: liveSubscription?.status || refreshed?.subscriptionStatus || "active",
        subscriptionPlan: currentPlan,
        subscriptionPeriodStart: refreshed?.subscriptionPeriodStart || null,
        subscriptionPeriodEnd: refreshed?.subscriptionPeriodEnd || null,
        nextChargeDate: getNextChargeDate(
          refreshed?.subscriptionPeriodEnd,
          null,
          Boolean(refreshed?.cancelAtPeriodEnd),
          liveSubscription?.status || refreshed?.subscriptionStatus
        ),
        nextChargeAmount: nextCharge.amount,
        nextChargeAmountUncertain: nextCharge.uncertain,
        message: "Cambio piano programmato annullato. Il tuo abbonamento attuale rimane regolarmente attivo.",
      });
    } catch (err: any) {
      if (err instanceof FirestoreUnavailableError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      console.error("Errore annullamento cambio piano:", err?.message || err);
      return res.status(500).json({
        error: "Impossibile annullare il cambio piano programmato. Riprova tra qualche istante.",
      });
    } finally {
      activePlanChangeUsers.delete(userId);
    }
  }
);

app.post(
  "/api/cancel-subscription-renewal",
  verifySameOriginOnApi,
  apiSensitiveLimiter,
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: "Utente non autenticato" });
    }

    if (isAuthorizedCoach(req.user?.email, req.user?.emailVerified)) {
      return res.status(400).json({
        error: "L'account Coach ha accesso illimitato gratuito senza abbonamento Stripe.",
      });
    }

    if (activePlanChangeUsers.has(userId)) {
      return res.status(409).json({
        error: "Un'operazione sull'abbonamento è già in corso. Attendi qualche secondo.",
      });
    }

    activePlanChangeUsers.add(userId);
    try {
      const stripe = getStripe();
      if (!stripe) {
        return res.status(503).json({
          error: "Servizio pagamenti temporaneamente non configurato.",
        });
      }

      const currentData = await getSubscriptionData(userId);
      const liveSub = await findActiveStripeSubscriptionForUser(stripe, userId, currentData);
      if (!liveSub) {
        return res.status(404).json({
          error: "Nessun abbonamento attivo trovato per questo account.",
        });
      }

      const customerId =
        typeof liveSub.customer === "string" ? liveSub.customer : liveSub.customer?.id;
      if (
        (currentData?.stripeCustomerId && customerId && currentData.stripeCustomerId !== customerId) ||
        (liveSub.metadata?.userId && liveSub.metadata.userId !== userId)
      ) {
        return res.status(403).json({ error: "Verifica proprietà abbonamento fallita." });
      }

      if (currentData?.pendingPlan || currentData?.stripeScheduleId || (liveSub as any).schedule) {
        await cancelPendingPlan(stripe, userId, currentData || {}, liveSub);
      }

      const updatedSub = await stripe.subscriptions.update(
        liveSub.id,
        {
          cancel_at_period_end: true,
          expand: ["items.data.price"],
        }
      );

      const startTs = getSubscriptionPeriodStartTs(updatedSub);
      const endTs = getSubscriptionPeriodEndTs(updatedSub);
      const periodStartIso = startTs ? new Date(startTs * 1000).toISOString() : (currentData?.subscriptionPeriodStart || null);
      const periodEndIso = endTs ? new Date(endTs * 1000).toISOString() : (currentData?.subscriptionPeriodEnd || null);
      const currentPlan = derivePlanFromSubscription(updatedSub) || currentData?.subscriptionPlan || null;

      const cancelUpdate: Record<string, any> = {
        subscriptionStatus: updatedSub.status === "trialing" ? "trialing" : "active",
        ...(currentPlan ? { subscriptionPlan: currentPlan } : {}),
        subscriptionPeriodStart: periodStartIso,
        subscriptionPeriodEnd: periodEndIso,
        cancelAtPeriodEnd: true,
        stripeCustomerId: customerId || currentData?.stripeCustomerId || null,
        stripeSubscriptionId: updatedSub.id,
        pendingPlan: null,
        pendingPlanAmount: null,
        pendingPlanPaymentIntentId: null,
        pendingPlanStartsAt: null,
        pendingPlanInvoiceItemId: null,
        stripeScheduleId: null,
        updatedAt: new Date().toISOString(),
      };

      await safeFirestoreSet(userId, cancelUpdate, true);
      subscriptionsMap.set(userId, {
        ...(currentData || {}),
        ...cancelUpdate,
      } as any);

      return res.json({
        canceledRenewal: true,
        cancelAtPeriodEnd: true,
        subscriptionStatus: cancelUpdate.subscriptionStatus,
        subscriptionPlan: currentPlan,
        subscriptionPeriodStart: periodStartIso,
        subscriptionPeriodEnd: periodEndIso,
        nextChargeDate: null,
        nextChargeAmount: 0,
        nextChargeAmountUncertain: false,
        message: periodEndIso
          ? `Rinnovo automatico annullato. Il tuo abbonamento rimane attivo fino al ${formatDateRomeIt(periodEndIso)} senza ulteriori addebiti.`
          : "Rinnovo automatico annullato. Nessun altro addebito verrà effettuato.",
      });
    } catch (err: any) {
      if (err instanceof FirestoreUnavailableError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      console.error("Errore annullamento rinnovo abbonamento:", err?.message || err);
      return res.status(500).json({
        error: "Impossibile annullare il rinnovo automatico al momento. Riprova tra qualche istante.",
      });
    } finally {
      activePlanChangeUsers.delete(userId);
    }
  }
);

app.get(
  "/api/verify-checkout-session",
  verifySameOriginOnApi,
  apiSensitiveLimiter,
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: "Utente non autenticato." });
      }

      const rawSessionId = typeof req.query.session_id === "string" ? req.query.session_id.trim() : "";
      if (!rawSessionId || rawSessionId.length > 255 || !/^cs_(test|live)_[a-zA-Z0-9]+$/.test(rawSessionId)) {
        return res.status(400).json({
          verified: false,
          errorCode: "INVALID_SESSION_ID",
          error: "Identificativo sessione Checkout non valido.",
        });
      }

      const stripe = getStripe();
      if (!stripe) {
        return res.status(503).json({
          verified: false,
          error: "Servizio pagamenti temporaneamente non configurato.",
        });
      }

      const session = await stripe.checkout.sessions.retrieve(rawSessionId, {
        expand: ["subscription", "subscription.items.data.price", "subscription.discounts", "subscription.discounts.source.coupon"],
      });

      const refUid = session.client_reference_id || null;
      const metaUid = session.metadata?.userId || null;

      if (!refUid && !metaUid) {
        return res.status(403).json({
          verified: false,
          errorCode: "CHECKOUT_IDENTITY_MISSING",
          error: "Errore di sicurezza: sessione Checkout priva di identità associata.",
        });
      }

      if (
        (refUid && refUid !== userId) ||
        (metaUid && metaUid !== userId) ||
        (refUid && metaUid && refUid !== metaUid)
      ) {
        console.warn(
          `Security block CHECKOUT_IDENTITY_MISMATCH: authenticated=${userId}, client_reference_id=${refUid}, metadata.userId=${metaUid}`
        );
        return res.status(403).json({
          verified: false,
          errorCode: "CHECKOUT_IDENTITY_MISMATCH",
          error:
            "Errore di sicurezza: questa sessione di pagamento appartiene a un altro account e non corrisponde all'utente attualmente autenticato. Nessun abbonamento è stato associato.",
        });
      }

      const isPaymentSettled =
        session.payment_status === "paid" ||
        session.payment_status === "no_payment_required";

      const expandedSub =
        session.subscription && typeof session.subscription === "object"
          ? (session.subscription as Stripe.Subscription)
          : typeof session.subscription === "string"
            ? await stripe.subscriptions.retrieve(session.subscription, {
                expand: ["items.data.price", "discounts", "discounts.source.coupon"],
              })
            : null;

      if (expandedSub?.metadata?.userId && expandedSub.metadata.userId !== userId) {
        return res.status(403).json({
          verified: false,
          errorCode: "CHECKOUT_IDENTITY_MISMATCH",
          error:
            "Errore di sicurezza: la sottoscrizione Stripe risulta associata a un altro account.",
        });
      }

      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id ||
            (expandedSub
              ? typeof expandedSub.customer === "string"
                ? expandedSub.customer
                : expandedSub.customer?.id
              : undefined);

      if (customerId) {
        const ownership = await checkStripeCustomerOwnership(stripe, userId, customerId);
        if (ownership.conflict) {
          return res.status(403).json({
            verified: false,
            errorCode: "CHECKOUT_IDENTITY_MISMATCH",
            error:
              "Errore di sicurezza: il cliente Stripe della sessione è associato a un altro account Firebase.",
          });
        }
      }

      let syncedStatus = isPaymentSettled ? "active" : "incomplete";
      let syncedPlan = session.metadata?.plan || "monthly";
      let syncedPeriodStart: string | null = null;
      let syncedPeriodEnd: string | null = null;
      let cancelAtPeriodEnd = false;

      if (expandedSub) {
        syncedStatus = expandedSub.status;
        syncedPlan = derivePlanFromSubscription(expandedSub) || syncedPlan;
        const startTs = getSubscriptionPeriodStartTs(expandedSub);
        const endTs = getSubscriptionPeriodEndTs(expandedSub);
        syncedPeriodStart = startTs ? new Date(startTs * 1000).toISOString() : null;
        syncedPeriodEnd = endTs ? new Date(endTs * 1000).toISOString() : null;
        cancelAtPeriodEnd = Boolean(expandedSub.cancel_at_period_end);

        if (isPaymentSettled && (syncedStatus === "active" || syncedStatus === "trialing")) {
          const syncPayload: Record<string, any> = {
            subscriptionStatus: syncedStatus,
            subscriptionPlan: syncedPlan,
            subscriptionPeriodStart: syncedPeriodStart,
            subscriptionPeriodEnd: syncedPeriodEnd,
            cancelAtPeriodEnd,
            stripeCustomerId: customerId || null,
            stripeSubscriptionId: expandedSub.id,
            pendingPlan: null,
            pendingPlanAmount: null,
            pendingPlanPaymentIntentId: null,
            pendingPlanStartsAt: null,
            pendingPlanInvoiceItemId: null,
            stripeScheduleId: null,
            updatedAt: new Date().toISOString(),
          };

          await safeFirestoreSet(userId, syncPayload, true);
          subscriptionsMap.set(userId, {
            ...(subscriptionsMap.get(userId) || {}),
            ...syncPayload,
          } as any);
        }
      }

      const nextCharge = expandedSub
        ? await resolveNextChargeForActiveSubscription(
            stripe,
            expandedSub,
            syncedPlan,
            null,
            null,
            null,
            cancelAtPeriodEnd
          )
        : {
            amount: getNextChargeAmount(syncedPlan, null, null, cancelAtPeriodEnd),
            uncertain: false,
          };

      return res.json({
        verified: true,
        uid: userId,
        paymentStatus: session.payment_status,
        subscriptionStatus: syncedStatus,
        subscriptionPlan: syncedPlan,
        subscriptionPeriodStart: syncedPeriodStart,
        subscriptionPeriodEnd: syncedPeriodEnd,
        cancelAtPeriodEnd,
        nextChargeDate: getNextChargeDate(syncedPeriodEnd, null, cancelAtPeriodEnd, syncedStatus),
        nextChargeAmount: nextCharge.amount,
        nextChargeAmountUncertain: nextCharge.uncertain,
      });
    } catch (err: any) {
      if (err instanceof FirestoreUnavailableError) {
        return res.status(err.statusCode).json({
          verified: false,
          error: err.message,
        });
      }
      console.error("Errore verifica Checkout Session:", err?.message || err);
      return res.status(500).json({
        verified: false,
        error: "Impossibile verificare la sessione di pagamento su Stripe.",
      });
    }
  }
);

/* =========================================================
   STRIPE WEBHOOK
   ========================================================= */

app.post("/api/webhook", async (req, res) => {
  const stripe = getStripe();
  if (!stripe) {
    console.error("Webhook Error: Stripe non è inizializzato sul server");
    return res.status(500).json({
      error: "Stripe non è inizializzato sul server.",
    });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Webhook Error: STRIPE_WEBHOOK_SECRET non configurato");
    return res.status(500).json({
      error: "Configurazione del server incompleta: STRIPE_WEBHOOK_SECRET mancante.",
    });
  }

  const signature = req.headers["stripe-signature"] as string;
  if (!signature || (typeof signature === "string" && !signature.trim())) {
    console.error("Webhook Error: Intestazione stripe-signature mancante");
    return res.status(400).json({
      error: "Intestazione stripe-signature mancante.",
    });
  }

  const payload: string | Buffer = (req as any).rawBody || req.body;
  if (!payload || (typeof payload !== "string" && !Buffer.isBuffer(payload))) {
    console.error("Webhook Error: Corpo raw della richiesta non disponibile per la verifica");
    return res.status(400).send(
      "Webhook Error: Impossibile verificare la firma Stripe. Corpo della richiesta raw mancante o non valido."
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
  } catch (err: any) {
    console.error(
      `Webhook Signature Error: ${err.message}`
    );

    return res
      .status(400)
      .send(
        `Webhook Error: ${err.message}`
      );
  }

  let lock: StripeEventLockResult = {
    acquired: false,
    alreadyProcessed: false,
    inProgress: false,
    ownerId: null,
    acquiredFirestoreLock: false,
    attempt: 0,
  };
  try {
    // 1. Atomic lease + owner-fenced replay / race-safe deduplication protection
    lock = await acquireStripeEventLock(event);
    if (lock.alreadyProcessed) {
      return res.json({ received: true, duplicate: true });
    }
    if (!lock.acquired || lock.inProgress) {
      return res.status(409).json({
        received: false,
        inProgress: true,
        error: "Evento webhook già in elaborazione.",
      });
    }

    /* =====================================================
       CHECKOUT COMPLETED
       ===================================================== */

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const refUserId = session.client_reference_id || undefined;
      const metaUserId = session.metadata?.userId || undefined;
      if (refUserId && metaUserId && refUserId !== metaUserId) {
        console.warn(
          `Webhook Security block: mismatch client_reference_id (${refUserId}) vs metadata.userId (${metaUserId}).`
        );
        await markStripeEventProcessed(event, lock, { securityBlocked: true });
        return res.json({ received: true });
      }

      const userId = refUserId || metaUserId;
      const plan = session.metadata?.plan;

      // Ignore legacy scheduled_plan_change one-time checkout if any old link completes
      if (session.metadata?.changeType === "scheduled_plan_change") {
        await markStripeEventProcessed(event, lock);
        return res.json({ received: true });
      }

      // Standard checkout flow
      if (userId) {
        const existing = await getSubscriptionData(userId);
        if (
          existing?.lastStripeEventCreated &&
          event.created < existing.lastStripeEventCreated
        ) {
          console.warn("Ignorato checkout.session.completed obsoleto:", event.id);
          await markStripeEventProcessed(event, lock, { staleSkipped: true });
          return res.json({ received: true, stale: true });
        }

        let normalPlan = plan || "monthly";

        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;

        if (customerId) {
          const customerOwnership = await checkStripeCustomerOwnership(stripe, userId, customerId);
          if (customerOwnership.conflict) {
            console.warn(
              `Webhook Security block: checkout customer ${customerId} appartiene a un altro UID rispetto a ${userId}.`
            );
            await markStripeEventProcessed(event, lock, { securityBlocked: true });
            return res.json({ received: true });
          }
        }

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        if (normalPlan === "test") {
          await markStripeEventProcessed(event, lock);
          return res.json({ received: true });
        }

        const isPaymentSettled =
          session.payment_status === "paid" ||
          session.payment_status === "no_payment_required";

        let subscriptionStatus = isPaymentSettled
          ? (normalPlan === "trial" ? "trialing" : "active")
          : "incomplete";

        let periodStart: string | undefined;
        let periodEnd: string | undefined;
        let cancelAtPeriodEnd = false;

        if (subscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
              expand: ["items.data.price"],
            });

            if (subscription.metadata?.userId && subscription.metadata.userId !== userId) {
              console.warn(
                `Webhook Security block: subscription ${subscriptionId} metadata.userId (${subscription.metadata.userId}) != checkout userId (${userId}).`
              );
              await markStripeEventProcessed(event, lock, { securityBlocked: true });
              return res.json({ received: true });
            }

            if (
              subscription.status === "trialing" ||
              subscription.status === "active" ||
              subscription.status === "past_due" ||
              subscription.status === "incomplete" ||
              subscription.status === "canceled" ||
              subscription.status === "unpaid"
            ) {
              subscriptionStatus = subscription.status;
            }

            const derivedFromSub = derivePlanFromSubscription(subscription);
            if (derivedFromSub) {
              normalPlan = derivedFromSub;
            }

            const periodStartTs = getSubscriptionPeriodStartTs(subscription);
            const periodEndTs = getSubscriptionPeriodEndTs(subscription);

            if (periodStartTs) {
              periodStart = new Date(periodStartTs * 1000).toISOString();
            }
            if (periodEndTs) {
              periodEnd = new Date(periodEndTs * 1000).toISOString();
            }
            cancelAtPeriodEnd = Boolean(subscription.cancel_at_period_end);
          } catch (e: any) {
            console.warn("Subscription retrieve note:", e?.message || e);
          }
        }

        if (!periodStart && (subscriptionStatus === "active" || subscriptionStatus === "trialing")) {
          periodStart = new Date((event.created || Math.floor(Date.now() / 1000)) * 1000).toISOString();
        }

        if (!periodEnd && (subscriptionStatus === "active" || subscriptionStatus === "trialing")) {
          const periodDays =
            normalPlan === "trial"
              ? 7
              : normalPlan === "monthly"
                ? 30
                : normalPlan === "quarterly"
                  ? 90
                  : 365;

          periodEnd = new Date(Date.now() + periodDays * 86400000).toISOString();
        }

        const subInfo: Record<string, any> = {
          subscriptionStatus,
          subscriptionPlan: normalPlan,
          subscriptionPeriodStart: periodStart || null,
          subscriptionPeriodEnd: periodEnd || null,
          cancelAtPeriodEnd,
          stripeCustomerId: customerId || null,
          stripeSubscriptionId: subscriptionId || null,
          pendingPlan: null,
          pendingPlanAmount: null,
          pendingPlanPaymentIntentId: null,
          pendingPlanStartsAt: null,
          pendingPlanInvoiceItemId: null,
          stripeScheduleId: null,
          lastStripeEventCreated: event.created,
          updatedAt: new Date().toISOString(),
        };

        const commitRes = await commitWebhookUserUpdateAndMarkProcessed(userId, event, lock, subInfo);
        return res.json(commitRes.stale ? { received: true, stale: true } : { received: true });
      }

      await markStripeEventProcessed(event, lock);
      return res.json({ received: true });
    }

    /* =====================================================
       SUBSCRIPTION CREATED & UPDATED
       ===================================================== */

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated"
    ) {
      const subscription = event.data.object as Stripe.Subscription;

      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id;

      const subscriptionId = subscription.id;

      const userId = await resolveStrictUserIdForSubscription(
        subscription.metadata?.userId,
        customerId,
        stripe
      );

      if (!userId) {
        console.warn("Webhook subscription update senza userId valido/coerente:", subscriptionId);
        await markStripeEventProcessed(event, lock);
        return res.json({ received: true });
      }

      const existing = await getSubscriptionData(userId);
      if (
        existing?.lastStripeEventCreated &&
        event.created < existing.lastStripeEventCreated
      ) {
        console.warn("Ignorato evento Stripe obsoleto:", event.id);
        await markStripeEventProcessed(event, lock, { staleSkipped: true });
        return res.json({ received: true, stale: true });
      }

      const rawStatus = subscription.status;
      const status =
        rawStatus === "active" ||
        rawStatus === "trialing" ||
        rawStatus === "past_due" ||
        rawStatus === "incomplete" ||
        rawStatus === "unpaid"
          ? rawStatus
          : "canceled";

      if (status === "canceled") {
        const subCanceled: Record<string, any> = {
          subscriptionStatus: "canceled",
          subscriptionPlan: null,
          subscriptionPeriodStart: null,
          subscriptionPeriodEnd: null,
          cancelAtPeriodEnd: false,
          stripeSubscriptionId: null,
          pendingPlan: null,
          pendingPlanAmount: null,
          pendingPlanPaymentIntentId: null,
          pendingPlanStartsAt: null,
          pendingPlanInvoiceItemId: null,
          stripeScheduleId: null,
          lastStripeEventCreated: event.created,
          updatedAt: new Date().toISOString(),
        };
        const commitRes = await commitWebhookUserUpdateAndMarkProcessed(userId, event, lock, subCanceled);
        return res.json(commitRes.stale ? { received: true, stale: true } : { received: true });
      }

      const periodStartTs = getSubscriptionPeriodStartTs(subscription);
      const periodEndTs = getSubscriptionPeriodEndTs(subscription);

      const periodStart = periodStartTs
        ? new Date(periodStartTs * 1000).toISOString()
        : existing?.subscriptionPeriodStart || null;
      const periodEnd = periodEndTs
        ? new Date(periodEndTs * 1000).toISOString()
        : null;

      const cancelAtPeriodEnd = Boolean(subscription.cancel_at_period_end);

      const derivedPlan = derivePlanFromSubscription(subscription);
      let planToStore = derivedPlan || existing?.subscriptionPlan || subscription.metadata?.plan;
      let pendingPlan: string | null | undefined = existing?.pendingPlan;
      const scheduleRef = (subscription as any).schedule;
      const attachedScheduleId =
        typeof scheduleRef === "string" ? scheduleRef : scheduleRef?.id || null;

      const subUpdate: Record<string, any> = {
        subscriptionStatus: status,
        subscriptionPeriodStart: periodStart,
        subscriptionPeriodEnd: periodEnd,
        cancelAtPeriodEnd,
        stripeCustomerId: customerId || null,
        stripeSubscriptionId: subscriptionId,
        lastStripeEventCreated: event.created,
        updatedAt: new Date().toISOString(),
      };

      if (
        existing?.pendingPlan &&
        derivedPlan === existing.pendingPlan &&
        (status === "active" || status === "trialing")
      ) {
        planToStore = existing.pendingPlan;
        pendingPlan = null;
        subUpdate.pendingPlan = null;
        subUpdate.pendingPlanAmount = null;
        subUpdate.pendingPlanPaymentIntentId = null;
        subUpdate.pendingPlanStartsAt = null;
        subUpdate.pendingPlanInvoiceItemId = null;
        subUpdate.stripeScheduleId = attachedScheduleId;
      } else if (
        existing?.pendingPlan &&
        derivedPlan === existing.pendingPlan &&
        (status === "past_due" || status === "incomplete" || status === "unpaid")
      ) {
        // Payment failed right when the scheduled transition occurred; keep pendingPlan info visible until invoice is paid
        planToStore = existing.subscriptionPlan || derivedPlan;
      }

      if (cancelAtPeriodEnd && existing?.pendingPlan) {
        await assertWebhookLockStillOwned(event.id, lock);
        await cancelPendingPlan(stripe, userId, existing, subscription, { skipFirestoreWrite: true });
        pendingPlan = null;
        subUpdate.pendingPlan = null;
        subUpdate.pendingPlanAmount = null;
        subUpdate.pendingPlanPaymentIntentId = null;
        subUpdate.pendingPlanStartsAt = null;
        subUpdate.pendingPlanInvoiceItemId = null;
        subUpdate.stripeScheduleId = null;
      }

      if (planToStore) {
        subUpdate.subscriptionPlan = planToStore;
      }

      if (pendingPlan !== undefined) {
        subUpdate.pendingPlan = pendingPlan || null;
      }

      const commitRes = await commitWebhookUserUpdateAndMarkProcessed(userId, event, lock, subUpdate);
      return res.json(commitRes.stale ? { received: true, stale: true } : { received: true });
    }

    /* =====================================================
       SUBSCRIPTION SCHEDULES
       ===================================================== */

    if (
      event.type === "subscription_schedule.created" ||
      event.type === "subscription_schedule.updated" ||
      event.type === "subscription_schedule.released" ||
      event.type === "subscription_schedule.canceled" ||
      event.type === "subscription_schedule.completed"
    ) {
      const schedule = event.data.object as Stripe.SubscriptionSchedule;
      const customerId =
        typeof schedule.customer === "string"
          ? schedule.customer
          : schedule.customer?.id;

      const userId = await resolveStrictUserIdForSubscription(
        schedule.metadata?.userId,
        customerId,
        stripe
      );

      if (!userId) {
        await markStripeEventProcessed(event, lock);
        return res.json({ received: true });
      }

      const existing = await getSubscriptionData(userId);
      if (
        existing?.lastStripeEventCreated &&
        event.created < existing.lastStripeEventCreated
      ) {
        console.warn("Ignorato evento subscription_schedule obsoleto:", event.id);
        await markStripeEventProcessed(event, lock, { staleSkipped: true });
        return res.json({ received: true, stale: true });
      }

      const linkedSubId =
        (typeof (schedule as any).released_subscription === "string"
          ? (schedule as any).released_subscription
          : (schedule as any).released_subscription?.id) ||
        (typeof schedule.subscription === "string"
          ? schedule.subscription
          : schedule.subscription?.id) ||
        existing?.stripeSubscriptionId;

      let liveSub: Stripe.Subscription | null = null;
      if (linkedSubId) {
        try {
          liveSub = await stripe.subscriptions.retrieve(linkedSubId, {
            expand: ["items.data.price", "discounts", "discounts.source.coupon"],
          });
        } catch {}
      }

      if (
        event.type === "subscription_schedule.released" ||
        event.type === "subscription_schedule.canceled" ||
        event.type === "subscription_schedule.completed" ||
        schedule.status === "released" ||
        schedule.status === "canceled" ||
        schedule.status === "completed"
      ) {
        const livePlan = liveSub
          ? derivePlanFromSubscription(liveSub) || existing?.subscriptionPlan
          : existing?.subscriptionPlan;
        const livePeriodStartTs = liveSub ? getSubscriptionPeriodStartTs(liveSub) : undefined;
        const livePeriodEndTs = liveSub ? getSubscriptionPeriodEndTs(liveSub) : undefined;
        const liveStatus = liveSub?.status;

        const scheduleClearUpdate: Record<string, any> = {
          ...(livePlan ? { subscriptionPlan: livePlan } : {}),
          ...(livePeriodStartTs
            ? { subscriptionPeriodStart: new Date(livePeriodStartTs * 1000).toISOString() }
            : {}),
          ...(livePeriodEndTs
            ? { subscriptionPeriodEnd: new Date(livePeriodEndTs * 1000).toISOString() }
            : {}),
          ...(liveStatus ? { subscriptionStatus: liveStatus } : {}),
          pendingPlan: null,
          pendingPlanAmount: null,
          pendingPlanPaymentIntentId: null,
          pendingPlanStartsAt: null,
          pendingPlanInvoiceItemId: null,
          stripeScheduleId: null,
          lastStripeEventCreated: event.created,
          updatedAt: new Date().toISOString(),
        };

        const commitRes = await commitWebhookUserUpdateAndMarkProcessed(userId, event, lock, scheduleClearUpdate);
        return res.json(commitRes.stale ? { received: true, stale: true } : { received: true });
      }

      // Active / updated schedule: check if a future phase exists beyond current_phase
      const currentPhase = schedule.current_phase;
      const nextPhase = currentPhase
        ? (schedule.phases || []).find((p) => p.start_date >= currentPhase.end_date)
        : undefined;

      if (nextPhase) {
        const nextPlanFromMeta = nextPhase.metadata?.plan;
        const nextPrice = nextPhase.items?.[0]?.price;
        let nextPlan: PaidPlan | undefined = isPaidPlan(nextPlanFromMeta)
          ? nextPlanFromMeta
          : undefined;
        if (!nextPlan && typeof nextPrice === "string") {
          try {
            const retrievedPrice = await stripe.prices.retrieve(nextPrice);
            nextPlan = derivePlanFromPrice(retrievedPrice);
          } catch {}
        } else if (!nextPlan && nextPrice && typeof nextPrice === "object") {
          nextPlan = derivePlanFromPrice(nextPrice as Stripe.Price);
        }

        if (nextPlan) {
          const startsAt = new Date(nextPhase.start_date * 1000).toISOString();
          const currentPlan = liveSub
            ? derivePlanFromSubscription(liveSub) || existing?.subscriptionPlan
            : existing?.subscriptionPlan;
          let computedPendingAmount: number | null = PLAN_CONFIG[nextPlan].amount;
          const rawNextDiscounts = Array.isArray((nextPhase as any).discounts)
            ? (nextPhase as any).discounts
            : [];
          if (rawNextDiscounts.length > 0 && liveSub) {
            const evaluated = await evaluateSchedulePhaseDiscounts(
              stripe,
              liveSub,
              rawNextDiscounts,
              nextPhase.start_date,
              { onceConsumed: false }
            );
            computedPendingAmount = computeDiscountedAmountFromCoupons(
              PLAN_CONFIG[nextPlan].amount,
              evaluated.activeCoupons,
              evaluated.uncertain
            ).amount;
          } else if (rawNextDiscounts.length > 0) {
            computedPendingAmount = null;
          }

          const scheduleActiveUpdate: Record<string, any> = {
            ...(currentPlan ? { subscriptionPlan: currentPlan } : {}),
            pendingPlan: nextPlan,
            pendingPlanAmount: computedPendingAmount,
            pendingPlanPaymentIntentId: null,
            pendingPlanStartsAt: startsAt,
            pendingPlanInvoiceItemId: null,
            stripeScheduleId: schedule.id,
            lastStripeEventCreated: event.created,
            updatedAt: new Date().toISOString(),
          };
          const commitRes = await commitWebhookUserUpdateAndMarkProcessed(userId, event, lock, scheduleActiveUpdate);
          return res.json(commitRes.stale ? { received: true, stale: true } : { received: true });
        }
      } else if (liveSub) {
        // Schedule has entered its final phase
        const livePlan = derivePlanFromSubscription(liveSub);
        if (
          livePlan &&
          existing?.pendingPlan === livePlan &&
          (liveSub.status === "active" || liveSub.status === "trialing")
        ) {
          const livePeriodStartTs = getSubscriptionPeriodStartTs(liveSub);
          const livePeriodEndTs = getSubscriptionPeriodEndTs(liveSub);
          const transitionUpdate: Record<string, any> = {
            subscriptionStatus: liveSub.status,
            subscriptionPlan: livePlan,
            ...(livePeriodStartTs
              ? { subscriptionPeriodStart: new Date(livePeriodStartTs * 1000).toISOString() }
              : {}),
            ...(livePeriodEndTs
              ? { subscriptionPeriodEnd: new Date(livePeriodEndTs * 1000).toISOString() }
              : {}),
            pendingPlan: null,
            pendingPlanAmount: null,
            pendingPlanPaymentIntentId: null,
            pendingPlanStartsAt: null,
            pendingPlanInvoiceItemId: null,
            stripeScheduleId: schedule.id,
            lastStripeEventCreated: event.created,
            updatedAt: new Date().toISOString(),
          };
          const commitRes = await commitWebhookUserUpdateAndMarkProcessed(userId, event, lock, transitionUpdate);
          return res.json(commitRes.stale ? { received: true, stale: true } : { received: true });
        }
      }

      await markStripeEventProcessed(event, lock);
      return res.json({ received: true });
    }

    /* =====================================================
       SUBSCRIPTION DELETED
       ===================================================== */

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;

      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id;

      const userId = await resolveStrictUserIdForSubscription(
        subscription.metadata?.userId,
        customerId,
        stripe
      );

      if (!userId) {
        await markStripeEventProcessed(event, lock);
        return res.json({ received: true });
      }

      const existing = await getSubscriptionData(userId);
      if (
        existing?.lastStripeEventCreated &&
        event.created < existing.lastStripeEventCreated
      ) {
        await markStripeEventProcessed(event, lock, { staleSkipped: true });
        return res.json({ received: true, stale: true });
      }

      if (existing?.pendingPlan || existing?.stripeScheduleId) {
        await assertWebhookLockStillOwned(event.id, lock);
        await cancelPendingPlan(stripe, userId, existing, undefined, { skipFirestoreWrite: true });
      }

      const subDelete = {
        subscriptionStatus: "canceled",
        subscriptionPlan: null,
        subscriptionPeriodStart: null,
        subscriptionPeriodEnd: null,
        cancelAtPeriodEnd: false,
        stripeSubscriptionId: null,
        pendingPlan: null,
        pendingPlanAmount: null,
        pendingPlanPaymentIntentId: null,
        pendingPlanStartsAt: null,
        pendingPlanInvoiceItemId: null,
        stripeScheduleId: null,
        lastStripeEventCreated: event.created,
        updatedAt: new Date().toISOString(),
      };

      const commitRes = await commitWebhookUserUpdateAndMarkProcessed(userId, event, lock, subDelete);
      return res.json(commitRes.stale ? { received: true, stale: true } : { received: true });
    }

    /* =====================================================
       INVOICE PAID / PAYMENT SUCCEEDED & FAILED
       ===================================================== */

    if (
      event.type === "invoice.paid" ||
      event.type === "invoice.payment_succeeded" ||
      event.type === "invoice.payment_failed"
    ) {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      const invoiceSub = (invoice as any).subscription;
      const subscriptionId =
        typeof invoiceSub === "string" ? invoiceSub : invoiceSub?.id;

      let retrievedSubscription: Stripe.Subscription | null = null;
      if (subscriptionId) {
        try {
          retrievedSubscription = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ["items.data.price"],
          });
        } catch (subErr: any) {
          console.warn("Invoice subscription retrieve note:", subErr?.message || subErr);
        }
      }

      const invoiceMetaUserId =
        retrievedSubscription?.metadata?.userId ||
        (invoice as any).subscription_details?.metadata?.userId ||
        (invoice as any).parent?.subscription_details?.metadata?.userId;

      const userId = await resolveStrictUserIdForSubscription(
        invoiceMetaUserId,
        customerId,
        stripe
      );

      if (!userId) {
        console.warn("Webhook invoice senza userId valido/coerente:", subscriptionId || invoice.id);
        await markStripeEventProcessed(event, lock);
        return res.json({ received: true });
      }

      if (
        retrievedSubscription?.metadata?.userId &&
        retrievedSubscription.metadata.userId !== userId
      ) {
        console.warn(
          `Webhook Security block: invoice subscription ${subscriptionId} appartiene a ${retrievedSubscription.metadata.userId}, non a ${userId}.`
        );
        await markStripeEventProcessed(event, lock, { securityBlocked: true });
        return res.json({ received: true });
      }

      const existing = await getSubscriptionData(userId);
      if (
        existing?.lastStripeEventCreated &&
        event.created < existing.lastStripeEventCreated
      ) {
        await markStripeEventProcessed(event, lock, { staleSkipped: true });
        return res.json({ received: true, stale: true });
      }

      if (event.type === "invoice.payment_failed") {
        const failedUpdate = {
          subscriptionStatus: "past_due",
          lastStripeEventCreated: event.created,
          updatedAt: new Date().toISOString(),
        };
        const commitRes = await commitWebhookUserUpdateAndMarkProcessed(userId, event, lock, failedUpdate);
        return res.json(commitRes.stale ? { received: true, stale: true } : { received: true });
      }

      if (retrievedSubscription) {
        const subscription = retrievedSubscription;

        const periodStartTs = getSubscriptionPeriodStartTs(subscription);
        const periodEndTs = getSubscriptionPeriodEndTs(subscription);
        const periodStart = periodStartTs
          ? new Date(periodStartTs * 1000).toISOString()
          : existing?.subscriptionPeriodStart || null;
        const periodEnd = periodEndTs
          ? new Date(periodEndTs * 1000).toISOString()
          : existing?.subscriptionPeriodEnd || null;

        const livePlan = derivePlanFromSubscription(subscription);
        const scheduleRef = (subscription as any).schedule;
        const attachedScheduleId =
          typeof scheduleRef === "string" ? scheduleRef : scheduleRef?.id || null;

        const paidUpdate: Record<string, any> = {
          subscriptionStatus: subscription.status === "trialing" ? "trialing" : "active",
          subscriptionPeriodStart: periodStart,
          subscriptionPeriodEnd: periodEnd,
          cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
          stripeCustomerId: customerId || null,
          stripeSubscriptionId: subscriptionId,
          lastStripeEventCreated: event.created,
          updatedAt: new Date().toISOString(),
        };

        if (livePlan) {
          paidUpdate.subscriptionPlan = livePlan;
        }

        if (existing?.pendingPlan && livePlan === existing.pendingPlan) {
          paidUpdate.pendingPlan = null;
          paidUpdate.pendingPlanAmount = null;
          paidUpdate.pendingPlanPaymentIntentId = null;
          paidUpdate.pendingPlanStartsAt = null;
          paidUpdate.pendingPlanInvoiceItemId = null;
          paidUpdate.stripeScheduleId = attachedScheduleId;
        } else if (!attachedScheduleId && existing?.stripeScheduleId) {
          paidUpdate.stripeScheduleId = null;
        }

        const commitRes = await commitWebhookUserUpdateAndMarkProcessed(userId, event, lock, paidUpdate);
        return res.json(commitRes.stale ? { received: true, stale: true } : { received: true });
      }

      await markStripeEventProcessed(event, lock);
      return res.json({ received: true });
    }

    /* =====================================================
       CHARGE REFUNDED
       ===================================================== */

    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const customerId =
        typeof charge.customer === "string" ? charge.customer : charge.customer?.id;
      const paymentIntentId =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id;

      const userId = await findUserIdByStripeCustomerId(customerId, stripe);
      if (userId) {
        const existing = await getSubscriptionData(userId);
        if (
          existing?.lastStripeEventCreated &&
          event.created < existing.lastStripeEventCreated
        ) {
          await markStripeEventProcessed(event, lock, { staleSkipped: true });
          return res.json({ received: true, stale: true });
        }

        if (
          existing?.pendingPlanPaymentIntentId &&
          paymentIntentId &&
          existing.pendingPlanPaymentIntentId === paymentIntentId
        ) {
          await assertWebhookLockStillOwned(event.id, lock);
          await cancelPendingPlan(
            stripe,
            userId,
            {
              ...existing,
              pendingPlanPaymentIntentId: null,
            },
            undefined,
            { skipFirestoreWrite: true }
          );
          const clearRefundUpdate = {
            pendingPlan: null,
            pendingPlanAmount: null,
            pendingPlanPaymentIntentId: null,
            pendingPlanStartsAt: null,
            pendingPlanInvoiceItemId: null,
            stripeScheduleId: null,
            lastStripeEventCreated: event.created,
            updatedAt: new Date().toISOString(),
          };
          const commitRes = await commitWebhookUserUpdateAndMarkProcessed(userId, event, lock, clearRefundUpdate);
          return res.json(commitRes.stale ? { received: true, stale: true } : { received: true });
        } else if (charge.refunded && existing?.stripeSubscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(existing.stripeSubscriptionId);
            const refundUpdate = {
              subscriptionStatus:
                subscription.status === "active" || subscription.status === "trialing"
                  ? subscription.status
                  : "canceled",
              lastStripeEventCreated: event.created,
              updatedAt: new Date().toISOString(),
            };
            const commitRes = await commitWebhookUserUpdateAndMarkProcessed(userId, event, lock, refundUpdate);
            return res.json(commitRes.stale ? { received: true, stale: true } : { received: true });
          } catch {}
        }
      }

      await markStripeEventProcessed(event, lock);
      return res.json({ received: true });
    }

    /* =====================================================
       ALTRI EVENTI
       ===================================================== */

    await markStripeEventProcessed(event, lock);
    return res.json({ received: true });
  } catch (err: any) {
    if (err instanceof WebhookLockLostError) {
      console.warn("Webhook lock lost during execution:", err.message);
      return res.status(409).json({
        error: err.message,
        lockLost: true,
      });
    }

    await releaseStripeEventLockOnError(event.id, lock);

    if (err instanceof FirestoreUnavailableError) {
      console.error("Webhook Firestore error:", err.message);
      return res.status(err.statusCode).json({
        error: err.message,
      });
    }

    console.error(
      "Errore elaborazione webhook Stripe:",
      err?.message || err
    );

    return res.status(500).json({
      error: "Errore interno durante elaborazione webhook",
    });
  }
});

/* =========================================================
   SUBSCRIPTION STATUS & COACH AUTHORIZATION
   ========================================================= */

app.get(
  "/api/auth/verify-coach",
  verifySameOriginOnApi,
  requireAuth,
  (req: AuthenticatedRequest, res) => {
    const isCoach = isAuthorizedCoach(req.user?.email, req.user?.emailVerified);
    if (!isCoach) {
      return res.json({
        isCoach: false,
        role: "student",
        email: req.user?.email || null,
      });
    }

    return res.json({
      isCoach: true,
      role: "coach",
      email: req.user?.email,
      uid: req.user?.uid,
      permissions: {
        unlimitedAccess: true,
        manageExercises: true,
        manageDemoAudios: true,
        manageRoutines: true,
        bypassSubscription: true,
      },
    });
  }
);

app.get(
  "/api/subscription-status",
  verifySameOriginOnApi,
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.uid;
      const userEmail = req.user?.email;

      if (!userId) {
        return res.status(401).json({
          error: "Utente non autenticato",
        });
      }

      // Check if user is the cryptographically verified authorized Coach
      if (isAuthorizedCoach(userEmail, req.user?.emailVerified)) {
        return res.json({
          subscriptionStatus: "active",
          isPremium: true,
          role: "coach",
          isCoach: true,
          subscriptionPlan: "coach_unlimited",
          subscriptionPeriodEnd: "2099-12-31T23:59:59.000Z",
          cancelAtPeriodEnd: false,
          pendingPlan: null,
          pendingPlanAmount: null,
          pendingPlanStartsAt: null,
          nextChargeAmount: null,
          email: userEmail,
        });
      }

      // Normal student verification (ignores any client query/body userId)
      let data = await getSubscriptionData(userId);
      let status = data?.subscriptionStatus || "inactive";

      // Check Stripe state whenever active subscription exists (to verify discounts, expiration, and pending schedules)
      const periodEndMs = data?.subscriptionPeriodEnd
        ? new Date(data.subscriptionPeriodEnd).getTime()
        : null;
      const isExpiredLocally = Boolean(
        periodEndMs && !Number.isNaN(periodEndMs) && periodEndMs < Date.now()
      );
      const pendingStartsMs = data?.pendingPlanStartsAt
        ? new Date(data.pendingPlanStartsAt).getTime()
        : null;
      const isPendingStartsPassed = Boolean(
        pendingStartsMs && !Number.isNaN(pendingStartsMs) && pendingStartsMs <= Date.now()
      );

      let verifiedLiveSub: Stripe.Subscription | null = null;
      let verifiedLiveSchedule: Stripe.SubscriptionSchedule | null = null;
      let stripeLookupFailed = false;

      if (
        data?.stripeSubscriptionId &&
        (status === "active" ||
          status === "trialing" ||
          !data?.subscriptionPeriodStart ||
          isExpiredLocally ||
          isPendingStartsPassed ||
          status === "past_due" ||
          status === "incomplete" ||
          Boolean(data?.pendingPlan))
      ) {
        const stripe = getStripe();
        if (stripe) {
          try {
            const liveSub = await stripe.subscriptions.retrieve(data.stripeSubscriptionId, {
              expand: ["items.data.price", "discounts", "discounts.source.coupon"],
            });
            verifiedLiveSub = liveSub;
            const liveStartTs = getSubscriptionPeriodStartTs(liveSub);
            const liveEndTs = getSubscriptionPeriodEndTs(liveSub);
            const liveStartIso = liveStartTs
              ? new Date(liveStartTs * 1000).toISOString()
              : data.subscriptionPeriodStart;
            const liveEndIso = liveEndTs
              ? new Date(liveEndTs * 1000).toISOString()
              : data.subscriptionPeriodEnd;
            const liveStatus =
              liveSub.status === "active" ||
              liveSub.status === "trialing" ||
              liveSub.status === "past_due" ||
              liveSub.status === "incomplete" ||
              liveSub.status === "unpaid"
                ? liveSub.status
                : "canceled";

            const livePlan = derivePlanFromSubscription(liveSub) || data.subscriptionPlan;
            const scheduleRef = (liveSub as any).schedule;
            const liveScheduleId =
              typeof scheduleRef === "string" ? scheduleRef : scheduleRef?.id || null;

            const synced: Record<string, any> = liveStatus === "canceled"
              ? {
                  subscriptionStatus: "canceled",
                  subscriptionPlan: null,
                  subscriptionPeriodStart: null,
                  subscriptionPeriodEnd: null,
                  cancelAtPeriodEnd: false,
                  stripeSubscriptionId: null,
                  pendingPlan: null,
                  pendingPlanAmount: null,
                  pendingPlanStartsAt: null,
                  pendingPlanPaymentIntentId: null,
                  pendingPlanInvoiceItemId: null,
                  stripeScheduleId: null,
                  updatedAt: new Date().toISOString(),
                }
              : {
                  subscriptionStatus: liveStatus,
                  subscriptionPeriodStart: liveStartIso || null,
                  subscriptionPeriodEnd: liveEndIso || null,
                  cancelAtPeriodEnd: Boolean(liveSub.cancel_at_period_end),
                  updatedAt: new Date().toISOString(),
                };

            if (liveStatus !== "canceled" && liveScheduleId) {
              try {
                const liveSchedule = await stripe.subscriptionSchedules.retrieve(liveScheduleId);
                verifiedLiveSchedule = liveSchedule;
                const curPhase = liveSchedule.current_phase;
                const nextPhase = curPhase
                  ? (liveSchedule.phases || []).find((p) => p.start_date >= curPhase.end_date)
                  : undefined;

                if (
                  (liveSchedule.status === "active" || liveSchedule.status === "not_started") &&
                  nextPhase
                ) {
                  let nextPlan: PaidPlan | undefined = isPaidPlan(nextPhase.metadata?.plan)
                    ? nextPhase.metadata?.plan
                    : undefined;
                  const nextPrice = nextPhase.items?.[0]?.price;
                  if (!nextPlan && typeof nextPrice === "string") {
                    const p = await stripe.prices.retrieve(nextPrice);
                    nextPlan = derivePlanFromPrice(p);
                  } else if (!nextPlan && nextPrice && typeof nextPrice === "object") {
                    nextPlan = derivePlanFromPrice(nextPrice as Stripe.Price);
                  }
                  if (nextPlan) {
                    const rawNextDiscounts = Array.isArray((nextPhase as any).discounts)
                      ? (nextPhase as any).discounts
                      : [];
                    let computedPendingAmount: number | null = PLAN_CONFIG[nextPlan].amount;
                    if (rawNextDiscounts.length > 0) {
                      const evaluated = await evaluateSchedulePhaseDiscounts(
                        stripe,
                        liveSub,
                        rawNextDiscounts,
                        nextPhase.start_date,
                        { onceConsumed: false }
                      );
                      computedPendingAmount = computeDiscountedAmountFromCoupons(
                        PLAN_CONFIG[nextPlan].amount,
                        evaluated.activeCoupons,
                        evaluated.uncertain
                      ).amount;
                    }
                    if (livePlan) synced.subscriptionPlan = livePlan;
                    synced.pendingPlan = nextPlan;
                    synced.pendingPlanAmount = computedPendingAmount;
                    synced.pendingPlanStartsAt = new Date(nextPhase.start_date * 1000).toISOString();
                    synced.stripeScheduleId = liveSchedule.id;
                  }
                } else {
                  if (livePlan && (liveStatus === "active" || liveStatus === "trialing")) {
                    synced.subscriptionPlan = livePlan;
                    synced.pendingPlan = null;
                    synced.pendingPlanAmount = null;
                    synced.pendingPlanStartsAt = null;
                    synced.pendingPlanPaymentIntentId = null;
                    synced.pendingPlanInvoiceItemId = null;
                  }
                  synced.stripeScheduleId =
                    liveSchedule.status === "active" ? liveSchedule.id : null;
                }
              } catch {}
            } else if (liveStatus !== "canceled") {
              if (livePlan && (liveStatus === "active" || liveStatus === "trialing")) {
                synced.subscriptionPlan = livePlan;
              }
              if (
                (data.pendingPlan || data.stripeScheduleId) &&
                (liveStatus === "active" || liveStatus === "trialing")
              ) {
                synced.pendingPlan = null;
                synced.pendingPlanAmount = null;
                synced.pendingPlanStartsAt = null;
                synced.pendingPlanPaymentIntentId = null;
                synced.pendingPlanInvoiceItemId = null;
                synced.stripeScheduleId = null;
              }
            }

            data = { ...data, ...synced } as any;
            await safeFirestoreSet(userId, synced, true);
            subscriptionsMap.set(userId, data!);
            status = liveStatus;
          } catch (syncErr) {
            if (syncErr instanceof FirestoreUnavailableError) {
              throw syncErr;
            }
            stripeLookupFailed = true;
            console.warn("Live Stripe sync check note:", (syncErr as any)?.message || syncErr);
          }
        }
      }

      const finalPeriodEndMs = data?.subscriptionPeriodEnd
        ? new Date(data.subscriptionPeriodEnd).getTime()
        : null;
      const isNotExpired =
        !finalPeriodEndMs || Number.isNaN(finalPeriodEndMs) || finalPeriodEndMs >= Date.now();

      const isPremium =
        (status === "active" || status === "trialing") && isNotExpired;

      const effectiveStatus = isPremium
        ? status
        : status === "active" || status === "trialing"
          ? "expired"
          : status;

      const cancelAtPeriodEnd = Boolean(data?.cancelAtPeriodEnd);
      const pendingPlan = isPremium ? (data?.pendingPlan || null) : null;
      const pendingPlanAmount =
        pendingPlan && typeof data?.pendingPlanAmount === "number"
          ? data.pendingPlanAmount
          : null;
      const pendingPlanStartsAt = pendingPlan ? (data?.pendingPlanStartsAt || null) : null;

      let nextChargeAmount: number | null = null;
      let nextChargeAmountUncertain = false;

      if (isPremium) {
        if (cancelAtPeriodEnd) {
          nextChargeAmount = 0;
          nextChargeAmountUncertain = false;
        } else if (verifiedLiveSub && getStripe()) {
          const resolved = await resolveNextChargeForActiveSubscription(
            getStripe()!,
            verifiedLiveSub,
            data?.subscriptionPlan,
            pendingPlan,
            pendingPlanAmount,
            verifiedLiveSchedule,
            cancelAtPeriodEnd
          );
          nextChargeAmount = resolved.amount;
          nextChargeAmountUncertain = resolved.uncertain;
        } else if (stripeLookupFailed) {
          nextChargeAmount = null;
          nextChargeAmountUncertain = true;
        } else if (pendingPlan) {
          if (typeof pendingPlanAmount === "number") {
            nextChargeAmount = pendingPlanAmount;
            nextChargeAmountUncertain = false;
          } else {
            nextChargeAmount = null;
            nextChargeAmountUncertain = true;
          }
        } else {
          nextChargeAmount = getNextChargeAmount(
            data?.subscriptionPlan,
            pendingPlan,
            pendingPlanAmount,
            cancelAtPeriodEnd
          );
          nextChargeAmountUncertain = nextChargeAmount === null;
        }
      }

      const nextChargeDate = isPremium
        ? getNextChargeDate(
            data?.subscriptionPeriodEnd,
            pendingPlanStartsAt,
            cancelAtPeriodEnd,
            effectiveStatus
          )
        : null;

      return res.json({
        subscriptionStatus: effectiveStatus,
        subscriptionPlan: effectiveStatus === "canceled" ? null : (data?.subscriptionPlan || null),
        subscriptionPeriodStart: effectiveStatus === "canceled" ? null : (data?.subscriptionPeriodStart || null),
        subscriptionPeriodEnd: effectiveStatus === "canceled" ? null : (data?.subscriptionPeriodEnd || null),
        cancelAtPeriodEnd: effectiveStatus === "canceled" ? false : cancelAtPeriodEnd,
        pendingPlan,
        pendingPlanAmount,
        pendingPlanStartsAt,
        nextChargeDate,
        nextChargeAmount,
        nextChargeAmountUncertain,
        isPremium,
        role: "student",
        isCoach: false,
      });
    } catch (err: any) {
      if (err instanceof FirestoreUnavailableError) {
        return res.status(err.statusCode).json({
          error: err.message,
        });
      }

      console.error(
        "Subscription status error:",
        err?.message || err
      );

      // Fail-closed: never pretend 200 OK when verification fails
      return res.status(500).json({
        error: "Impossibile verificare lo stato dell'abbonamento.",
      });
    }
  }
);

/* =========================================================
   DEMO AUDIO FOR EXERCISES
   ========================================================= */

const DEMO_AUDIO_DIR = path.resolve(process.cwd(), "public", "audio", "demos");
const DEMO_MANIFEST_PATH = path.resolve(DEMO_AUDIO_DIR, "manifest.json");

function resolveSafeDemoPath(filename: string): string | null {
  const base = path.basename(filename);
  if (!base || base !== filename || base.includes("..")) {
    return null;
  }
  const resolved = path.resolve(DEMO_AUDIO_DIR, base);
  if (!resolved.startsWith(DEMO_AUDIO_DIR + path.sep)) {
    return null;
  }
  return resolved;
}

function ensureDemoDirExists() {
  if (!fs.existsSync(DEMO_AUDIO_DIR)) {
    fs.mkdirSync(DEMO_AUDIO_DIR, { recursive: true });
  }
}

function readDemoManifest(): Record<string, { url: string; filename: string; updatedAt: number }> {
  ensureDemoDirExists();
  let manifest: Record<string, { url: string; filename: string; updatedAt: number }> = {};
  let hadInvalidEntries = false;

  if (fs.existsSync(DEMO_MANIFEST_PATH)) {
    try {
      const raw = fs.readFileSync(DEMO_MANIFEST_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      for (const [key, item] of Object.entries(parsed)) {
        if (item && typeof item === "object" && typeof (item as any).filename === "string") {
          const filePath = resolveSafeDemoPath((item as any).filename);
          if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).size > 100) {
            manifest[key] = item as any;
          } else {
            hadInvalidEntries = true;
          }
        }
      }
    } catch {
      manifest = {};
    }
  }

  // Scan DEMO_AUDIO_DIR to auto-discover any audio files present on disk
  try {
    const files = fs.readdirSync(DEMO_AUDIO_DIR);
    for (const file of files) {
      if (file.endsWith(".mp3") || file.endsWith(".webm") || file.endsWith(".wav") || file.endsWith(".ogg") || file.endsWith(".m4a")) {
        const id = file.replace(/\.[^/.]+$/, "");
        if (!manifest[id]) {
          manifest[id] = {
            url: `/audio/demos/${file}`,
            filename: file,
            updatedAt: Date.now(),
          };
        }
      }
    }
  } catch {}

  // Explicit Voce Mista / Warm-up alias links to confirmed disk files
  if (manifest["vocalizzo_mam_fissa"]) {
    manifest["mix_mam_fissa"] = manifest["vocalizzo_mam_fissa"];
    manifest["mix_mam_fissa__fixed_5_notes"] = manifest["vocalizzo_mam_fissa"];
  }
  if (manifest["vocalizzo_mee_151__gliss_1_5_1"]) {
    manifest["vocalizzo_mee_151"] = manifest["vocalizzo_mee_151__gliss_1_5_1"];
    manifest["mix_mee_gliss_151"] = manifest["vocalizzo_mee_151__gliss_1_5_1"];
    manifest["mix_mee_gliss_151__gliss_1_5_1"] = manifest["vocalizzo_mee_151__gliss_1_5_1"];
  }
  if (manifest["lip_thrill_warmup"]) {
    manifest["sovt_lip_trill"] = manifest["lip_thrill_warmup"];
  }
  if (manifest["lip_thrill_warmup__five_notes"]) {
    manifest["sovt_lip_trill__five_notes"] = manifest["lip_thrill_warmup__five_notes"];
  }

  if (hadInvalidEntries) {
    try {
      fs.writeFileSync(DEMO_MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf-8");
    } catch {}
  }

  return manifest;
}

function writeDemoManifest(data: Record<string, { url: string; filename: string; updatedAt: number }>) {
  ensureDemoDirExists();
  fs.writeFileSync(DEMO_MANIFEST_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// Public: Get all registered demo audios
app.get("/api/demo-audio-manifest", (_req, res) => {
  const manifest = readDemoManifest();
  res.json({ demos: manifest });
});

// Admin/Coach: Save an audio demo directly to public/audio/demos
app.post("/api/admin/save-demo-audio", verifySameOriginOnApi, apiSensitiveLimiter, requireCoachAuth, (req: AuthenticatedRequest, res) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ error: "Corpo della richiesta non valido." });
  }

  const { exerciseId, base64Data, extension = "webm" } = req.body;

  if (typeof exerciseId !== "string" || !ALLOWED_EXERCISE_ID_REGEX.test(exerciseId.trim())) {
    return res.status(400).json({ error: "Identificativo esercizio non valido." });
  }

  if (typeof extension !== "string" || !ALLOWED_AUDIO_EXTENSIONS.has(extension.trim().toLowerCase())) {
    return res.status(400).json({ error: "Estensione file audio non supportata." });
  }

  if (typeof base64Data !== "string" || !base64Data.trim()) {
    return res.status(400).json({ error: "Dati audio mancanti o non validi." });
  }

  if (base64Data.startsWith("data:") && !/^data:(audio\/[a-zA-Z0-9.+-]+|application\/octet-stream)(;[^,]*)?,/.test(base64Data)) {
    return res.status(400).json({ error: "Formato dati audio non valido." });
  }

  try {
    ensureDemoDirExists();

    const cleanBase64 = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
    const buffer = Buffer.from(cleanBase64.trim(), "base64");

    if (buffer.length < 100 || buffer.length > MAX_DEMO_AUDIO_BYTES) {
      return res.status(400).json({ error: "Dimensione file audio non valida (consentito fino a 10 MB)." });
    }

    const safeId = exerciseId.trim();
    const safeExt = extension.trim().toLowerCase();

    const rawFilename = `${safeId}_raw.${safeExt}`;
    const rawFilePath = resolveSafeDemoPath(rawFilename);
    const mp3Filename = `${safeId}.mp3`;
    const mp3FilePath = resolveSafeDemoPath(mp3Filename);

    if (!rawFilePath || !mp3FilePath) {
      return res.status(400).json({ error: "Percorso file non consentito." });
    }

    fs.writeFileSync(rawFilePath, buffer);

    let finalFilename = `${safeId}.${safeExt}`;
    let isMp3Converted = false;

    // Transcode safely without shell interpolation (prevents command injection)
    try {
      execFileSync(
        "ffmpeg",
        ["-y", "-i", rawFilePath, "-c:a", "libmp3lame", "-b:a", "128k", mp3FilePath],
        {
          stdio: "ignore",
          timeout: 15000,
          shell: false,
        }
      );

      if (fs.existsSync(mp3FilePath) && fs.statSync(mp3FilePath).size > 100) {
        finalFilename = mp3Filename;
        isMp3Converted = true;
        try {
          fs.unlinkSync(rawFilePath);
        } catch {}
      }
    } catch (ffmpegErr) {
      console.warn("FFmpeg conversion fallback to original file format:", ffmpegErr);
      const fallbackPath = resolveSafeDemoPath(finalFilename);
      if (fallbackPath) {
        fs.renameSync(rawFilePath, fallbackPath);
      }
    }

    const manifest = readDemoManifest();
    const publicUrl = `/audio/demos/${finalFilename}`;
    manifest[safeId] = {
      url: publicUrl,
      filename: finalFilename,
      updatedAt: Date.now(),
    };

    writeDemoManifest(manifest);

    try {
      const distAudioDir = path.resolve(process.cwd(), "dist", "audio", "demos");
      if (fs.existsSync(path.resolve(process.cwd(), "dist"))) {
        if (!fs.existsSync(distAudioDir)) {
          fs.mkdirSync(distAudioDir, { recursive: true });
        }
        const srcFile = resolveSafeDemoPath(finalFilename);
        const dstFile = path.resolve(distAudioDir, finalFilename);
        if (srcFile && dstFile.startsWith(distAudioDir + path.sep) && fs.existsSync(srcFile)) {
          fs.copyFileSync(srcFile, dstFile);
        }
        fs.writeFileSync(path.resolve(distAudioDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf-8");
      }
    } catch {}

    return res.json({
      success: true,
      url: publicUrl,
      exerciseId: safeId,
      size: isMp3Converted ? fs.statSync(mp3FilePath).size : buffer.length,
      format: isMp3Converted ? "mp3" : safeExt,
    });
  } catch (err: any) {
    console.error("Errore salvataggio audio demo:", err?.message || err);
    return res.status(500).json({ error: "Errore nel salvataggio dell'audio demo sul server." });
  }
});

// Admin/Coach: Delete an audio demo
app.delete("/api/admin/delete-demo-audio/:exerciseId", verifySameOriginOnApi, apiSensitiveLimiter, requireCoachAuth, (req: AuthenticatedRequest, res) => {
  const { exerciseId } = req.params;
  if (typeof exerciseId !== "string" || !ALLOWED_EXERCISE_ID_REGEX.test(exerciseId.trim())) {
    return res.status(400).json({ error: "Identificativo esercizio non valido." });
  }

  const safeId = exerciseId.trim();

  try {
    const manifest = readDemoManifest();
    const existing = manifest[safeId];
    if (existing && existing.filename) {
      const filePath = resolveSafeDemoPath(existing.filename);
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    for (const ext of ALLOWED_AUDIO_EXTENSIONS) {
      const variantPath = resolveSafeDemoPath(`${safeId}.${ext}`);
      if (variantPath && fs.existsSync(variantPath)) {
        try { fs.unlinkSync(variantPath); } catch {}
      }
    }

    delete manifest[safeId];
    writeDemoManifest(manifest);
    return res.json({ success: true });
  } catch (err: any) {
    console.error("Errore eliminazione audio demo:", err?.message || err);
    return res.status(500).json({ error: "Errore durante l'eliminazione dell'audio demo." });
  }
});

/* =========================================================
   START EXPRESS + VITE
   ========================================================= */

async function startServer() {
  if (
    process.env.NODE_ENV !==
    "production"
  ) {
    const { createServer: createViteServer } = await import("vite");
    const vite =
      await createViteServer({
        server: {
          middlewareMode: true,
        },

        appType: "spa",
      });

    app.use(
      vite.middlewares
    );
  } else {
    const distPath =
      path.join(
        process.cwd(),
        "dist"
      );

    app.use(
      express.static(
        distPath
      )
    );

    app.get(
      "*",
      (_req, res) => {
        res.sendFile(
          path.join(
            distPath,
            "index.html"
          )
        );
      }
    );
  }

  app.listen(
    PORT,
    "0.0.0.0",
    () => {
      console.log(
        `Server Vocalis attivo su http://localhost:${PORT}`
      );
    }
  );
}

export default app;

if (
  process.env.VERCEL !== "1" &&
  process.env.ECHORA_TEST_NO_LISTEN !== "1"
) {
  startServer();
}
