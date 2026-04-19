"use client";

import { LeftVisual } from "./LeftVisual";
import { RightAuthPanel } from "./RightAuthPanel";

/**
 * Premium split auth shell: immersive visual (md+) + glass auth panel.
 * Tab state is driven by the route (`/login` vs `/register`) inside {@link RightAuthPanel}.
 */
export function SplitAuthLayout() {
  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-[#0A0F1E] text-white overflow-hidden">
      {/* Page-wide subtle grain */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.04] mix-blend-soft-light"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />

      <div className="relative z-0 hidden md:flex md:w-3/5 h-full">
        <LeftVisual />
      </div>
      <div className="relative z-10 flex h-full w-full flex-col overflow-y-auto px-4 py-8 md:w-2/5 md:px-10">
        <div className="m-auto flex w-full justify-center">
          <RightAuthPanel />
        </div>
      </div>
    </div>
  );
}
