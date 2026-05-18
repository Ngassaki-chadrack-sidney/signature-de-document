"use client";

import { useTranslations } from "next-intl";
import { Github, Coffee } from "lucide-react";
import { AUTHOR_NAME, APP_GITHUB, BUY_ME_A_COFFEE } from "@/lib/constants";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-center gap-4 px-4 text-xs text-muted-foreground">
        <span>
          {t("built_by")}{" "}
          <a
            href={APP_GITHUB}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-2 hover:text-foreground"
          >
            {AUTHOR_NAME}
          </a>{" "}
          — {t("role")}
        </span>

        <span className="hidden sm:inline">·</span>

        <a
          href={APP_GITHUB}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-1 hover:text-foreground sm:inline-flex"
        >
          <Github className="h-3 w-3" />
          {t("source")}
        </a>

        <a
          href={BUY_ME_A_COFFEE}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-1 hover:text-foreground sm:inline-flex"
        >
          <Coffee className="h-3 w-3" />
          {t("coffee")}
        </a>

        <span className="hidden sm:inline">·</span>
        <span>© {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
