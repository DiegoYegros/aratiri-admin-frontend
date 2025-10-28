"use client";

import { useLanguage } from "@/app/lib/language";
import { CheckCircle2, Globe2 } from "lucide-react";

export const SettingsView = () => {
  const { language, availableLanguages, setLanguage, t } = useLanguage();

  return (
    <main className="flex-grow p-4 sm:p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="rounded-2xl border border-gray-700 bg-gray-900/70 p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <Globe2 className="h-8 w-8 text-yellow-400" />
            <div>
              <h1 className="text-3xl font-semibold text-white">
                {t("settings.title")}
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                {t("settings.subtitle")}
              </p>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-gray-700 bg-gray-900/60 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">
              {t("settings.language.title")}
            </h2>
            <p className="mt-2 text-sm text-gray-400">
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
                  className={`w-full rounded-xl border px-5 py-4 text-left transition focus:outline-none focus:ring-2 focus:ring-yellow-400/60 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                    isActive
                      ? "border-yellow-400/60 bg-yellow-500/10 text-yellow-100 shadow-lg shadow-yellow-500/20"
                      : "border-gray-700 bg-gray-800/70 text-gray-200 hover:border-gray-600 hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold">{label}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {isActive
                          ? t("settings.language.description")
                          : t("settings.language.title")}
                      </p>
                    </div>
                    {isActive && (
                      <CheckCircle2 className="h-6 w-6 text-yellow-400" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
};

