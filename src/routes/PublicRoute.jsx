import {
  Navigate,
  useLocation
} from "react-router-dom";

import {
  useAuth
} from "../context/AuthContext";


/*
|--------------------------------------------------------------------------
| ZYRIONOS — PUBLIC ROUTE
|--------------------------------------------------------------------------
|
| Purpose:
| Control routes intended for unauthenticated users.
|
| Typical public routes:
| - /
| - /login
| - /register
|
| Authentication architecture:
|
| Backend Session
|       ↓
| AuthContext
|       ↓
| PublicRoute
|       ↓
| Public Page
|
| Responsibilities:
| - Wait for authentication initialization.
| - Prevent premature redirects.
| - Redirect authenticated users away from auth pages.
| - Render public pages for unauthenticated users.
|
| IMPORTANT:
| - HttpOnly cookie remains the authentication mechanism.
| - localStorage is NOT used as an authentication source.
| - JWT/token is NOT read or stored here.
| - Backend authentication remains authoritative.
| - This route is a UX/navigation boundary, not a security boundary.
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| DEFAULT AUTHENTICATED DESTINATION
|--------------------------------------------------------------------------
|
| Primary authenticated application destination according
| to the current routing architecture.
|--------------------------------------------------------------------------
*/

const AUTHENTICATED_REDIRECT =
  "/dashboard";


/*
|--------------------------------------------------------------------------
| LOADING STATE
|--------------------------------------------------------------------------
|
| Authentication state is unknown until AuthContext completes
| its server-side session check.
|
| Do not redirect while loading.
|--------------------------------------------------------------------------
*/

function AuthenticationLoading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      role="status"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px"
      }}
    >
      <p>
        Checking your session...
      </p>
    </main>
  );
}


/*
|--------------------------------------------------------------------------
| PUBLIC ROUTE
|--------------------------------------------------------------------------
*/

function PublicRoute({
  children
}) {
  const {
    authenticated,
    loading
  } = useAuth();

  const location =
    useLocation();


  /*
  |--------------------------------------------------------------------------
  | AUTH INITIALIZATION
  |--------------------------------------------------------------------------
  |
  | AuthContext performs the real backend session check.
  |
  | Until that check finishes, neither:
  |
  | - authenticated
  | - unauthenticated
  |
  | should be treated as final.
  |
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <AuthenticationLoading />
    );
  }


  /*
  |--------------------------------------------------------------------------
  | AUTHENTICATED USER
  |--------------------------------------------------------------------------
  |
  | Login/Register pages are not needed once the user has
  | an authenticated session.
  |
  | Redirect to the primary authenticated application.
  |--------------------------------------------------------------------------
  */

  if (authenticated) {
    return (
      <Navigate
        to={AUTHENTICATED_REDIRECT}
        replace
        state={{
          from: location
        }}
      />
    );
  }


  /*
  |--------------------------------------------------------------------------
  | UNAUTHENTICATED USER
  |--------------------------------------------------------------------------
  |
  | Authentication has been checked and no valid session
  | exists.
  |
  | Public page can now render normally.
  |--------------------------------------------------------------------------
  */

  return children;
}


export default PublicRoute;
