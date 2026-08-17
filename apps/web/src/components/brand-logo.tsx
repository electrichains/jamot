"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

const LOGO_DIMENSIONS = { width: 425, height: 430 };

export function BrandLogo({
  className,
  alt = "Jamot",
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <span
      className={cn("relative inline-block shrink-0 overflow-hidden", className)}
      aria-hidden={!alt}
    >
      <Image
        src="/brand/jamot-logo.png"
        alt={alt}
        width={LOGO_DIMENSIONS.width}
        height={LOGO_DIMENSIONS.height}
        priority
        className="absolute inset-0 h-full w-full object-contain dark:hidden"
      />
      <Image
        src="/brand/jamot-logo-white.webp"
        alt={alt}
        width={LOGO_DIMENSIONS.width}
        height={LOGO_DIMENSIONS.height}
        priority
        className="absolute inset-0 hidden h-full w-full object-contain dark:block"
      />
    </span>
  );
}