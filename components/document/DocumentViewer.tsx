"use client";

import { useEffect, useLayoutEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PDF_SCALE_MIN, PDF_SCALE_MAX, PDF_SCALE_STEP } from "@/lib/constants";

interface DocumentViewerProps {
  file: File;
  currentPage: number;
  numPages: number;
  scale: number;
  onPageChange: (page: number) => void;
  onScaleChange: (scale: number) => void;
  onLoadSuccess: ({ numPages }: { numPages: number }) => void;
  children?: React.ReactNode;
}

export function DocumentViewer({
  file,
  currentPage,
  numPages,
  scale,
  onPageChange,
  onScaleChange,
  onLoadSuccess,
  children,
}: DocumentViewerProps) {
  const t = useTranslations("document.controls");
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageWidth, setPageWidth] = useState<number | undefined>(undefined);
  const [Components, setComponents] = useState<{
    Document: React.ElementType;
    Page: React.ElementType;
  } | null>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateWidth = () => {
      setPageWidth(el.clientWidth);
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const mod = await import("react-pdf");
      mod.pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();
      if (mounted) {
        setComponents({ Document: mod.Document, Page: mod.Page });
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!Components) return null;
  const { Document, Page } = Components;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() =>
              onScaleChange(Math.max(PDF_SCALE_MIN, scale - PDF_SCALE_STEP))
            }
            disabled={scale <= PDF_SCALE_MIN}
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="w-10 text-center text-xs font-medium tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() =>
              onScaleChange(Math.min(PDF_SCALE_MAX, scale + PDF_SCALE_STEP))
            }
            disabled={scale >= PDF_SCALE_MAX}
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="min-w-[60px] text-center text-xs font-medium tabular-nums">
            {t("page", { current: currentPage, total: numPages })}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onPageChange(Math.min(numPages, currentPage + 1))}
            disabled={currentPage >= numPages}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="relative flex justify-center overflow-hidden rounded-lg border bg-muted/20 p-4">
        <div className="relative" ref={containerRef}>
          <Document file={file} onLoadSuccess={onLoadSuccess}>
            <Page
              pageNumber={currentPage}
              width={pageWidth ? Math.round(pageWidth * scale) : undefined}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
          {children}
        </div>
      </div>
    </div>
  );
}
