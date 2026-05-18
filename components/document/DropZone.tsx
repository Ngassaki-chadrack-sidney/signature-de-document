"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Upload, FileWarning, Loader2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DropZoneState } from "@/types";

interface DropZoneProps {
  state: DropZoneState;
  errorLabel?: string;
  onDragEnter: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const stateConfig = {
  idle: { icon: Upload, bg: "bg-muted/50", border: "border-border" },
  dragover: { icon: FileText, bg: "bg-muted", border: "border-foreground" },
  rejected: { icon: FileWarning, bg: "bg-destructive/5", border: "border-destructive" },
  uploading: { icon: Loader2, bg: "bg-muted/50", border: "border-border" },
} as const;

export function DropZone({
  state,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
}: DropZoneProps) {
  const t = useTranslations("dropzone");
  const config = stateConfig[state];
  const Icon = config.icon;

  const message =
    state === "idle"
      ? { title: t("idle.title"), subtitle: t("idle.subtitle"), hint: t("idle.hint") }
      : state === "dragover"
      ? { title: t("dragover.title"), subtitle: "", hint: "" }
      : state === "rejected"
      ? { title: t("rejected.title"), subtitle: t("rejected.subtitle"), hint: "" }
      : { title: t("uploading.title"), subtitle: "", hint: "" };

  return (
    <div
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
        config.bg,
        config.border
      )}
    >
      <motion.div
        key={state}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col items-center gap-2"
      >
        <motion.div
          animate={
            state === "dragover" ? { y: [0, -4, 0] } : state === "uploading" ? { rotate: 360 } : {}
          }
          transition={
            state === "dragover"
              ? { repeat: Infinity, duration: 1 }
              : state === "uploading"
              ? { repeat: Infinity, duration: 1.5, ease: "linear" }
              : {}
          }
        >
          <Icon className="h-8 w-8 text-muted-foreground" />
        </motion.div>

        <div className="text-center">
          <p className="text-sm font-medium">{message.title}</p>
          {message.subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground">{message.subtitle}</p>
          )}
          {message.hint && (
            <p className="mt-1 text-[11px] text-muted-foreground/60">{message.hint}</p>
          )}
        </div>
      </motion.div>

      <input
        type="file"
        accept=".pdf,application/pdf"
        onChange={onFileSelect}
        className="absolute inset-0 cursor-pointer opacity-0"
        disabled={state === "uploading"}
      />
    </div>
  );
}
