import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../../layouts/DashboardLayout/DashboardLayout.jsx";

import {
  createPaymentOrder,
  createSubscription,
  upgradeSubscription,
  cancelSubscription,
  getSubscription,
  getBillingHistory,
  getCredits,
} from "../../../services/billingService";

import styles from "./Billing.module.css";


/* =========================================================
   ZYRIONOS — BILLING & SUBSCRIPTION
   =========================================================

   REAL BACKEND CONTRACT

   Subscription:
   GET  /api/subscription/me
   POST /api/subscription/create
   POST /api/subscription/upgrade
   POST /api/subscription/cancel

   Payment:
   POST /api/payment/create-order
   POST /api/payment/verify-payment

   Billing:
   GET  /api/payment/billing-history
   GET  /api/payment/credits

   Current catalog:
   Starter    $19 / $190
   Pro        $99 / $990
   Business   $199 / $1990
   Scale      $299 / $2990
   Enterprise $499 / $4990

   Currency:
   USD

   Provider:
   Stripe = enabled
   Razorpay = disabled until verified INR catalog exists

   IMPORTANT:
   - Frontend never decides final payment amount.
   - Backend remains source of truth.
   - Frontend never marks subscription as active.
   - Stripe activation is webhook controlled.
   - Credits are read from the real backend.
========================================================= */


/* =========================================================
   DISPLAY CATALOG
========================================================= */

const PLANS = Object.freeze([
  {
    name: "Starter",
    monthly: 19,
    yearly: 190,
    description:
      "A practical starting plan for individual projects.",
  },

  {
    name: "Pro",
    monthly: 99,
    yearly: 990,
    description:
      "More capacity for serious AI-powered work.",
  },

  {
    name: "Business",
    monthly: 199,
    yearly: 1990,
    description:
      "Designed for growing production workloads.",
  },

  {
    name: "Scale",
    monthly: 299,
    yearly: 2990,
    description:
      "Higher capacity for larger workloads.",
  },

  {
    name: "Enterprise",
    monthly: 499,
    yearly: 4990,
    description:
      "Maximum configured plan in the current catalog.",
  },
]);


/* =========================================================
   GENERIC HELPERS
========================================================= */

function firstValue(...values) {
  return values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      value !== ""
  );
}


function displayValue(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return "—";
  }

  return String(value);
}


function isObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}


/* =========================================================
   RESPONSE UNWRAPPING
========================================================= */

function unwrapResponse(response) {
  const root = response?.data;

  if (
    root === undefined ||
    root === null
  ) {
    return null;
  }

  if (
    root?.data !== undefined &&
    root?.data !== null
  ) {
    return root.data;
  }

  return root;
}


/* =========================================================
   SUBSCRIPTION NORMALIZATION
========================================================= */

function normalizeSubscription(response) {
  const root = response?.data;

  if (!root) {
    return null;
  }

  const candidates = [
    root?.subscription,
    root?.data?.subscription,
    root?.data?.data?.subscription,
    root?.data,
    root,
  ];

  for (const candidate of candidates) {
    if (
      candidate &&
      typeof candidate === "object" &&
      !Array.isArray(candidate)
    ) {
      if (
        candidate?.subscription &&
        typeof candidate.subscription === "object"
      ) {
        return candidate.subscription;
      }

      return candidate;
    }
  }

  if (Array.isArray(root)) {
    return root[0] || null;
  }

  return null;
}


/* =========================================================
   SUBSCRIPTION FIELD NORMALIZATION
========================================================= */

function normalizePlanName(subscription) {
  return firstValue(
    subscription?.planName,
    subscription?.plan?.name,
    typeof subscription?.plan === "string"
      ? subscription.plan
      : undefined,
    subscription?.productName,
    subscription?.product?.name
  );
}


function normalizeCurrency(subscription) {
  return firstValue(
    subscription?.currency,
    subscription?.plan?.currency,
    subscription?.price?.currency,
    subscription?.billing?.currency
  );
}


function normalizePrice(subscription) {
  return firstValue(
    subscription?.monthlyPrice,
    subscription?.price?.monthly,
    subscription?.price?.amountMonthly,
    subscription?.price?.amount,
    subscription?.amount,
    subscription?.billing?.amount
  );
}


function normalizeBillingInterval(subscription) {
  return firstValue(
    subscription?.billingInterval,
    subscription?.billingCycle,
    subscription?.interval,
    subscription?.price?.interval,
    subscription?.cycle
  );
}


function normalizeStatus(subscription) {
  return firstValue(
    subscription?.status,
    subscription?.subscriptionStatus,
    subscription?.state
  );
}


function normalizePaymentMethod(subscription) {
  return (
    subscription?.paymentMethod ||
    subscription?.defaultPaymentMethod ||
    subscription?.billing?.paymentMethod ||
    null
  );
}


function normalizeInfrastructure(subscription) {
  const infrastructure =
    subscription?.infrastructure ||
    subscription?.plan?.infrastructure ||
    subscription?.resources ||
    {};

  return {
    ram: firstValue(
      infrastructure?.ram,
      infrastructure?.memory,
      infrastructure?.memoryLimit,
      subscription?.ram
    ),

    cpu: firstValue(
      infrastructure?.cpu,
      infrastructure?.vCpu,
      infrastructure?.vcpu,
      infrastructure?.cpuLimit,
      subscription?.cpu
    ),

    storage: firstValue(
      infrastructure?.storage,
      infrastructure?.storageLimit,
      subscription?.storage
    ),

    bandwidth: firstValue(
      infrastructure?.bandwidth,
      infrastructure?.bandwidthLimit,
      subscription?.bandwidth
    ),
  };
}


/* =========================================================
   PAYMENT METHOD
========================================================= */

function normalizePaymentLabel(
  paymentMethod
) {
  if (!paymentMethod) {
    return null;
  }

  const brand = firstValue(
    paymentMethod?.brand,
    paymentMethod?.card?.brand,
    paymentMethod?.type
  );

  const last4 = firstValue(
    paymentMethod?.last4,
    paymentMethod?.card?.last4
  );

  if (brand && last4) {
    return `${String(
      brand
    )} •••• ${last4}`;
  }

  if (last4) {
    return `Card •••• ${last4}`;
  }

  if (brand) {
    return String(brand);
  }

  return "Payment method on file";
}


/* =========================================================
   CREDITS NORMALIZATION
=========================================================

   Backend may return:

   {
     credits: {
       total,
       used,
       remaining
     }
   }

   OR:

   {
     data: {
       credits: {
         total,
         used,
         remaining
       }
     }
   }

   OR directly:

   {
     total,
     used,
     remaining
   }

   Additional common backend field names are supported.

   No fallback credit amount is fabricated.
========================================================= */

function extractCreditsObject(response) {
  const root = response?.data;

  if (
    root === undefined ||
    root === null
  ) {
    return null;
  }

  const candidates = [
    root?.credits,
    root?.data?.credits,
    root?.data?.data?.credits,
    root?.result?.credits,
    root?.payload?.credits,

    root?.data,
    root?.result,
    root?.payload,

    root,
  ];

  for (const candidate of candidates) {
    if (!isObject(candidate)) {
      continue;
    }

    const hasCreditField =
      candidate?.total !== undefined ||
      candidate?.limit !== undefined ||
      candidate?.included !== undefined ||
      candidate?.totalCredits !== undefined ||
      candidate?.creditLimit !== undefined ||
      candidate?.used !== undefined ||
      candidate?.usedCredits !== undefined ||
      candidate?.consumed !== undefined ||
      candidate?.remaining !== undefined ||
      candidate?.remainingCredits !== undefined ||
      candidate?.available !== undefined ||
      candidate?.availableCredits !== undefined ||
      candidate?.unlimited !== undefined;

    if (hasCreditField) {
      return candidate;
    }
  }

  return null;
}


function normalizeCredits(response) {
  const source =
    extractCreditsObject(
      response
    );

  if (!source) {
    return null;
  }

  const total = firstValue(
    source?.total,
    source?.limit,
    source?.included,
    source?.totalCredits,
    source?.creditLimit,
    source?.creditsLimit
  );

  const used = firstValue(
    source?.used,
    source?.consumed,
    source?.usedCredits,
    source?.creditsUsed
  );

  const remaining = firstValue(
    source?.remaining,
    source?.available,
    source?.remainingCredits,
    source?.availableCredits,
    source?.creditsRemaining
  );

  const unlimited =
    source?.unlimited === true ||
    Number(total) === -1;

  return {
    total,
    used,
    remaining,
    unlimited,
  };
}


/* =========================================================
   BILLING HISTORY NORMALIZATION
========================================================= */

function normalizeBillingHistory(
  response
) {
  const root = response?.data;

  if (!root) {
    return [];
  }

  const candidates = [
    root?.history,
    root?.billingHistory,
    root?.transactions,
    root?.data?.history,
    root?.data?.billingHistory,
    root?.data?.transactions,
    root?.data,
    root,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}


/* =========================================================
   COMPONENT
========================================================= */

function Billing() {
  const navigate =
    useNavigate();

  const [
    subscription,
    setSubscription,
  ] = useState(null);

  const [
    billingHistory,
    setBillingHistory,
  ] = useState([]);

  const [
    credits,
    setCredits,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    processing,
    setProcessing,
  ] = useState(false);

  const [
    selectedPlan,
    setSelectedPlan,
  ] = useState("Pro");

  const [
    billingCycle,
    setBillingCycle,
  ] = useState("monthly");

  const [
    provider,
    setProvider,
  ] = useState("stripe");

  const [
    error,
    setError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    paymentData,
    setPaymentData,
  ] = useState(null);


  /* =======================================================
     LOAD REAL BILLING DATA
  ======================================================= */

  const loadBilling =
    useCallback(
      async ({
        refresh = false,
      } = {}) => {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        try {
          const [
            subscriptionResponse,
            historyResponse,
            creditsResponse,
          ] =
            await Promise.allSettled([
              getSubscription(),
              getBillingHistory(),
              getCredits(),
            ]);


          /* -----------------------------------------------
             SUBSCRIPTION
          ------------------------------------------------ */

          if (
            subscriptionResponse.status ===
            "fulfilled"
          ) {
            const normalized =
              normalizeSubscription(
                subscriptionResponse.value
              );

            setSubscription(
              normalized
            );

            const currentPlan =
              normalizePlanName(
                normalized
              );

            if (
              currentPlan &&
              PLANS.some(
                (plan) =>
                  plan.name ===
                  currentPlan
              )
            ) {
              setSelectedPlan(
                currentPlan
              );
            }

            const currentInterval =
              normalizeBillingInterval(
                normalized
              );

            if (
              String(
                currentInterval ||
                  ""
              ).toLowerCase() ===
              "yearly"
            ) {
              setBillingCycle(
                "yearly"
              );
            }
          } else {
            setSubscription(null);
          }


          /* -----------------------------------------------
             BILLING HISTORY
          ------------------------------------------------ */

          if (
            historyResponse.status ===
            "fulfilled"
          ) {
            setBillingHistory(
              normalizeBillingHistory(
                historyResponse.value
              )
            );
          } else {
            setBillingHistory([]);
          }


          /* -----------------------------------------------
             AI CREDITS
          ------------------------------------------------ */

          if (
            creditsResponse.status ===
            "fulfilled"
          ) {
            const normalizedCredits =
              normalizeCredits(
                creditsResponse.value
              );

            setCredits(
              normalizedCredits
            );
          } else {
            console.error(
              "Credits API error:",
              creditsResponse.reason
            );

            setCredits(null);
          }

        } catch (err) {
          console.error(
            "Billing loading error:",
            err
          );

          setError(
            "Billing information could not be loaded from the backend."
          );
        } finally {
          if (refresh) {
            setRefreshing(false);
          } else {
            setLoading(false);
          }
        }
      },
      []
    );


  useEffect(() => {
    loadBilling();
  }, [loadBilling]);


  /* =======================================================
     CURRENT BILLING
  ======================================================= */

  const billing =
    useMemo(() => {
      const infrastructure =
        normalizeInfrastructure(
          subscription
        );

      const paymentMethod =
        normalizePaymentMethod(
          subscription
        );

      return {
        planName:
          normalizePlanName(
            subscription
          ),

        currency:
          normalizeCurrency(
            subscription
          ) || "USD",

        price:
          normalizePrice(
            subscription
          ),

        interval:
          normalizeBillingInterval(
            subscription
          ),

        status:
          normalizeStatus(
            subscription
          ),

        infrastructure,

        paymentMethod,

        paymentLabel:
          normalizePaymentLabel(
            paymentMethod
          ),

        nextBillingDate:
          firstValue(
            subscription?.nextBillingDate,
            subscription?.currentPeriodEnd,
            subscription?.billing
              ?.nextBillingDate
          ),
      };
    }, [
      subscription,
    ]);


  /* =======================================================
     SELECTED PLAN
  ======================================================= */

  const selectedPlanData =
    useMemo(
      () =>
        PLANS.find(
          (plan) =>
            plan.name ===
            selectedPlan
        ) || PLANS[0],
      [selectedPlan]
    );


  const selectedPrice =
    billingCycle ===
    "yearly"
      ? selectedPlanData.yearly
      : selectedPlanData.monthly;


  /* =======================================================
     MONEY
  ======================================================= */

  const formatMoney =
    useCallback(
      (
        amount,
        currency = "USD"
      ) => {
        const numeric =
          Number(amount);

        if (
          !Number.isFinite(
            numeric
          )
        ) {
          return "—";
        }

        try {
          return new Intl.NumberFormat(
            undefined,
            {
              style: "currency",
              currency:
                currency || "USD",
              maximumFractionDigits: 2,
            }
          ).format(numeric);
        } catch {
          return `${currency || "USD"} ${numeric}`;
        }
      },
      []
    );


  const formattedCurrentPrice =
    useMemo(() => {
      if (
        billing.price ===
          undefined ||
        billing.price ===
          null ||
        billing.price ===
          ""
      ) {
        return "—";
      }

      return formatMoney(
        billing.price,
        billing.currency
      );
    }, [
      billing.price,
      billing.currency,
      formatMoney,
    ]);


  /* =======================================================
     CREDIT PROGRESS
  ======================================================= */

  const creditProgress =
    useMemo(() => {
      if (!credits) {
        return null;
      }

      if (credits.unlimited) {
        return null;
      }

      const used =
        Number(
          credits.used
        );

      const total =
        Number(
          credits.total
        );

      if (
        !Number.isFinite(
          used
        ) ||
        !Number.isFinite(
          total
        ) ||
        total <= 0
      ) {
        return null;
      }

      return Math.min(
        100,
        Math.max(
          0,
          (used / total) *
            100
        )
      );
    }, [credits]);


  /* =======================================================
     API ERROR
  ======================================================= */

  const getApiErrorMessage =
    useCallback(
      (
        err,
        fallback
      ) =>
        err?.response?.data
          ?.message ||
        err?.response?.data
          ?.error ||
        err?.response?.data
          ?.code ||
        err?.message ||
        fallback,
      []
    );


  /* =======================================================
     START STRIPE PAYMENT
  ======================================================= */

  const handleStartPayment =
    async () => {
      setProcessing(true);
      setError("");
      setSuccessMessage("");
      setPaymentData(null);

      try {
        if (
          provider !==
          "stripe"
        ) {
          throw new Error(
            "Razorpay is not currently enabled for the USD ZyrionOS catalog."
          );
        }

        const response =
          await createPaymentOrder({
            plan:
              selectedPlan,

            billingCycle,

            provider:
              "stripe",

            currency:
              "USD",
          });

        const root =
          response?.data;

        const data =
          root?.data ||
          root;

        const clientSecret =
          data?.clientSecret ||
          data?.paymentIntent
            ?.client_secret ||
          null;

        const paymentIntentId =
          data?.paymentIntentId ||
          data?.paymentIntent
            ?.id ||
          null;

        setPaymentData({
          provider: "stripe",

          plan:
            selectedPlan,

          billingCycle,

          amount:
            data?.amount ??
            selectedPrice,

          currency:
            data?.currency ||
            "USD",

          clientSecret,

          paymentIntentId,
        });

        if (
          clientSecret
        ) {
          setSuccessMessage(
            "Stripe PaymentIntent created successfully. Complete the Stripe payment flow; subscription activation remains webhook-controlled."
          );
        } else {
          setSuccessMessage(
            "Stripe payment initialization returned successfully, but no client secret was provided."
          );
        }

      } catch (err) {
        console.error(
          "Payment initialization error:",
          err
        );

        setError(
          getApiErrorMessage(
            err,
            "Payment could not be initialized."
          )
        );
      } finally {
        setProcessing(false);
      }
    };


  /* =======================================================
     CREATE SUBSCRIPTION COMPATIBILITY
  ======================================================= */

  const handleCreateSubscription =
    async () => {
      setProcessing(true);
      setError("");
      setSuccessMessage("");

      try {
        await createSubscription({
          plan:
            selectedPlan,

          billingCycle,

          provider,

          currency:
            "USD",
        });

        await loadBilling({
          refresh: true,
        });

      } catch (err) {
        const status =
          err?.response
            ?.status;

        const code =
          err?.response?.data
            ?.code;

        if (
          status === 409 ||
          code ===
            "PAYMENT_REQUIRED"
        ) {
          setError(
            "Payment is required before the subscription can become active."
          );
        } else {
          setError(
            getApiErrorMessage(
              err,
              "Subscription request failed."
            )
          );
        }
      } finally {
        setProcessing(false);
      }
    };


  /* =======================================================
     UPGRADE
  ======================================================= */

  const handleUpgrade =
    async () => {
      setProcessing(true);
      setError("");
      setSuccessMessage("");

      try {
        await upgradeSubscription({
          plan:
            selectedPlan,

          billingCycle,

          provider,

          currency:
            "USD",
        });

        await loadBilling({
          refresh: true,
        });

        setSuccessMessage(
          "Upgrade request was sent to the backend. The displayed subscription state remains backend-controlled."
        );

      } catch (err) {
        const status =
          err?.response
            ?.status;

        const code =
          err?.response?.data
            ?.code;

        if (
          status === 409 ||
          code ===
            "PAYMENT_REQUIRED"
        ) {
          setError(
            "Payment is required before the upgraded subscription can become active."
          );
        } else {
          setError(
            getApiErrorMessage(
              err,
              "Subscription upgrade failed."
            )
          );
        }
      } finally {
        setProcessing(false);
      }
    };


  /* =======================================================
     CANCEL
  ======================================================= */

  const handleCancel =
    async () => {
      const confirmed =
        window.confirm(
          "Are you sure you want to cancel your subscription?"
        );

      if (!confirmed) {
        return;
      }

      setProcessing(true);
      setError("");
      setSuccessMessage("");

      try {
        await cancelSubscription();

        await loadBilling({
          refresh: true,
        });

        setSuccessMessage(
          "Cancellation request was submitted. The subscription status shown above comes from the backend."
        );

      } catch (err) {
        setError(
          getApiErrorMessage(
            err,
            "Subscription cancellation failed."
          )
        );
      } finally {
        setProcessing(false);
      }
    };


  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh =
    () =>
      loadBilling({
        refresh: true,
      });


  /* =======================================================
     STATUS
  ======================================================= */

  const statusText =
    displayValue(
      billing.status
    );


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <DashboardLayout>
      <main
        className={
          styles.page
        }
      >
        <div
          className={
            styles.container
          }
        >

          {/* HEADER */}

          <header
            className={
              styles.header
            }
          >
            <div
              className={
                styles.headerContent
              }
            >
              <div
                className={
                  styles.eyebrow
                }
              >
                <span
                  className={
                    styles.eyebrowDot
                  }
                />

                ZYRIONOS BILLING
              </div>

              <h1
                className={
                  styles.title
                }
              >
                Billing & Subscription
              </h1>

              <p
                className={
                  styles.subtitle
                }
              >
                Manage your subscription,
                payment provider, usage,
                AI credits and billing
                history through the
                connected ZyrionOS
                backend.
              </p>
            </div>

            <div
              className={
                styles.headerActions
              }
            >
              <button
                type="button"
                className={
                  styles.refreshButton
                }
                onClick={
                  handleRefresh
                }
                disabled={
                  refreshing
                }
              >
                <span
                  className={
                    refreshing
                      ? styles.spin
                      : styles.refreshIcon
                  }
                >
                  ↻
                </span>

                {refreshing
                  ? "Refreshing..."
                  : "Refresh"}
              </button>

              <button
                type="button"
                className={
                  styles.manageButton
                }
                onClick={() =>
                  navigate(
                    "/billing"
                  )
                }
              >
                Billing Overview
                <span>→</span>
              </button>
            </div>
          </header>


          {/* ALERTS */}

          {error && (
            <section
              className={
                styles.alert
              }
              role="alert"
            >
              <div
                className={
                  styles.alertIcon
                }
              >
                !
              </div>

              <div
                className={
                  styles.alertContent
                }
              >
                <strong>
                  Billing action unavailable
                </strong>

                <p>
                  {error}
                </p>
              </div>

              <button
                type="button"
                className={
                  styles.retryButton
                }
                onClick={
                  handleRefresh
                }
              >
                Retry
              </button>
            </section>
          )}


          {successMessage && (
            <section
              className={
                styles.successAlert
              }
              role="status"
            >
              <div
                className={
                  styles.alertIcon
                }
              >
                ✓
              </div>

              <div
                className={
                  styles.alertContent
                }
              >
                <strong>
                  Billing update
                </strong>

                <p>
                  {successMessage}
                </p>
              </div>
            </section>
          )}


          {/* CURRENT SUBSCRIPTION */}

          <section
            className={
              styles.subscriptionCard
            }
          >
            <div
              className={
                styles.subscriptionGlow
              }
            />

            <div
              className={
                styles.subscriptionMain
              }
            >
              <div
                className={
                  styles.subscriptionEyebrow
                }
              >
                CURRENT SUBSCRIPTION
              </div>

              <div
                className={
                  styles.subscriptionTop
                }
              >
                <h2
                  className={
                    styles.planName
                  }
                >
                  {loading
                    ? "Loading..."
                    : displayValue(
                        billing.planName
                      )}
                </h2>

                {!loading &&
                  billing.status && (
                    <span
                      className={
                        styles.statusBadge
                      }
                    >
                      <span />
                      {statusText}
                    </span>
                  )}
              </div>

              <div
                className={
                  styles.priceRow
                }
              >
                <strong
                  className={
                    styles.planPrice
                  }
                >
                  {loading
                    ? "—"
                    : formattedCurrentPrice}
                </strong>

                {!loading &&
                  billing.interval && (
                    <span
                      className={
                        styles.billingInterval
                      }
                    >
                      /{" "}
                      {displayValue(
                        billing.interval
                      )}
                    </span>
                  )}
              </div>

              <p
                className={
                  styles.planDescription
                }
              >
                Subscription state is
                read directly from the
                authenticated backend.
                The frontend does not
                fabricate active billing
                state.
              </p>
            </div>

            <div
              className={
                styles.subscriptionSide
              }
            >
              <div
                className={
                  styles.sideLabel
                }
              >
                BILLING STATUS
              </div>

              <strong>
                {loading
                  ? "—"
                  : statusText}
              </strong>

              {billing.nextBillingDate && (
                <span>
                  Next billing:{" "}
                  {displayValue(
                    billing.nextBillingDate
                  )}
                </span>
              )}
            </div>
          </section>


          {/* PLANS */}

          <section
            className={
              styles.planSection
            }
          >
            <div
              className={
                styles.sectionHeader
              }
            >
              <div>
                <div
                  className={
                    styles.panelEyebrow
                  }
                >
                  PLANS
                </div>

                <h2
                  className={
                    styles.sectionTitle
                  }
                >
                  Choose Your Plan
                </h2>

                <p
                  className={
                    styles.panelSubtitle
                  }
                >
                  Display prices match the
                  configured ZyrionOS
                  catalog. Final payment
                  validation is performed
                  by the backend.
                </p>
              </div>

              <div
                className={
                  styles.billingToggle
                }
              >
                <button
                  type="button"
                  className={
                    billingCycle ===
                    "monthly"
                      ? styles.toggleActive
                      : styles.toggleButton
                  }
                  onClick={() =>
                    setBillingCycle(
                      "monthly"
                    )
                  }
                >
                  Monthly
                </button>

                <button
                  type="button"
                  className={
                    billingCycle ===
                    "yearly"
                      ? styles.toggleActive
                      : styles.toggleButton
                  }
                  onClick={() =>
                    setBillingCycle(
                      "yearly"
                    )
                  }
                >
                  Yearly
                </button>
              </div>
            </div>


            <div
              className={
                styles.planGrid
              }
            >
              {PLANS.map(
                (plan) => {
                  const active =
                    selectedPlan ===
                    plan.name;

                  const current =
                    billing.planName ===
                    plan.name;

                  const price =
                    billingCycle ===
                    "yearly"
                      ? plan.yearly
                      : plan.monthly;

                  return (
                    <button
                      key={
                        plan.name
                      }
                      type="button"
                      className={
                        active
                          ? styles.planCardActive
                          : styles.planCard
                      }
                      onClick={() =>
                        setSelectedPlan(
                          plan.name
                        )
                      }
                    >
                      <div
                        className={
                          styles.planCardTop
                        }
                      >
                        <span>
                          {plan.name}
                        </span>

                        {current && (
                          <span
                            className={
                              styles.currentBadge
                            }
                          >
                            Current
                          </span>
                        )}
                      </div>

                      <strong
                        className={
                          styles.planCardPrice
                        }
                      >
                        {formatMoney(
                          price,
                          "USD"
                        )}
                      </strong>

                      <span
                        className={
                          styles.planCardInterval
                        }
                      >
                        /{" "}
                        {billingCycle}
                      </span>

                      <p
                        className={
                          styles.planCardDescription
                        }
                      >
                        {
                          plan.description
                        }
                      </p>
                    </button>
                  );
                }
              )}
            </div>


            {/* PAYMENT PROVIDER */}

            <div
              className={
                styles.providerSection
              }
            >
              <div>
                <div
                  className={
                    styles.panelEyebrow
                  }
                >
                  PAYMENT PROVIDER
                </div>

                <h3
                  className={
                    styles.providerTitle
                  }
                >
                  Select Payment Provider
                </h3>
              </div>

              <div
                className={
                  styles.providerGrid
                }
              >
                <button
                  type="button"
                  className={
                    provider ===
                    "stripe"
                      ? styles.providerActive
                      : styles.providerButton
                  }
                  onClick={() =>
                    setProvider(
                      "stripe"
                    )
                  }
                >
                  <strong>
                    Stripe
                  </strong>

                  <span>
                    USD payments
                  </span>
                </button>

                <button
                  type="button"
                  className={
                    styles.providerDisabled
                  }
                  disabled
                  title="Razorpay is disabled for the current USD catalog"
                >
                  <strong>
                    Razorpay
                  </strong>

                  <span>
                    INR pricing required
                  </span>
                </button>
              </div>
            </div>


            {/* PAYMENT ACTION */}

            <div
              className={
                styles.planAction
              }
            >
              <div
                className={
                  styles.selectedSummary
                }
              >
                <span
                  className={
                    styles.actionLabel
                  }
                >
                  SELECTED
                </span>

                <strong>
                  {selectedPlan}
                </strong>

                <span>
                  {formatMoney(
                    selectedPrice,
                    "USD"
                  )}
                  {" "}
                  /{" "}
                  {billingCycle}
                </span>
              </div>

              <div
                className={
                  styles.actionButtons
                }
              >
                <button
                  type="button"
                  className={
                    styles.primaryAction
                  }
                  onClick={
                    handleStartPayment
                  }
                  disabled={
                    processing ||
                    provider !==
                      "stripe"
                  }
                >
                  {processing
                    ? "Initializing..."
                    : "Start Stripe Payment"}

                  <span>
                    →
                  </span>
                </button>

                {billing.planName &&
                  selectedPlan !==
                    billing.planName && (
                    <button
                      type="button"
                      className={
                        styles.secondaryAction
                      }
                      onClick={
                        handleUpgrade
                      }
                      disabled={
                        processing
                      }
                    >
                      Request Upgrade
                    </button>
                  )}
              </div>
            </div>
          </section>


          {/* PAYMENT SESSION */}

          {paymentData && (
            <section
              className={
                styles.panel
              }
            >
              <div
                className={
                  styles.panelHeader
                }
              >
                <div>
                  <div
                    className={
                      styles.panelEyebrow
                    }
                  >
                    PAYMENT SESSION
                  </div>

                  <h2
                    className={
                      styles.panelTitle
                    }
                  >
                    Stripe Payment Initialized
                  </h2>

                  <p
                    className={
                      styles.panelSubtitle
                    }
                  >
                    The backend created a
                    real Stripe PaymentIntent.
                    Subscription activation
                    remains provider-webhook
                    controlled.
                  </p>
                </div>

                <div
                  className={
                    styles.creditIcon
                  }
                >
                  $
                </div>
              </div>

              <div
                className={
                  styles.paymentSession
                }
              >
                <div>
                  <span>
                    Plan
                  </span>

                  <strong>
                    {
                      paymentData.plan
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Amount
                  </span>

                  <strong>
                    {formatMoney(
                      paymentData.amount,
                      paymentData.currency
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Provider
                  </span>

                  <strong>
                    Stripe
                  </strong>
                </div>

                <div>
                  <span>
                    Payment Intent
                  </span>

                  <strong>
                    {displayValue(
                      paymentData.paymentIntentId
                    )}
                  </strong>
                </div>
              </div>

              <div
                className={
                  styles.paymentNotice
                }
              >
                Payment activation is
                <strong>
                  {" "}
                  pending webhook
                  confirmation
                </strong>
                .
              </div>
            </section>
          )}


          {/* RESOURCES */}

          <section
            className={
              styles.resourceGrid
            }
            aria-label="Subscription resources"
          >
            {[
              [
                "RAM",
                "RAM",
                billing.infrastructure
                  .ram,
                "Backend-reported workspace memory.",
              ],

              [
                "CPU",
                "CPU",
                billing.infrastructure
                  .cpu,
                "Backend-reported compute capacity.",
              ],

              [
                "STORAGE",
                "DB",
                billing.infrastructure
                  .storage,
                "Backend-reported storage allocation.",
              ],

              [
                "BANDWIDTH",
                "↕",
                billing.infrastructure
                  .bandwidth,
                "Backend-reported network allocation.",
              ],
            ].map(
              ([
                label,
                icon,
                value,
                description,
              ]) => (
                <article
                  key={label}
                  className={
                    styles.resourceCard
                  }
                >
                  <div
                    className={
                      styles.resourceHeader
                    }
                  >
                    <span>
                      {label}
                    </span>

                    <div
                      className={
                        styles.resourceIcon
                      }
                    >
                      {icon}
                    </div>
                  </div>

                  <strong>
                    {loading
                      ? "—"
                      : displayValue(
                          value
                        )}
                  </strong>

                  <span>
                    {description}
                  </span>
                </article>
              )
            )}
          </section>


          {/* PAYMENT + CREDITS */}

          <section
            className={
              styles.detailsGrid
            }
          >

            {/* PAYMENT METHOD */}

            <article
              className={
                styles.panel
              }
            >
              <div
                className={
                  styles.panelHeader
                }
              >
                <div>
                  <div
                    className={
                      styles.panelEyebrow
                    }
                  >
                    PAYMENTS
                  </div>

                  <h2
                    className={
                      styles.panelTitle
                    }
                  >
                    Payment Method
                  </h2>

                  <p
                    className={
                      styles.panelSubtitle
                    }
                  >
                    Payment information
                    returned by the
                    authenticated backend.
                  </p>
                </div>

                <div
                  className={
                    styles.cardIcon
                  }
                >
                  💳
                </div>
              </div>

              {billing.paymentLabel ? (
                <div
                  className={
                    styles.paymentMethod
                  }
                >
                  <div
                    className={
                      styles.paymentMethodIcon
                    }
                  >
                    💳
                  </div>

                  <div
                    className={
                      styles.paymentMethodInfo
                    }
                  >
                    <strong>
                      {
                        billing.paymentLabel
                      }
                    </strong>

                    <span>
                      Payment method on file
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  className={
                    styles.detailEmpty
                  }
                >
                  <strong>
                    No payment method available
                  </strong>

                  <p>
                    The backend has not
                    returned a stored
                    payment method.
                  </p>
                </div>
              )}
            </article>


            {/* AI CREDITS */}

            <article
              className={
                styles.panel
              }
            >
              <div
                className={
                  styles.panelHeader
                }
              >
                <div>
                  <div
                    className={
                      styles.panelEyebrow
                    }
                  >
                    AI USAGE
                  </div>

                  <h2
                    className={
                      styles.panelTitle
                    }
                  >
                    AI Credits
                  </h2>

                  <p
                    className={
                      styles.panelSubtitle
                    }
                  >
                    Live credit values
                    returned by the
                    authenticated payment
                    backend.
                  </p>
                </div>

                <div
                  className={
                    styles.creditIcon
                  }
                >
                  AI
                </div>
              </div>

              <div
                className={
                  styles.creditBody
                }
              >
                {!credits ? (
                  <div
                    className={
                      styles.creditUnavailable
                    }
                  >
                    <strong>
                      Credits unavailable
                    </strong>

                    <p>
                      The credits API did
                      not return credit
                      values for this
                      account.
                    </p>

                    <button
                      type="button"
                      className={
                        styles.creditRetryButton
                      }
                      onClick={
                        handleRefresh
                      }
                      disabled={
                        refreshing
                      }
                    >
                      Refresh Credits
                    </button>
                  </div>
                ) : (
                  <>
                    <div
                      className={
                        styles.creditValues
                      }
                    >
                      <div>
                        <span>
                          Used
                        </span>

                        <strong>
                          {displayValue(
                            credits.used
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Remaining
                        </span>

                        <strong>
                          {displayValue(
                            credits.remaining
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Limit
                        </span>

                        <strong>
                          {credits.unlimited
                            ? "Unlimited"
                            : displayValue(
                                credits.total
                              )}
                        </strong>
                      </div>
                    </div>

                    {creditProgress !==
                      null && (
                      <div
                        className={
                          styles.progressTrack
                        }
                        aria-label={`AI credits used ${Math.round(
                          creditProgress
                        )}%`}
                      >
                        <span
                          className={
                            styles.progressBar
                          }
                          style={{
                            width: `${creditProgress}%`,
                          }}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </article>
          </section>


          {/* BILLING HISTORY */}

          <section
            className={
              styles.panel
            }
          >
            <div
              className={
                styles.panelHeader
              }
            >
              <div>
                <div
                  className={
                    styles.panelEyebrow
                  }
                >
                  TRANSACTIONS
                </div>

                <h2
                  className={
                    styles.panelTitle
                  }
                >
                  Billing History
                </h2>

                <p
                  className={
                    styles.panelSubtitle
                  }
                >
                  Subscription records
                  returned by the
                  authenticated billing
                  backend.
                </p>
              </div>
            </div>

            {billingHistory.length ===
            0 ? (
              <div
                className={
                  styles.detailEmpty
                }
              >
                <strong>
                  No billing records available
                </strong>

                <p>
                  No transaction history
                  has been returned for
                  this account.
                </p>
              </div>
            ) : (
              <div
                className={
                  styles.historyList
                }
              >
                {billingHistory.map(
                  (
                    item,
                    index
                  ) => {
                    const itemPlan =
                      firstValue(
                        item?.planName,
                        item?.plan?.name,
                        typeof item?.plan ===
                          "string"
                          ? item.plan
                          : undefined
                      );

                    const itemAmount =
                      firstValue(
                        item?.amount,
                        item?.price?.amount
                      );

                    const itemCurrency =
                      firstValue(
                        item?.currency,
                        item?.price?.currency
                      ) ||
                      "USD";

                    const itemStatus =
                      firstValue(
                        item?.status,
                        item?.subscriptionStatus
                      );

                    const itemDate =
                      firstValue(
                        item?.createdAt,
                        item?.startDate,
                        item?.date
                      );

                    return (
                      <div
                        key={
                          item?._id ||
                          item?.id ||
                          index
                        }
                        className={
                          styles.historyRow
                        }
                      >
                        <div>
                          <span>
                            Plan
                          </span>

                          <strong>
                            {displayValue(
                              itemPlan
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Amount
                          </span>

                          <strong>
                            {itemAmount !==
                            undefined
                              ? formatMoney(
                                  itemAmount,
                                  itemCurrency
                                )
                              : "—"}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Status
                          </span>

                          <strong>
                            {displayValue(
                              itemStatus
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Date
                          </span>

                          <strong>
                            {displayValue(
                              itemDate
                            )}
                          </strong>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </section>


          {/* SUBSCRIPTION CONTROL */}

          <section
            className={
              styles.controlPanel
            }
          >
            <div
              className={
                styles.controlContent
              }
            >
              <div
                className={
                  styles.controlEyebrow
                }
              >
                SUBSCRIPTION CONTROL
              </div>

              <h2>
                Manage Your Subscription
              </h2>

              <p>
                Subscription actions are
                sent to the authenticated
                backend. Payment confirmation
                and activation remain
                provider-webhook controlled.
              </p>
            </div>

            <div
              className={
                styles.controlActions
              }
            >
              <button
                type="button"
                className={
                  styles.controlButton
                }
                onClick={
                  handleUpgrade
                }
                disabled={
                  processing
                }
              >
                Upgrade
                <span>→</span>
              </button>

              {billing.status ===
                "active" && (
                <button
                  type="button"
                  className={
                    styles.cancelButton
                  }
                  onClick={
                    handleCancel
                  }
                  disabled={
                    processing
                  }
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </section>

        </div>
      </main>
    </DashboardLayout>
  );
}

export default Billing;
