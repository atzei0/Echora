import express from "express";
import path from "path";
import fs from "fs";
import { execFileSync } from "child_process";
import { createServer as createViteServer } from "vite";
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
   CONFIG & SECURITY HELPERS
   ========================================================= */

const PLAN_CONFIG = {
  monthly: {
    amount: 500,
    interval: "month" as const,
    intervalCount: 1,
    label: "Abbonamento Mensile",
    description: "5,00 €/mese",
  },
  quarterly: {
    amount: 4500,
    interval: "month" as const,
    intervalCount: 3,
    label: "Abbonamento Trimestrale",
    description: "45,00 € ogni 3 mesi",
  },
  annual: {
    amount: 5000,
    interval: "year" as const,
    intervalCount: 1,
    label: "Abbonamento Annuale",
    description: "50,00 €/anno",
  },
} as const;

type PaidPlan = keyof typeof PLAN_CONFIG;

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
    subscriptionPlan?: string;
    subscriptionPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;

    pendingPlan?: PaidPlan;
    pendingPlanAmount?: number;
    pendingPlanPaymentIntentId?: string;
    pendingPlanStartsAt?: string;
    pendingPlanInvoiceItemId?: string;
    stripeScheduleId?: string;
    lastStripeEventCreated?: number;

    updatedAt: string;
  }
>();

const processedStripeEvents = new Map<string, number>();

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

    if (db) {
      await db
        .collection("users")
        .doc(userId)
        .set(data, { merge: true });
    }
  } catch (e: any) {
    console.warn("Firestore Admin sync note:", e?.code || e?.message || "sync_error");
    if (throwOnError && (process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT || process.env.VERCEL === "1")) {
      throw e;
    }
  }
}

async function safeFirestoreGet(
  userId: string
): Promise<Record<string, any> | null> {
  try {
    const db = getAdminDb();

    if (db) {
      const docSnap = await db
        .collection("users")
        .doc(userId)
        .get();

      if (docSnap.exists) {
        return docSnap.data() || null;
      }
    }
  } catch (e: any) {
    console.warn("Firestore Admin read note:", e?.code || e?.message || "read_error");
  }

  return null;
}

async function isStripeEventAlreadyProcessed(eventId: string): Promise<boolean> {
  if (processedStripeEvents.has(eventId)) {
    return true;
  }
  try {
    const db = getAdminDb();
    if (db) {
      const snap = await db.collection("stripe_webhook_events").doc(eventId).get();
      if (snap.exists) {
        recordProcessedEventMemory(eventId);
        return true;
      }
    }
  } catch {
    // Ignore read error when Admin IAM unavailable in local preview
  }
  return false;
}

async function markStripeEventProcessed(event: Stripe.Event): Promise<void> {
  recordProcessedEventMemory(event.id);
  try {
    const db = getAdminDb();
    if (db) {
      await db.collection("stripe_webhook_events").doc(event.id).set({
        eventId: event.id,
        type: event.type,
        created: event.created,
        processedAt: new Date().toISOString(),
      });
    }
  } catch {
    // Ignore write error when Admin IAM unavailable in local preview
  }
}

async function findUserIdByStripeCustomerId(
  customerId: string | undefined,
  stripe: Stripe
): Promise<string | undefined> {
  if (!customerId) return undefined;

  for (const [uId, sub] of subscriptionsMap.entries()) {
    if (sub.stripeCustomerId === customerId) {
      return uId;
    }
  }

  try {
    const db = getAdminDb();
    if (db) {
      const snap = await db
        .collection("users")
        .where("stripeCustomerId", "==", customerId)
        .limit(1)
        .get();
      if (!snap.empty) {
        return snap.docs[0].id;
      }
    }
  } catch {
    // Ignore query error if Admin IAM unavailable in preview
  }

  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer.deleted && (customer as Stripe.Customer).metadata?.userId) {
      return (customer as Stripe.Customer).metadata.userId;
    }
  } catch {
    // Ignore retrieve failure
  }

  return undefined;
}

/* =========================================================
   FIREBASE DATA HELPERS
   ========================================================= */

async function getSubscriptionData(userId: string) {
  const memoryData = subscriptionsMap.get(userId);

  if (memoryData) {
    return memoryData;
  }

  const dbData = await safeFirestoreGet(userId);

  if (!dbData) {
    return null;
  }

  const data = {
    subscriptionStatus:
      dbData.subscriptionStatus || "inactive",

    subscriptionPlan:
      dbData.subscriptionPlan,

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

  subscriptionsMap.set(userId, data);

  return data;
}

function isPaidPlan(
  plan: string | undefined | null
): plan is PaidPlan {
  return (
    plan === "monthly" ||
    plan === "quarterly" ||
    plan === "annual"
  );
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

    if (
      typeof plan !== "string" ||
      (plan !== "trial" &&
      plan !== "monthly" &&
      plan !== "quarterly" &&
      plan !== "annual" &&
      plan !== "test")
    ) {
      return res.status(400).json({
        error: "Piano non valido",
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

    const hasCurrentSubscription =
      currentData &&
      (
        currentData.subscriptionStatus === "active" ||
        currentData.subscriptionStatus === "trialing"
      ) &&
      currentData.stripeSubscriptionId;

    /* =====================================================
       CAMBIO DI PIANO SU SUBSCRIPTION ESISTENTE
       ===================================================== */

    if (
      hasCurrentSubscription &&
      isPaidPlan(plan)
    ) {
      /*
       * Se esiste già un cambio di piano programmato,
       * impediamo un secondo pagamento.
       */

      if (currentData?.pendingPlan) {
        return res.status(400).json({
          error:
            `Hai già programmato il passaggio al piano ${currentData.pendingPlan}. Attendi che il cambio venga completato prima di selezionare un altro piano.`,
        });
      }

      /*
       * Se l'utente clicca sul piano che ha già,
       * non serve creare un altro pagamento.
       */

      if (
        currentData.subscriptionPlan === plan &&
        currentData.subscriptionStatus === "active"
      ) {
        return res.status(400).json({
          error:
            "Sei già abbonato a questo piano.",
        });
      }

      /*
       * Recuperiamo la subscription per ottenere
       * il customer Stripe.
       */

      const subscription =
        await stripe.subscriptions.retrieve(
          currentData.stripeSubscriptionId as string
        );

      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

      /*
       * Checkout UNA TANTUM.
       *
       * Questo pagamento è il pagamento anticipato
       * del prossimo periodo.
       *
       * Non modifica immediatamente la subscription.
       */

      const config = PLAN_CONFIG[plan];

      const session =
        await stripe.checkout.sessions.create({
          payment_method_types: [
            "card",
            "paypal",
            "klarna",
          ],

          mode: "payment",

          line_items: [
            {
              price_data: {
                currency: "eur",

                product_data: {
                  name:
                    `Echora — ${config.label}`,

                  description:
                    `${config.description}. Il piano inizierà alla fine del periodo attuale.`,
                },

                unit_amount: config.amount,
              },

              quantity: 1,
            },
          ],

          customer: customerId,

          client_reference_id: userId,

          metadata: {
            userId,
            plan,
            changeType: "scheduled_plan_change",
            subscriptionId: subscription.id,
          },

          custom_text: {
            submit: {
              message:
                `Paghi ora ${(
                  config.amount / 100
                ).toFixed(2).replace(".", ",")} €. Il nuovo piano inizierà quando terminerà il tuo periodo attuale.`,
            },
          },

          success_url:
            `${appUrl}/#payment-success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,

          cancel_url:
            `${appUrl}/#payment-cancelled`,
        });

      return res.json({
        url: session.url,
        sessionId: session.id,
      });
    }

    /* =====================================================
       TRIAL NORMALE
       ===================================================== */

    let lineItems:
      Stripe.Checkout.SessionCreateParams.LineItem[] =
      [];

    let mode:
      Stripe.Checkout.SessionCreateParams.Mode =
        "subscription";

    let subscriptionData:
      Stripe.Checkout.SessionCreateParams.SubscriptionData
      | undefined = undefined;

    switch (plan) {
      case "trial":
        /*
         * 0,99 € immediati
         * +
         * subscription mensile da 20 €
         * che parte dopo 7 giorni.
         *
         * Stripe gestisce automaticamente la fine
         * del trial e il successivo ciclo di fatturazione.
         */

        lineItems = [
          {
            price_data: {
              currency: "eur",

              product_data: {
                name:
                  "Echora — 7 Giorni di Prova",

                description:
                  "0,99 € per i primi 7 giorni",
              },

              unit_amount: 99,
            },

            quantity: 1,
          },

          {
            price_data: {
              currency: "eur",

              product_data: {
                name:
                  "Echora — Abbonamento Mensile",

                description:
                  "5,00 €/mese dopo i 7 giorni di prova",
              },

              unit_amount: 500,

              recurring: {
                interval: "month",
              },
            },

            quantity: 1,
          },
        ];

        mode = "subscription";

        subscriptionData = {
          trial_period_days: 7,

          metadata: {
            userId,
            plan: "trial",
          },
        };

        break;

      case "monthly":
        lineItems = [
          {
            price_data: {
              currency: "eur",

              product_data: {
                name: "Echora — Abbonamento Mensile",

                description:
                  "5,00 €/mese",
              },

              unit_amount: 500,

              recurring: {
                interval: "month",
              },
            },

            quantity: 1,
          },
        ];

        mode = "subscription";

        subscriptionData = {
          metadata: {
            userId,
            plan: "monthly",
          },
        };

        break;

      case "quarterly":
        lineItems = [
          {
            price_data: {
              currency: "eur",

              product_data: {
                name:
                  "Echora — Abbonamento Trimestrale",

                description:
                  "45,00 € ogni 3 mesi",
              },

              unit_amount: 4500,

              recurring: {
                interval: "month",
                interval_count: 3,
              },
            },

            quantity: 1,
          },
        ];

        mode = "subscription";

        subscriptionData = {
          metadata: {
            userId,
            plan: "quarterly",
          },
        };

        break;

      case "annual":
        lineItems = [
          {
            price_data: {
              currency: "eur",

              product_data: {
                name:
                  "Echora — Abbonamento Annuale",

                description:
                  "50,00 €/anno",
              },

              unit_amount: 5000,

              recurring: {
                interval: "year",
              },
            },

            quantity: 1,
          },
        ];

        mode = "subscription";

        subscriptionData = {
          metadata: {
            userId,
            plan: "annual",
          },
        };

        break;

      case "test":
        lineItems = [
          {
            price_data: {
              currency: "eur",

              product_data: {
                name: "Echora Test",

                description:
                  "Pagamento Test 0,99 €",
              },

              unit_amount: 99,
            },

            quantity: 1,
          },
        ];

        mode = "payment";

        subscriptionData = undefined;

        break;
    }

    const sessionParams:
      Stripe.Checkout.SessionCreateParams = {
      payment_method_types: [
        "card",
        "paypal",
        "klarna",
      ],

      line_items: lineItems,

      mode,

      subscription_data:
        subscriptionData,

      client_reference_id: userId,

      customer_email:
        customerEmail || undefined,

      metadata: {
        userId,
        plan,
      },

      custom_text:
        plan === "trial"
          ? {
              submit: {
                message:
                  "Paghi 0,99 € oggi per 7 giorni di prova di Echora. Se non disdici prima della fine dei 7 giorni, l'abbonamento si rinnoverà automaticamente a 20,00 €/mese.",
              },
            }
          : undefined,

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
    });
  } catch (err: any) {
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

    let customerId =
      subscriptionsMap.get(userId)
        ?.stripeCustomerId;

    if (!customerId) {
      const dbData =
        await safeFirestoreGet(userId);

      customerId =
        dbData?.stripeCustomerId;
    }

    if (!customerId) {
      const customer =
        await stripe.customers.create({
          email: req.user?.email || undefined,
          metadata: {
            userId,
          },
        });

      customerId = customer.id;

      const subInfo = {
        stripeCustomerId:
          customerId,

        updatedAt:
          new Date().toISOString(),
      };

      subscriptionsMap.set(userId, {
        subscriptionStatus:
          "inactive",

        ...subInfo,
      });

      await safeFirestoreSet(
        userId,
        subInfo
      );
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
   SCHEDULE FUTURE PLAN
   ========================================================= */

async function scheduleFuturePlan(
  stripe: Stripe,
  userId: string,
  subscription: Stripe.Subscription,
  newPlan: PaidPlan,
  paymentIntentId: string
) {
  const config =
    PLAN_CONFIG[newPlan];

  const currentPeriodEndTs =
    (subscription as any).current_period_end;

  if (!currentPeriodEndTs) {
    throw new Error(
      "Impossibile determinare la fine del periodo attuale."
    );
  }

  const startsAt =
    new Date(
      currentPeriodEndTs * 1000
    ).toISOString();

  /*
   * Creiamo un invoice item negativo sul customer,
   * associato alla subscription.
   *
   * Quando arriverà la prima fattura del nuovo periodo,
   * questo credito compenserà il pagamento che l'utente
   * ha già effettuato nel Checkout.
   */

  const invoiceItem =
    await stripe.invoiceItems.create({
      customer:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id,

      subscription:
        subscription.id,

      currency: "eur",

      amount:
        -config.amount,

      description:
        `Pagamento anticipato Echora — ${config.label}`,

      metadata: {
        userId,
        plan: newPlan,
        type: "prepaid_future_plan",
        paymentIntentId,
      },
    });

  /*
   * Se esiste già uno schedule lo riutilizziamo.
   * Altrimenti lo creiamo dalla subscription attuale.
   */

  let scheduleId:
    | string
    | null = null;

  const existingSchedule =
    (subscription as any).schedule;

  if (existingSchedule) {
    scheduleId =
      typeof existingSchedule === "string"
        ? existingSchedule
        : existingSchedule.id;
  }

  if (!scheduleId) {
    const schedule =
      await stripe.subscriptionSchedules.create({
        from_subscription:
          subscription.id,
      });

    scheduleId =
      schedule.id;
  }

  const schedule =
    await stripe.subscriptionSchedules.retrieve(
      scheduleId
    );

  /*
   * Manteniamo la fase attuale esattamente com'è.
   * La nuova fase comincia alla fine del periodo attuale.
   */

  const currentPhase =
    schedule.current_phase;

  if (!currentPhase) {
    throw new Error(
      "Impossibile determinare la fase attuale della subscription."
    );
  }

  const currentPhaseStart =
    currentPhase.start_date;

  const currentPhaseEnd =
    currentPhase.end_date;

  const currentItems =
    schedule.phases?.[0]?.items ||
    [];

  /*
   * Recuperiamo il Price attuale.
   */

  const currentPrice =
    currentItems[0]?.price;

  if (!currentPrice) {
    throw new Error(
      "Impossibile determinare il prezzo attuale della subscription."
    );
  }

  /*
   * Creiamo il Price del nuovo piano.
   *
   * Viene usato soltanto nella fase futura.
   */

  const newPrice =
    await stripe.prices.create({
      currency: "eur",

      unit_amount:
        config.amount,

      recurring: {
        interval:
          config.interval,

        interval_count:
          config.intervalCount,
      },

      product_data: {
        name:
          `Echora — ${config.label}`,
      },

      metadata: {
        echoraPlan:
          newPlan,
      },
    });

  /*
   * Fase attuale:
   * stesso prezzo, stessa quantità.
   *
   * Fase futura:
   * nuovo prezzo.
   */

  const phases: any[] = [
    {
      start_date:
        currentPhaseStart,

      end_date:
        currentPhaseEnd,

      items: [
        {
          price:
            typeof currentPrice === "string"
              ? currentPrice
              : currentPrice.id,

          quantity: 1,
        },
      ],
    },

    {
      start_date:
        currentPhaseEnd,

      items: [
        {
          price:
            newPrice.id,

          quantity: 1,
        },
      ],
    },
  ];

  await stripe.subscriptionSchedules.update(
    scheduleId,
    {
      phases,

      end_behavior:
        "release",

      proration_behavior:
        "none",
    } as any
  );

  const pendingData = {
    pendingPlan:
      newPlan,

    pendingPlanAmount:
      config.amount,

    pendingPlanPaymentIntentId:
      paymentIntentId,

    pendingPlanStartsAt:
      startsAt,

    pendingPlanInvoiceItemId:
      invoiceItem.id,

    stripeScheduleId:
      scheduleId,

    updatedAt:
      new Date().toISOString(),
  };

  subscriptionsMap.set(userId, {
    ...(subscriptionsMap.get(userId) || {
      subscriptionStatus:
        subscription.status,
      updatedAt:
        new Date().toISOString(),
    }),

    ...pendingData,
  } as any);

  await safeFirestoreSet(
    userId,
    pendingData
  );

  return {
    scheduleId,
    invoiceItemId:
      invoiceItem.id,
    startsAt,
  };
}

/* =========================================================
   CANCEL / CLEAN FUTURE PLAN
   ========================================================= */

async function cancelPendingPlan(
  stripe: Stripe,
  userId: string,
  data: any
) {
  /*
   * Se non c'è un piano futuro, non facciamo nulla.
   */

  if (!data?.pendingPlan) {
    return;
  }

  /*
   * Se il pagamento futuro esiste, lo rimborsiamo.
   */

  if (data.pendingPlanPaymentIntentId) {
    try {
      await stripe.refunds.create({
        payment_intent:
          data.pendingPlanPaymentIntentId,
      });
    } catch (refundError: any) {
      /*
       * Se il pagamento è già stato rimborsato,
       * non blocchiamo tutto.
       */

      console.log(
        "Refund pending plan note:",
        refundError?.message ||
          refundError
      );
    }
  }

  /*
   * Eliminiamo l'eventuale invoice item negativo.
   */

  if (data.pendingPlanInvoiceItemId) {
    try {
      await stripe.invoiceItems.del(
        data.pendingPlanInvoiceItemId
      );
    } catch (invoiceError: any) {
      console.log(
        "Delete pending invoice item note:",
        invoiceError?.message ||
          invoiceError
      );
    }
  }

  /*
   * Se esiste uno schedule, lo cancelliamo.
   *
   * La subscription attuale rimane nel suo periodo.
   */

  if (data.stripeScheduleId) {
    try {
      await stripe.subscriptionSchedules.release(
        data.stripeScheduleId
      );
    } catch (scheduleError: any) {
      console.log(
        "Release schedule note:",
        scheduleError?.message ||
          scheduleError
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
    updatedAt:
      new Date().toISOString(),
  };

  const existing =
    subscriptionsMap.get(userId);

  if (existing) {
    subscriptionsMap.set(
      userId,
      {
        ...existing,
        ...clearData,
      } as any
    );
  }

  await safeFirestoreSet(
    userId,
    clearData
  );
}

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

  try {
    // 1. Replay / Deduplication protection
    if (await isStripeEventAlreadyProcessed(event.id)) {
      return res.json({ received: true, duplicate: true });
    }

    /* =====================================================
       CHECKOUT COMPLETED
       ===================================================== */

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId =
        session.client_reference_id ||
        session.metadata?.userId;

      const plan = session.metadata?.plan;

      // One-time scheduled plan change payment
      if (
        session.metadata?.changeType === "scheduled_plan_change" &&
        userId &&
        isPaidPlan(plan)
      ) {
        if (session.payment_status !== "paid") {
          console.log("Checkout future plan non ancora pagato:", session.id);
          return res.json({ received: true });
        }

        const subscriptionId = session.metadata?.subscriptionId;
        if (!subscriptionId) {
          throw new Error("Subscription ID mancante nel cambio piano.");
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;

        if (!paymentIntentId) {
          throw new Error("PaymentIntent mancante nel pagamento del cambio piano.");
        }

        const existing = await getSubscriptionData(userId);
        if (existing?.pendingPlan) {
          await markStripeEventProcessed(event);
          return res.json({ received: true });
        }

        await scheduleFuturePlan(stripe, userId, subscription, plan, paymentIntentId);
        await markStripeEventProcessed(event);
        return res.json({ received: true });
      }

      // Standard checkout flow
      if (userId) {
        const normalPlan = plan || "monthly";

        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        if (normalPlan === "test") {
          await markStripeEventProcessed(event);
          return res.json({ received: true });
        }

        const isPaymentSettled =
          session.payment_status === "paid" ||
          session.payment_status === "no_payment_required";

        let subscriptionStatus = isPaymentSettled
          ? (normalPlan === "trial" ? "trialing" : "active")
          : "incomplete";

        let periodEnd: string | undefined;

        if (subscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
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

            const periodEndTs =
              (subscription as any).current_period_end ||
              (subscription as any).trial_end;

            if (periodEndTs) {
              periodEnd = new Date(periodEndTs * 1000).toISOString();
            }
          } catch (e: any) {
            console.warn("Subscription retrieve note:", e?.message || e);
          }
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
          subscriptionPeriodEnd: periodEnd || null,
          cancelAtPeriodEnd: false,
          stripeCustomerId: customerId || null,
          stripeSubscriptionId: subscriptionId || null,
          lastStripeEventCreated: event.created,
          updatedAt: new Date().toISOString(),
        };

        const existing =
          subscriptionsMap.get(userId) || {
            subscriptionStatus: "inactive",
            updatedAt: new Date().toISOString(),
          };

        subscriptionsMap.set(userId, {
          ...existing,
          ...subInfo,
        } as any);

        await safeFirestoreSet(userId, subInfo, true);
      }

      await markStripeEventProcessed(event);
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

      let userId = subscription.metadata?.userId;
      if (!userId) {
        userId = await findUserIdByStripeCustomerId(customerId, stripe);
      }

      if (!userId) {
        console.warn("Webhook subscription update senza userId:", subscriptionId);
        await markStripeEventProcessed(event);
        return res.json({ received: true });
      }

      const existing = await getSubscriptionData(userId);
      if (
        existing?.lastStripeEventCreated &&
        event.created < existing.lastStripeEventCreated
      ) {
        console.warn("Ignorato evento Stripe obsoleto:", event.id);
        await markStripeEventProcessed(event);
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

      const periodEndTs =
        (subscription as any).current_period_end ||
        (subscription as any).trial_end;

      const periodEnd = periodEndTs
        ? new Date(periodEndTs * 1000).toISOString()
        : null;

      const cancelAtPeriodEnd = Boolean(subscription.cancel_at_period_end);

      let planToStore = existing?.subscriptionPlan || subscription.metadata?.plan;
      let pendingPlan = existing?.pendingPlan;

      if (existing?.pendingPlan && existing?.pendingPlanStartsAt) {
        const startsAt = new Date(existing.pendingPlanStartsAt).getTime();
        if (Date.now() >= startsAt) {
          planToStore = existing.pendingPlan;
          pendingPlan = undefined;

          const clearPending = {
            pendingPlan: null,
            pendingPlanAmount: null,
            pendingPlanPaymentIntentId: null,
            pendingPlanStartsAt: null,
            pendingPlanInvoiceItemId: null,
            stripeScheduleId: null,
          };

          await safeFirestoreSet(userId, clearPending, true);
        }
      }

      if (cancelAtPeriodEnd && existing?.pendingPlan && existing.pendingPlanStartsAt) {
        const startsAt = new Date(existing.pendingPlanStartsAt).getTime();
        if (Date.now() < startsAt) {
          await cancelPendingPlan(stripe, userId, existing);
          pendingPlan = undefined;
        }
      }

      const subUpdate: Record<string, any> = {
        subscriptionStatus: status,
        subscriptionPeriodEnd: periodEnd,
        cancelAtPeriodEnd,
        stripeCustomerId: customerId || null,
        stripeSubscriptionId: subscriptionId,
        lastStripeEventCreated: event.created,
        updatedAt: new Date().toISOString(),
      };

      if (planToStore) {
        subUpdate.subscriptionPlan = planToStore;
      }

      if (pendingPlan !== undefined) {
        subUpdate.pendingPlan = pendingPlan || null;
      }

      const updated = {
        ...(existing || {}),
        ...subUpdate,
      };

      subscriptionsMap.set(userId, updated as any);
      await safeFirestoreSet(userId, subUpdate, true);
      await markStripeEventProcessed(event);

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

      let userId = subscription.metadata?.userId;
      if (!userId) {
        userId = await findUserIdByStripeCustomerId(customerId, stripe);
      }

      if (!userId) {
        await markStripeEventProcessed(event);
        return res.json({ received: true });
      }

      const existing = await getSubscriptionData(userId);
      if (
        existing?.lastStripeEventCreated &&
        event.created < existing.lastStripeEventCreated
      ) {
        await markStripeEventProcessed(event);
        return res.json({ received: true, stale: true });
      }

      if (existing?.pendingPlan && existing.pendingPlanStartsAt) {
        const startsAt = new Date(existing.pendingPlanStartsAt).getTime();
        if (Date.now() < startsAt) {
          await cancelPendingPlan(stripe, userId, existing);
        }
      }

      const subDelete = {
        subscriptionStatus: "canceled",
        cancelAtPeriodEnd: false,
        lastStripeEventCreated: event.created,
        updatedAt: new Date().toISOString(),
      };

      const current =
        subscriptionsMap.get(userId) || {
          subscriptionStatus: "canceled",
          updatedAt: new Date().toISOString(),
        };

      subscriptionsMap.set(userId, {
        ...current,
        ...subDelete,
      } as any);

      await safeFirestoreSet(userId, subDelete, true);
      await markStripeEventProcessed(event);

      return res.json({ received: true });
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

      const userId = await findUserIdByStripeCustomerId(customerId, stripe);
      if (!userId) {
        await markStripeEventProcessed(event);
        return res.json({ received: true });
      }

      const existing = await getSubscriptionData(userId);
      if (
        existing?.lastStripeEventCreated &&
        event.created < existing.lastStripeEventCreated
      ) {
        await markStripeEventProcessed(event);
        return res.json({ received: true, stale: true });
      }

      if (event.type === "invoice.payment_failed") {
        const failedUpdate = {
          subscriptionStatus: "past_due",
          lastStripeEventCreated: event.created,
          updatedAt: new Date().toISOString(),
        };
        subscriptionsMap.set(userId, {
          ...(existing || {}),
          ...failedUpdate,
        } as any);
        await safeFirestoreSet(userId, failedUpdate, true);
        await markStripeEventProcessed(event);
        return res.json({ received: true });
      }

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const periodEndTs =
          (subscription as any).current_period_end ||
          (subscription as any).trial_end;
        const periodEnd = periodEndTs
          ? new Date(periodEndTs * 1000).toISOString()
          : existing?.subscriptionPeriodEnd || null;

        const paidUpdate: Record<string, any> = {
          subscriptionStatus: subscription.status === "trialing" ? "trialing" : "active",
          subscriptionPeriodEnd: periodEnd,
          stripeCustomerId: customerId || null,
          stripeSubscriptionId: subscriptionId,
          lastStripeEventCreated: event.created,
          updatedAt: new Date().toISOString(),
        };

        subscriptionsMap.set(userId, {
          ...(existing || {}),
          ...paidUpdate,
        } as any);
        await safeFirestoreSet(userId, paidUpdate, true);
      }

      await markStripeEventProcessed(event);
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
          existing?.pendingPlanPaymentIntentId &&
          paymentIntentId &&
          existing.pendingPlanPaymentIntentId === paymentIntentId
        ) {
          await cancelPendingPlan(stripe, userId, {
            ...existing,
            pendingPlanPaymentIntentId: null,
          });
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
            subscriptionsMap.set(userId, {
              ...(existing || {}),
              ...refundUpdate,
            } as any);
            await safeFirestoreSet(userId, refundUpdate, true);
          } catch {}
        }
      }

      await markStripeEventProcessed(event);
      return res.json({ received: true });
    }

    /* =====================================================
       ALTRI EVENTI
       ===================================================== */

    await markStripeEventProcessed(event);
    return res.json({ received: true });
  } catch (err: any) {
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
          pendingPlanStartsAt: null,
          email: userEmail,
        });
      }

      // Normal student verification (ignores any client query/body userId)
      let data = await getSubscriptionData(userId);
      let status = data?.subscriptionStatus || "inactive";

      // Check expiration & refresh live from Stripe if periodEnd has elapsed or subscription exists
      const periodEndMs = data?.subscriptionPeriodEnd
        ? new Date(data.subscriptionPeriodEnd).getTime()
        : null;
      const isExpiredLocally = Boolean(
        periodEndMs && !Number.isNaN(periodEndMs) && periodEndMs < Date.now()
      );

      if (data?.stripeSubscriptionId && (isExpiredLocally || status === "past_due" || status === "incomplete")) {
        const stripe = getStripe();
        if (stripe) {
          try {
            const liveSub = await stripe.subscriptions.retrieve(data.stripeSubscriptionId);
            const liveEndTs =
              (liveSub as any).current_period_end || (liveSub as any).trial_end;
            const liveEndIso = liveEndTs
              ? new Date(liveEndTs * 1000).toISOString()
              : data.subscriptionPeriodEnd;
            const liveStatus =
              liveSub.status === "active" ||
              liveSub.status === "trialing" ||
              liveSub.status === "past_due"
                ? liveSub.status
                : "canceled";

            const synced = {
              subscriptionStatus: liveStatus,
              subscriptionPeriodEnd: liveEndIso || null,
              cancelAtPeriodEnd: Boolean(liveSub.cancel_at_period_end),
              updatedAt: new Date().toISOString(),
            };
            data = { ...data, ...synced } as any;
            subscriptionsMap.set(userId, data!);
            await safeFirestoreSet(userId, synced);
            status = liveStatus;
          } catch (syncErr) {
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

      return res.json({
        subscriptionStatus: isPremium ? status : (status === "active" || status === "trialing" ? "expired" : status),
        subscriptionPlan: data?.subscriptionPlan || null,
        subscriptionPeriodEnd: data?.subscriptionPeriodEnd || null,
        cancelAtPeriodEnd: Boolean(data?.cancelAtPeriodEnd),
        pendingPlan: data?.pendingPlan || null,
        pendingPlanStartsAt: data?.pendingPlanStartsAt || null,
        isPremium,
        role: "student",
        isCoach: false,
      });
    } catch (err: any) {
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
  process.env.VERCEL !== "1"
) {
  startServer();
}
