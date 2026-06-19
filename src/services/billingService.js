import api from "./api";

/* =========================
CREATE SUBSCRIPTION
========================= */

export async function createSubscription(
  plan
) {

  return api.post(

    "/api/subscription/create",

    { plan }

  );

}

/* =========================
GET SUBSCRIPTION
========================= */

export async function getSubscription() {

  return api.get(

    "/api/subscription/me"

  );

}

/* =========================
UPGRADE PLAN
========================= */

export async function upgradeSubscription(
  plan
) {

  return api.post(

    "/api/subscription/upgrade",

    { plan }

  );

}

/* =========================
CANCEL SUBSCRIPTION
========================= */

export async function cancelSubscription() {

  return api.post(

    "/api/subscription/cancel"

  );

}

/* =========================
USAGE
========================= */

export async function getUsage() {

  return api.get(

    "/api/subscription/usage"

  );

}
