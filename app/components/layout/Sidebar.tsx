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
      className={`bg-gray-800 text-white flex-col hidden sm:flex border-r border-gray-700 h-screen sticky top-0 transition-all duration-300 ${
        isSidebarCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div
        className={`flex items-center p-4 h-16 cursor-pointer border-b border-gray-700 ${
          isSidebarCollapsed ? "justify-center" : "space-x-3"
        }`}
        onClick={onRefresh}
        title={t("common.refresh")}
      >
        <Server
          className={`w-8 h-8 text-yellow-400 ${
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
                    ? "text-white bg-yellow-500/20"
                    : "text-gray-400 hover:bg-gray-700/50"
                }`}
                title={label}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isSidebarCollapsed ? "" : "mr-3"
                  } ${
                    activeView === key ? "text-yellow-400" : ""
                  }`}
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
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={onToggleCollapse}
          className={`flex items-center w-full px-3 py-2 text-gray-400 hover:bg-gray-700/50 rounded-md mb-2 ${
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
          className={`flex items-center w-full px-3 py-2 text-gray-400 hover:bg-gray-700/50 rounded-md ${
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

