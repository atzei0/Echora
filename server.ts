import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import Stripe from "stripe";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for raw body parsing on Stripe Webhook endpoint
app.use("/api/webhook", express.raw({ type: "application/json" }));

// Standard JSON middleware for API endpoints
app.use(express.json());

// Lazy-get Stripe client
function getStripe(): Stripe | null {
  let secretKey = (
    process.env.STRIPE_SECRET_KEY ||
    process.env.STRIPE_SECRET ||
    process.env.STRIPE_KEY ||
    process.env.VITE_STRIPE_SECRET_KEY
  )?.trim();

  if (secretKey) {
    if ((secretKey.startsWith('"') && secretKey.endsWith('"')) || (secretKey.startsWith("'") && secretKey.endsWith("'"))) {
      secretKey = secretKey.slice(1, -1).trim();
    }
  }

  if (!secretKey || secretKey === "sk_test_..." || secretKey === "MY_STRIPE_SECRET_KEY") {
    return null;
  }
  return new Stripe(secretKey);
}

// Lazy-get Firebase Admin Firestore
function getAdminDb() {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0054933986";
  const dbId = process.env.FIREBASE_DATABASE_ID || process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID || "ai-studio-remixechora1-0c1d8482-e315-4883-b5ca-10797300d295";

  if (getApps().length === 0) {
    try {
      if (process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT);
        initializeApp({
          credential: cert(serviceAccount),
          projectId
        });
      } else {
        initializeApp({
          projectId
        });
      }
    } catch (e) {
      console.warn("Firebase Admin Init warning:", e);
    }
  }
  const defaultApp = getApps()[0];
  if (!defaultApp) return null;

  return dbId && dbId !== "(default)"
    ? getFirestore(defaultApp, dbId)
    : getFirestore(defaultApp);
}

// In-memory fallback store for subscription states when Admin SDK permissions are limited
const subscriptionsMap = new Map<string, {
  subscriptionStatus: string;
  subscriptionPlan?: string;
  subscriptionPeriodEnd?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  updatedAt: string;
}>();

// Helper to safely perform Admin Firestore operations without crashing or logging error stacks
async function safeFirestoreSet(userId: string, data: Record<string, any>) {
  try {
    const db = getAdminDb();
    if (db) {
      await db.collection("users").doc(userId).set(data, { merge: true });
    }
  } catch (e: any) {
    // Quietly catch permission or credential warnings without throwing or breaking API
    console.log(`Firestore Admin sync note: ${e?.message || e}`);
  }
}

async function safeFirestoreGet(userId: string): Promise<Record<string, any> | null> {
  try {
    const db = getAdminDb();
    if (db) {
      const docSnap = await db.collection("users").doc(userId).get();
      if (docSnap.exists) {
        return docSnap.data() || null;
      }
    }
  } catch (e: any) {
    console.log(`Firestore Admin read note: ${e?.message || e}`);
  }
  return null;
}
function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Create Stripe Checkout Session API
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { userId, plan, customerEmail } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "ID utente mancante" });
    }

    const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
    const stripe = getStripe();

    if (!stripe) {
      return res.status(400).json({
        error: "Stripe non è ancora configurato. Inserisci la variabile d'ambiente STRIPE_SECRET_KEY nelle impostazioni dell'applicazione per abilitare Stripe Checkout."
      });
    }

    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let mode: Stripe.Checkout.SessionCreateParams.Mode = "subscription";
    let subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData | undefined = undefined;

    switch (plan) {
      case "trial":
        // Prova 7 giorni a €0,99 addebitati subito + Abbonamento mensile da €20/mese che inizia dopo 7 giorni
        lineItems = [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: "Echora — 7 Giorni di Prova",
                description: "0,99 € per i primi 7 giorni"
              },
              unit_amount: 99
            },
            quantity: 1
          },
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: "Echora — Abbonamento Mensile",
                description: "20,00 €/mese dopo i 7 giorni di prova (disdici in qualsiasi momento)"
              },
              unit_amount: 2000,
              recurring: { interval: "month" }
            },
            quantity: 1
          }
        ];
        mode = "subscription";
        subscriptionData = {
          trial_period_days: 7,
          metadata: {
            userId,
            plan
          }
        };
        break;

      case "monthly":
        lineItems = [{
          price_data: {
            currency: "eur",
            product_data: {
              name: "Echora",
              description: "Abbonamento mensile"
            },
            unit_amount: 2000,
            recurring: { interval: "month" }
          },
          quantity: 1
        }];
        mode = "subscription";
        subscriptionData = { metadata: { userId, plan } };
        break;

      case "quarterly":
        lineItems = [{
          price_data: {
            currency: "eur",
            product_data: {
              name: "Echora",
              description: "Abbonamento trimestrale"
            },
            unit_amount: 4500,
            recurring: { interval: "month", interval_count: 3 }
          },
          quantity: 1
        }];
        mode = "subscription";
        subscriptionData = { metadata: { userId, plan } };
        break;

      case "annual":
        lineItems = [{
          price_data: {
            currency: "eur",
            product_data: {
              name: "Echora",
              description: "Abbonamento annuale"
            },
            unit_amount: 12000,
            recurring: { interval: "year" }
          },
          quantity: 1
        }];
        mode = "subscription";
        subscriptionData = { metadata: { userId, plan } };
        break;

      case "test":
        lineItems = [{
          price_data: {
            currency: "eur",
            product_data: {
              name: "Echora Test",
              description: "Pagamento Test 0,99 €"
            },
            unit_amount: 99
          },
          quantity: 1
        }];
        mode = "payment";
        break;

      default:
        return res.status(400).json({ error: "Piano non valido" });
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card", "paypal", "klarna"],
      line_items: lineItems,
      mode: mode,
      subscription_data: subscriptionData,
      client_reference_id: userId,
      customer_email: customerEmail || undefined,
      metadata: {
        userId,
        plan
      },
      custom_text: plan === "trial" ? {
        submit: {
          message: "Paghi 0,99 € oggi per 7 giorni di prova di Echora. Se non disdici prima della fine dei 7 giorni, l'abbonamento si rinnoverà automaticamente a 20,00 €/mese. Puoi disdire in qualsiasi momento prima del prossimo addebito."
        }
      } : undefined,
      success_url: `${appUrl}/#payment-success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${appUrl}/#payment-cancelled`
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return res.json({
      url: session.url,
      sessionId: session.id
    });
  } catch (err: any) {
    console.error("Errore creazione Stripe Checkout Session:", err);
    return res.status(500).json({ error: "Impossibile avviare il Checkout: " + (err.message || "") });
  }
});

// Create Stripe Customer Portal Session API
app.post("/api/create-portal-session", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "ID utente mancante" });
    }

    const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
    const stripe = getStripe();

    if (!stripe) {
      return res.status(400).json({ error: "Stripe non è ancora configurato con STRIPE_SECRET_KEY" });
    }

    let customerId = subscriptionsMap.get(userId)?.stripeCustomerId;

    if (!customerId) {
      const dbData = await safeFirestoreGet(userId);
      customerId = dbData?.stripeCustomerId;
    }

    if (!customerId) {
      // Generate a new Stripe customer if missing
      const customer = await stripe.customers.create({
        metadata: { userId }
      });
      customerId = customer.id;
      const subInfo = {
        stripeCustomerId: customerId,
        updatedAt: new Date().toISOString()
      };
      subscriptionsMap.set(userId, {
        subscriptionStatus: "inactive",
        ...(subscriptionsMap.get(userId) || {}),
        ...subInfo
      });
      await safeFirestoreSet(userId, subInfo);
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/#profile`,
    });

    return res.json({ url: portalSession.url });
  } catch (err: any) {
    console.error("Errore creazione Stripe Portal Session:", err?.message || err);
    return res.status(500).json({ error: "Impossibile accedere al Customer Portal: " + (err.message || "") });
  }
});

// Stripe Webhook Endpoint
app.post("/api/webhook", async (req, res) => {
  const stripe = getStripe();
  const signature = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (stripe && webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } else {
      const rawString = typeof req.body === "string" ? req.body : req.body.toString("utf8");
      event = JSON.parse(rawString);
    }
  } catch (err: any) {
    console.error(`Webhook Signature Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id || session.metadata?.userId;
        const plan = session.metadata?.plan || "monthly";

        if (userId) {
          const periodDays = plan === "trial" ? 7 : plan === "monthly" ? 30 : plan === "quarterly" ? 90 : 365;
          const periodEnd = new Date(Date.now() + periodDays * 86400000).toISOString();
          const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
          const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

          const subInfo = {
            subscriptionStatus: plan === "trial" ? "trialing" : "active",
            subscriptionPlan: plan,
            subscriptionPeriodEnd: periodEnd,
            cancelAtPeriodEnd: false,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            updatedAt: new Date().toISOString()
          };

          const existing = subscriptionsMap.get(userId) || {};
          subscriptionsMap.set(userId, { ...existing, ...subInfo });
          await safeFirestoreSet(userId, subInfo);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
        const subscriptionId = subscription.id;
        const userId = subscription.metadata?.userId;

        const rawStatus = subscription.status;
        const status = (rawStatus === "active" || rawStatus === "trialing") ? rawStatus : (rawStatus === "past_due" ? "past_due" : "canceled");
        const periodEndTs = (subscription as any).current_period_end || (subscription as any).trial_end;
        const periodEnd = periodEndTs ? new Date(periodEndTs * 1000).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString();
        const cancelAtPeriodEnd = Boolean(subscription.cancel_at_period_end);

        const subUpdate = {
          subscriptionStatus: status,
          subscriptionPeriodEnd: periodEnd,
          cancelAtPeriodEnd,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          updatedAt: new Date().toISOString()
        };

        if (userId) {
          const existing = subscriptionsMap.get(userId) || {};
          subscriptionsMap.set(userId, { ...existing, ...subUpdate });
          await safeFirestoreSet(userId, subUpdate);
        }

        for (const [uId, sub] of subscriptionsMap.entries()) {
          if (sub.stripeCustomerId === customerId) {
            const updated = {
              ...sub,
              ...subUpdate
            };
            subscriptionsMap.set(uId, updated);
            await safeFirestoreSet(uId, updated);
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
        const userId = subscription.metadata?.userId;

        const subDelete = {
          subscriptionStatus: "canceled",
          cancelAtPeriodEnd: false,
          updatedAt: new Date().toISOString()
        };

        if (userId) {
          const existing = subscriptionsMap.get(userId) || {};
          subscriptionsMap.set(userId, { ...existing, ...subDelete });
          await safeFirestoreSet(userId, subDelete);
        }

        for (const [uId, sub] of subscriptionsMap.entries()) {
          if (sub.stripeCustomerId === customerId) {
            const updated = {
              ...sub,
              ...subDelete
            };
            subscriptionsMap.set(uId, updated);
            await safeFirestoreSet(uId, updated);
          }
        }
        break;
      }

      default:
        console.log(`Evento Stripe gestito: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (err: any) {
    console.error("Errore elaborazione webhook Stripe:", err?.message || err);
    return res.status(500).json({ error: "Errore interno durante elaborazione webhook" });
  }
});

// Subscription Status API
app.get("/api/subscription-status", async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: "ID utente mancante" });
    }

    let data = subscriptionsMap.get(userId);
    if (!data) {
      const dbData = await safeFirestoreGet(userId);
      if (dbData) {
        data = {
          subscriptionStatus: dbData.subscriptionStatus || "inactive",
          subscriptionPlan: dbData.subscriptionPlan,
          subscriptionPeriodEnd: dbData.subscriptionPeriodEnd,
          stripeCustomerId: dbData.stripeCustomerId,
          stripeSubscriptionId: dbData.stripeSubscriptionId,
          updatedAt: dbData.updatedAt || new Date().toISOString()
        };
        subscriptionsMap.set(userId, data);
      }
    }

    const status = data?.subscriptionStatus || "inactive";
    const isPremium = status === "active" || status === "trialing";

    return res.json({
      subscriptionStatus: status,
      subscriptionPlan: data?.subscriptionPlan || null,
      subscriptionPeriodEnd: data?.subscriptionPeriodEnd || null,
      isPremium
    });
  } catch (err: any) {
    return res.json({
      subscriptionStatus: "inactive",
      subscriptionPlan: null,
      subscriptionPeriodEnd: null,
      isPremium: false
    });
  }
});

// Vocal Coach Chat API
app.post("/api/vocal-coach", async (req, res) => {
  try {
    const { message, voiceType, vocalRange, userLevel, promptContext } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Messaggio mancante" });
    }

    const ai = getAIClient();
    if (!ai) {
      return res.status(500).json({
        error: "Chiave API Gemini non configurata. Inserisci la tua GEMINI_API_KEY nei Segreti.",
      });
    }

    const systemInstruction = `Sei Vocalis AI, un maestro di canto esperto e amichevole, specializzato in tecnica vocale, fisiologia della voce, igiene vocale, respirazione diaframmatica e interpretazione.
Rispondi in italiano in modo chiaro, incoraggiante e tecnicamente accurato.
Contesto utente:
- Tipo di voce: ${voiceType || "Non specificato"}
- Estensione: ${vocalRange || "Non specificata"}
- Livello: ${userLevel || "Intermedio"}

Fornisci consigli pratici, indicazioni fisiologiche utili (es. posizione della laringe, risuonatori, appoggio addominale) ed avvertimenti sulla salute vocale (evitare sforzi o raschiare la gola). Usa la formattazione markdown con punti elenco e grassetti dove utile.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: `${systemInstruction}\n\nDomanda utente: ${message}` }] }
      ],
    });

    return res.json({ reply: response.text });
  } catch (err: any) {
    console.error("Errore Vocal Coach API:", err);
    return res.status(500).json({
      error: "Impossibile elaborare la richiesta al Coach Vocale AI. " + (err.message || ""),
    });
  }
});

// Custom Routine Generator API
app.post("/api/generate-routine", async (req, res) => {
  try {
    const { goal, availableTimeMinutes, voiceType, userLevel } = req.body;

    const ai = getAIClient();
    if (!ai) {
      return res.status(500).json({
        error: "Chiave API Gemini non configurata.",
      });
    }

    const prompt = `Crea una routine di riscaldamento ed esercizio vocale personalizzata in formato JSON.
Obiettivo: ${goal || "Riscaldamento generale"}
Tempo a disposizione: ${availableTimeMinutes || 10} minuti
Tipo di voce: ${voiceType || "Non specificato"}
Livello: ${userLevel || "Intermedio"}

Rispondi ESCLUSIVAMENTE con un oggetto JSON valido (senza blocchi markdown extra) con questa struttura:
{
  "routineName": "Nome della Routine",
  "description": "Descrizione sintetica",
  "totalDurationMinutes": 10,
  "steps": [
    {
      "id": "step1",
      "title": "Titolo fase (es: Respirazione e Rilassamento)",
      "duration": "2 min",
      "instruction": "Istruzioni dettagliate su cosa fare e come posizionare la bocca/corpo",
      "scaleType": "five_note" | "triad" | "octave_slide" | "humming_glide" | "siren" | "none",
      "vowel": "AH" | "OH" | "EE" | "MM" | "BRRR" | "Zzz",
      "focus": "Appoggio, risonanza, articolazione, ecc."
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    let rawText = response.text || "";
    // Clean up potential code block markers
    rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
      const routineJson = JSON.parse(rawText);
      return res.json({ routine: routineJson });
    } catch {
      return res.json({ rawReply: rawText });
    }
  } catch (err: any) {
    console.error("Errore Routine Generator API:", err);
    return res.status(500).json({ error: "Impossibile generare la routine." });
  }
});

// Start Express + Vite server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server Vocalis attivo su http://localhost:${PORT}`);
  });
}

startServer();

