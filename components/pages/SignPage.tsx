"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Stepper } from "@/components/layout/Stepper";
import { DropZone } from "@/components/document/DropZone";
import { DocumentList } from "@/components/document/DocumentList";
import { SignatureCanvas } from "@/components/document/SignatureCanvas";
import { DocumentViewer } from "@/components/document/DocumentViewer";
import { SignatureOverlay } from "@/components/document/SignatureOverlay";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { useDocumentUpload } from "@/hooks/useDocumentUpload";
import { useSignatureFlow } from "@/hooks/useSignatureFlow";
import { DEFAULT_PDF_SCALE } from "@/lib/constants";

export function SignPage() {
  const t = useTranslations();
  const dragDrop = useDragAndDrop();
  const upload = useDocumentUpload();
  const signature = useSignatureFlow();

  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [pdfScale, setPdfScale] = useState(DEFAULT_PDF_SCALE);


  const currentStep = upload.currentDocument
    ? signature.signaturePreview
      ? 2
      : 1
    : 0;

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      const file = dragDrop.handleDrop(e);
      if (file) {
        upload.addDocument(file);
        setCurrentPage(1);
        setNumPages(0);
        toast.success(t("document.toast.uploaded"));
      }
    },
    [dragDrop, upload, t]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = dragDrop.handleFileSelect(e);
      if (file) {
        upload.addDocument(file);
        setCurrentPage(1);
        setNumPages(0);
        toast.success(t("document.toast.uploaded"));
      } else if (dragDrop.error) {
        toast.error(t("dropzone.error.invalid_type"));
      }
    },
    [dragDrop, upload, t]
  );

  const handleRemove = useCallback(() => {
    upload.removeDocument();
    signature.clearSignature();
    setCurrentPage(1);
    setNumPages(0);
  }, [upload, signature]);

  const handleSaveSignature = useCallback(() => {
    signature.saveSignature();
    toast.success(t("signature.toast.saved"));
  }, [signature, t]);

  const handleClearSignature = useCallback(() => {
    signature.clearSignature();
    toast.success(t("signature.toast.cleared"));
  }, [signature, t]);

  const handleAddToPage = useCallback(() => {
    signature.addToPage(currentPage);
    toast.success(t("document.toast.signed"));
  }, [signature, currentPage, t]);

  const handleExport = useCallback(async () => {
    if (!upload.currentDocument) return;
    const success = await signature.exportPDF(upload.currentDocument.file);
    if (success) {
      upload.updateStatus("signed");
      toast.success(t("document.export.success"));
    } else {
      toast.error(t("document.export.error"));
    }
  }, [upload, signature, t]);

  const currentSignaturePositions = signature.positions.filter(
    (sig) => sig.page === currentPage
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-medium tracking-tight">
              {t("app.tagline")}
            </h1>
          </div>

          <Stepper currentStep={currentStep} />

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t("signature.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SignatureCanvas
                  onInit={signature.initPad}
                  signaturePadRef={signature.signaturePadRef}
                  isEmpty={signature.isEmpty}
                  signaturePreview={signature.signaturePreview}
                  color={signature.color}
                  onColorChange={signature.setColor}
                  onSave={handleSaveSignature}
                  onClear={handleClearSignature}
                  onUndo={signature.undoSignature}
                />

                {signature.signaturePreview && upload.currentDocument && (
                  <Button
                    className="mt-4 w-full"
                    size="sm"
                    onClick={handleAddToPage}
                  >
                    {t("signature.add_to_page", { page: currentPage })}
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t("document.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!upload.currentDocument ? (
                  <DropZone
                    state={dragDrop.dropState}
                    errorLabel={dragDrop.errorLabel}
                    onDragEnter={dragDrop.handleDragEnter}
                    onDragOver={dragDrop.handleDragOver}
                    onDragLeave={dragDrop.handleDragLeave}
                    onDrop={handleDrop}
                    onFileSelect={handleFileSelect}
                  />
                ) : (
                  <>
                    <DocumentList
                      documents={upload.documents}
                      onRemove={handleRemove}
                    />

                    <DocumentViewer
                      file={upload.currentDocument.file}
                      currentPage={currentPage}
                      numPages={numPages}
                      scale={pdfScale}
                      onPageChange={setCurrentPage}
                      onScaleChange={setPdfScale}
                      onLoadSuccess={({ numPages: n }) => setNumPages(n)}
                    >
                      {currentSignaturePositions.map((sig) => {
                        const globalIndex =
                          signature.positions.indexOf(sig);
                        return (
                          <SignatureOverlay
                            key={globalIndex}
                            position={sig}
                            preview={signature.signaturePreview!}
                            isSelected={
                              signature.selectedIndex === globalIndex
                            }
                            onSelect={() =>
                              signature.setSelectedIndex(globalIndex)
                            }
                            onUpdate={(x, y, w, h) =>
                              signature.updatePosition(
                                globalIndex,
                                x,
                                y,
                                w,
                                h
                              )
                            }
                            onRemove={() =>
                              signature.removePosition(globalIndex)
                            }
                          />
                        );
                      })}
                    </DocumentViewer>

                    {signature.positions.length > 0 && (
                      <Button
                        className="w-full"
                        onClick={handleExport}
                        disabled={signature.isExporting}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {signature.isExporting
                          ? t("document.export.progress")
                          : t("document.export.button")}
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
