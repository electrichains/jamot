"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { CanvasWorkspace } from "@/components/canvas/CanvasWorkspace";

export default function CanvasPage() {
  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-background text-foreground">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Jamot
        </Link>
        <span className="font-display text-sm font-semibold">Canvas</span>
      </header>
      <CanvasWorkspace />
    </div>
  );
}
