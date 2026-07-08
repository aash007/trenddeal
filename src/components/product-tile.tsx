import Image from "next/image";
import { SWATCH } from "@/lib/constants";

// Graceful fallback tile (spec §12: "real image with graceful fallback tile").
// Seeded/simulated products have no real image_url yet; live-ingested ones do.
export function ProductTile({
  imageUrl,
  color,
  category,
  size = 130,
}: {
  imageUrl: string | null;
  color: string | null;
  category: string;
  size?: number;
}) {
  if (imageUrl) {
    return (
      <div className="relative w-full overflow-hidden rounded-xl" style={{ height: size }}>
        <Image src={imageUrl} alt={category} fill sizes="240px" className="object-cover" unoptimized />
      </div>
    );
  }
  const c1 = (color && SWATCH[color]) || "#999";
  return (
    <div
      className="relative flex items-center justify-center rounded-xl overflow-hidden w-full"
      style={{ height: size, background: `linear-gradient(135deg, ${c1} 0%, ${c1}cc 60%, ${c1}88 100%)` }}
    >
      <span className="td-disp font-semibold text-white/85 text-sm capitalize text-center px-2">{category}</span>
      {color && (
        <span
          className="absolute bottom-1.5 right-2 td-mono text-[9px] px-1.5 py-0.5 rounded"
          style={{ background: "#00000055", color: "#fff" }}
        >
          {color}
        </span>
      )}
    </div>
  );
}
