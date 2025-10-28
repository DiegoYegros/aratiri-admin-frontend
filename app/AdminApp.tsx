"use client";
import { useEffect, useState, useCallback } from "react";
import { ChannelsDashboard } from "./components/channels/ChannelsDashboard";
import { LoginScreen } from "./components/auth/LoginScreen";
import { Dashboard } from "./components/dashboard/Dashboard";
import { Sidebar } from "./components/layout/Sidebar";
import { PeersDashboard } from "./components/peers/PeersDashboard";
import { WalletDashboard } from "./components/wallet/WalletDashboard";
import { apiCall } from "./lib/api";

const decodeJwt = (token: string): { exp: number } | null => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

export default function AdminApp() {
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const verifyStoredSession = async () => {
      const storedToken = localStorage.getItem("aratiri_accessToken");
      if (!storedToken) {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
        return;
      }

      const decodedToken = decodeJwt(storedToken);
      if (!decodedToken || decodedToken.exp * 1000 <= Date.now()) {
        localStorage.removeItem("aratiri_accessToken");
        localStorage.removeItem("aratiri_refreshToken");
        if (isMounted) {
          setIsCheckingAuth(false);
        }
        return;
      }

      try {
        const currentUser = await apiCall("/auth/me");
        const role = currentUser?.role;
        if (role === "ADMIN" || role === "SUPERADMIN") {
          if (!isMounted) {
            return;
          }
          setToken(storedToken);
          setIsAuthenticated(true);
          setAuthError(null);
        } else {
          localStorage.removeItem("aratiri_accessToken");
          localStorage.removeItem("aratiri_refreshToken");
          if (!isMounted) {
            return;
          }
          setToken(null);
          setIsAuthenticated(false);
          setAuthError("You do not have permission to access the admin dashboard.");
        }
      } catch {
        localStorage.removeItem("aratiri_accessToken");
        localStorage.removeItem("aratiri_refreshToken");
        if (!isMounted) {
          return;
        }
        setToken(null);
        setIsAuthenticated(false);
        setAuthError("Session expired. Please sign in again.");
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    };

    verifyStoredSession();

    const handleForceLogout = () => {
      localStorage.removeItem("aratiri_accessToken");
      localStorage.removeItem("aratiri_refreshToken");
      setToken(null);
      setIsAuthenticated(false);
      setAuthError(null);
      setIsCheckingAuth(false);
    };

    window.addEventListener("force-logout", handleForceLogout);

    return () => {
      isMounted = false;
      window.removeEventListener("force-logout", handleForceLogout);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("aratiri_accessToken");
    localStorage.removeItem("aratiri_refreshToken");
    setToken(null);
    setIsAuthenticated(false);
    setAuthError(null);
  };

  const handleRefresh = useCallback(() => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    setRefreshKey((prevKey) => prevKey + 1);

    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  }, [isRefreshing]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const renderActiveView = () => {
    switch (activeView) {
      case "dashboard":
        return <Dashboard refreshKey={refreshKey} />;
      case "wallet":
        return <WalletDashboard />;
      case "channels":
        return <ChannelsDashboard />;
      case "peers":
        return <PeersDashboard />;
      default:
        return <Dashboard refreshKey={refreshKey} />;
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center font-sans">
        <p className="text-gray-300 text-lg">Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 text-white font-sans flex">
        <Sidebar
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          onLogout={handleLogout}
          activeView={activeView}
          onNavigate={setActiveView}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />
        <div className="flex-1 flex flex-col h-screen overflow-y-auto">
          {renderActiveView()}
        </div>
      </div>
    );
  }

  return (
    <LoginScreen
      setToken={setToken}
      setIsAuthenticated={setIsAuthenticated}
      authError={authError}
      onClearAuthError={() => setAuthError(null)}
    />
  );
}
