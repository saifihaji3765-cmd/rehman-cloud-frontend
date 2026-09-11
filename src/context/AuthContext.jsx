import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getCurrentUser,
  logout,
} from "../services/authService";

/* =========================================================
   AUTH CONTEXT
========================================================= */

const AuthContext = createContext(null);

const USER_STORAGE_KEY = "zyrions_user";

/* =========================================================
   AUTH PROVIDER
========================================================= */

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  /*
   * Protects authentication state from stale
   * initialization requests.
   */
  const authRequestId = useRef(0);

  /*
   * Tracks whether an explicit login/logout action
   * has happened after initialization started.
   */
  const authActionVersion = useRef(0);

  /* =======================================================
     INITIAL AUTH CHECK
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const requestId =
      ++authRequestId.current;

    const actionVersionAtStart =
      authActionVersion.current;

    async function initializeAuth() {
      try {
        /*
         * Backend HttpOnly cookie is the
         * authoritative authentication source.
         */

        const response =
          await getCurrentUser();

        if (!mounted) {
          return;
        }

        /*
         * Ignore stale authentication checks.
         *
         * Example:
         *
         * /me started before login
         * login completed
         * old /me returns afterward
         *
         * That old response must NOT log
         * the newly authenticated user out.
         */

        if (
          requestId !==
          authRequestId.current
        ) {
          return;
        }

        if (
          actionVersionAtStart !==
          authActionVersion.current
        ) {
          return;
        }

        const responseData =
          response?.data;

        const currentUser =
          responseData?.success &&
          responseData?.user
            ? responseData.user
            : null;

        if (currentUser) {
          /*
           * AUTHENTICATED
           */

          setUser(currentUser);
          setAuthenticated(true);

          /*
           * Cache profile information only.
           *
           * No JWT/token is stored.
           */

          try {
            localStorage.setItem(
              USER_STORAGE_KEY,
              JSON.stringify(
                currentUser
              )
            );
          } catch (storageError) {
            console.warn(
              "Unable to cache user profile:",
              storageError
            );
          }

          return;
        }

        /*
         * Backend responded successfully but
         * did not provide an authenticated user.
         */

        setUser(null);
        setAuthenticated(false);

        try {
          localStorage.removeItem(
            USER_STORAGE_KEY
          );
        } catch {
          // Ignore storage errors.
        }
      } catch (error) {
        if (!mounted) {
          return;
        }

        /*
         * Ignore stale requests.
         */

        if (
          requestId !==
          authRequestId.current
        ) {
          return;
        }

        /*
         * If an explicit auth action happened
         * while this request was running, this
         * response is no longer authoritative.
         */

        if (
          actionVersionAtStart !==
          authActionVersion.current
        ) {
          return;
        }

        /*
         * A failed /me check means the current
         * server session could not be verified.
         *
         * Do not trust localStorage as authentication.
         */

        console.error(
          "Authentication check failed:",
          error
        );

        setUser(null);
        setAuthenticated(false);

        try {
          localStorage.removeItem(
            USER_STORAGE_KEY
          );
        } catch {
          // Ignore storage errors.
        }
      } finally {
        if (!mounted) {
          return;
        }

        /*
         * Only the active initialization request
         * can finish the initial loading state.
         */

        if (
          requestId ===
          authRequestId.current
        ) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     AUTHENTICATE AFTER SUCCESSFUL LOGIN
  ======================================================= */

  function establishSession(currentUser) {
    /*
     * Invalidate any older /me request.
     */

    authActionVersion.current += 1;

    authRequestId.current += 1;

    if (!currentUser) {
      setUser(null);
      setAuthenticated(false);
      return;
    }

    setUser(currentUser);
    setAuthenticated(true);

    /*
     * Cache profile only.
     *
     * JWT remains inside backend-controlled
     * HttpOnly cookie.
     */

    try {
      localStorage.setItem(
        USER_STORAGE_KEY,
        JSON.stringify(currentUser)
      );
    } catch (error) {
      console.warn(
        "Unable to cache user profile:",
        error
      );
    }
  }

  /* =======================================================
     SIGN OUT
  ======================================================= */

  async function signOut() {
    /*
     * Invalidate all previous auth checks
     * before making the logout request.
     */

    authActionVersion.current += 1;

    authRequestId.current += 1;

    try {
      await logout();
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );
    } finally {
      setUser(null);
      setAuthenticated(false);

      try {
        localStorage.removeItem(
          USER_STORAGE_KEY
        );
      } catch {
        // Ignore storage errors.
      }
    }
  }

  /* =======================================================
     AUTH VALUE
  ======================================================= */

  const value = {
    user,
    loading,
    authenticated,

    /*
     * Existing compatibility API.
     */

    setUser,
    setAuthenticated,

    /*
     * Preferred API for successful login.
     */

    establishSession,

    /*
     * Logout.
     */

    signOut,
  };

  /* =======================================================
     PROVIDER
  ======================================================= */

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* =========================================================
   USE AUTH
========================================================= */

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}
