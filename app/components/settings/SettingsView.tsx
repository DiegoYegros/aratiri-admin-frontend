"use client";

import { useLanguage } from "@/app/lib/language";
import { CheckCircle2, Globe2 } from "lucide-react";

export const SettingsView = () => {
  const { language, availableLanguages, setLanguage, t } = useLanguage();

  return (
    <main className="flex-grow overflow-y-auto">
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <header className="rounded-2xl border border-panel-edge bg-panel p-6">
            <div className="flex items-center gap-3">
              <Globe2 className="h-8 w-8 text-accent" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold">
                  {t("settings.title")}
                </h1>
                <p className="mt-1 text-sm text-muted">
                  {t("settings.subtitle")}
                </p>
              </div>
            </div>
          </header>

          <section className="rounded-2xl border border-panel-edge bg-panel p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">
                {t("settings.language.title")}
              </h2>
              <p className="mt-2 text-sm text-muted">
                {t("settings.language.helper")}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {availableLanguages.map(({ code, label }) => {
                const isActive = code === language;
                return (
                  <button
                    key={code}
                    onClick={() => setLanguage(code)}
                    className={`w-full rounded-xl border px-5 py-4 text-left transition ${
                      isActive
                        ? "border-accent bg-accent-subtle text-accent"
                        : "border-panel-edge bg-panel-elevated text-foreground hover:border-panel-edge hover:bg-panel-elevated"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-semibold">{label}</p>
                        <p className="text-xs text-muted mt-1">
                          {isActive
                            ? t("settings.language.description")
                            : t("settings.language.title")}
                        </p>
                      </div>
                      {isActive && (
                        <CheckCircle2 className="h-6 w-6 text-accent" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};
