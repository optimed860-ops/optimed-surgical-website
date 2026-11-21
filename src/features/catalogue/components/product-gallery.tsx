"use client";

import { useState } from "react";
import { ProductVisual } from "@/components/shared/product-visual";
import { cn } from "@/lib/utils";
import type { ImageRef } from "../types";

export function ProductGallery({ images, name, hints }: { images: ImageRef[]; name: string; hints: (string | null)[] }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? null;

  return (
    <div className="space-y-3">
      <ProductVisual
        imagePath={current?.path ?? null}
        alt={current?.alt ?? name}
        hints={hints}
        priority
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="aspect-square rounded-lg border border-line"
        iconClassName="size-24"
      />
      {images.length > 1 ? (
        <ul className="grid grid-cols-5 gap-2" aria-label="Product images">
          {images.map((image, index) => (
            <li key={image.path}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show image ${index + 1} of ${images.length}`}
                aria-pressed={index === active}
                className={cn(
                  "block w-full border transition-colors",
                  index === active ? "border-navy-800 ring-1 ring-navy-800" : "border-line hover:border-navy-800/40",
                )}
              >
                <ProductVisual imagePath={image.path} alt="" hints={hints} sizes="120px" className="aspect-square" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
