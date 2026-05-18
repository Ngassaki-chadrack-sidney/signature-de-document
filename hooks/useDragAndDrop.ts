import { useState, useCallback, useRef } from "react";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE, FILE_SIZE_LABEL } from "@/lib/constants";
import type { DropZoneState, UploadError } from "@/types";

export function useDragAndDrop() {
  const [dropState, setDropState] = useState<DropZoneState>("idle");
  const [error, setError] = useState<UploadError>(null);
  const dragCounter = useRef(0);

  const validateFile = useCallback((file: File): UploadError => {
    if (!ACCEPTED_FILE_TYPES.includes(file.type as typeof ACCEPTED_FILE_TYPES[number])) {
      return "invalid_type";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "too_large";
    }
    return null;
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (dragCounter.current === 1) {
      setDropState("dragover");
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDropState("idle");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent): File | null => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;

      const file = e.dataTransfer.files?.[0];
      if (!file) return null;

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setDropState("rejected");
        setTimeout(() => {
          setDropState("idle");
          setError(null);
        }, 2000);
        return null;
      }

      setDropState("uploading");
      setError(null);
      return file;
    },
    [validateFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): File | null => {
      const file = e.target.files?.[0];
      if (!file) return null;

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return null;
      }

      setError(null);
      return file;
    },
    [validateFile]
  );

  const reset = useCallback(() => {
    setDropState("idle");
    setError(null);
    dragCounter.current = 0;
  }, []);

  return {
    dropState,
    error,
    errorLabel: error === "too_large" ? FILE_SIZE_LABEL : undefined,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    reset,
  };
}
