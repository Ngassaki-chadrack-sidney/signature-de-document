export interface SignaturePosition {
  x: number;
  y: number;
  page: number;
  width: number;
  height: number;
}

export interface DocumentFile {
  file: File;
  name: string;
  size: number;
  uploadedAt: Date;
  status: DocumentStatus;
}

export type DocumentStatus = "pending" | "signed" | "rejected";

export type DropZoneState = "idle" | "dragover" | "rejected" | "uploading";

export type UploadError = "too_large" | "invalid_type" | "upload_failed" | null;

export interface UploadResult {
  file: File;
  error: UploadError;
}
