"use client";

import React, { useRef, useState, useCallback } from "react";
import SignatureCanvas from "react-signature-canvas";
import jsPDF from "jspdf";
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
  Save,
} from "lucide-react";

// Configuration PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface SignaturePosition {
  x: number;
  y: number;
  page: number;
  width: number;
  height: number;
}

export default function page() {
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [pdfScale, setPdfScale] = useState(1.2);
  const [signaturePositions, setSignaturePositions] = useState<
    SignaturePosition[]
  >([]);
  const [selectedSignature, setSelectedSignature] = useState<number | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);

  // Sauvegarder la signature
  const saveSignature = useCallback(() => {
    if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
      const dataUrl = sigCanvasRef.current.toDataURL("image/png");
      setSignaturePreview(dataUrl);
    }
  }, []);

  // Effacer la signature
  const clearSignature = useCallback(() => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear();
      setSignaturePreview(null);
    }
  }, []);

  // Annuler le dernier trait
  const undoSignature = useCallback(() => {
    if (sigCanvasRef.current) {
      const data = sigCanvasRef.current.toData();
      if (data.length > 0) {
        data.pop();
        sigCanvasRef.current.fromData(data);
      }
    }
  }, []);

  // Gérer l'upload de fichier PDF
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

  // Ajouter une signature à la page
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

  // Supprimer une signature
  const removeSignature = (index: number) => {
    setSignaturePositions((prev) => prev.filter((_, i) => i !== index));
    setSelectedSignature(null);
  };

  // Gérer le drag des signatures
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

  // Créer un nouveau PDF avec signatures uniquement
  const createSignaturePDF = async () => {
    if (!signaturePreview) return;

    setIsExporting(true);

    try {
      const pdf = new jsPDF("p", "mm", "a4");

      // Ajouter la signature au centre de la page
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const sigWidth = 60;
      const sigHeight = 30;
      const x = (pageWidth - sigWidth) / 2;
      const y = (pageHeight - sigHeight) / 2;

      pdf.addImage(signaturePreview, "PNG", x, y, sigWidth, sigHeight);

      // Ajouter un titre
      pdf.setFontSize(16);
      pdf.text("Document de Signature", pageWidth / 2, 30, { align: "center" });

      pdf.setFontSize(10);
      pdf.text(
        `Créé le ${new Date().toLocaleDateString("fr-FR")}`,
        pageWidth / 2,
        y + sigHeight + 20,
        { align: "center" }
      );

      pdf.save("signature.pdf");
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      alert("Erreur lors de l'export du PDF");
    } finally {
      setIsExporting(false);
    }
  };

  // Exporter PDF avec signatures positionnées (version simplifiée)
  const exportSignedPDF = async () => {
    if (!signaturePreview) return;

    setIsExporting(true);

    try {
      const pdf = new jsPDF("p", "mm", "a4");

      if (signaturePositions.length > 0) {
        // Créer une page pour chaque signature
        signaturePositions.forEach((sigPos, index) => {
          if (index > 0) {
            pdf.addPage();
          }

          // Convertir les coordonnées pixel en mm
          const x = (sigPos.x * 210) / 600;
          const y = (sigPos.y * 297) / 800;
          const width = (sigPos.width * 210) / 600;
          const height = (sigPos.height * 297) / 800;

          pdf.addImage(signaturePreview, "PNG", x, y, width, height);

          pdf.setFontSize(10);
          pdf.text(`Page ${sigPos.page}`, x, y - 5);
        });
      } else {
        // Si pas de positions, créer un PDF simple avec la signature
        const pageWidth = 210;
        const pageHeight = 297;
        const sigWidth = 60;
        const sigHeight = 30;
        const x = (pageWidth - sigWidth) / 2;
        const y = (pageHeight - sigHeight) / 2;

        pdf.addImage(signaturePreview, "PNG", x, y, sigWidth, sigHeight);
      }

      const fileName = pdfFile
        ? `${pdfFile.name.replace(".pdf", "")}_signé.pdf`
        : "document_signé.pdf";

      pdf.save(fileName);
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      alert("Erreur lors de l'export du PDF");
    } finally {
      setIsExporting(false);
    }
  };

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

        <div className="flex flex-col gap-8">
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
            <div className="border-2 border-dashed border-gray-300 rounded-xl mb-6 overflow-hidden min-h-72 bg-gray-50 p-4">
              <SignatureCanvas
                ref={sigCanvasRef}
                penColor="#1f2937"
                backgroundColor="#ffffff"
                minWidth={1}
                maxWidth={3}
                throttle={16}
                minDistance={5}
                canvasProps={{
                  height: 500,
                  className: "sigCanvas border rounded-lg bg-white w-full",
                }}
                clearOnResize={false}
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
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Annuler
              </button>
              <button
                onClick={saveSignature}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                <Save className="h-4 w-4" />
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
                <div className="mt-3 space-y-2">
                  <button
                    onClick={createSignaturePDF}
                    disabled={isExporting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white rounded-lg transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Créer PDF de signature
                  </button>
                  {pdfFile && (
                    <button
                      onClick={addSignatureToPage}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                      <Move className="h-4 w-4" />
                      Ajouter à la page {currentPage}
                    </button>
                  )}
                </div>
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
