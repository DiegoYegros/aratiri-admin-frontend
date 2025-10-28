"use client";
import { Server } from "lucide-react";
import { useEffect, useState } from "react";
import { apiCall } from "../../lib/api";
import { useLanguage } from "@/app/lib/language";

export const LoginScreen = ({
  setToken,
  setIsAuthenticated,
  authError,
  onClearAuthError,
}: {
  setToken: (token: string | null) => void;
  setIsAuthenticated: (auth: boolean) => void;
  authError?: string | null;
  onClearAuthError?: () => void;
}) => {
  const { t } = useLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    onClearAuthError?.();
    try {
      const response = await apiCall("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      localStorage.setItem("aratiri_accessToken", response.accessToken);
      localStorage.setItem("aratiri_refreshToken", response.refreshToken);
      const currentUser = await apiCall("/auth/me");
      const role = currentUser?.role;
      if (role !== "ADMIN" && role !== "SUPERADMIN") {
        localStorage.removeItem("aratiri_accessToken");
        localStorage.removeItem("aratiri_refreshToken");
        throw new Error(t("auth.errors.noPermission"));
      }
      setToken(response.accessToken);
      setIsAuthenticated(true);
    } catch (err: unknown) {
      localStorage.removeItem("aratiri_accessToken");
      localStorage.removeItem("aratiri_refreshToken");
      setToken(null);
      setIsAuthenticated(false);
      const message =
        err instanceof Error && err.message
          ? err.message
          : t("auth.errors.default");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-lg p-8 space-y-6 border border-yellow-500/20">
        <div className="text-center">
          <Server className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-glow" />
          <h1 className="text-4xl font-bold">{t("auth.heading")}</h1>
          <p className="text-gray-400">{t("auth.subheading")}</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t("auth.usernamePlaceholder")}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("auth.passwordPlaceholder")}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 text-gray-900 font-bold py-3 px-4 rounded-lg hover:bg-yellow-500 disabled:opacity-50 transition"
          >
            {loading ? t("auth.signingIn") : t("auth.signIn")}
          </button>
        </form>
      </div>
    </div>
  );
};

