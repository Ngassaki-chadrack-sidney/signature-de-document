"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { FileText, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DocumentFile } from "@/types";

interface DocumentCardProps {
  document: DocumentFile;
  onRemove: () => void;
}

const statusVariant = {
  pending: "secondary" as const,
  signed: "default" as const,
  rejected: "destructive" as const,
};

export function DocumentCard({ document, onRemove }: DocumentCardProps) {
  const t = useTranslations("document.status");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-center gap-3 rounded-lg border p-3"
    >
      <FileText className="h-8 w-8 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{document.name}</p>
        <p className="text-xs text-muted-foreground">
          {(document.size / 1024 / 1024).toFixed(1)} Mo
        </p>
      </div>
      <Badge variant={statusVariant[document.status]}>
        {t(document.status)}
      </Badge>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={onRemove}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </motion.div>
  );
}
