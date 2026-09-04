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

/* =========================================================
   CONFIG
   ========================================================= */

const PLAN_CONFIG = {
  monthly: {
    amount: 2000,
    interval: "month" as const,
    intervalCount: 1,
    label: "Abbonamento Mensile",
    description: "20,00 €/mese",
  },
  quarterly: {
    amount: 4500,
    interval: "month" as const,
    intervalCount: 3,
    label: "Abbonamento Trimestrale",
    description: "45,00 € ogni 3 mesi",
  },
  annual: {
    amount: 12000,
    interval: "year" as const,
    intervalCount: 1,
    label: "Abbonamento Annuale",
    description: "120,00 €/anno",
  },
} as const;

type PaidPlan = keyof typeof PLAN_CONFIG;

/* =========================================================
   STRIPE WEBHOOK RAW BODY
   Deve essere prima di express.json()
   ========================================================= */

app.use("/api/webhook", express.raw({ type: "application/json" }));

/* =========================================================
   STANDARD JSON
   ========================================================= */

app.use(express.json());

/* =========================================================
   STRIPE CLIENT
   ========================================================= */

function getStripe(): Stripe | null {
  let secretKey = (
    process.env.STRIPE_SECRET_KEY ||
    process.env.STRIPE_SECRET ||
    process.env.STRIPE_KEY ||
    process.env.VITE_STRIPE_SECRET_KEY
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

/* =========================================================
   IN-MEMORY FALLBACK
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

    updatedAt: string;
  }
>();

/* =========================================================
   FIRESTORE HELPERS
   ========================================================= */

async function safeFirestoreSet(
  userId: string,
  data: Record<string, any>
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
    console.log(
      `Firestore Admin sync note: ${e?.message || e}`
    );
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
    console.log(
      `Firestore Admin read note: ${e?.message || e}`
    );
  }

  return null;
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
   AI
   ========================================================= */

function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new GoogleGenAI({ apiKey });
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

app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const {
      userId,
      plan,
      customerEmail,
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: "ID utente mancante",
      });
    }

    if (
      plan !== "trial" &&
      plan !== "monthly" &&
      plan !== "quarterly" &&
      plan !== "annual" &&
      plan !== "test"
    ) {
      return res.status(400).json({
        error: "Piano non valido",
      });
    }

    const appUrl =
      process.env.APP_URL ||
      `http://localhost:${PORT}`;

    const stripe = getStripe();

    if (!stripe) {
      return res.status(400).json({
        error:
          "Stripe non è ancora configurato. Inserisci la variabile d'ambiente STRIPE_SECRET_KEY.",
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
                  "20,00 €/mese dopo i 7 giorni di prova",
              },

              unit_amount: 2000,

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
                  "20,00 €/mese",
              },

              unit_amount: 2000,

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
                  "120,00 €/anno",
              },

              unit_amount: 12000,

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
      err
    );

    return res.status(500).json({
      error:
        "Impossibile avviare il Checkout: " +
        (err.message || ""),
    });
  }
});

/* =========================================================
   CREATE CUSTOMER PORTAL SESSION
   ========================================================= */

app.post("/api/create-portal-session", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: "ID utente mancante",
      });
    }

    const appUrl =
      process.env.APP_URL ||
      `http://localhost:${PORT}`;

    const stripe = getStripe();

    if (!stripe) {
      return res.status(400).json({
        error:
          "Stripe non è ancora configurato con STRIPE_SECRET_KEY",
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
      error:
        "Impossibile accedere al Customer Portal: " +
        (err.message || ""),
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

  const signature =
    req.headers["stripe-signature"] as string;

  const webhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (
      stripe &&
      webhookSecret &&
      signature
    ) {
      event =
        stripe.webhooks.constructEvent(
          req.body,
          signature,
          webhookSecret
        );
    } else {
      const rawString =
        typeof req.body === "string"
          ? req.body
          : req.body.toString("utf8");

      event =
        JSON.parse(rawString);
    }
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
    /* =====================================================
       CHECKOUT COMPLETED
       ===================================================== */

    if (
      event.type ===
      "checkout.session.completed"
    ) {
      const session =
        event.data.object as Stripe.Checkout.Session;

      const userId =
        session.client_reference_id ||
        session.metadata?.userId;

      const plan =
        session.metadata?.plan;

      /*
       * Pagamento una tantum per cambio piano.
       */

      if (
        session.metadata?.changeType ===
          "scheduled_plan_change" &&
        userId &&
        isPaidPlan(plan)
      ) {
        /*
         * Non procediamo se Stripe non considera
         * il pagamento riuscito.
         */

        if (
          session.payment_status !==
          "paid"
        ) {
          console.log(
            "Checkout future plan non ancora pagato:",
            session.id
          );

          return res.json({
            received: true,
          });
        }

        if (!stripe) {
          throw new Error(
            "Stripe non configurato."
          );
        }

        const subscriptionId =
          session.metadata
            ?.subscriptionId;

        if (!subscriptionId) {
          throw new Error(
            "Subscription ID mancante nel cambio piano."
          );
        }

        const subscription =
          await stripe.subscriptions.retrieve(
            subscriptionId
          );

        const paymentIntentId =
          typeof session.payment_intent ===
          "string"
            ? session.payment_intent
            : session.payment_intent?.id;

        if (!paymentIntentId) {
          throw new Error(
            "PaymentIntent mancante nel pagamento del cambio piano."
          );
        }

        /*
         * Controlliamo ancora Firestore prima
         * di creare schedule e credito.
         */

        const existing =
          await getSubscriptionData(
            userId
          );

        if (existing?.pendingPlan) {
          console.log(
            "Cambio piano già presente:",
            existing.pendingPlan
          );

          return res.json({
            received: true,
          });
        }

        await scheduleFuturePlan(
          stripe,
          userId,
          subscription,
          plan,
          paymentIntentId
        );

        return res.json({
          received: true,
        });
      }

      /* ===================================================
         CHECKOUT NORMALE
         =================================================== */

      if (userId) {
        const normalPlan =
          plan || "monthly";

        const customerId =
          typeof session.customer ===
          "string"
            ? session.customer
            : session.customer?.id;

        const subscriptionId =
          typeof session.subscription ===
          "string"
            ? session.subscription
            : session.subscription?.id;

        /*
         * Il test one-time non crea subscription.
         */

        if (
          normalPlan === "test"
        ) {
          return res.json({
            received: true,
          });
        }

        /*
         * Per il trial usiamo i dati reali
         * della subscription Stripe.
         */

        let subscriptionStatus =
          "active";

        let periodEnd:
          | string
          | undefined;

        if (subscriptionId && stripe) {
          try {
            const subscription =
              await stripe.subscriptions.retrieve(
                subscriptionId
              );

            subscriptionStatus =
              subscription.status ===
              "trialing"
                ? "trialing"
                : subscription.status ===
                    "active"
                  ? "active"
                  : subscription.status;

            const periodEndTs =
              (subscription as any)
                .current_period_end ||
              (subscription as any)
                .trial_end;

            if (periodEndTs) {
              periodEnd =
                new Date(
                  periodEndTs * 1000
                ).toISOString();
            }
          } catch (e: any) {
            console.log(
              "Subscription retrieve note:",
              e?.message || e
            );
          }
        }

        /*
         * Fallback se Stripe non restituisce
         * subito il periodo.
         */

        if (!periodEnd) {
          const periodDays =
            normalPlan === "trial"
              ? 7
              : normalPlan === "monthly"
                ? 30
                : normalPlan ===
                    "quarterly"
                  ? 90
                  : 365;

          periodEnd =
            new Date(
              Date.now() +
                periodDays *
                  86400000
            ).toISOString();
        }

        const subInfo = {
          subscriptionStatus:
            normalPlan === "trial"
              ? "trialing"
              : "active",

          subscriptionPlan:
            normalPlan,

          subscriptionPeriodEnd:
            periodEnd,

          cancelAtPeriodEnd:
            false,

          stripeCustomerId:
            customerId,

          stripeSubscriptionId:
            subscriptionId,

          updatedAt:
            new Date().toISOString(),
        };

        const existing =
          subscriptionsMap.get(
            userId
          ) || {
            subscriptionStatus:
              "inactive",
            updatedAt:
              new Date().toISOString(),
          };

        subscriptionsMap.set(
          userId,
          {
            ...existing,
            ...subInfo,
          } as any
        );

        await safeFirestoreSet(
          userId,
          subInfo
        );
      }

      return res.json({
        received: true,
      });
    }

    /* =====================================================
       SUBSCRIPTION UPDATED
       ===================================================== */

    if (
      event.type ===
      "customer.subscription.updated"
    ) {
      const subscription =
        event.data.object as Stripe.Subscription;

      const customerId =
        typeof subscription.customer ===
        "string"
          ? subscription.customer
          : subscription.customer?.id;

      const subscriptionId =
        subscription.id;

      let userId =
        subscription.metadata?.userId;

      /*
       * Se metadata non contiene userId,
       * cerchiamo il customer nei nostri dati.
       */

      if (!userId) {
        for (
          const [uId, sub]
          of subscriptionsMap.entries()
        ) {
          if (
            sub.stripeCustomerId ===
            customerId
          ) {
            userId = uId;
            break;
          }
        }
      }

      if (!userId) {
        console.log(
          "Webhook subscription.updated senza userId:",
          subscriptionId
        );

        return res.json({
          received: true,
        });
      }

      const rawStatus =
        subscription.status;

      const status =
        rawStatus === "active" ||
        rawStatus === "trialing"
          ? rawStatus
          : rawStatus === "past_due"
            ? "past_due"
            : "canceled";

      const periodEndTs =
        (subscription as any)
          .current_period_end ||
        (subscription as any)
          .trial_end;

      const periodEnd =
        periodEndTs
          ? new Date(
              periodEndTs * 1000
            ).toISOString()
          : null;

      const cancelAtPeriodEnd =
        Boolean(
          subscription.cancel_at_period_end
        );

      const existing =
        await getSubscriptionData(
          userId
        );

      /*
       * Controlliamo se esiste un piano futuro
       * e se il momento di inizio è arrivato.
       */

      let planToStore =
        existing?.subscriptionPlan;

      let pendingPlan =
        existing?.pendingPlan;

      if (
        existing?.pendingPlan &&
        existing?.pendingPlanStartsAt
      ) {
        const startsAt =
          new Date(
            existing.pendingPlanStartsAt
          ).getTime();

        const now =
          Date.now();

        /*
         * Se la nuova fase è iniziata,
         * il piano futuro diventa quello corrente.
         */

        if (now >= startsAt) {
          planToStore =
            existing.pendingPlan;

          pendingPlan =
            undefined;

          const clearPending = {
            pendingPlan: null,
            pendingPlanAmount: null,
            pendingPlanPaymentIntentId:
              null,
            pendingPlanStartsAt:
              null,
            pendingPlanInvoiceItemId:
              null,
            stripeScheduleId: null,
          };

          await safeFirestoreSet(
            userId,
            clearPending
          );
        }
      }

      /*
       * Se Stripe ha impostato cancel_at_period_end,
       * significa che il periodo corrente continua
       * ma non verrà rinnovato.
       *
       * Se c'è un piano futuro, quel piano non deve
       * partire: lo rimborsiamo e rimuoviamo lo schedule.
       */

      if (
        cancelAtPeriodEnd &&
        existing?.pendingPlan &&
        existing.pendingPlanStartsAt
      ) {
        const startsAt =
          new Date(
            existing.pendingPlanStartsAt
          ).getTime();

        if (Date.now() < startsAt) {
          if (stripe) {
            await cancelPendingPlan(
              stripe,
              userId,
              existing
            );
          }

          pendingPlan =
            undefined;
        }
      }

      const subUpdate: Record<
        string,
        any
      > = {
        subscriptionStatus:
          status,

        subscriptionPeriodEnd:
          periodEnd,

        cancelAtPeriodEnd,

        stripeCustomerId:
          customerId,

        stripeSubscriptionId:
          subscriptionId,

        updatedAt:
          new Date().toISOString(),
      };

      /*
       * Non sovrascriviamo il piano attuale
       * con quello futuro prima che inizi.
       */

      if (planToStore) {
        subUpdate.subscriptionPlan =
          planToStore;
      }

      if (
        pendingPlan !== undefined
      ) {
        subUpdate.pendingPlan =
          pendingPlan || null;
      }

      const updated = {
        ...(existing || {}),
        ...subUpdate,
      };

      subscriptionsMap.set(
        userId,
        updated as any
      );

      await safeFirestoreSet(
        userId,
        subUpdate
      );

      return res.json({
        received: true,
      });
    }

    /* =====================================================
       SUBSCRIPTION DELETED
       ===================================================== */

    if (
      event.type ===
      "customer.subscription.deleted"
    ) {
      const subscription =
        event.data.object as Stripe.Subscription;

      const customerId =
        typeof subscription.customer ===
        "string"
          ? subscription.customer
          : subscription.customer?.id;

      let userId =
        subscription.metadata?.userId;

      if (!userId) {
        for (
          const [uId, sub]
          of subscriptionsMap.entries()
        ) {
          if (
            sub.stripeCustomerId ===
            customerId
          ) {
            userId = uId;
            break;
          }
        }
      }

      if (!userId) {
        return res.json({
          received: true,
        });
      }

      const existing =
        await getSubscriptionData(
          userId
        );

      /*
       * Se per qualche motivo esiste ancora
       * un pagamento futuro non iniziato,
       * lo rimborsiamo.
       */

      if (
        existing?.pendingPlan &&
        existing.pendingPlanStartsAt
      ) {
        const startsAt =
          new Date(
            existing.pendingPlanStartsAt
          ).getTime();

        if (Date.now() < startsAt) {
          if (stripe) {
            await cancelPendingPlan(
              stripe,
              userId,
              existing
            );
          }
        }
      }

      const subDelete = {
        subscriptionStatus:
          "canceled",

        cancelAtPeriodEnd:
          false,

        updatedAt:
          new Date().toISOString(),
      };

      const current =
        subscriptionsMap.get(
          userId
        ) || {
          subscriptionStatus:
            "canceled",
          updatedAt:
            new Date().toISOString(),
        };

      subscriptionsMap.set(
        userId,
        {
          ...current,
          ...subDelete,
        } as any
      );

      await safeFirestoreSet(
        userId,
        subDelete
      );

      return res.json({
        received: true,
      });
    }

    /* =====================================================
       EVENTI NON SPECIFICI
       ===================================================== */

    console.log(
      `Evento Stripe ricevuto: ${event.type}`
    );

    return res.json({
      received: true,
    });
  } catch (err: any) {
    console.error(
      "Errore elaborazione webhook Stripe:",
      err?.message || err
    );

    return res.status(500).json({
      error:
        "Errore interno durante elaborazione webhook",
    });
  }
});

/* =========================================================
   SUBSCRIPTION STATUS
   ========================================================= */

app.get(
  "/api/subscription-status",
  async (req, res) => {
    try {
      const userId =
        req.query.userId as string;

      if (!userId) {
        return res.status(400).json({
          error:
            "ID utente mancante",
        });
      }

      const data =
        await getSubscriptionData(
          userId
        );

      const status =
        data?.subscriptionStatus ||
        "inactive";

      const isPremium =
        status === "active" ||
        status === "trialing";

      return res.json({
        subscriptionStatus:
          status,

        subscriptionPlan:
          data?.subscriptionPlan ||
          null,

        subscriptionPeriodEnd:
          data?.subscriptionPeriodEnd ||
          null,

        cancelAtPeriodEnd:
          Boolean(
            data?.cancelAtPeriodEnd
          ),

        pendingPlan:
          data?.pendingPlan ||
          null,

        pendingPlanStartsAt:
          data?.pendingPlanStartsAt ||
          null,

        isPremium,
      });
    } catch (err: any) {
      console.error(
        "Subscription status error:",
        err?.message || err
      );

      return res.json({
        subscriptionStatus:
          "inactive",

        subscriptionPlan:
          null,

        subscriptionPeriodEnd:
          null,

        cancelAtPeriodEnd:
          false,

        pendingPlan:
          null,

        pendingPlanStartsAt:
          null,

        isPremium:
          false,
      });
    }
  }
);

/* =========================================================
   VOCAL COACH
   ========================================================= */

app.post(
  "/api/vocal-coach",
  async (req, res) => {
    try {
      const {
        message,
        voiceType,
        vocalRange,
        userLevel,
        promptContext,
      } = req.body;

      if (!message) {
        return res.status(400).json({
          error:
            "Messaggio mancante",
        });
      }

      const ai =
        getAIClient();

      if (!ai) {
        return res.status(500).json({
          error:
            "Chiave API Gemini non configurata. Inserisci la tua GEMINI_API_KEY nei Segreti.",
        });
      }

      const systemInstruction = `
Sei Vocalis AI, un maestro di canto esperto e amichevole, specializzato in tecnica vocale, fisiologia della voce, igiene vocale, respirazione diaframmatica e interpretazione.

Rispondi in italiano in modo chiaro, incoraggiante e tecnicamente accurato.

Contesto utente:
- Tipo di voce: ${voiceType || "Non specificato"}
- Estensione: ${vocalRange || "Non specificata"}
- Livello: ${userLevel || "Intermedio"}
- Contesto aggiuntivo: ${promptContext || "Nessuno"}

Fornisci consigli pratici, indicazioni fisiologiche utili (es. posizione della laringe, risuonatori, appoggio addominale) ed avvertimenti sulla salute vocale (evitare sforzi o raschiare la gola).

Usa la formattazione markdown con punti elenco e grassetti dove utile.
`;

      const response =
        await ai.models.generateContent({
          model:
            "gemini-2.5-flash",

          contents: [
            {
              role: "user",

              parts: [
                {
                  text:
                    `${systemInstruction}\n\nDomanda utente: ${message}`,
                },
              ],
            },
          ],
        });

      return res.json({
        reply:
          response.text,
      });
    } catch (err: any) {
      console.error(
        "Errore Vocal Coach API:",
        err
      );

      return res.status(500).json({
        error:
          "Impossibile elaborare la richiesta al Coach Vocale AI. " +
          (err.message || ""),
      });
    }
  }
);

/* =========================================================
   CUSTOM ROUTINE GENERATOR
   ========================================================= */

app.post(
  "/api/generate-routine",
  async (req, res) => {
    try {
      const {
        goal,
        availableTimeMinutes,
        voiceType,
        userLevel,
      } = req.body;

      const ai =
        getAIClient();

      if (!ai) {
        return res.status(500).json({
          error:
            "Chiave API Gemini non configurata.",
        });
      }

      const prompt = `
Crea una routine di riscaldamento ed esercizio vocale personalizzata in formato JSON.

Obiettivo:
${goal || "Riscaldamento generale"}

Tempo a disposizione:
${availableTimeMinutes || 10} minuti

Tipo di voce:
${voiceType || "Non specificato"}

Livello:
${userLevel || "Intermedio"}

Rispondi ESCLUSIVAMENTE con un oggetto JSON valido (senza blocchi markdown extra) con questa struttura:

{
  "routineName": "Nome della Routine",
  "description": "Descrizione sintetica",
  "totalDurationMinutes": 10,
  "steps": [
    {
      "id": "step1",
      "title": "Titolo fase",
      "duration": "2 min",
      "instruction": "Istruzioni dettagliate su cosa fare e come posizionare la bocca/corpo",
      "scaleType": "five_note",
      "vowel": "AH",
      "focus": "Appoggio, risonanza, articolazione, ecc."
    }
  ]
}
`;

      const response =
        await ai.models.generateContent({
          model:
            "gemini-2.5-flash",

          contents: [
            {
              role: "user",
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        });

      let rawText =
        response.text || "";

      rawText =
        rawText
          .replace(
            /```json/g,
            ""
          )
          .replace(
            /```/g,
            ""
          )
          .trim();

      try {
        const routineJson =
          JSON.parse(rawText);

        return res.json({
          routine:
            routineJson,
        });
      } catch {
        return res.json({
          rawReply:
            rawText,
        });
      }
    } catch (err: any) {
      console.error(
        "Errore Routine Generator API:",
        err
      );

      return res.status(500).json({
        error:
          "Impossibile generare la routine.",
      });
    }
  }
);

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
