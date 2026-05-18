import { useState, useCallback } from "react";
import type { DocumentFile, DocumentStatus } from "@/types";

export function useDocumentUpload() {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);

  const addDocument = useCallback((file: File) => {
    const doc: DocumentFile = {
      file,
      name: file.name,
      size: file.size,
      uploadedAt: new Date(),
      status: "pending",
    };
    setDocuments([doc]);
  }, []);

  const removeDocument = useCallback(() => {
    setDocuments([]);
  }, []);

  const updateStatus = useCallback(
    (status: DocumentStatus) => {
      setDocuments((prev) =>
        prev.map((doc) => ({ ...doc, status }))
      );
    },
    []
  );

  const currentDocument = documents[0] ?? null;

  return {
    documents,
    currentDocument,
    addDocument,
    removeDocument,
    updateStatus,
  };
}
