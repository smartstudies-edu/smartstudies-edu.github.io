import { useEffect, useRef } from "react";

interface AdBannerProps {
  slot?: string;
  format?: "horizontal" | "vertical" | "square";
  className?: string;
}

/**
 * Generic ad banner placeholder.
 * Replace the inner content with your ad network's script/tag when ready.
 * Supports Google AdSense, Monetag, ad.plus, etc.
 *
 * Usage: <AdBanner slot="top-banner" format="horizontal" />
 */
const AdBanner = ({ slot = "default", format = "horizontal", className = "" }: AdBannerProps) => {
  const adRef = useRef<HTMLDivElement>(null);

  const sizeClass =
    format === "horizontal"
      ? "h-[90px] w-full"
      : format === "vertical"
      ? "w-[160px] h-[600px]"
      : "w-[300px] h-[250px]";

  // Hook for injecting ad network scripts — uncomment when ready
  // useEffect(() => {
  //   if (adRef.current) {
  //     // Example: inject ad script here
  //   }
  // }, [slot]);

  return (
    <div
      ref={adRef}
      data-ad-slot={slot}
      className={`flex items-center justify-center rounded-lg border border-border/50 bg-muted/30 overflow-hidden ${sizeClass} ${className}`}
    >
      {/* Placeholder — replace with ad network code */}
      <p className="text-[10px] text-muted-foreground/40 select-none">Ad Space</p>
    </div>
  );
};

export default AdBanner;
