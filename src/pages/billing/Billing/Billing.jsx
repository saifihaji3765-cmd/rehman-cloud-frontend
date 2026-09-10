import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../../layouts/DashboardLayout/DashboardLayout.jsx";

import { getSubscription } from "../../../services/billingService";

import styles from "./Billing.module.css";

/* =========================================================
   RESPONSE NORMALIZATION
   ========================================================= */

function normalizeSubscription(response) {
  const payload = response?.data;

  if (!payload) {
    return null;
  }

  if (Array.isArray(payload)) {
    return payload[0] || null;
  }

  if (payload?.subscription) {
    return payload.subscription;
  }

  if (payload?.data?.subscription) {
    return payload.data.subscription;
  }

  if (payload?.data && !Array.isArray(payload.data)) {
    return payload.data;
  }

  return payload;
}

/* =========================================================
   SAFE VALUE HELPERS
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

function normalizePlanName(subscription) {
  return firstValue(
    subscription?.planName,
    subscription?.plan?.name,
    subscription?.plan,
    subscription?.productName,
    subscription?.product?.name
  );
}

function normalizeCurrency(subscription) {
  return firstValue(
    subscription?.currency,
    subscription?.plan?.currency,
    subscription?.price?.currency
  );
}

function normalizePrice(subscription) {
  return firstValue(
    subscription?.monthlyPrice,
    subscription?.price?.monthly,
    subscription?.price?.amountMonthly,
    subscription?.price?.amount
  );
}

function normalizeBillingInterval(subscription) {
  return firstValue(
    subscription?.billingInterval,
    subscription?.interval,
    subscription?.price?.interval
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
      subscription?.ram
    ),

    cpu: firstValue(
      infrastructure?.cpu,
      infrastructure?.vCpu,
      infrastructure?.vcpu,
      subscription?.cpu
    ),

    storage: firstValue(
      infrastructure?.storage,
      subscription?.storage
    ),

    bandwidth: firstValue(
      infrastructure?.bandwidth,
      subscription?.bandwidth
    ),
  };
}

function normalizeCredits(subscription) {
  const credits =
    subscription?.credits ||
    subscription?.usage?.credits ||
    subscription?.aiCredits ||
    null;

  if (!credits) {
    return {
      used: null,
      limit: null,
      remaining: null,
    };
  }

  return {
    used: firstValue(
      credits?.used,
      credits?.consumed
    ),

    limit: firstValue(
      credits?.limit,
      credits?.included,
      credits?.total
    ),

    remaining: firstValue(
      credits?.remaining,
      credits?.available
    ),
  };
}

function normalizeManageUrl(subscription) {
  return firstValue(
    subscription?.manageUrl,
    subscription?.billingPortalUrl,
    subscription?.portalUrl,
    subscription?.customerPortalUrl
  );
}

function normalizePaymentLabel(paymentMethod) {
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
    return `${String(brand)} •••• ${last4}`;
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
   COMPONENT
   ========================================================= */

function Billing() {
  const navigate = useNavigate();

  const [subscription, setSubscription] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =======================================================
     LOAD SUBSCRIPTION
     ======================================================= */

  const loadBilling = useCallback(
    async ({ refresh = false } = {}) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response =
          await getSubscription();

        const normalized =
          normalizeSubscription(response);

        setSubscription(normalized);
      } catch (err) {
        console.error(
          "Billing loading error:",
          err
        );

        setSubscription(null);

        setError(
          "Billing information could not be loaded from your workspace."
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
     REAL BILLING DATA
     ======================================================= */

  const billing = useMemo(() => {
    const infrastructure =
      normalizeInfrastructure(
        subscription
      );

    const credits =
      normalizeCredits(subscription);

    const paymentMethod =
      normalizePaymentMethod(
        subscription
      );

    return {
      planName:
        normalizePlanName(subscription),

      currency:
        normalizeCurrency(subscription),

      price:
        normalizePrice(subscription),

      interval:
        normalizeBillingInterval(
          subscription
        ),

      status:
        normalizeStatus(subscription),

      infrastructure,

      credits,

      paymentMethod,

      paymentLabel:
        normalizePaymentLabel(
          paymentMethod
        ),

      manageUrl:
        normalizeManageUrl(
          subscription
        ),

      nextBillingDate:
        firstValue(
          subscription?.nextBillingDate,
          subscription?.currentPeriodEnd,
          subscription?.billing?.nextBillingDate
        ),
    };
  }, [subscription]);

  /* =======================================================
     PRICE FORMATTER
     ======================================================= */

  const formattedPrice = useMemo(() => {
    if (
      billing.price === undefined ||
      billing.price === null ||
      billing.price === ""
    ) {
      return "—";
    }

    const numericPrice =
      Number(billing.price);

    if (!Number.isFinite(numericPrice)) {
      return displayValue(
        billing.price
      );
    }

    const currency =
      billing.currency ||
      "";

    try {
      return new Intl.NumberFormat(
        undefined,
        {
          style: currency
            ? "currency"
            : "decimal",

          currency:
            currency || undefined,

          maximumFractionDigits: 2,
        }
      ).format(numericPrice);
    } catch {
      return `${currency} ${numericPrice}`.trim();
    }
  }, [
    billing.price,
    billing.currency,
  ]);

  /* =======================================================
     CREDIT DISPLAY
     ======================================================= */

  const creditProgress = useMemo(() => {
    const used = Number(
      billing.credits.used
    );

    const limit = Number(
      billing.credits.limit
    );

    if (
      !Number.isFinite(used) ||
      !Number.isFinite(limit) ||
      limit <= 0
    ) {
      return null;
    }

    return Math.min(
      100,
      Math.max(
        0,
        (used / limit) * 100
      )
    );
  }, [
    billing.credits.used,
    billing.credits.limit,
  ]);

  /* =======================================================
     ACTIONS
     ======================================================= */

  const handleRefresh = () => {
    loadBilling({
      refresh: true,
    });
  };

  const handleManageSubscription = () => {
    /*
     * Only open a billing portal URL if the
     * authenticated backend actually returned one.
     */
    if (billing.manageUrl) {
      window.location.assign(
        billing.manageUrl
      );

      return;
    }

    /*
     * No invented payment endpoint.
     * Keep the user inside the billing page
     * when the backend has not supplied a
     * management URL.
     */
    navigate("/billing");
  };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <DashboardLayout>
      <main className={styles.page}>
        <div className={styles.container}>

          {/* =================================================
              HEADER
          ================================================= */}

          <header className={styles.header}>
            <div className={styles.headerContent}>

              <div className={styles.eyebrow}>
                <span
                  className={styles.eyebrowDot}
                  aria-hidden="true"
                />

                ZYRIONOS BILLING
              </div>

              <h1 className={styles.title}>
                Billing & Subscription
              </h1>

              <p className={styles.subtitle}>
                Manage your subscription, usage,
                payment method and billing resources
                from one secure workspace.
              </p>

            </div>

            <div className={styles.headerActions}>

              <button
                type="button"
                className={styles.refreshButton}
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <span
                  className={
                    refreshing
                      ? styles.spin
                      : styles.refreshIcon
                  }
                  aria-hidden="true"
                >
                  ↻
                </span>

                {refreshing
                  ? "Refreshing..."
                  : "Refresh"}
              </button>

              <button
                type="button"
                className={styles.manageButton}
                onClick={
                  handleManageSubscription
                }
              >
                Manage Subscription
                <span aria-hidden="true">
                  →
                </span>
              </button>

            </div>
          </header>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <section
              className={styles.alert}
              role="alert"
            >
              <div
                className={styles.alertIcon}
                aria-hidden="true"
              >
                !
              </div>

              <div className={styles.alertContent}>
                <strong>
                  Billing data unavailable
                </strong>

                <p>
                  {error}
                </p>
              </div>

              <button
                type="button"
                className={styles.retryButton}
                onClick={handleRefresh}
                disabled={refreshing}
              >
                Retry
              </button>
            </section>
          )}

          {/* =================================================
              SUBSCRIPTION HERO
          ================================================= */}

          <section className={styles.subscriptionCard}>

            <div className={styles.subscriptionGlow} />

            <div className={styles.subscriptionMain}>

              <div className={styles.subscriptionEyebrow}>
                CURRENT SUBSCRIPTION
              </div>

              <div className={styles.subscriptionTop}>

                <h2 className={styles.planName}>
                  {loading || error
                    ? "—"
                    : displayValue(
                        billing.planName
                      )}
                </h2>

                {!loading &&
                  !error &&
                  billing.status && (
                    <span
                      className={
                        styles.statusBadge
                      }
                    >
                      <span />
                      {displayValue(
                        billing.status
                      )}
                    </span>
                  )}

              </div>

              <div className={styles.priceRow}>

                <strong
                  className={styles.planPrice}
                >
                  {loading || error
                    ? "—"
                    : formattedPrice}
                </strong>

                {!loading &&
                  !error &&
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

              <p className={styles.planDescription}>
                Your subscription and resource
                configuration are controlled by
                the authenticated billing system.
              </p>

            </div>

            <div className={styles.subscriptionSide}>

              <div className={styles.sideLabel}>
                BILLING STATUS
              </div>

              <strong>
                {loading || error
                  ? "—"
                  : displayValue(
                      billing.status
                    )}
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

          {/* =================================================
              RESOURCE CARDS
          ================================================= */}

          <section
            className={styles.resourceGrid}
            aria-label="Subscription resources"
          >

            <article className={styles.resourceCard}>
              <div className={styles.resourceHeader}>
                <span>RAM</span>

                <div
                  className={styles.resourceIcon}
                  aria-hidden="true"
                >
                  RAM
                </div>
              </div>

              <strong>
                {loading || error
                  ? "—"
                  : displayValue(
                      billing.infrastructure.ram
                    )}
              </strong>

              <span>
                Allocated workspace memory
              </span>
            </article>

            <article className={styles.resourceCard}>
              <div className={styles.resourceHeader}>
                <span>CPU</span>

                <div
                  className={styles.resourceIcon}
                  aria-hidden="true"
                >
                  CPU
                </div>
              </div>

              <strong>
                {loading || error
                  ? "—"
                  : displayValue(
                      billing.infrastructure.cpu
                    )}
              </strong>

              <span>
                Allocated compute capacity
              </span>
            </article>

            <article className={styles.resourceCard}>
              <div className={styles.resourceHeader}>
                <span>STORAGE</span>

                <div
                  className={styles.resourceIcon}
                  aria-hidden="true"
                >
                  DB
                </div>
              </div>

              <strong>
                {loading || error
                  ? "—"
                  : displayValue(
                      billing.infrastructure.storage
                    )}
              </strong>

              <span>
                Workspace storage allocation
              </span>
            </article>

            <article className={styles.resourceCard}>
              <div className={styles.resourceHeader}>
                <span>BANDWIDTH</span>

                <div
                  className={styles.resourceIcon}
                  aria-hidden="true"
                >
                  ↕
                </div>
              </div>

              <strong>
                {loading || error
                  ? "—"
                  : displayValue(
                      billing.infrastructure.bandwidth
                    )}
              </strong>

              <span>
                Network allocation
              </span>
            </article>

          </section>

          {/* =================================================
              BILLING DETAILS
          ================================================= */}

          <section className={styles.detailsGrid}>

            {/* PAYMENT METHOD */}

            <article className={styles.panel}>

              <div className={styles.panelHeader}>
                <div>
                  <div className={styles.panelEyebrow}>
                    PAYMENTS
                  </div>

                  <h2 className={styles.panelTitle}>
                    Payment Method
                  </h2>

                  <p className={styles.panelSubtitle}>
                    Secure payment information
                    returned by your billing provider.
                  </p>
                </div>

                <div
                  className={styles.cardIcon}
                  aria-hidden="true"
                >
                  💳
                </div>
              </div>

              <div className={styles.paymentBody}>

                {loading ? (
                  <div className={styles.detailLoading}>
                    Loading payment information...
                  </div>
                ) : billing.paymentLabel ? (
                  <div className={styles.paymentMethod}>

                    <div
                      className={
                        styles.paymentMethodIcon
                      }
                      aria-hidden="true"
                    >
                      💳
                    </div>

                    <div
                      className={
                        styles.paymentMethodInfo
                      }
                    >
                      <strong>
                        {billing.paymentLabel}
                      </strong>

                      <span>
                        Payment method
                      </span>
                    </div>

                  </div>
                ) : (
                  <div className={styles.detailEmpty}>

                    <div
                      className={
                        styles.emptySmallIcon
                      }
                      aria-hidden="true"
                    >
                      💳
                    </div>

                    <strong>
                      No payment method available
                    </strong>

                    <p>
                      Your billing provider has not
                      returned a payment method for
                      this subscription.
                    </p>

                  </div>
                )}

              </div>

            </article>

            {/* AI CREDITS */}

            <article className={styles.panel}>

              <div className={styles.panelHeader}>
                <div>
                  <div className={styles.panelEyebrow}>
                    AI USAGE
                  </div>

                  <h2 className={styles.panelTitle}>
                    AI Credits
                  </h2>

                  <p className={styles.panelSubtitle}>
                    Usage information supplied by
                    your subscription system.
                  </p>
                </div>

                <div
                  className={styles.creditIcon}
                  aria-hidden="true"
                >
                  AI
                </div>
              </div>

              <div className={styles.creditBody}>

                <div className={styles.creditValues}>

                  <div>
                    <span>
                      Used
                    </span>

                    <strong>
                      {loading || error
                        ? "—"
                        : displayValue(
                            billing.credits.used
                          )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Remaining
                    </span>

                    <strong>
                      {loading || error
                        ? "—"
                        : displayValue(
                            billing.credits.remaining
                          )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Limit
                    </span>

                    <strong>
                      {loading || error
                        ? "—"
                        : displayValue(
                            billing.credits.limit
                          )}
                    </strong>
                  </div>

                </div>

                {creditProgress !== null && (
                  <div
                    className={
                      styles.progressTrack
                    }
                    aria-label={`AI credit usage ${Math.round(
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

              </div>

            </article>

          </section>

          {/* =================================================
              BILLING CONTROL
          ================================================= */}

          <section className={styles.controlPanel}>

            <div className={styles.controlContent}>

              <div className={styles.controlEyebrow}>
                ZYRIONOS BILLING CONTROL
              </div>

              <h2>
                Build Your Future
              </h2>

              <p>
                Your plan, resources and payment
                configuration are managed through
                the authenticated billing system.
                ZyrionOS never fabricates billing
                information in the interface.
              </p>

            </div>

            <button
              type="button"
              className={styles.controlButton}
              onClick={
                handleManageSubscription
              }
            >
              Manage Subscription
              <span aria-hidden="true">
                →
              </span>
            </button>

          </section>

        </div>
      </main>
    </DashboardLayout>
  );
}

export default Billing;
