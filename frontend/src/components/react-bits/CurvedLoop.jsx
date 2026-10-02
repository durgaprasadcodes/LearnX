import React, { useRef, useEffect, useState, useMemo, useId } from "react";

/**
 * CurvedLoop Component (from React Bits)
 * Clean, borderless curved loop marquee with fluid touch & drag swiping
 */
export default function CurvedLoop({
  marqueeText = "FASTAPI • REACT.JS • LANGCHAIN • FAISS • MYSQL • REDIS • PYTHON • SUPABASE • ALEMBIC • JWT • DOCKER • VITE • ",
  speed = 1.6,
  className = "",
  curveAmount = 120,
  direction = "left",
  interactive = true,
}) {
  const text = useMemo(() => {
    const hasTrailing = /\s|\u00A0$/.test(marqueeText);
    return (hasTrailing ? marqueeText.replace(/\s+$/, "") : marqueeText) + "\u00A0";
  }, [marqueeText]);

  const containerRef = useRef(null);
  const measureRef = useRef(null);
  const textPathRef = useRef(null);
  const pathRef = useRef(null);
  const [spacing, setSpacing] = useState(0);
  const [offset, setOffset] = useState(0);
  const offsetRef = useRef(0);
  const uid = useId();
  const pathId = `curve-${uid.replace(/:/g, "")}`;
  const pathD = `M-100,50 Q720,${50 + curveAmount} 1600,50`;

  const isDragging = useRef(false);
  const startX = useRef(0);
  const dirRef = useRef(direction);
  const currentSpeed = useRef(speed);

  const textLength = spacing;
  const totalText = textLength
    ? Array(Math.ceil(2600 / textLength) + 3)
        .fill(text)
        .join("")
    : text;
  const ready = spacing > 0;

  useEffect(() => {
    if (measureRef.current) {
      setSpacing(measureRef.current.getComputedTextLength());
    }
  }, [text, className]);

  useEffect(() => {
    if (!spacing) return;
    const initial = -spacing;
    offsetRef.current = initial;
    setOffset(initial);
    if (textPathRef.current) {
      textPathRef.current.setAttribute("startOffset", initial + "px");
    }
  }, [spacing]);

  // Continuous loop animation loop
  useEffect(() => {
    if (!spacing || !ready) return;
    let animId;

    const step = () => {
      if (!isDragging.current && textPathRef.current) {
        const delta = dirRef.current === "right" ? currentSpeed.current : -currentSpeed.current;
        let next = offsetRef.current + delta;
        const wrapPoint = spacing;

        if (next <= -wrapPoint) next += wrapPoint;
        if (next > 0) next -= wrapPoint;

        offsetRef.current = next;
        textPathRef.current.setAttribute("startOffset", next + "px");
      }
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [spacing, ready]);

  // Touch and pointer swiping handlers
  const handlePointerDown = (e) => {
    if (!interactive) return;
    isDragging.current = true;
    startX.current = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    try {
      if (containerRef.current && e.pointerId !== undefined) {
        containerRef.current.setPointerCapture(e.pointerId);
      }
    } catch (_) {}
  };

  const handlePointerMove = (e) => {
    if (!interactive || !isDragging.current) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const dx = clientX - startX.current;
    startX.current = clientX;

    if (textPathRef.current && spacing > 0) {
      let next = offsetRef.current + dx;
      const wrapPoint = spacing;

      if (next <= -wrapPoint) next += wrapPoint;
      if (next > 0) next -= wrapPoint;

      offsetRef.current = next;
      textPathRef.current.setAttribute("startOffset", next + "px");
      dirRef.current = dx >= 0 ? "right" : "left";
    }
  };

  const handlePointerUp = (e) => {
    if (!interactive) return;
    isDragging.current = false;
    try {
      if (containerRef.current && e.pointerId !== undefined) {
        containerRef.current.releasePointerCapture(e.pointerId);
      }
    } catch (_) {}
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full flex items-center justify-center overflow-hidden py-2 select-none bg-transparent"
      style={{
        visibility: ready ? "visible" : "hidden",
        touchAction: "none",
        cursor: isDragging.current ? "grabbing" : "grab",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
    >
      <svg
        className="w-full overflow-visible block aspect-[1440/150] text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-widest leading-none drop-shadow-[0_8px_20px_rgba(168,85,247,0.3)] pointer-events-none"
        viewBox="0 0 1440 150"
      >
        <text
          ref={measureRef}
          xmlSpace="preserve"
          style={{ visibility: "hidden", opacity: 0, pointerEvents: "none" }}
        >
          {text}
        </text>
        <defs>
          <path ref={pathRef} id={pathId} d={pathD} fill="none" stroke="transparent" />
          <linearGradient id="plainPurpleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="35%" stopColor="#e879f9" />
            <stop offset="70%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>
        {ready && (
          <text
            xmlSpace="preserve"
            className={`fill-[url(#plainPurpleGradient)] ${className}`}
            style={{ fontWeight: 800, letterSpacing: "0.14em" }}
          >
            <textPath ref={textPathRef} href={`#${pathId}`} startOffset={offset + "px"} xmlSpace="preserve">
              {totalText}
            </textPath>
          </text>
        )}
      </svg>
    </div>
  );
}
