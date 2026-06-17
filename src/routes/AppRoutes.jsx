import { Routes, Route } from "react-router-dom";

import Login from "../pages/auth/Login/Login.jsx";
import Register from "../pages/auth/Register/Register.jsx";

import Dashboard from "../pages/dashboard/Dashboard/Dashboard.jsx";
import Workspace from "../pages/workspace/Workspace/Workspace.jsx";

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

    </Routes>
  );
}

export default AppRoutes;
