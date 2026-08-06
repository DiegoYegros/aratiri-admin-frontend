"use client";

import { ReactNode, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { IconButton } from "./IconButton";
import { useLanguage } from "@/app/lib/language";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
  leading?: ReactNode;
  className?: string;
  bodyClassName?: string;
  padded?: boolean;
  /** When false, Escape and the close control are disabled (e.g. secret reveal). */
  dismissible?: boolean;
}

export const Modal = ({
  title,
  onClose,
  children,
  labelledBy = "modal-title",
  leading,
  className = "",
  bodyClassName = "",
  padded = true,
  dismissible = true,
}: ModalProps) => {
  const { t } = useLanguage();
  const dialogRef = useRef<HTMLDivElement>(null);

  const focusDialog = () => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
    (focusable[0] ?? dialog).focus();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dismissible) {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);

      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const focusInside = dialogRef.current.contains(active);

      // Always trap Tab when focus is outside (e.g. Sidebar/MobileNav).
      if (event.shiftKey) {
        if (!focusInside || active === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (!focusInside || active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [dismissible, onClose]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    focusDialog();

    return () => {
      previous?.focus?.();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-overlay flex items-center justify-center z-50 p-4 animate-fade-in"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target !== event.currentTarget) {
          return;
        }
        // Non-dismissible modals (secret reveal): keep focus inside on backdrop click.
        if (!dismissible) {
          event.preventDefault();
          focusDialog();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`bg-panel border border-panel-edge rounded-xl w-full max-w-md max-h-[90dvh] flex flex-col shadow-none animate-fade-in-up ${className}`}
      >
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-panel-edge shrink-0">
          <div className="min-w-11 flex items-center justify-start">
            {leading ?? <span className="w-11" aria-hidden="true" />}
          </div>
          <h2
            id={labelledBy}
            className="text-lg sm:text-xl font-semibold text-center flex-1 truncate"
          >
            {title}
          </h2>
          {dismissible ? (
            <IconButton label={t("common.close")} onClick={onClose}>
              <X className="w-5 h-5" aria-hidden="true" />
            </IconButton>
          ) : (
            <span className="w-11" aria-hidden="true" />
          )}
        </div>
        <div
          className={`${padded ? "overflow-y-auto p-4 sm:p-6" : "overflow-y-auto"} ${bodyClassName}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
