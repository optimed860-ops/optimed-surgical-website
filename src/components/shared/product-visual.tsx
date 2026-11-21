import Image from "next/image";
import { cn } from "@/lib/utils";
import { publicStorageUrl, type PublicBucket } from "@/lib/storage";
import { CategoryIcon } from "./category-icon";

type Props = {
  imagePath: string | null;
  alt: string;
  hints: (string | null | undefined)[];
  bucket?: PublicBucket;
  sizes?: string;
  priority?: boolean;
  className?: string;
  iconClassName?: string;
};

/**
 * Product or category image on a clean white field (like an instrument
 * catalogue). Without a photo, shows a quiet line icon instead of stock imagery.
 */
export function ProductVisual({
  imagePath,
  alt,
  hints,
  bucket = "product-images",
  sizes = "(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw",
  priority,
  className,
  iconClassName,
}: Props) {
  const src = publicStorageUrl(bucket, imagePath);

  if (src) {
    return (
      <div className={cn("relative overflow-hidden bg-white", className)}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-contain p-[8%]" />
      </div>
    );
  }

  return (
    <div
      className={cn("relative grid place-items-center overflow-hidden bg-[#f5f7f9]", className)}
      role="img"
      aria-label={`${alt}, photo coming soon`}
    >
      <CategoryIcon hints={hints} className={cn("size-12 text-navy-800/20", iconClassName)} strokeWidth={1.1} aria-hidden />
    </div>
  );
}
