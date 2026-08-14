import type { StaticImageData } from "next/image";

export function assetUrl(asset: StaticImageData | string): string {
  return typeof asset === "string" ? asset : asset.src;
}
