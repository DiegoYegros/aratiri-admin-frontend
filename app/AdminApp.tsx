"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChannelsDashboard } from "./components/channels/ChannelsDashboard";
import { LoginScreen } from "./components/auth/LoginScreen";
import { Dashboard } from "./components/dashboard/Dashboard";
import { Sidebar } from "./components/layout/Sidebar";
import { MobileNav } from "./components/layout/MobileNav";
import { PeersDashboard } from "./components/peers/PeersDashboard";
import { WalletDashboard } from "./components/wallet/WalletDashboard";
import { apiCall } from "./lib/api";
import { LanguageProvider, useLanguage } from "./lib/language";
import { SettingsView } from "./components/settings/SettingsView";

type ViewKey = "dashboard" | "wallet" | "channels" | "peers" | "settings";

type StoredAuthErrorKey =
  | "auth.errors.noPermission"
  | "auth.errors.sessionExpired"
  | null;

const decodeJwt = (token: string): { exp: number } | null => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

const AdminAppContent = () => {
  const { t } = useLanguage();
  const [, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeView, setActiveView] = useState<ViewKey>("dashboard");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [authErrorKey, setAuthErrorKey] = useState<StoredAuthErrorKey>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          setAuthErrorKey(null);
        } else {
          localStorage.removeItem("aratiri_accessToken");
          localStorage.removeItem("aratiri_refreshToken");
          if (!isMounted) {
            return;
          }
          setToken(null);
          setIsAuthenticated(false);
          setAuthErrorKey("auth.errors.noPermission");
        }
      } catch {
        localStorage.removeItem("aratiri_accessToken");
        localStorage.removeItem("aratiri_refreshToken");
        if (!isMounted) {
          return;
        }
        setToken(null);
        setIsAuthenticated(false);
        setAuthErrorKey("auth.errors.sessionExpired");
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
      setAuthErrorKey(null);
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
    setAuthErrorKey(null);
    setIsMobileMenuOpen(false);
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
    setIsSidebarCollapsed((prev) => !prev);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const handleMobileNavigate = (view: ViewKey) => {
    setActiveView(view);
    setIsMobileMenuOpen(false);
  };

  const activeViewContent = useMemo(() => {
    switch (activeView) {
      case "dashboard":
        return <Dashboard refreshKey={refreshKey} />;
      case "wallet":
        return <WalletDashboard />;
      case "channels":
        return <ChannelsDashboard />;
      case "peers":
        return <PeersDashboard />;
      case "settings":
        return <SettingsView />;
      default:
        return <Dashboard refreshKey={refreshKey} />;
    }
  }, [activeView, refreshKey]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center font-sans">
        <p className="text-gray-300 text-lg">{t("admin.loading")}</p>
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
          onNavigate={(view) => {
            setActiveView(view as ViewKey);
            setIsMobileMenuOpen(false);
          }}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <MobileNav
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
            onLogout={handleLogout}
            activeView={activeView}
            onNavigate={handleMobileNavigate}
            isMenuOpen={isMobileMenuOpen}
            onToggleMenu={toggleMobileMenu}
          />
          <div className="flex-1 overflow-y-auto pt-[4.5rem] sm:pt-0">
            {activeViewContent}
          </div>
        </div>
      </div>
    );
  }

  const authErrorMessage = authErrorKey ? t(authErrorKey) : null;

  return (
    <LoginScreen
      setToken={setToken}
      setIsAuthenticated={setIsAuthenticated}
      authError={authErrorMessage}
      onClearAuthError={() => setAuthErrorKey(null)}
    />
  );
};

const AdminApp = () => {
  return (
    <LanguageProvider>
      <AdminAppContent />
    </LanguageProvider>
  );
};

export default AdminApp;

