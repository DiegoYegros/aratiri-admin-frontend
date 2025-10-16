"use client";

import { LayoutDashboard, Link2, LogOut, Server, Users } from "lucide-react";

interface SidebarProps {
  isRefreshing: boolean;
  activeView: string;
  onRefresh: () => void;
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

export const Sidebar = ({
  isRefreshing,
  onRefresh,
  onLogout,
  activeView,
  onNavigate,
}: SidebarProps) => {
  return (
    <aside className="w-64 bg-gray-800 text-white flex-col hidden sm:flex border-r border-gray-700">
      <div
        className="flex items-center space-x-3 p-4 h-16 cursor-pointer border-b border-gray-700"
        onClick={onRefresh}
      >
        <Server
          className={`w-8 h-8 text-yellow-400 ${
            isRefreshing ? "animate-spin-smooth" : ""
          }`}
        />
        <h1 className="text-xl font-bold">Aratiri Admin</h1>
      </div>
      <nav className="flex-grow p-4">
        <ul>
          <li>
            <button
              onClick={() => onNavigate("dashboard")}
              className={`flex items-center w-full px-3 py-2 rounded-md ${
                activeView === "dashboard"
                  ? "text-white bg-yellow-500/20"
                  : "text-gray-400 hover:bg-gray-700/50"
              }`}
            >
              <LayoutDashboard
                className={`w-5 h-5 mr-3 ${
                  activeView === "dashboard" ? "text-yellow-400" : ""
                }`}
              />
              <span className="font-semibold">Dashboard</span>
            </button>
          </li>
          <li className="mt-2">
            <button
              onClick={() => onNavigate("channels")}
              className={`flex items-center w-full px-3 py-2 rounded-md ${
                activeView === "channels"
                  ? "text-white bg-yellow-500/20"
                  : "text-gray-400 hover:bg-gray-700/50"
              }`}
            >
              <Link2
                className={`w-5 h-5 mr-3 ${
                  activeView === "channels" ? "text-yellow-400" : ""
                }`}
              />
              <span>Channels</span>
            </button>
          </li>
          <li className="mt-2">
            <button
              onClick={() => onNavigate("peers")}
              className={`flex items-center w-full px-3 py-2 rounded-md ${
                activeView === "peers"
                  ? "text-white bg-yellow-500/20"
                  : "text-gray-400 hover:bg-gray-700/50"
              }`}
            >
              <Users
                className={`w-5 h-5 mr-3 ${
                  activeView === "peers" ? "text-yellow-400" : ""
                }`}
              />
              <span>Peers</span>
            </button>
          </li>
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={onLogout}
          className="flex items-center w-full px-3 py-2 text-gray-400 hover:bg-gray-700/50 rounded-md"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};