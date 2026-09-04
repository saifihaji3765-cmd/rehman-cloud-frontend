import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

import {
  getCurrentUser,
  logout
} from "../services/authService";

/* =========================
   AUTH CONTEXT
========================= */

const AuthContext = createContext(null);

/* =========================
   AUTH PROVIDER
========================= */

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  /* =========================
     INITIAL AUTH CHECK
  ========================= */

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        /*
         * IMPORTANT:
         * Backend HttpOnly cookie is the
         * source of truth.
         */

        const response = await getCurrentUser();

        const currentUser =
          response?.data?.success &&
          response?.data?.user
            ? response.data.user
            : null;

        if (!mounted) {
          return;
        }

        if (currentUser) {
          /*
           * AUTHENTICATED
           */

          setUser(currentUser);
          setAuthenticated(true);

          /*
           * Store profile only.
           * JWT is NEVER stored here.
           */

          localStorage.setItem(
            "zyrions_user",
            JSON.stringify(currentUser)
          );
        } else {
          /*
           * NOT AUTHENTICATED
           */

          setUser(null);
          setAuthenticated(false);

          localStorage.removeItem(
            "zyrions_user"
          );
        }

      } catch (error) {
        if (!mounted) {
          return;
        }

        /*
         * /me failed.
         * Do NOT trust stale localStorage.
         */

        console.error(
          "Authentication check failed:",
          error
        );

        setUser(null);
        setAuthenticated(false);

        localStorage.removeItem(
          "zyrions_user"
        );

      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================
     SIGN OUT
  ========================= */

  async function signOut() {
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

      localStorage.removeItem(
        "zyrions_user"
      );
    }
  }

  /* =========================
     AUTH VALUE
  ========================= */

  const value = {
    user,
    loading,
    authenticated,
    setUser,
    setAuthenticated,
    signOut
  };

  /* =========================
     PROVIDER
  ========================= */

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/* =========================
   USE AUTH
========================= */

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
