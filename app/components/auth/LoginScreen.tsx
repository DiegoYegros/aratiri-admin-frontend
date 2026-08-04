"use client";
import { Server } from "lucide-react";
import { useEffect, useState } from "react";
import { apiCall } from "../../lib/api";
import { useLanguage } from "@/app/lib/language";
import { AuthShell } from "../ui/AuthShell";
import { Alert } from "../ui/Alert";

const fieldClass =
  "w-full px-4 py-3 bg-input border border-panel-edge rounded-lg text-foreground placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition touch-manipulation";

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
    <AuthShell
      variant="login"
      icon={Server}
      title={t("auth.heading")}
      subtitle={t("auth.subheading")}
      railTitle={t("auth.signIn")}
    >
      {error && <Alert variant="danger">{error}</Alert>}

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="login-username"
            className="block text-sm text-muted-strong"
          >
            {t("auth.usernamePlaceholder")}
          </label>
          <input
            id="login-username"
            name="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t("auth.usernamePlaceholder")}
            className={fieldClass}
            required
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="login-password"
            className="block text-sm text-muted-strong"
          >
            {t("auth.passwordPlaceholder")}
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("auth.passwordPlaceholder")}
            className={fieldClass}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-11 bg-accent text-accent-fg font-semibold py-3 px-4 rounded-lg hover:bg-accent-hover disabled:opacity-50 transition touch-manipulation"
        >
          {loading ? t("auth.signingIn") : t("auth.signIn")}
        </button>
      </form>
    </AuthShell>
  );
};
