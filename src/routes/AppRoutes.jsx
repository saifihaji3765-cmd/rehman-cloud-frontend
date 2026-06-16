import { Routes, Route } from "react-router-dom";

import Login from "../pages/auth/Login/Login.jsx";
import Register from "../pages/auth/Register/Register.jsx";

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

      <Route
        path="/register"
        element={<Register />}
      />

    </Routes>
  );
}

export default AppRoutes;
