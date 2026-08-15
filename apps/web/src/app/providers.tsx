"use client";

import type { ReactNode } from "react";

import { CopilotKit } from "@copilotkit/react-core/v2";
import { ThemeProvider } from "@/components/theme-provider";
import { catalog, theme } from "@/components/a2ui/a2ui-catalog";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <CopilotKit runtimeUrl="/api/copilotkit" a2ui={{ theme, catalog }}>
        {children}
      </CopilotKit>
    </ThemeProvider>
  );
}
