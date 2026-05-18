import { useState, useCallback, useEffect, useRef } from "react";
import type SignaturePad from "signature_pad";
import { PDFDocument } from "pdf-lib";
import type { SignaturePosition } from "@/types";
import {
  SIGNATURE_DEFAULT_WIDTH,
  SIGNATURE_DEFAULT_HEIGHT,
  SIGNATURE_MIN_WIDTH,
  SIGNATURE_MIN_HEIGHT,
  SIGNATURE_MAX_WIDTH,
  SIGNATURE_MAX_HEIGHT,
} from "@/lib/constants";

export function useSignatureFlow() {
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [color, setColor] = useState("#000000");
  const [positions, setPositions] = useState<SignaturePosition[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const initPad = useCallback(async (canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas;
    const SignaturePadModule = (await import("signature_pad")).default;
    const pad = new SignaturePadModule(canvas, {
      penColor: "#000000",
      backgroundColor: "transparent",
      minWidth: 1,
      maxWidth: 3,
      throttle: 16,
      minDistance: 5,
    });

    const handleBegin = () => setIsEmpty(false);
    const handleEnd = () => setIsEmpty(pad.isEmpty());

    pad.addEventListener("beginStroke", handleBegin);
    pad.addEventListener("endStroke", handleEnd);

    signaturePadRef.current = pad;

    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const parent = canvas.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      const width = Math.min(600, rect.width - 32);
      const height = 200;

      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      }

      pad.clear();
      setIsEmpty(true);
    };

    resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      pad.removeEventListener("beginStroke", handleBegin);
      pad.removeEventListener("endStroke", handleEnd);
      pad.off();
    };
  }, []);

  const saveSignature = useCallback(() => {
    const pad = signaturePadRef.current;
    if (!pad || pad.isEmpty()) return;

    const dataUrl = pad.toDataURL("image/png", 1.0);
    setSignaturePreview(dataUrl);
  }, []);

  const clearSignature = useCallback(() => {
    signaturePadRef.current?.clear();
    setIsEmpty(true);
    setSignaturePreview(null);
  }, []);

  const undoSignature = useCallback(() => {
    const pad = signaturePadRef.current;
    if (!pad) return;

    const data = pad.toData();
    if (data.length === 0) return;

    data.pop();
    pad.fromData(data);
    setIsEmpty(pad.isEmpty());

    if (pad.isEmpty()) {
      setSignaturePreview(null);
    }
  }, []);

  useEffect(() => {
    if (signaturePadRef.current) {
      signaturePadRef.current.penColor = color;
    }
  }, [color]);

  const addToPage = useCallback(
    (page: number) => {
      if (!signaturePreview) return;

      const newPosition: SignaturePosition = {
        x: 100,
        y: 100,
        page,
        width: SIGNATURE_DEFAULT_WIDTH,
        height: SIGNATURE_DEFAULT_HEIGHT,
      };

      setPositions((prev) => [...prev, newPosition]);
      setSelectedIndex(positions.length);
    },
    [signaturePreview, positions.length]
  );

  const removePosition = useCallback((index: number) => {
    setPositions((prev) => prev.filter((_, i) => i !== index));
    setSelectedIndex(null);
  }, []);

  const updatePosition = useCallback(
    (index: number, x: number, y: number, width: number, height: number) => {
      setPositions((prev) =>
        prev.map((sig, i) =>
          i === index ? { ...sig, x, y, width, height } : sig
        )
      );
    },
    []
  );

  const exportPDF = useCallback(
    async (pdfFile: File) => {
      if (!pdfFile || !signaturePreview || positions.length === 0) return;

      setIsExporting(true);
      try {
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pngImage = await pdfDoc.embedPng(signaturePreview);
        const pages = pdfDoc.getPages();

        for (const sigPos of positions) {
          const page = pages[sigPos.page - 1];
          if (!page) continue;

          const { width: pageWidth, height: pageHeight } = page.getSize();
          const pdfX = (sigPos.x / 600) * pageWidth;
          const pdfY =
            pageHeight - (sigPos.y / 800) * pageHeight - sigPos.height;

          page.drawImage(pngImage, {
            x: pdfX,
            y: pdfY,
            width: sigPos.width,
            height: sigPos.height,
          });
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `${pdfFile.name.replace(".pdf", "")}_signed.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return true;
      } catch {
        return false;
      } finally {
        setIsExporting(false);
      }
    },
    [signaturePreview, positions]
  );

  return {
    signaturePadRef,
    canvasRef,
    isEmpty,
    signaturePreview,
    color,
    positions,
    selectedIndex,
    isExporting,
    initPad,
    saveSignature,
    clearSignature,
    undoSignature,
    setColor,
    addToPage,
    removePosition,
    updatePosition,
    setSelectedIndex,
    exportPDF,
  };
}
