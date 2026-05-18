"use client";

import { useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Eraser, RotateCcw, Save, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import type SignaturePad from "signature_pad";
import { COLORS } from "@/lib/constants";

interface SignatureCanvasProps {
  onInit: (canvas: HTMLCanvasElement) => void;
  signaturePadRef: React.MutableRefObject<SignaturePad | null>;
  isEmpty: boolean;
  signaturePreview: string | null;
  color: string;
  onColorChange: (color: string) => void;
  onSave: () => void;
  onClear: () => void;
  onUndo: () => void;
}

export function SignatureCanvas({
  onInit,
  isEmpty,
  signaturePreview,
  color,
  onColorChange,
  onSave,
  onClear,
  onUndo,
}: SignatureCanvasProps) {
  const t = useTranslations("signature");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const setRef = useCallback(
    (node: HTMLCanvasElement | null) => {
      if (node && node !== canvasRef.current) {
        canvasRef.current = node;
        onInit(node);
      }
    },
    [onInit]
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/30">
        <canvas
          ref={setRef}
          className="block w-full cursor-crosshair"
          style={{ touchAction: "none" }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          disabled={isEmpty}
        >
          <Eraser className="mr-1.5 h-3.5 w-3.5" />
          {t("actions.clear")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onUndo}
          disabled={isEmpty}
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          {t("actions.undo")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          disabled={isEmpty}
        >
          <Save className="mr-1.5 h-3.5 w-3.5" />
          {t("actions.save")}
        </Button>

        <div className="ml-auto flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onColorChange(c)}
              className={`h-5 w-5 rounded-full border transition-transform hover:scale-110 ${
                color === c ? "ring-1 ring-offset-1 ring-foreground" : ""
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
          <label className="flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-muted-foreground hover:text-foreground">
            <Palette className="h-4 w-4" />
            <input
              type="color"
              value={color}
              onChange={(e) => onColorChange(e.target.value)}
              className="h-5 w-5 cursor-pointer rounded border"
            />
          </label>
        </div>
      </div>

      {signaturePreview && (
        <div className="rounded-lg border p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            {t("preview")}
          </p>
          <img
            src={signaturePreview}
            alt="Signature preview"
            className="max-h-16 object-contain"
          />
        </div>
      )}
    </div>
  );
}
