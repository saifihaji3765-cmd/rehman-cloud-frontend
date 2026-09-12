import api from "./api";

/* =========================================================
   ZYRIONOS BILLING SERVICE
   Real frontend → backend billing API layer
========================================================= */

/* =========================================================
   CREATE PAYMENT ORDER
   Backend decides/validates the actual catalog price.
========================================================= */

export async function createPaymentOrder({
  plan,
  billingCycle = "monthly",
  provider,
  currency,
} = {}) {
  return api.post("/api/payment/create-order", {
    plan,
    billingCycle,
    provider,
    currency,
  });
}

/* =========================================================
   VERIFY PAYMENT
   Provider payment verification payload is passed to backend.
   Subscription activation should ultimately be controlled
   by verified provider webhooks.
========================================================= */

export async function verifyPayment(payload = {}) {
  return api.post(
    "/api/payment/verify-payment",
    payload
  );
}

/* =========================================================
   CREATE SUBSCRIPTION PAYMENT
========================================================= */

export async function createBillingSubscription({
  plan,
  billingCycle = "monthly",
  provider,
  currency,
} = {}) {
  return api.post("/api/payment/subscription", {
    plan,
    billingCycle,
    provider,
    currency,
  });
}

/* =========================================================
   GET BILLING HISTORY
========================================================= */

export async function getBillingHistory() {
  return api.get(
    "/api/payment/billing-history"
  );
}

/* =========================================================
   GET CREDITS / USAGE BALANCE
========================================================= */

export async function getCredits() {
  return api.get(
    "/api/payment/credits"
  );
}

/* =========================================================
   GET CURRENT SUBSCRIPTION
========================================================= */

export async function getSubscription() {
  return api.get(
    "/api/subscription/me"
  );
}

/* =========================================================
   CREATE / START SUBSCRIPTION
========================================================= */

export async function createSubscription({
  plan,
  billingCycle = "monthly",
  provider,
  currency,
} = {}) {
  return api.post(
    "/api/subscription/create",
    {
      plan,
      billingCycle,
      provider,
      currency,
    }
  );
}

/* =========================================================
   UPGRADE SUBSCRIPTION
========================================================= */

export async function upgradeSubscription({
  plan,
  billingCycle = "monthly",
  provider,
  currency,
} = {}) {
  return api.post(
    "/api/subscription/upgrade",
    {
      plan,
      billingCycle,
      provider,
      currency,
    }
  );
}

/* =========================================================
   CANCEL SUBSCRIPTION
========================================================= */

export async function cancelSubscription() {
  return api.post(
    "/api/subscription/cancel"
  );
}

/* =========================================================
   SUBSCRIPTION USAGE
========================================================= */

export async function getUsage() {
  return api.get(
    "/api/subscription/usage"
  );
}
