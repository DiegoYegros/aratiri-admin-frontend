"use client";

import { Inbox } from "lucide-react";
import { useLanguage } from "@/app/lib/language";

export const ChartEmptyState = ({ message }: { message?: string }) => {
  const { t } = useLanguage();
  const text = message || t("charts.common.noData");
  return (
    <div
      className="flex h-full min-h-48 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-panel-edge text-muted"
      role="status"
    >
      <Inbox className="h-8 w-8" aria-hidden="true" />
      <p className="px-4 text-center text-sm">{text}</p>
    </div>
  );
};
