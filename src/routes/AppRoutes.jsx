import { Routes, Route } from "react-router-dom";

import Login from "../pages/auth/Login/Login.jsx";

function AppRoutes() {
  return (
    <Routes>

      <Route
        path="/"
        element={<Login />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

    </Routes>
  );
}

export default AppRoutes;
