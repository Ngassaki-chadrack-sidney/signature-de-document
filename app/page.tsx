"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import SignaturePad from "signature_pad";

export default function SignaturePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sigRef = useRef<any>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

  // helper: dataURL -> Blob (utile si tu veux uploader)
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

  // Enregistrer la signature et afficher l'aperçu à droite
  const saveSignature = useCallback(() => {
    const sig = sigRef.current;
    if (!sig || sig.isEmpty()) return;

    // signature_pad expose toDataURL
    const dataUrl = sig.toDataURL("image/png");
    setPreview(dataUrl);

    // créer blob (optionnel: prêt pour upload)
    const blob = dataURLToBlob(dataUrl);
    setPreviewBlob(blob);

    // exemple: console log
    console.log("Signature sauvegardée (dataUrl):", dataUrl);
    // si tu veux uploader: envoie `blob` via fetch/FormData
  }, []);

  // Effacer tout
  const clear = useCallback(() => {
    sigRef.current?.clear();
    setIsEmpty(true);
    // on peut conserver l'aperçu même après effacement (choix UX)
  }, []);

  // Undo dernier trait (Retour)
  const undo = useCallback(() => {
    const sig = sigRef.current;
    if (!sig) return;
    const data = sig.toData();
    if (!data || data.length === 0) return;
    data.pop();
    sig.fromData(data);
    setIsEmpty(sig.isEmpty());
  }, []);

  // Init signature_pad + resize handling
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

    // gérer état début/fin dessin
    // signature_pad permet d'assigner les callbacks
    sig.onBegin = () => {
      setIsDrawing(true);
    };
    sig.onEnd = () => {
      setIsDrawing(false);
      setIsEmpty(sig.isEmpty());
    };

    const resizeCanvas = () => {
      // NOTE: on choisit ici de *réinitialiser* lors du resize pour garder la précision.
      // Si tu veux garder la signature après resize, on peut sauvegarder les données puis les restaurer (plus loin).
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const parent = canvas.parentElement;
      if (!parent) return;

      const width = Math.min(700, parent.clientWidth); // max width 700 (comme avant)
      const height = 260;

      // mettre la taille en pixels réels
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);

      // taille CSS visible
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        // reset transform puis appliquer ratio (évite facteur d'échelle cumulatif)
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      }

      // on clear pour éviter artefacts; si tu veux conserver, il faut sauvegarder et rescaler les points
      sig.clear();
      setIsEmpty(true);
    };

    // initial resize + listener
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      sig.off && sig.off(); // si signature_pad expose off
    };
  }, []);

  // télécharge l'aperçu (ou l'image courante)
  const downloadPreview = useCallback(() => {
    const url = preview ?? sigRef.current?.toDataURL("image/png");
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = "signature.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [preview]);

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl mb-3">Signature document</h1>

      <div className="flex gap-4">
        {/* colonne gauche : canvas + contrôles */}
        <div className="max-w-[100%]">
          <div className="flex gap-2.5 mb-4">
            <button
              onClick={() => {
                clear();
              }}
              className="p-2 bg-red-500 hover:opacity-90 text-white rounded-md"
            >
              Effacer
            </button>

            <button
              onClick={saveSignature}
              className="p-2 bg-green-500 hover:opacity-90 text-white rounded-md disabled:opacity-50"
              disabled={isEmpty}
            >
              Enregistrer
            </button>

            <button
              onClick={undo}
              className="p-2 bg-gray-200 text-black rounded-md hover:opacity-90 disabled:opacity-50"
              disabled={isEmpty}
              title="Annuler le dernier trait"
            >
              Retour
            </button>

            <button
              onClick={downloadPreview}
              className="p-2 bg-white text-black rounded-md hover:opacity-90 border"
              disabled={isEmpty && !preview}
            >
              Télécharger
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="">
              <div className="border border-gray-300 rounded-md">
                <canvas ref={canvasRef} className="block touch-action-none" />
              </div>
            </div>
            <div className="p-3 border rounded-md bg-white w-full md:w-80">
              <h2 className="text-sm font-medium mb-2 text-black">
                Aperçu de la signature
              </h2>
              {preview ? (
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={preview}
                    alt="Aperçu signature"
                    className="max-w-full border rounded w-full"
                    style={{ maxHeight: 130, objectFit: "contain" }}
                  />
                  <div className="text-xs text-black">
                    Format: PNG — prêt à être uploadé.
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={downloadPreview}
                      className="px-3 py-1 rounded border text-sm bg-black text-white hover:opacity-90"
                    >
                      Télécharger
                    </button>
                    <button
                      onClick={() => {
                        // Exemple: reset preview si user veut refaire
                        setPreview(null);
                        setPreviewBlob(null);
                      }}
                      className="px-3 py-1 rounded border text-sm bg-black text-white hover:opacity-90"
                    >
                      Refaire
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-black text-center">
                  Aucun aperçu — clique sur Enregistrer pour générer l'image.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* colonne droite : aperçu (à côté du drawer) */}
        <aside className="w-80 flex-shrink-0"></aside>
      </div>
    </div>
  );
}
