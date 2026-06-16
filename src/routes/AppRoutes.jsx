import { Routes, Route } from "react-router-dom";

function AppRoutes() {
  return (
    <Routes>

      <Route
        path="/"
        element={
          <h1>
            Rehman Cloud Frontend V2
          </h1>
        }
      />

    </Routes>
  );
}

export default AppRoutes;
