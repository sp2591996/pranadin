"use client";

import Image from "next/image";
import { useS } from "@/features/shared/strings";

/** Pose illustration with the visible "AI-generated image" caption (D-027). */
export function YogaImage({ file, alt, priority = false, className = "" }: { file: string; alt: string; priority?: boolean; className?: string }) {
  const s = useS();
  return (
    <figure className={`mx-auto w-full max-w-[320px] ${className}`}>
      <Image
        src={`/yoga/${file}`}
        alt={alt}
        width={480}
        height={480}
        priority={priority}
        className="h-auto w-full rounded-lg border border-divider bg-surface-2"
      />
      <figcaption className="mt-1 text-center text-[0.875rem] leading-5 text-text-muted">{s("yoga.aiImage")}</figcaption>
    </figure>
  );
}
