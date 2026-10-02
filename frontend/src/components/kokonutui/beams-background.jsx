import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

/**
 * KokonutUI Beams Background
 * Animated canvas beams tailored with vibrant purple & deep black obsidian glow
 */
function createBeam(width, height) {
  const angle = -35 + Math.random() * 10;
  // Purple / Violet / Indigo hue spectrum (260 - 300)
  const hueBase = 265;
  const hueRange = 45;

  return {
    x: Math.random() * width * 1.5 - width * 0.25,
    y: Math.random() * height * 1.5 - height * 0.25,
    width: 35 + Math.random() * 70,
    length: height * 2.2,
    angle,
    speed: 0.5 + Math.random() * 0.9,
    opacity: 0.16 + Math.random() * 0.22,
    hue: hueBase + Math.random() * hueRange,
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: 0.015 + Math.random() * 0.025,
  };
}

export default function BeamsBackground({
  children,
  className,
  intensity = "strong",
}) {
  const canvasRef = useRef(null);
  const beamsRef = useRef([]);
  const animationFrameRef = useRef(0);
  const MINIMUM_BEAMS = 22;

  const opacityMap = {
    subtle: 0.6,
    medium: 0.85,
    strong: 1.1,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width || window.innerWidth;
      const h = rect.height || window.innerHeight;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);

      const totalBeams = Math.floor(MINIMUM_BEAMS * 1.4);
      beamsRef.current = Array.from({ length: totalBeams }, () =>
        createBeam(w, h)
      );
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    function resetBeam(beam, index, totalBeams) {
      if (!canvas) return beam;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width || window.innerWidth;
      const h = rect.height || window.innerHeight;

      const column = index % 3;
      const spacing = w / 3;

      beam.y = h + 120;
      beam.x = column * spacing + spacing / 2 + (Math.random() - 0.5) * spacing * 0.6;
      beam.width = 80 + Math.random() * 110;
      beam.speed = 0.4 + Math.random() * 0.5;
      beam.hue = 265 + (index * 40) / totalBeams;
      beam.opacity = 0.18 + Math.random() * 0.15;
      return beam;
    }

    function drawBeam(ctx, beam) {
      ctx.save();
      ctx.translate(beam.x, beam.y);
      ctx.rotate((beam.angle * Math.PI) / 180);

      const pulsingOpacity =
        beam.opacity *
        (0.8 + Math.sin(beam.pulse) * 0.25) *
        (opacityMap[intensity] || 1);

      const gradient = ctx.createLinearGradient(0, 0, 0, beam.length);

      gradient.addColorStop(0, `hsla(${beam.hue}, 90%, 65%, 0)`);
      gradient.addColorStop(0.15, `hsla(${beam.hue}, 92%, 60%, ${pulsingOpacity * 0.4})`);
      gradient.addColorStop(0.5, `hsla(${beam.hue}, 95%, 65%, ${pulsingOpacity})`);
      gradient.addColorStop(0.85, `hsla(${beam.hue}, 90%, 55%, ${pulsingOpacity * 0.4})`);
      gradient.addColorStop(1, `hsla(${beam.hue}, 85%, 45%, 0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(-beam.width / 2, 0, beam.width, beam.length);
      ctx.restore();
    }

    function animate() {
      if (!canvas || !ctx) return;

      const rect = canvas.getBoundingClientRect();
      const w = rect.width || window.innerWidth;
      const h = rect.height || window.innerHeight;

      ctx.clearRect(0, 0, w, h);
      ctx.filter = "blur(28px)";

      const totalBeams = beamsRef.current.length;
      beamsRef.current.forEach((beam, index) => {
        beam.y -= beam.speed;
        beam.pulse += beam.pulseSpeed;

        if (beam.y + beam.length < -100) {
          resetBeam(beam, index, totalBeams);
        }

        drawBeam(ctx, beam);
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [intensity]);

  return (
    <div
      className={cn(
        "relative min-h-[90vh] w-full overflow-hidden bg-[#06060c]",
        className
      )}
    >
      {/* Background glow layers */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-purple-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[500px] h-[350px] bg-violet-800/15 rounded-full blur-[120px] pointer-events-none" />

      {/* HTML5 Canvas Beams */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ filter: "blur(18px)" }}
      />

      {/* Pulsing backdrop sheen */}
      <motion.div
        animate={{
          opacity: [0.15, 0.35, 0.15],
        }}
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(168,85,247,0.25),rgba(255,255,255,0))]"
        transition={{
          duration: 8,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />

      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage: `radial-gradient(#c084fc 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Children content (Hero & interactive elements) */}
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
}
