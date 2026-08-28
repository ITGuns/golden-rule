"use client";

import { Canvas } from "@react-three/fiber";
import {
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Performance-governed R3F canvas:
 * - mounts only when scrolled near the viewport (IntersectionObserver)
 * - caps device pixel ratio, disables antialiasing on small screens
 * - renders a static poster instead of WebGL for reduced-motion users
 *   or when WebGL is unavailable
 */
export function SceneCanvas({
  children,
  className,
  fallback,
  camera = { position: [0, 1.4, 7], fov: 42 },
  eager = false,
}: {
  children: ReactNode;
  className?: string;
  fallback?: ReactNode;
  camera?: { position: [number, number, number]; fov: number };
  eager?: boolean;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(eager);
  const [webgl, setWebgl] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    try {
      const c = document.createElement("canvas");
      setWebgl(!!(c.getContext("webgl2") || c.getContext("webgl")));
    } catch {
      setWebgl(false);
    }
  }, []);

  useEffect(() => {
    if (eager || !holder.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    io.observe(holder.current);
    return () => io.disconnect();
  }, [eager]);

  const showStatic = reduced || !webgl;

  return (
    <div ref={holder} className={className} aria-hidden>
      {showStatic
        ? fallback ?? null
        : visible && (
            <Suspense fallback={fallback ?? null}>
              <Canvas
                camera={camera}
                dpr={[1, isMobile ? 1.4 : 1.8]}
                gl={{
                  antialias: !isMobile,
                  powerPreference: "high-performance",
                  alpha: true,
                }}
                style={{ width: "100%", height: "100%" }}
              >
                {children}
              </Canvas>
            </Suspense>
          )}
    </div>
  );
}
