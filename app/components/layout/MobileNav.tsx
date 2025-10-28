"use client";

import {
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  Server,
  Settings as SettingsIcon,
  Users,
  Wallet,
  X,
  RefreshCw,
} from "lucide-react";
import { useMemo } from "react";
import { useLanguage } from "@/app/lib/language";

interface MobileNavProps {
  isRefreshing: boolean;
  onRefresh: () => void;
  onLogout: () => void;
  activeView: string;
  onNavigate: (view: string) => void;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
}

const NAV_ITEMS: Array<{
  key: string;
  icon: typeof LayoutDashboard;
}> = [
  { key: "dashboard", icon: LayoutDashboard },
  { key: "wallet", icon: Wallet },
  { key: "channels", icon: Link2 },
  { key: "peers", icon: Users },
  { key: "settings", icon: SettingsIcon },
];

export const MobileNav = ({
  isRefreshing,
  onRefresh,
  onLogout,
  activeView,
  onNavigate,
  isMenuOpen,
  onToggleMenu,
}: MobileNavProps) => {
  const { t } = useLanguage();

  const itemsWithLabels = useMemo(
    () =>
      NAV_ITEMS.map((item) => ({
        ...item,
        label: t(`navigation.${item.key}`),
      })),
    [t]
  );

  const activeLabel = useMemo(() => {
    return (
      itemsWithLabels.find((item) => item.key === activeView)?.label ||
      t("navigation.dashboard")
    );
  }, [activeView, itemsWithLabels, t]);

  return (
    <>
      <header className="sm:hidden fixed inset-x-0 top-0 z-40 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={onToggleMenu}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 bg-gray-800/70 text-gray-200 transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-400/60 focus:ring-offset-2 focus:ring-offset-gray-900"
            aria-label={t("mobileNav.navigation")}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-yellow-400" />
              <span className="text-lg font-semibold">{t("common.appName")}</span>
            </div>
            <span className="text-xs uppercase tracking-wide text-gray-400">
              {activeLabel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 bg-gray-800/70 text-gray-200 transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-400/60 focus:ring-offset-2 focus:ring-offset-gray-900"
              aria-label={t("common.refresh")}
            >
              <RefreshCw
                className={`h-5 w-5 ${
                  isRefreshing ? "animate-spin text-yellow-300" : "text-yellow-400"
                }`}
              />
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 bg-gray-800/70 text-gray-200 transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-400/60 focus:ring-offset-2 focus:ring-offset-gray-900"
              aria-label={t("common.logout")}
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div
        className={`sm:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[80vw] transform border-r border-gray-800 bg-gray-900/98 backdrop-blur-xl shadow-2xl transition-transform duration-300 ease-out ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/80">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10">
                <Server className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-200">
                  {t("mobileNav.navigation")}
                </p>
                <p className="text-xs text-gray-400">
                  {t("mobileNav.subtitle")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleMenu}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-700 bg-gray-800/70 text-gray-300 transition hover:bg-gray-800"
              aria-label={t("mobileNav.navigation")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
            {itemsWithLabels.map(({ key, label, icon: Icon }) => {
              const isActive = activeView === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onNavigate(key)}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-yellow-400/60 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                    isActive
                      ? "border-yellow-400/40 bg-yellow-500/10 text-yellow-200 shadow-lg shadow-yellow-500/10"
                      : "border-gray-800 bg-gray-800/70 text-gray-300 hover:border-gray-700 hover:bg-gray-800"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${isActive ? "text-yellow-300" : "text-gray-400"}`} />
                    <span className="flex-1">{label}</span>
                    {isActive && (
                      <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-semibold text-yellow-200">
                        {t("mobileNav.active")}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="border-t border-gray-800/80 px-4 py-5">
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-500/20"
            >
              <LogOut className="h-4 w-4" />
              {t("mobileNav.signOut")}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div
          className="sm:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur"
          role="presentation"
          onClick={onToggleMenu}
        />
      )}
    </>
  );
};

