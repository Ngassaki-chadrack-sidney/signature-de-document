"use client";

import { useTranslations } from "next-intl";
import { Upload, Pen, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
  currentStep: number;
}

const steps = ["upload", "sign", "download"] as const;

export function Stepper({ currentStep }: StepperProps) {
  const t = useTranslations("stepper");

  const icons = [Upload, Pen, Download];

  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((step, i) => {
        const Icon = icons[i];
        const isActive = currentStep >= i;

        return (
          <div key={step} className="flex items-center">
            {i > 0 && (
              <div
                className={cn(
                  "h-px w-8 sm:w-12 transition-colors duration-300",
                  isActive ? "bg-foreground" : "bg-border"
                )}
              />
            )}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border transition-colors duration-300",
                  isActive
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-muted-foreground"
                )}
              >
                <Icon className="h-3 w-3" />
              </div>
              <span
                className={cn(
                  "text-[10px] leading-none transition-colors duration-300",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {t(step)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
