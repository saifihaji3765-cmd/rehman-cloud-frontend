import React from "react";
import ReactDOM from "react-dom/client";

import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";

import { AuthProvider } from "./context/AuthContext.jsx";

import "./index.css";


/*
|--------------------------------------------------------------------------
| ZYRIONOS — APPLICATION ENTRY POINT
|--------------------------------------------------------------------------
|
| Runtime architecture:
|
| React
|   ↓
| BrowserRouter
|   ↓
| AuthProvider
|   ↓
| App
|   ↓
| AppRoutes
|
| Responsibilities:
| - Mount the React application.
| - Provide application-wide routing.
| - Provide centralized authentication state.
| - Load the global stylesheet.
|
| Authentication remains controlled by AuthContext.
| Routing remains controlled by AppRoutes.
|
| IMPORTANT:
| - No API calls belong here.
| - No authentication decisions belong here.
| - No page-specific state belongs here.
| - No business logic belongs here.
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| ROOT ELEMENT
|--------------------------------------------------------------------------
*/

const rootElement =
  document.getElementById("root");


/*
|--------------------------------------------------------------------------
| ROOT VALIDATION
|--------------------------------------------------------------------------
|
| React cannot mount without the root element.
| Fail clearly during development rather than
| producing an obscure runtime error.
|--------------------------------------------------------------------------
*/

if (!rootElement) {
  throw new Error(
    "ZyrionOS application root element was not found."
  );
}


/*
|--------------------------------------------------------------------------
| APPLICATION MOUNT
|--------------------------------------------------------------------------
*/

ReactDOM.createRoot(
  rootElement
).render(
  <React.StrictMode>

    <BrowserRouter>

      <AuthProvider>

        <App />

      </AuthProvider>

    </BrowserRouter>

  </React.StrictMode>
);
