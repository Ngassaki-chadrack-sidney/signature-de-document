"use client";

import { AnimatePresence } from "framer-motion";
import { DocumentCard } from "./DocumentCard";
import type { DocumentFile } from "@/types";

interface DocumentListProps {
  documents: DocumentFile[];
  onRemove: () => void;
}

export function DocumentList({ documents, onRemove }: DocumentListProps) {
  if (documents.length === 0) return null;

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {documents.map((doc) => (
          <DocumentCard
            key={doc.file.name}
            document={doc}
            onRemove={onRemove}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
