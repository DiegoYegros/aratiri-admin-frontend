"use client";

import { Globe2 } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/app/lib/language";

interface LanguageSwitcherProps {
  /** Compact icon-only trigger (used when the sidebar is collapsed). */
  collapsed?: boolean;
  /** Render the plain segmented control (no container chrome). */
  plain?: boolean;
  className?: string;
}

export const LanguageSwitcher = ({
  collapsed = false,
  plain = false,
  className = "",
}: LanguageSwitcherProps) => {
  const { language, availableLanguages, setLanguage, t } = useLanguage();
  const [popoverOpen, setPopoverOpen] = useState(false);

  if (collapsed) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setPopoverOpen((prev) => !prev)}
          className="flex w-full items-center justify-center px-3 py-2 text-muted hover:bg-panel-elevated hover:text-foreground rounded-md"
          title={t("settings.language.title")}
          aria-label={t("settings.language.title")}
          aria-expanded={popoverOpen}
        >
          <Globe2 className="h-5 w-5" />
        </button>
        {popoverOpen && (
          <div
            className="absolute bottom-full left-0 mb-2 flex flex-col rounded-lg border border-panel-edge bg-panel p-1 shadow-none animate-fade-in"
            role="menu"
          >
            {availableLanguages.map(({ code, label }) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setLanguage(code);
                  setPopoverOpen(false);
                }}
                role="menuitemradio"
                aria-checked={language === code}
                className={`flex w-32 items-center justify-between rounded-md px-3 py-2 text-sm ${
                  language === code
                    ? "bg-accent-subtle text-accent"
                    : "text-muted hover:bg-panel-elevated hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center rounded-md border border-panel-edge bg-panel p-0.5 ${className}`}
      role="group"
      aria-label={t("settings.language.title")}
    >
      {availableLanguages.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLanguage(code)}
          className={`rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
            language === code
              ? "bg-accent text-accent-fg"
              : "text-muted hover:text-foreground"
          }`}
          title={label}
          aria-pressed={language === code}
        >
          {code}
        </button>
      ))}
    </div>
  );
};
