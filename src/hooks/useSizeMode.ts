import { useEffect, useRef, useState } from "react";

export type SizeMode = "compact" | "medium" | "expanded";

/**
 * Hook that observes element size and returns appropriate size mode
 * for responsive widget layouts
 */
export function useSizeMode() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = useState<SizeMode>("expanded");

  useEffect(() => {
    if (!ref.current) return;
    
    const el = ref.current;
    const ro = new ResizeObserver(entries => {
      const cr = entries[0].contentRect;
      
      // Determine mode based on available space
      if (cr.width < 280 || cr.height < 120) {
        setMode("compact");
      } else if (cr.width < 420 || cr.height < 220) {
        setMode("medium");
      } else {
        setMode("expanded");
      }
    });
    
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, mode };
}
