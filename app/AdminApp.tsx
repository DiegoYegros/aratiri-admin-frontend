"use client";
import { useEffect, useState, useCallback } from "react";
import { ChannelsDashboard } from "./components/channels/ChannelsDashboard";
import { LoginScreen } from "./components/auth/LoginScreen";
import { Dashboard } from "./components/dashboard/Dashboard";
import { Sidebar } from "./components/layout/Sidebar";
import { PeersDashboard } from "./components/peers/PeersDashboard";

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

  useEffect(() => {
    const storedToken = localStorage.getItem("aratiri_accessToken");
    if (storedToken) {
      const decodedToken = decodeJwt(storedToken);
      if (decodedToken && decodedToken.exp * 1000 > Date.now()) {
        setToken(storedToken);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("aratiri_accessToken");
        localStorage.removeItem("aratiri_refreshToken");
      }
    }

    const handleForceLogout = () => {
      setToken(null);
      setIsAuthenticated(false);
    };

    window.addEventListener("force-logout", handleForceLogout);

    return () => {
      window.removeEventListener("force-logout", handleForceLogout);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("aratiri_accessToken");
    localStorage.removeItem("aratiri_refreshToken");
    setToken(null);
    setIsAuthenticated(false);
  };

  const handleRefresh = useCallback(() => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    setRefreshKey((prevKey) => prevKey + 1);

    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  }, [isRefreshing]);

  const renderActiveView = () => {
    switch (activeView) {
      case "dashboard":
        return <Dashboard refreshKey={refreshKey} />;
      case "channels":
        return <ChannelsDashboard />;
      case "peers":
        return <PeersDashboard />;
      default:
        return <Dashboard refreshKey={refreshKey} />;
    }
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 text-white font-sans flex">
        <Sidebar
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          onLogout={handleLogout}
          activeView={activeView}
          onNavigate={setActiveView}
        />
        <div className="flex-1 flex flex-col">
          {renderActiveView()}
        </div>
      </div>
    );
  }

  return (
    <LoginScreen setToken={setToken} setIsAuthenticated={setIsAuthenticated} />
  );
}