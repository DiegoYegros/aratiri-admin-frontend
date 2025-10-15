"use client";

import { LayoutDashboard, Link2, LogOut, Server } from "lucide-react";

interface SidebarProps {
  isRefreshing: boolean;
  onRefresh: () => void;
  onLogout: () => void;
}

export const Sidebar = ({ isRefreshing, onRefresh, onLogout }: SidebarProps) => {
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
            <a
              href="#"
              className="flex items-center px-3 py-2 text-white bg-yellow-500/20 rounded-md"
            >
              <LayoutDashboard className="w-5 h-5 mr-3 text-yellow-400" />
              <span className="font-semibold">Dashboard</span>
            </a>
          </li>
          <li className="mt-2">
            <a
              href="#"
              className="flex items-center px-3 py-2 text-gray-400 hover:bg-gray-700/50 rounded-md"
            >
              <Link2 className="w-5 h-5 mr-3" />
              <span>Channels</span>
            </a>
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
