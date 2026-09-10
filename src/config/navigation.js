/* =========================================================
   ZYRIONOS
   ENTERPRISE NAVIGATION CONFIGURATION

   Responsibility:
   ---------------------------------------------------------
   This file defines application navigation metadata only.

   It MUST NOT contain:
   - JSX
   - API calls
   - business logic
   - authentication logic
   - permissions enforcement
   - styling
   - layout logic

   Backend authorization remains authoritative.
   ========================================================= */

const navigation = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/dashboard",
    icon: "dashboard",
    section: "Overview",
  },

  {
    id: "workspace",
    label: "Workspace",
    path: "/workspace",
    icon: "workspace",
    section: "Build",
  },

  {
    id: "deployments",
    label: "Deployments",
    path: "/deployments",
    icon: "deployment",
    section: "Operate",
  },

  {
    id: "billing",
    label: "Billing",
    path: "/billing",
    icon: "billing",
    section: "Account",
  },

  {
    id: "settings",
    label: "Settings",
    path: "/settings",
    icon: "settings",
    section: "Account",
  },
];

export default navigation;
