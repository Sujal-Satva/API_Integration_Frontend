import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";

interface AuthContextType {
  connectedAccounts: {
    quickbooksConnectionId: string | null;
    xeroConnectionId: string | null;
    quickbooks: boolean;
    xero: boolean;
  };
  updateConnection: (provider: "xero" | "quickbooks", isConnected: boolean, connectionId?: string | null) => void;
  checkConnectionStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_URL = import.meta.env.VITE_API_URL;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [connectedAccounts, setConnectedAccounts] = useState({
    quickbooks: false,
    xero: false,
    quickbooksConnectionId: null,
    xeroConnectionId: null,
  });

  const checkConnectionStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/connection-status`);
      setConnectedAccounts({
        quickbooks: response.data.data.quickbooksConnected || false,
        xero: response.data.data.xeroConnected || false,
        quickbooksConnectionId: response.data.data.quickbooksConnectionId || null,
        xeroConnectionId: response.data.data.xeroConnectionId || null,
      });
    } catch (err) {
      console.error("Failed to fetch connection status", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const updateConnection = (provider: "xero" | "quickbooks", isConnected: boolean, connectionId?: string | null) => {
    setConnectedAccounts(prev => ({
      ...prev,
      [`${provider}`]: isConnected,
      [`${provider}ConnectionId`]: connectionId ?? null,
    }));
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
    <AuthContext.Provider value={{ 
      connectedAccounts, 
      updateConnection, 
      checkConnectionStatus 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};