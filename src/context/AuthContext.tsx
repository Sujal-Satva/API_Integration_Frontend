import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface AuthContextType {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_URL = import.meta.env.VITE_API_URL;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("qb_access_token");
      const refreshToken = localStorage.getItem("qb_refresh_token");
      const realm = localStorage.getItem("qb_realm_id");

      if (!token || !realm || !refreshToken) {
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/auth/validate-token?realmId=${realm}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          setIsLoggedIn(true);
        } else {
          if (response.status === 401) {
            console.warn("Access token expired, attempting refresh...");
            const refreshResponse = await fetch(
              `${API_URL}/api/auth/refresh?realmId=${realm}`,
              {
                method: "POST",
                credentials: "include",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  refreshToken: refreshToken,
                }),
              }
            );

            if (refreshResponse.ok) {
              const data = await refreshResponse.json();
              localStorage.setItem("qb_access_token", data.accessToken);
              localStorage.setItem("qb_refresh_token", data.refreshToken);
              setIsLoggedIn(true);
            } else {
              console.error("Token refresh failed");
              localStorage.clear();
              setIsLoggedIn(false);
            }
          }
        }z
      } catch (error) {
        console.log(error);
        console.error("Token validation error:", error);
        setIsLoggedIn(false);
      } finally {
        setLoading(false); 
      }
    };

    validateToken();
  }, []);

  const login = () => setIsLoggedIn(true);

  const logout = async () => {
    const token = localStorage.getItem("qb_refresh_token");
    if (!token) {
      setIsLoggedIn(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/revoke-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessToken: token }),
      });

      if (response.ok) {
        localStorage.clear();
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error("Token revocation failed:", error);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "100px",
        }}
      >
        <div className="spinner" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
