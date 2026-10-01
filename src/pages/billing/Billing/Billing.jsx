
import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout/DashboardLayout.jsx";
import * as billingService from "../../../services/billingService.js";
import styles from "./Billing.module.css";

const PLANS = [
  { id: "starter", name: "Starter", description: "For getting started" },
  { id: "pro", name: "Pro", description: "For growing workloads" },
  { id: "business", name: "Business", description: "For demanding projects" },
  { id: "scale", name: "Scale", description: "For larger workloads" },
  { id: "enterprise", name: "Enterprise", description: "For enterprise workloads" },
];

const getObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};

const unwrap = (response) => {
  let value = response?.data ?? response;

  // Preserve a direct array response.
  if (Array.isArray(value)) {
    return value;
  }

  // Support APIs returning { data: {...} } or { data: [...] }.
  if (
    value &&
    typeof value === "object" &&
    value.data !== undefined &&
    value.data !== null &&
    typeof value.data === "object"
  ) {
    value = value.data;
  }

  return value && typeof value === "object" ? value : {};
};

const firstValue = (...values) =>
  values.find(
    (value) => value !== undefined && value !== null && value !== ""
  );

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.records)) return value.records;
  if (Array.isArray(value?.history)) return value.history;
  if (Array.isArray(value?.transactions)) return value.transactions;
  return [];
};

const normalizePlan = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

const formatMoney = (amount, currency = "USD") => {
  if (amount === undefined || amount === null || amount === "") {
    return null;
  }

  const number = Number(amount);
  if (!Number.isFinite(number)) return null;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: String(currency || "USD").toUpperCase(),
      maximumFractionDigits: 2,
    }).format(number);
  } catch {
    return `${String(currency || "USD").toUpperCase()} ${number.toFixed(2)}`;
  }
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

const humanize = (value) =>
  String(value || "unknown")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const findPlan = (subscription) =>
  firstValue(
    subscription?.plan,
    subscription?.planName,
    subscription?.activePlan,
    subscription?.subscription?.plan,
    subscription?.subscription?.planName,
    subscription?.subscription?.activePlan
  );

const findStatus = (subscription) =>
  firstValue(
    subscription?.status,
    subscription?.subscriptionStatus,
    subscription?.subscription?.status,
    subscription?.subscription?.subscriptionStatus
  );

const findCatalog = (...sources) => {
  for (const source of sources) {
    const object = getObject(source);

    const candidates = [
      object.plans,
      object.catalog,
      object.planCatalog,
      object.availablePlans,
      object.subscription?.plans,
      object.subscription?.catalog,
      object.subscription?.planCatalog,
      object.data?.plans,
      object.data?.catalog,
      object.data?.planCatalog,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }

      if (candidate && typeof candidate === "object") {
        const entries = Object.entries(candidate).map(([key, value]) => ({
          ...getObject(value),
          id: firstValue(getObject(value).id, key),
        }));

        if (entries.length) return entries;
      }
    }
  }

  return [];
};

const getCatalogPlan = (catalog, planId) =>
  catalog.find((item) => {
    const id = firstValue(
      item?.id,
      item?.key,
      item?.slug,
      item?.name,
      item?.plan
    );

    return normalizePlan(id) === normalizePlan(planId);
  });

const getPlanPrice = (plan, cycle) => {
  if (!plan) return null;

  const prices = getObject(plan.prices);
  const nested = getObject(prices[cycle]);
  const cycleObject = getObject(plan[cycle]);
  const isMonthly = cycle !== "yearly";

  const candidates = isMonthly
    ? [
        prices.monthly,
        plan.monthlyPrice,
        plan.monthly_price,
        plan.monthlyAmount,
        plan.monthly_amount,
        cycleObject.amount,
      ]
    : [
        prices.yearly,
        plan.yearlyPrice,
        plan.yearly_price,
        plan.annualPrice,
        plan.annual_price,
        plan.yearlyAmount,
        plan.yearly_amount,
        cycleObject.amount,
      ];

  const amount = firstValue(
    ...candidates.filter(
      (value) => typeof value === "number" || typeof value === "string"
    ),
    nested.amount
  );

  const currency = firstValue(
    nested.currency,
    cycleObject.currency,
    plan.currency,
    prices.currency,
    "USD"
  );

  if (amount === undefined || amount === null || amount === "") {
    return null;
  }

  if (!Number.isFinite(Number(amount))) return null;

  return { amount: Number(amount), currency };
};

const getResources = (subscription) => {
  const root = getObject(subscription);
  const nested = getObject(root.subscription);
  const plan = getObject(root.activePlan);

  const infrastructure = getObject(
    firstValue(
      root.infrastructure,
      root.resources,
      nested.infrastructure,
      nested.resources,
      plan.infrastructure
    )
  );

  const usage = getObject(firstValue(root.usage, nested.usage));
  const limits = getObject(firstValue(root.limits, nested.limits));

  const definitions = [
    {
      key: "ram",
      label: "RAM",
      unit: "GB",
      aliases: ["ram", "memory", "memoryGb", "ramGb"],
    },
    {
      key: "cpu",
      label: "CPU",
      unit: "vCPU",
      aliases: ["cpu", "vCpu", "vcpu", "cpuCores"],
    },
    {
      key: "storage",
      label: "Storage",
      unit: "GB",
      aliases: ["storage", "storageGb", "disk", "diskGb"],
    },
    {
      key: "bandwidth",
      label: "Bandwidth",
      unit: "",
      aliases: ["bandwidth", "bandwidthGb", "transfer"],
    },
  ];

  return definitions.map((definition) => {
    const find = (object, aliases) => {
      for (const alias of aliases) {
        if (object[alias] !== undefined && object[alias] !== null) {
          return object[alias];
        }
      }
      return undefined;
    };

    const used = find(usage, definition.aliases);
    const total = firstValue(
      find(infrastructure, definition.aliases),
      find(limits, definition.aliases)
    );

    return {
      ...definition,
      used,
      total,
      available: total !== undefined,
    };
  });
};

const getCreditsInfo = (creditsResponse) => {
  const root = getObject(creditsResponse);
  const nested = getObject(root.credits);
  const data = Object.keys(nested).length ? nested : root;

  return {
    balance: firstValue(
      data.balance,
      data.available,
      data.remaining,
      data.remainingCredits,
      data.creditsBalance,
      data.total
    ),
    used: firstValue(data.used, data.consumed, data.usedCredits),
    total: firstValue(data.limit, data.totalCredits, data.monthlyLimit),
    currency: firstValue(data.currency, "credits"),
  };
};

const getHistoryRows = (response) => {
  if (Array.isArray(response)) return response;

  const root = getObject(response);

  const candidates = [
    root.history,
    root.records,
    root.transactions,
    root.items,
    root.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;

    if (candidate && typeof candidate === "object") {
      const nested = [
        candidate.history,
        candidate.records,
        candidate.transactions,
        candidate.items,
      ];

      const rows = nested.find(Array.isArray);
      if (rows) return rows;
    }
  }

  return [];
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.data?.message ||
  error?.message ||
  fallback;

function StatusBadge({ value }) {
  const normalized = String(value || "unknown").toLowerCase();
  let className = styles.statusNeutral;

  if (
    ["active", "paid", "success", "succeeded", "completed"].includes(
      normalized
    )
  ) {
    className = styles.statusSuccess;
  } else if (
    ["pending", "trialing", "processing", "past_due"].includes(normalized)
  ) {
    className = styles.statusWarning;
  } else if (
    ["cancelled", "canceled", "failed", "unpaid", "expired"].includes(
      normalized
    )
  ) {
    className = styles.statusDanger;
  }

  return (
    <span className={`${styles.statusBadge} ${className}`}>
      <span className={styles.statusDot} />
      {humanize(value)}
    </span>
  );
}

function MetricCard({ label, value, detail }) {
  return (
    <article className={styles.metricCard}>
      <span className={styles.metricLabel}>{label}</span>
      <strong className={styles.metricValue}>{value}</strong>
      {detail ? <span className={styles.metricDetail}>{detail}</span> : null}
    </article>
  );
}

export default function Billing() {
  const [subscription, setSubscription] = useState(null);
  const [history, setHistory] = useState([]);
  const [credits, setCredits] = useState(null);
  const [catalog, setCatalog] = useState([]);

  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [billingCycle, setBillingCycle] = useState("monthly");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const [pageError, setPageError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [creditsError, setCreditsError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const loadBilling = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setPageError("");
    setHistoryError("");
    setCreditsError("");

    try {
      const results = await Promise.allSettled([
        billingService.getSubscription(),
        billingService.getBillingHistory(),
        billingService.getCredits(),
      ]);

      if (results[0].status === "fulfilled") {
        const data = unwrap(results[0].value);
        const subscriptionData = getObject(data);

        setSubscription(subscriptionData);
        setCatalog(findCatalog(subscriptionData));

        const currentPlan = findPlan(subscriptionData);

        if (currentPlan) {
          const matchingPlan = PLANS.find(
            (plan) =>
              normalizePlan(plan.id) === normalizePlan(currentPlan)
          );

          if (matchingPlan) setSelectedPlan(matchingPlan.id);
        }

        const currentCycle = firstValue(
          subscriptionData.billingCycle,
          subscriptionData.billing_cycle,
          subscriptionData.interval,
          subscriptionData.subscription?.billingCycle,
          subscriptionData.subscription?.billing_cycle
        );

        if (currentCycle) {
          const normalized = String(currentCycle).toLowerCase();

          setBillingCycle(
            ["year", "yearly", "annual", "annually"].includes(normalized)
              ? "yearly"
              : "monthly"
          );
        }
      } else {
        setSubscription(null);
        setCatalog([]);
        setPageError(
          getErrorMessage(
            results[0].reason,
            "Unable to load subscription details."
          )
        );
      }

      if (results[1].status === "fulfilled") {
        setHistory(getHistoryRows(unwrap(results[1].value)));
      } else {
        setHistory([]);
        setHistoryError(
          getErrorMessage(
            results[1].reason,
            "Billing history is unavailable."
          )
        );
      }

      if (results[2].status === "fulfilled") {
        setCredits(unwrap(results[2].value));
      } else {
        setCredits(null);
        setCreditsError(
          getErrorMessage(
            results[2].reason,
            "Credit information is unavailable."
          )
        );
      }
    } catch (error) {
      setPageError(
        getErrorMessage(error, "Unable to load billing information.")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBilling();
  }, [loadBilling]);

  const currentPlan = findPlan(subscription);
  const currentStatus = findStatus(subscription);
  const isActive = ["active", "trialing"].includes(
    String(currentStatus || "").toLowerCase()
  );

  const selectedPlanDetails = useMemo(
    () => getCatalogPlan(catalog, selectedPlan),
    [catalog, selectedPlan]
  );

  const currentPlanDetails = useMemo(
    () => getCatalogPlan(catalog, currentPlan),
    [catalog, currentPlan]
  );

  const selectedPrice = getPlanPrice(selectedPlanDetails, billingCycle);
  const currentPrice = getPlanPrice(currentPlanDetails, billingCycle);

  const currency = firstValue(
    selectedPrice?.currency,
    subscription?.currency,
    subscription?.subscription?.currency,
    "USD"
  );

  const creditsInfo = getCreditsInfo(credits);

  const nextBillingDate = firstValue(
    subscription?.currentPeriodEnd,
    subscription?.current_period_end,
    subscription?.nextBillingDate,
    subscription?.next_billing_date,
    subscription?.subscription?.currentPeriodEnd,
    subscription?.subscription?.nextBillingDate
  );

  const paymentMethod = firstValue(
    subscription?.paymentMethod,
    subscription?.payment_method,
    subscription?.subscription?.paymentMethod,
    subscription?.subscription?.payment_method
  );

  const handleCheckout = async () => {
    setActionMessage("");
    setActionError("");

    if (!PLANS.some((plan) => plan.id === selectedPlan)) {
      setActionError("Select a valid subscription plan.");
      return;
    }

    setCheckoutLoading(true);

    try {
      const payload = {
        plan: selectedPlan,
        billingCycle,
        provider: "stripe",
        currency: "USD",
      };

      const response = await billingService.createPaymentOrder(payload);
      const result = getObject(unwrap(response));
      const paymentIntent = getObject(result.paymentIntent);

      const checkoutUrl = firstValue(
        result.checkoutUrl,
        result.checkout_url,
        result.redirectUrl,
        result.redirect_url,
        result.url,
        result.sessionUrl,
        result.session_url,
        result.session?.url,
        result.checkoutSession?.url
      );

      if (checkoutUrl) {
        let parsedUrl;

        try {
          parsedUrl = new URL(checkoutUrl, window.location.origin);
        } catch {
          throw new Error(
            "The payment service returned an invalid checkout URL."
          );
        }

        if (!["https:", "http:"].includes(parsedUrl.protocol)) {
          throw new Error(
            "The payment service returned an unsupported checkout URL."
          );
        }

        window.location.assign(parsedUrl.href);
        return;
      }

      const clientSecret = firstValue(
        result.clientSecret,
        result.client_secret,
        paymentIntent.client_secret
      );

      if (clientSecret) {
        setActionError(
          "The backend returned a payment client secret but no hosted checkout URL. " +
            "A payment SDK integration is required. No payment or subscription has been marked successful."
        );
      } else {
        setActionError(
          firstValue(
            result.message,
            result.error,
            "The payment service did not return a checkout URL. Check the backend payment configuration."
          )
        );
      }
    } catch (error) {
      setActionError(
        getErrorMessage(error, "Unable to start secure checkout.")
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionMessage("");
    setActionError("");

    if (!isActive) {
      setActionError("There is no active subscription to cancel.");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to request subscription cancellation?"
      )
    ) {
      return;
    }

    setCancelLoading(true);

    try {
      const response = await billingService.cancelSubscription();
      const result = getObject(unwrap(response));

      setActionMessage(
        firstValue(
          result.message,
          "Cancellation request submitted. Refreshing subscription status."
        )
      );

      await loadBilling(true);
    } catch (error) {
      setActionError(
        getErrorMessage(error, "Unable to cancel the subscription.")
      );
    } finally {
      setCancelLoading(false);
    }
  };

  const handleRefresh = () => loadBilling(true);

  const getHistoryValue = (row, keys) => {
    for (const key of keys) {
      if (
        row?.[key] !== undefined &&
        row?.[key] !== null &&
        row?.[key] !== ""
      ) {
        return row[key];
      }
    }

    return null;
  };

  return (
    <DashboardLayout>
      <main className={styles.page}>
        <header className={styles.pageHeader}>
          <div>
            <div className={styles.eyebrow}>ACCOUNT MANAGEMENT</div>
            <h1 className={styles.pageTitle}>Billing &amp; Usage</h1>
            <p className={styles.pageSubtitle}>
              Manage your subscription, review resource usage, and access billing records.
            </p>
          </div>

          <button
            type="button"
            className={styles.refreshButton}
            onClick={handleRefresh}
            disabled={loading || refreshing}
          >
            <span
              aria-hidden="true"
              className={refreshing ? styles.spinning : ""}
            >
              ↻
            </span>
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </header>

        {pageError && (
          <div className={styles.errorBanner} role="alert">
            <strong>Subscription data unavailable</strong>
            <span>{pageError}</span>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              Retry
            </button>
          </div>
        )}

        {actionMessage && (
          <div className={styles.successBanner} role="status">
            {actionMessage}
          </div>
        )}

        {actionError && (
          <div className={styles.errorBanner} role="alert">
            <strong>Action could not be completed</strong>
            <span>{actionError}</span>
            <button type="button" onClick={() => setActionError("")}>
              Dismiss
            </button>
          </div>
        )}

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <div>
              <h2>Current subscription</h2>
              <p>Your subscription status as reported by the billing service.</p>
            </div>
            {!loading && currentStatus && (
              <StatusBadge value={currentStatus} />
            )}
          </div>

          {loading ? (
            <div className={styles.loadingCard} aria-live="polite">
              <span className={styles.spinner} />
              <span>Loading subscription details…</span>
            </div>
          ) : (
            <div className={styles.subscriptionCard}>
              <div className={styles.subscriptionMain}>
                <div className={styles.planIcon} aria-hidden="true">
                  Z
                </div>
                <div className={styles.subscriptionDetails}>
                  <span className={styles.mutedLabel}>CURRENT PLAN</span>
                  <h3>
                    {currentPlan
                      ? humanize(currentPlan)
                      : "No active plan found"}
                  </h3>
                  <p>
                    {nextBillingDate
                      ? `Next billing date: ${formatDate(nextBillingDate)}`
                      : "Billing date not provided by the backend."}
                  </p>
                </div>
              </div>

              <div className={styles.subscriptionPrice}>
                <span className={styles.mutedLabel}>CONFIGURED PRICE</span>
                <strong>
                  {currentPrice
                    ? formatMoney(currentPrice.amount, currentPrice.currency)
                    : "Not available"}
                </strong>
                <span>
                  {currentPrice
                    ? `per ${billingCycle === "yearly" ? "year" : "month"}`
                    : "Price not returned by the billing catalog"}
                </span>
              </div>

              <div className={styles.subscriptionActions}>
                {currentStatus && <StatusBadge value={currentStatus} />}
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={handleCancel}
                  disabled={!isActive || cancelLoading || loading}
                >
                  {cancelLoading ? "Submitting…" : "Cancel subscription"}
                </button>
              </div>
            </div>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <div>
              <h2>Choose your plan</h2>
              <p>Select a plan and billing period, then review the checkout details.</p>
            </div>

            <div
              className={styles.billingToggle}
              role="group"
              aria-label="Billing period"
            >
              <button
                type="button"
                className={
                  billingCycle === "monthly" ? styles.toggleActive : ""
                }
                onClick={() => setBillingCycle("monthly")}
                aria-pressed={billingCycle === "monthly"}
              >
                Monthly
              </button>
              <button
                type="button"
                className={
                  billingCycle === "yearly" ? styles.toggleActive : ""
                }
                onClick={() => setBillingCycle("yearly")}
                aria-pressed={billingCycle === "yearly"}
              >
                Yearly
              </button>
            </div>
          </div>

          <div className={styles.planGrid}>
            {PLANS.map((plan) => {
              const backendPlan = getCatalogPlan(catalog, plan.id);
              const price = getPlanPrice(backendPlan, billingCycle);
              const isSelected = selectedPlan === plan.id;
              const isCurrent =
                normalizePlan(currentPlan) === normalizePlan(plan.id);

              return (
                <button
                  type="button"
                  key={plan.id}
                  className={`${styles.planCard} ${
                    isSelected ? styles.planSelected : ""
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                  aria-pressed={isSelected}
                >
                  <span className={styles.planCardTop}>
                    <span className={styles.planRadio} aria-hidden="true">
                      {isSelected && <span />}
                    </span>
                    {isCurrent && (
                      <span className={styles.currentPlanTag}>Current</span>
                    )}
                  </span>

                  <span className={styles.planName}>{plan.name}</span>
                  <span className={styles.planDescription}>
                    {firstValue(backendPlan?.description, plan.description)}
                  </span>

                  <span className={styles.planPrice}>
                    {price
                      ? formatMoney(price.amount, price.currency)
                      : "Price unavailable"}
                  </span>
                  <span className={styles.planInterval}>
                    {price
                      ? `per ${billingCycle === "yearly" ? "year" : "month"}`
                      : "Pricing not configured"}
                  </span>

                  <span className={styles.planSelectText}>
                    {isSelected ? "Selected plan" : "Select plan"}
                  </span>
                </button>
              );
            })}
          </div>

          {!catalog.length && (
            <p className={styles.helperText}>
              Plan names are available, but the backend has not returned a
              pricing catalog. Actual prices must come from the configured
              billing catalog; this page will not invent prices.
            </p>
          )}

          <div className={styles.checkoutCard}>
            <div className={styles.checkoutHeading}>
              <div className={styles.checkoutIcon} aria-hidden="true">
                ✓
              </div>
              <div>
                <h3>Review subscription</h3>
                <p>Confirm your selection before continuing to the payment service.</p>
              </div>
            </div>

            <div className={styles.reviewRows}>
              <div>
                <span>Selected plan</span>
                <strong>{humanize(selectedPlan)}</strong>
              </div>
              <div>
                <span>Billing period</span>
                <strong>
                  {billingCycle === "yearly" ? "Yearly" : "Monthly"}
                </strong>
              </div>
              <div>
                <span>Configured price</span>
                <strong>
                  {selectedPrice
                    ? `${formatMoney(selectedPrice.amount, selectedPrice.currency)} / ${
                        billingCycle === "yearly" ? "year" : "month"
                      }`
                    : "Not available"}
                </strong>
              </div>
              <div>
                <span>Payment</span>
                <strong>Secure checkout</strong>
              </div>
            </div>

            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleCheckout}
              disabled={checkoutLoading || loading}
            >
              {checkoutLoading ? (
                <>
                  <span className={styles.buttonSpinner} />
                  Preparing secure checkout…
                </>
              ) : (
                <>
                  <span aria-hidden="true">↗</span>
                  Continue to Secure Checkout
                </>
              )}
            </button>

            <p className={styles.checkoutNote}>
              Payment is processed by the backend-configured provider.
              Subscription status must be confirmed by the server after
              verified payment.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <div>
              <h2>Resource usage</h2>
              <p>Only resource values returned by the backend are displayed.</p>
            </div>
          </div>

          {loading ? (
            <div className={styles.loadingCard}>
              <span className={styles.spinner} />
              <span>Loading resource usage…</span>
            </div>
          ) : (
            <div className={styles.metricGrid}>
              {getResources(subscription || {}).map((resource) => {
                const displayValue = resource.available
                  ? `${resource.total}${resource.unit ? ` ${resource.unit}` : ""}`
                  : "Unavailable";

                const detail =
                  resource.used !== undefined
                    ? `Reported usage: ${resource.used}${
                        resource.unit ? ` ${resource.unit}` : ""
                      }`
                    : "Usage not reported";

                return (
                  <MetricCard
                    key={resource.key}
                    label={resource.label}
                    value={displayValue}
                    detail={detail}
                  />
                );
              })}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <div>
              <h2>AI credits</h2>
              <p>Credit balance and usage reported by the credits API.</p>
            </div>
          </div>

          {creditsError ? (
            <div className={styles.inlineNotice} role="status">
              <strong>Credits unavailable</strong>
              <span>{creditsError}</span>
            </div>
          ) : credits === null && !loading ? (
            <div className={styles.emptyState}>
              No credit information was returned.
            </div>
          ) : loading ? (
            <div className={styles.loadingCard}>
              <span className={styles.spinner} />
              <span>Loading AI credits…</span>
            </div>
          ) : (
            <div className={styles.creditCard}>
              <div>
                <span className={styles.mutedLabel}>AVAILABLE CREDITS</span>
                <strong className={styles.creditValue}>
                  {creditsInfo.balance !== undefined
                    ? Number.isFinite(Number(creditsInfo.balance))
                      ? Number(creditsInfo.balance).toLocaleString("en-US")
                      : String(creditsInfo.balance)
                    : "Not reported"}
                </strong>
              </div>

              <div className={styles.creditMeta}>
                <div>
                  <span>Used</span>
                  <strong>
                    {creditsInfo.used !== undefined
                      ? String(creditsInfo.used)
                      : "Not reported"}
                  </strong>
                </div>
                <div>
                  <span>Limit</span>
                  <strong>
                    {creditsInfo.total !== undefined
                      ? String(creditsInfo.total)
                      : "Not reported"}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <div>
              <h2>Payment method</h2>
              <p>Payment method details available from your subscription record.</p>
            </div>
          </div>

          <div className={styles.paymentMethodCard}>
            <div className={styles.paymentMethodIcon} aria-hidden="true">
              ▤
            </div>
            <div className={styles.paymentMethodDetails}>
              <strong>
                {paymentMethod
                  ? humanize(
                      typeof paymentMethod === "object"
                        ? firstValue(
                            paymentMethod.brand,
                            paymentMethod.type,
                            paymentMethod.provider,
                            "Payment method"
                          )
                        : paymentMethod
                    )
                  : "No payment method reported"}
              </strong>
              <span>
                {paymentMethod && typeof paymentMethod === "object"
                  ? firstValue(
                      paymentMethod.last4
                        ? `Ending in ${paymentMethod.last4}`
                        : null,
                      paymentMethod.email,
                      paymentMethod.status,
                      "Details provided by billing service"
                    )
                  : "Payment method details are not available from the backend."}
              </span>
            </div>
            <span className={styles.secureLabel}>Secure billing</span>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <div>
              <h2>Billing history</h2>
              <p>Invoices and payment records returned by the billing API.</p>
            </div>
          </div>

          {historyError ? (
            <div className={styles.inlineNotice} role="status">
              <strong>Billing history unavailable</strong>
              <span>{historyError}</span>
            </div>
          ) : loading ? (
            <div className={styles.loadingCard}>
              <span className={styles.spinner} />
              <span>Loading billing history…</span>
            </div>
          ) : history.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon} aria-hidden="true">
                ▤
              </div>
              <strong>No billing records available</strong>
              <span>Records will appear here when the billing API returns them.</span>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.historyTable}>
                <thead>
                  <tr>
                    <th>Invoice / Reference</th>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row, index) => {
                    const id = getHistoryValue(row, [
                      "invoiceNumber",
                      "invoice_number",
                      "invoiceId",
                      "invoice_id",
                      "transactionId",
                      "transaction_id",
                      "id",
                      "reference",
                    ]);

                    const date = getHistoryValue(row, [
                      "createdAt",
                      "created_at",
                      "date",
                      "paidAt",
                      "paid_at",
                      "issuedAt",
                    ]);

                    const description = getHistoryValue(row, [
                      "description",
                      "planName",
                      "plan",
                      "product",
                      "type",
                    ]);

                    const amount = getHistoryValue(row, [
                      "amountPaid",
                      "amount_paid",
                      "amount",
                      "total",
                      "totalAmount",
                    ]);

                    const rowCurrency =
                      getHistoryValue(row, ["currency"]) || "USD";

                    const status = getHistoryValue(row, [
                      "status",
                      "paymentStatus",
                      "payment_status",
                    ]);

                    const invoiceUrl = getHistoryValue(row, [
                      "invoiceUrl",
                      "invoice_url",
                      "hostedInvoiceUrl",
                      "hosted_invoice_url",
                    ]);

                    return (
                      <tr key={String(id || `${date || "record"}-${index}`)}>
                        <td>
                          {invoiceUrl ? (
                            <a
                              className={styles.invoiceLink}
                              href={invoiceUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {String(id || "View invoice")}
                            </a>
                          ) : (
                            <span className={styles.referenceText}>
                              {String(id || "—")}
                            </span>
                          )}
                        </td>
                        <td>{formatDate(date)}</td>
                        <td>
                          {description ? humanize(description) : "—"}
                        </td>
                        <td>{formatMoney(amount, rowCurrency) || "—"}</td>
                        <td>
                          {status ? <StatusBadge value={status} /> : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className={styles.pageFooter}>
          Billing details and subscription status are supplied by the ZyrionOS
          backend. Checkout and subscription changes are subject to server-side
          validation.
        </footer>
      </main>
    </DashboardLayout>
  );
}
