"use client";

import {
  LayoutDashboard,
  Link2,
  LogOut,
  Server,
  Settings as SettingsIcon,
  Users,
  Wallet,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useMemo } from "react";
import { useLanguage } from "@/app/lib/language";
import { LanguageSwitcher } from "../ui/LanguageSwitcher";

interface SidebarProps {
  isRefreshing: boolean;
  activeView: string;
  onRefresh: () => void;
  onLogout: () => void;
  onNavigate: (view: string) => void;
  isSidebarCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar = ({
  isRefreshing,
  onRefresh,
  onLogout,
  activeView,
  onNavigate,
  isSidebarCollapsed,
  onToggleCollapse,
}: SidebarProps) => {
  const { t } = useLanguage();

  const navigationItems = useMemo(
    () => [
      {
        key: "dashboard",
        label: t("navigation.dashboard"),
        icon: LayoutDashboard,
      },
      { key: "wallet", label: t("navigation.wallet"), icon: Wallet },
      { key: "channels", label: t("navigation.channels"), icon: Link2 },
      { key: "peers", label: t("navigation.peers"), icon: Users },
      { key: "settings", label: t("navigation.settings"), icon: SettingsIcon },
    ],
    [t]
  );

  return (
    <aside
      className={`bg-panel text-foreground flex-col hidden sm:flex border-r border-panel-edge h-screen sticky top-0 transition-all duration-300 ${
        isSidebarCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div
        className={`flex items-center p-4 h-16 cursor-pointer border-b border-panel-edge ${
          isSidebarCollapsed ? "justify-center" : "space-x-3"
        }`}
        onClick={onRefresh}
        title={t("common.refresh")}
      >
        <Server
          className={`w-8 h-8 text-accent ${
            isRefreshing ? "animate-spin-smooth" : ""
          }`}
        />
        <h1
          className={`text-xl font-bold transition-all ${
            isSidebarCollapsed ? "hidden" : ""
          }`}
        >
          {t("common.appName")}
        </h1>
      </div>
      <nav className="flex-grow p-4">
        <ul>
          {navigationItems.map(({ key, label, icon: Icon }, index) => (
            <li key={key} className={index === 0 ? "" : "mt-2"}>
              <button
                onClick={() => onNavigate(key)}
                className={`flex items-center w-full px-3 py-2 rounded-md ${
                  isSidebarCollapsed ? "justify-center" : ""
                } ${
                  activeView === key
                    ? "text-accent bg-accent-subtle"
                    : "text-muted hover:bg-panel-elevated hover:text-foreground"
                }`}
                title={label}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isSidebarCollapsed ? "" : "mr-3"
                  } ${activeView === key ? "text-accent" : ""}`}
                />
                <span
                  className={`font-semibold ${
                    isSidebarCollapsed ? "hidden" : ""
                  }`}
                >
                  {label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-panel-edge space-y-2">
        <LanguageSwitcher collapsed={isSidebarCollapsed} />
        <button
          onClick={onToggleCollapse}
          className={`flex items-center w-full px-3 py-2 text-muted hover:bg-panel-elevated hover:text-foreground rounded-md ${
            isSidebarCollapsed ? "justify-center" : ""
          }`}
          title={
            isSidebarCollapsed ? t("common.expand") : t("common.collapse")
          }
        >
          {isSidebarCollapsed ? (
            <ChevronsRight className="w-5 h-5" />
          ) : (
            <ChevronsLeft className="w-5 h-5 mr-3" />
          )}
          <span className={isSidebarCollapsed ? "hidden" : ""}>
            {t("common.collapse")}
          </span>
        </button>
        <button
          onClick={onLogout}
          className={`flex items-center w-full px-3 py-2 text-muted hover:bg-panel-elevated hover:text-foreground rounded-md ${
            isSidebarCollapsed ? "justify-center" : ""
          }`}
          title={t("common.logout")}
        >
          <LogOut className={`w-5 h-5 ${isSidebarCollapsed ? "" : "mr-3"}`} />
          <span className={isSidebarCollapsed ? "hidden" : ""}>
            {t("common.logout")}
          </span>
        </button>
      </div>
    </aside>
  );
};
