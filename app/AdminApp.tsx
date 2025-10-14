"use client";
import { useEffect, useState } from "react";
import { LoginScreen } from "./components/auth/LoginScreen";
import { Dashboard } from "./components/dashboard/Dashboard";

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

  if (isAuthenticated) {
    return (
      <Dashboard setToken={setToken} setIsAuthenticated={setIsAuthenticated} />
    );
  }

  return (
    <LoginScreen setToken={setToken} setIsAuthenticated={setIsAuthenticated} />
  );
}
