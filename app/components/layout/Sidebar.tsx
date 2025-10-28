"use client";

import {
  LayoutDashboard,
  Link2,
  LogOut,
  Server,
  Users,
  Wallet,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

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
          Aratiri Admin
        </h1>
      </div>
      <nav className="flex-grow p-4">
        <ul>
          <li>
            <button
              onClick={() => onNavigate("dashboard")}
              className={`flex items-center w-full px-3 py-2 rounded-md ${
                isSidebarCollapsed ? "justify-center" : ""
              } ${
                activeView === "dashboard"
                  ? "text-white bg-yellow-500/20"
                  : "text-gray-400 hover:bg-gray-700/50"
              }`}
              title="Dashboard"
            >
              <LayoutDashboard
                className={`w-5 h-5 ${
                  isSidebarCollapsed ? "" : "mr-3"
                } ${
                  activeView === "dashboard" ? "text-yellow-400" : ""
                }`}
              />
              <span
                className={`font-semibold ${
                  isSidebarCollapsed ? "hidden" : ""
                }`}
              >
                Dashboard
              </span>
            </button>
          </li>
          <li className="mt-2">
            <button
              onClick={() => onNavigate("wallet")}
              className={`flex items-center w-full px-3 py-2 rounded-md ${
                isSidebarCollapsed ? "justify-center" : ""
              } ${
                activeView === "wallet"
                  ? "text-white bg-yellow-500/20"
                  : "text-gray-400 hover:bg-gray-700/50"
              }`}
              title="Wallet"
            >
              <Wallet
                className={`w-5 h-5 ${
                  isSidebarCollapsed ? "" : "mr-3"
                } ${
                  activeView === "wallet" ? "text-yellow-400" : ""
                }`}
              />
              <span className={isSidebarCollapsed ? "hidden" : ""}>Wallet</span>
            </button>
          </li>
          <li className="mt-2">
            <button
              onClick={() => onNavigate("channels")}
              className={`flex items-center w-full px-3 py-2 rounded-md ${
                isSidebarCollapsed ? "justify-center" : ""
              } ${
                activeView === "channels"
                  ? "text-white bg-yellow-500/20"
                  : "text-gray-400 hover:bg-gray-700/50"
              }`}
              title="Channels"
            >
              <Link2
                className={`w-5 h-5 ${
                  isSidebarCollapsed ? "" : "mr-3"
                } ${
                  activeView === "channels" ? "text-yellow-400" : ""
                }`}
              />
              <span className={isSidebarCollapsed ? "hidden" : ""}>
                Channels
              </span>
            </button>
          </li>
          <li className="mt-2">
            <button
              onClick={() => onNavigate("peers")}
              className={`flex items-center w-full px-3 py-2 rounded-md ${
                isSidebarCollapsed ? "justify-center" : ""
              } ${
                activeView === "peers"
                  ? "text-white bg-yellow-500/20"
                  : "text-gray-400 hover:bg-gray-700/50"
              }`}
              title="Peers"
            >
              <Users
                className={`w-5 h-5 ${
                  isSidebarCollapsed ? "" : "mr-3"
                } ${
                  activeView === "peers" ? "text-yellow-400" : ""
                }`}
              />
              <span className={isSidebarCollapsed ? "hidden" : ""}>
                Peers
              </span>
            </button>
          </li>
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={onToggleCollapse}
          className={`flex items-center w-full px-3 py-2 text-gray-400 hover:bg-gray-700/50 rounded-md mb-2 ${
            isSidebarCollapsed ? "justify-center" : ""
          }`}
          title={isSidebarCollapsed ? "Expand" : "Collapse"}
        >
          {isSidebarCollapsed ? (
            <ChevronsRight className="w-5 h-5" />
          ) : (
            <ChevronsLeft className="w-5 h-5 mr-3" />
          )}
          <span className={isSidebarCollapsed ? "hidden" : ""}>Collapse</span>
        </button>
        <button
          onClick={onLogout}
          className={`flex items-center w-full px-3 py-2 text-gray-400 hover:bg-gray-700/50 rounded-md ${
            isSidebarCollapsed ? "justify-center" : ""
          }`}
          title="Logout"
        >
          <LogOut
            className={`w-5 h-5 ${isSidebarCollapsed ? "" : "mr-3"}`}
          />
          <span className={isSidebarCollapsed ? "hidden" : ""}>
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
};