"use client";

import { Rnd } from "react-rnd";
import { X } from "lucide-react";
import type { SignaturePosition } from "@/types";
import {
  SIGNATURE_MIN_WIDTH,
  SIGNATURE_MIN_HEIGHT,
  SIGNATURE_MAX_WIDTH,
  SIGNATURE_MAX_HEIGHT,
} from "@/lib/constants";

interface SignatureOverlayProps {
  position: SignaturePosition;
  preview: string;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (x: number, y: number, width: number, height: number) => void;
  onRemove: () => void;
}

export function SignatureOverlay({
  position,
  preview,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
}: SignatureOverlayProps) {
  return (
    <Rnd
      size={{ width: position.width, height: position.height }}
      position={{ x: position.x, y: position.y }}
      onDragStop={(_, d) =>
        onUpdate(d.x, d.y, position.width, position.height)
      }
      onResizeStop={(_, __, ref, ___, pos) =>
        onUpdate(
          pos.x,
          pos.y,
          parseInt(ref.style.width),
          parseInt(ref.style.height)
        )
      }
      bounds="parent"
      onClick={onSelect}
      enableResizing={{
        top: true,
        right: true,
        bottom: true,
        left: true,
        topRight: true,
        bottomRight: true,
        bottomLeft: true,
        topLeft: true,
      }}
      minWidth={SIGNATURE_MIN_WIDTH}
      minHeight={SIGNATURE_MIN_HEIGHT}
      maxWidth={SIGNATURE_MAX_WIDTH}
      maxHeight={SIGNATURE_MAX_HEIGHT}
      className={`rounded ${
        isSelected
          ? "ring-1 ring-foreground bg-foreground/5"
          : "ring-0 hover:ring-1 hover:ring-muted-foreground/30"
      }`}
    >
      <div className="relative h-full w-full">
        <img
          src={preview}
          alt="Signature"
          className="h-full w-full object-contain pointer-events-none select-none"
          draggable={false}
        />
        {isSelected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </Rnd>
  );
}
