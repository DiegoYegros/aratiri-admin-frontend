"use client";
import { Check, ClipboardCopy } from "lucide-react";
import { useLanguage } from "@/app/lib/language";

interface CopyableCellProps {
  fullText: string;
  copiedText: string | null;
  onCopy: (text: string) => void;
  children: React.ReactNode;
}

export const CopyableCell = ({
  fullText,
  copiedText,
  onCopy,
  children,
}: CopyableCellProps) => {
  const { t } = useLanguage();

  const handleCopyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy(fullText);
  };

  return (
    <>
      {children}
      <button
        onClick={handleCopyClick}
        className="absolute top-1/2 right-2 -translate-y-1/2 p-1 bg-gray-700 rounded-md text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
        title={t("copyableCell.copy")}
      >
        {copiedText === fullText ? (
          <Check size={14} className="text-green-500" />
        ) : (
          <ClipboardCopy size={14} />
        )}
      </button>
    </>
  );
};

