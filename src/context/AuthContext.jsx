import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

import {
  getStoredUser,
  getCurrentUser,
  logout
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    async function initializeAuth() {
      try {
        // Server se actual authentication check
        const response = await getCurrentUser();

        if (
          response?.data?.success &&
          response?.data?.user
        ) {
          const currentUser = response.data.user;

          setUser(currentUser);
          setAuthenticated(true);

          // Latest user profile locally save
          localStorage.setItem(
            "zyrions_user",
            JSON.stringify(currentUser)
          );
        } else {
          setUser(null);
          setAuthenticated(false);
        }
      } catch (error) {
        console.error(
          "Auth initialization failed:",
          error
        );

        // Server authentication fail ho to
        // local stale authentication ko valid mat mano.
        setUser(null);
        setAuthenticated(false);
        localStorage.removeItem("zyrions_user");
      } finally {
        setLoading(false);
      }
    }

    initializeAuth();
  }, []);

  async function signOut() {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
      setAuthenticated(false);
      localStorage.removeItem("zyrions_user");
    }
  }

  const value = {
    user,
    loading,
    authenticated,
    setUser,
    setAuthenticated,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}
