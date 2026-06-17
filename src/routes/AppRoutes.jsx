import { Routes, Route } from "react-router-dom";

import Login from "../pages/auth/Login/Login.jsx";
import Register from "../pages/auth/Register/Register.jsx";

import Dashboard from "../pages/dashboard/Dashboard/Dashboard.jsx";
import Workspace from "../pages/workspace/Workspace/Workspace.jsx";
import Deployments from "../pages/deployments/Deployments/Deployments.jsx";
import Billing from "../pages/billing/Billing/Billing.jsx";
import Settings from "../pages/settings/Settings/Settings.jsx";

function AppRoutes() {
  return (
    <Routes>

      {/* AUTH */}

      <Route
        path="/"
        element={<Login />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      {/* APP */}

      <Route
        path="/dashboard"
        element={<Dashboard />}
      />

      <Route
        path="/workspace"
        element={<Workspace />}
      />

      <Route
        path="/deployments"
        element={<Deployments />}
      />

      <Route
        path="/billing"
        element={<Billing />}
      />

      <Route
        path="/settings"
        element={<Settings />}
      />

    </Routes>
  );
}

export default AppRoutes;
