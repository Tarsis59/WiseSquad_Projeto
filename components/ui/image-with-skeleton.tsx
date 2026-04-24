"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageWithSkeletonProps {
  src: string | null | undefined;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export function ImageWithSkeleton({ src, alt, width, height, className }: ImageWithSkeletonProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-2 bg-slate-100 text-slate-400", className)}>
        <ImageOff className="size-5 opacity-40" />
        <span className="text-xs text-slate-400">Imagem indisponível</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {!loaded && (
        <div className="absolute inset-0 animate-pulse rounded-[inherit] bg-slate-200" />
      )}
      <Image
        alt={alt}
        src={src}
        width={width}
        height={height}
        unoptimized
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        className={cn(
          className,
          "transition-opacity duration-700",
          loaded ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}
