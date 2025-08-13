"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import SignaturePad from "signature_pad";
import dynamic from "next/dynamic";

// Dynamic PDF Viewer Component
const PDFViewer = dynamic(
  () => {
    return import("react-pdf").then((mod) => {
      // Set up worker here as well
      mod.pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${mod.pdfjs.version}/pdf.worker.min.js`;

      return function PDFViewerComponent({
        file,
        onLoadSuccess,
        width,
      }: {
        file: File;
        onLoadSuccess: (data: { numPages: number }) => void;
        width: number;
      }) {
        return (
          <mod.Document file={file} onLoadSuccess={onLoadSuccess}>
            <mod.Page pageNumber={1} width={width} />
          </mod.Document>
        );
      };
    });
  },
  {
    ssr: false,
    loading: () => <div className="text-center p-4">Loading PDF viewer...</div>,
  }
);

// Set up PDF.js worker in useEffect to avoid SSR issues
let isWorkerSet = false;

// Import dynamique pour SignatureCanvas
const SignatureCanvas = dynamic(() => import("react-signature-canvas"), {
  ssr: false,
});

export default function SignaturePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sigRef = useRef<any>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState(1);
  const [pageNumber, setPageNumber] = useState(1);
  const [isClient, setIsClient] = useState(false);

  // signature position
  const [sigX, setSigX] = useState(50);
  const [sigY, setSigY] = useState(50);
  const [sigWidth, setSigWidth] = useState(150);
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // helper: dataURL -> Blob
  const dataURLToBlob = (dataURL: string) => {
    const parts = dataURL.split(",");
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";
    const binary = atob(parts[1]);
    const len = binary.length;
    const u8 = new Uint8Array(len);
    for (let i = 0; i < len; i++) u8[i] = binary.charCodeAt(i);
    return new Blob([u8], { type: mime });
  };

  // Enregistrer la signature
  const saveSignature = useCallback(() => {
    const sig = sigRef.current;
    if (!sig || sig.isEmpty()) return;
    const dataUrl = sig.toDataURL("image/png");
    setPreview(dataUrl);
  }, []);

  // Effacer tout
  const clear = useCallback(() => {
    sigRef.current?.clear();
    setIsEmpty(true);
    setPreview(null);
  }, []);

  // Undo
  const undo = useCallback(() => {
    const sig = sigRef.current;
    if (!sig) return;
    const data = sig.toData();
    if (!data || data.length === 0) return;
    data.pop();
    sig.fromData(data);
    setIsEmpty(sig.isEmpty());
  }, []);

  // Setup client-side environment
  useEffect(() => {
    setIsClient(true);

    // Setup PDF.js worker
    if (!isWorkerSet) {
      import("react-pdf").then((mod) => {
        mod.pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${mod.pdfjs.version}/pdf.worker.min.js`;
        isWorkerSet = true;
      });
    }
  }, []);

  // Init signature_pad
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sig = new SignaturePad(canvas, {
      penColor: "#0f172a",
      backgroundColor: "#ffffff",
      minWidth: 0.5,
      maxWidth: 2.5,
    });
    sigRef.current = sig;

    sig.onBegin = () => setIsEmpty(false);

    sig.onEnd = () => setIsEmpty(sig.isEmpty());

    const resizeCanvas = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const parent = canvas.parentElement;
      if (!parent) return;
      const width = Math.min(700, parent.clientWidth);
      const height = 260;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      sig.clear();
      setIsEmpty(true);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  // Drag handlers
  const onMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
    setDragging(true);
    dragOffset.current = {
      x: e.clientX - sigX,
      y: e.clientY - sigY,
    };
  };
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setSigX(e.clientX - dragOffset.current.x);
    setSigY(e.clientY - dragOffset.current.y);
  };
  const onMouseUp = () => setDragging(false);

  // Export PDF avec signature
  const exportPDF = async () => {
    if (!file || !preview || !isClient) return;

    try {
      const { PDFDocument } = await import("pdf-lib");
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pngImage = await pdfDoc.embedPng(preview);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      firstPage.drawImage(pngImage, {
        x: sigX,
        y: firstPage.getHeight() - sigY - 50, // ajuster selon position canvas
        width: sigWidth,
        height: sigWidth * 0.4,
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "document_signe.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error("Error exporting PDF:", error);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl mb-3">Signature document</h1>

      <div className="flex flex-col gap-4">
        {/* Canvas et contrôles */}
        <div className="max-w-[100%]">
          <div className="flex gap-2.5 mb-4">
            <button
              onClick={clear}
              className="p-2 bg-red-500 text-white rounded-md"
            >
              Effacer
            </button>
            <button
              onClick={saveSignature}
              disabled={isEmpty}
              className="p-2 bg-green-500 text-white rounded-md"
            >
              Enregistrer
            </button>
            <button
              onClick={undo}
              disabled={isEmpty}
              className="p-2 bg-white hover:opacity-90 rounded-md text-black"
            >
              Retour
            </button>
            <button
              onClick={exportPDF}
              disabled={!preview || !file}
              className="p-2 bg-blue-500 text-white rounded-md"
            >
              Export PDF signé
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="border border-gray-300 rounded-md">
              <canvas ref={canvasRef} className="block touch-action-none" />
            </div>

            <div className="p-3 border rounded-md bg-white w-full md:w-80">
              <h2 className="text-sm font-medium mb-2 text-black">
                Aperçu de la signature
              </h2>
              {preview ? (
                <img
                  src={preview}
                  alt="Aperçu signature"
                  style={{
                    position: "relative",
                    width: sigWidth,
                    objectFit: "contain",
                  }}
                  onMouseDown={onMouseDown}
                  onMouseUp={onMouseUp}
                />
              ) : (
                <div className="text-sm text-black text-center">
                  Aucun aperçu — clique sur Enregistrer pour générer l'image.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PDF upload + aperçu */}
        <div
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          style={{ position: "relative" }}
        >
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block text-sm border border-gray-300 rounded-md p-2 mb-2"
          />
          {file && isClient && (
            <PDFViewer
              file={file}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              width={700}
            />
          )}
          {/* signature superposée */}
          {preview && (
            <img
              src={preview}
              alt="Signature"
              style={{
                position: "absolute",
                top: sigY,
                left: sigX,
                width: sigWidth,
                cursor: "grab",
              }}
              onMouseDown={onMouseDown}
              onMouseUp={onMouseUp}
            />
          )}
        </div>
      </div>
    </div>
  );
}
