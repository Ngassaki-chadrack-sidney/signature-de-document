"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { Document, Page, pdfjs } from "react-pdf";
import {
  Download,
  FileText,
  Pen,
  RotateCcw,
  Trash2,
  Upload,
  Move,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

// Configuration PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface SignaturePosition {
  x: number;
  y: number;
  page: number;
  width: number;
  height: number;
}

export default function SignaturePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const signaturePadRef = useRef<any>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isClient, setIsClient] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [pdfScale, setPdfScale] = useState(1.2);
  const [signaturePositions, setSignaturePositions] = useState<
    SignaturePosition[]
  >([]);
  const [selectedSignature, setSelectedSignature] = useState<number | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);

  // Setup client-side environment
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize signature pad
  useEffect(() => {
    if (!isClient) return;

    const initSignaturePad = async () => {
      const SignaturePad = (await import("signature_pad")).default;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const pad = new SignaturePad(canvas, {
        penColor: "#1f2937",
        backgroundColor: "#ffffff",
        minWidth: 1,
        maxWidth: 3,
        throttle: 16,
        minDistance: 5,
      });

      signaturePadRef.current = pad;

      pad.onBegin = () => setIsEmpty(false);
      pad.onEnd = () => setIsEmpty(pad.isEmpty());

      const resizeCanvas = () => {
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

      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);

      return () => {
        window.removeEventListener("resize", resizeCanvas);
        pad.off();
      };
    };

    initSignaturePad();
  }, [isClient]);

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      setPdfFile(file);
      setCurrentPage(1);
      setSignaturePositions([]);
    } else {
      alert("Veuillez sélectionner un fichier PDF");
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const addSignatureToPage = () => {
    if (!signaturePreview) return;

    const newSignature: SignaturePosition = {
      x: 100,
      y: 100,
      page: currentPage,
      width: 150,
      height: 60,
    };

    setSignaturePositions((prev) => [...prev, newSignature]);
    setSelectedSignature(signaturePositions.length);
  };

  const removeSignature = (index: number) => {
    setSignaturePositions((prev) => prev.filter((_, i) => i !== index));
    setSelectedSignature(null);
  };

  const handleSignatureMouseDown = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedSignature(index);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || selectedSignature === null) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setSignaturePositions((prev) =>
      prev.map((sig, index) =>
        index === selectedSignature
          ? {
              ...sig,
              x: Math.max(0, x - sig.width / 2),
              y: Math.max(0, y - sig.height / 2),
            }
          : sig
      )
    );
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const exportSignedPDF = async () => {
    if (!pdfFile || !signaturePreview || signaturePositions.length === 0)
      return;

    setIsExporting(true);

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pngImage = await pdfDoc.embedPng(signaturePreview);
      const pages = pdfDoc.getPages();

      signaturePositions.forEach((sigPos) => {
        const page = pages[sigPos.page - 1];
        if (!page) return;

        const { width: pageWidth, height: pageHeight } = page.getSize();

        // Conversion des coordonnées (l'origine PDF est en bas à gauche)
        const pdfX = (sigPos.x / 600) * pageWidth; // 600 est la largeur approximative du viewer
        const pdfY = pageHeight - (sigPos.y / 800) * pageHeight - sigPos.height; // 800 hauteur approximative

        page.drawImage(pngImage, {
          x: pdfX,
          y: pdfY,
          width: sigPos.width,
          height: sigPos.height,
        });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${pdfFile.name.replace(".pdf", "")}_signé.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      alert("Erreur lors de l'export du PDF");
    } finally {
      setIsExporting(false);
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Signature de Documents PDF
          </h1>
          <p className="text-gray-600 text-lg">
            Créez votre signature et signez vos documents en toute simplicité
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Section Signature */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Pen className="h-6 w-6 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Créer votre signature
              </h2>
            </div>

            {/* Canvas de signature */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl mb-6 overflow-hidden bg-gray-50">
              <canvas
                ref={canvasRef}
                className="block w-full cursor-crosshair bg-white"
                style={{ touchAction: "none" }}
              />
            </div>

            {/* Contrôles signature */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={clearSignature}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Effacer
              </button>
              <button
                onClick={undoSignature}
                // disabled={isEmpty} 
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Annuler
              </button>
              <button
                onClick={saveSignature}
                disabled={isEmpty}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-lg transition-colors"
              >
                <Download className="h-4 w-4" />
                Enregistrer
              </button>
            </div>

            {/* Aperçu de la signature */}
            {signaturePreview && (
              <div className="border rounded-xl p-4 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Aperçu de votre signature
                </h3>
                <div className="bg-white p-4 rounded-lg border">
                  <img
                    src={signaturePreview}
                    alt="Signature"
                    className="max-w-full h-auto"
                  />
                </div>
                {pdfFile && (
                  <button
                    onClick={addSignatureToPage}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    <Move className="h-4 w-4" />
                    Ajouter à la page {currentPage}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Section Document */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Votre document
              </h2>
            </div>

            {/* Upload de fichier */}
            <div className="mb-6">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-10 w-10 text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 font-medium">
                    Cliquez pour sélectionner un PDF
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PDF uniquement</p>
                </div>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Aperçu du PDF */}
            {pdfFile && (
              <div className="space-y-4">
                {/* Contrôles PDF */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        setPdfScale((prev) => Math.max(0.5, prev - 0.1))
                      }
                      className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-medium">
                      {Math.round(pdfScale * 100)}%
                    </span>
                    <button
                      onClick={() =>
                        setPdfScale((prev) => Math.min(2, prev + 0.1))
                      }
                      className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage <= 1}
                      className="px-3 py-1 bg-white rounded-lg shadow-sm hover:shadow-md disabled:opacity-50 transition-all"
                    >
                      ←
                    </button>
                    <span className="text-sm font-medium px-2">
                      {currentPage} / {numPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(numPages, prev + 1))
                      }
                      disabled={currentPage >= numPages}
                      className="px-3 py-1 bg-white rounded-lg shadow-sm hover:shadow-md disabled:opacity-50 transition-all"
                    >
                      →
                    </button>
                  </div>
                </div>

                {/* Viewer PDF */}
                <div
                  className="relative border rounded-xl overflow-hidden bg-white"
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <Document
                    file={pdfFile}
                    onLoadSuccess={onDocumentLoadSuccess}
                    className="flex justify-center"
                  >
                    <Page
                      pageNumber={currentPage}
                      scale={pdfScale}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </Document>

                  {/* Signatures overlay */}
                  {signaturePositions
                    .filter((sig) => sig.page === currentPage)
                    .map((signature, index) => (
                      <div
                        key={index}
                        className={`absolute cursor-move border-2 ${
                          selectedSignature ===
                          signaturePositions.indexOf(signature)
                            ? "border-blue-500 bg-blue-100/20"
                            : "border-transparent hover:border-blue-300"
                        } rounded`}
                        style={{
                          left: signature.x,
                          top: signature.y,
                          width: signature.width,
                          height: signature.height,
                        }}
                        onMouseDown={(e) =>
                          handleSignatureMouseDown(
                            signaturePositions.indexOf(signature),
                            e
                          )
                        }
                      >
                        <img
                          src={signaturePreview!}
                          alt="Signature"
                          className="w-full h-full object-contain pointer-events-none"
                          draggable={false}
                        />
                        <button
                          onClick={() =>
                            removeSignature(
                              signaturePositions.indexOf(signature)
                            )
                          }
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                </div>

                {/* Bouton export */}
                {signaturePositions.length > 0 && (
                  <button
                    onClick={exportSignedPDF}
                    disabled={isExporting}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold transition-all transform hover:scale-105 disabled:scale-100"
                  >
                    {isExporting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Export en cours...
                      </>
                    ) : (
                      <>
                        <Download className="h-5 w-5" />
                        Télécharger le PDF signé
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
