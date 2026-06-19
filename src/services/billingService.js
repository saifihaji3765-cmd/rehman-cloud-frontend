import api from "./api";

/* =========================
GET BILLING
========================= */

export async function getBilling() {

  return api.get(

    "/api/billing"

  );

}

/* =========================
GET INVOICES
========================= */

export async function getInvoices() {

  return api.get(

    "/api/billing/invoices"

  );

}

/* =========================
GET SUBSCRIPTION
========================= */

export async function getSubscription() {

  return api.get(

    "/api/subscription"

  );

}

/* =========================
UPGRADE PLAN
========================= */

export async function upgradePlan(
  plan
) {

  return api.post(

    "/api/subscription/upgrade",

    { plan }

  );

}
