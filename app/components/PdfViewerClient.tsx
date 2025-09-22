"use client";

import React, { useEffect, useState } from "react";

type Props = {
  file: File | null;
  currentPage: number;
  scale: number;
  onLoadSuccess: ({ numPages }: { numPages: number }) => void;
};

export default function PdfViewerClient({ file, currentPage, scale, onLoadSuccess }: Props) {
  const [components, setComponents] = useState<null | {
    Document: any;
    Page: any;
    pdfjs: any;
  }>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const mod = await import("react-pdf");
      // Configure worker on client only
      mod.pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();
      if (mounted) {
        setComponents({ Document: mod.Document, Page: mod.Page, pdfjs: mod.pdfjs });
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!file) return null;
  if (!components) return null;

  const { Document, Page } = components;

  return (
    <Document file={file} onLoadSuccess={onLoadSuccess} className="flex justify-center">
      <Page
        pageNumber={currentPage}
        scale={scale}
        renderTextLayer={false}
        renderAnnotationLayer={false}
      />
    </Document>
  );
}
