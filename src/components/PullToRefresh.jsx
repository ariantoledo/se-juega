import React, { useRef, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

const THRESHOLD = 65;

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const pulling = useRef(false);

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (startY.current === null) return;
    if (window.scrollY > 0) { startY.current = null; return; }
    const dist = e.touches[0].clientY - startY.current;
    if (dist > 0) {
      pulling.current = true;
      setPullDistance(Math.min(dist * 0.45, THRESHOLD * 1.4));
    }
  };

  const handleTouchEnd = async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(42);
      try { await onRefresh(); } catch {}
      setRefreshing(false);
    }
    startY.current = null;
    setPullDistance(0);
  };

  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-20 pointer-events-none"
        style={{
          height: pullDistance,
          opacity: progress,
          overflow: "hidden",
          transition: refreshing ? "none" : "height 0.25s ease, opacity 0.25s ease"
        }}
      >
        <div className="p-2 rounded-full bg-card shadow-md border border-border">
          {refreshing
            ? <Loader2 className="w-4 h-4 text-primary animate-spin" />
            : <RefreshCw className="w-4 h-4 text-primary" style={{ transform: `rotate(${progress * 180}deg)` }} />}
        </div>
      </div>

      {/* Content */}
      <div style={{
        transform: `translateY(${pullDistance}px)`,
        transition: pulling.current ? "none" : "transform 0.3s ease"
      }}>
        {children}
      </div>
    </div>
  );
}