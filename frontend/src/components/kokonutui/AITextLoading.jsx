import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const defaultLoadingStates = [
  "Analyzing your resume...",
  "Extracting key information...",
  "Building knowledge graph...",
  "Generating embeddings...",
  "Indexing with FAISS...",
  "Almost ready...",
];

export default function AITextLoading({
  loadingStates = defaultLoadingStates,
  interval = 2200,
  className = "",
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % loadingStates.length);
    }, interval);
    return () => clearInterval(timer);
  }, [loadingStates.length, interval]);

  return (
    <div className={`flex items-center justify-center py-2.5 px-4 ${className}`}>
      <div className="relative w-full py-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: 1,
              y: 0,
              backgroundPosition: ["200% 0%", "0% 0%"],
            }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
              opacity: { duration: 0.25 },
              y: { duration: 0.25 },
              backgroundPosition: {
                duration: 2.2,
                ease: "linear",
                repeat: Infinity,
              },
            }}
            className="flex min-w-max justify-center whitespace-nowrap font-medium text-xs sm:text-sm text-transparent bg-clip-text tracking-wide"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #38bdf8, #818cf8, #c084fc, #818cf8, #38bdf8)",
              backgroundSize: "200% 100%",
            }}
          >
            {loadingStates[currentIndex]}
          </motion.div>
        </AnimatePresence>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-1 mt-1.5">
          {loadingStates.map((_, i) => (
            <div
              key={i}
              className={`w-1 h-1 rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? "bg-sky-400 scale-125 shadow-[0_0_8px_rgba(56,189,248,0.6)]"
                  : i < currentIndex
                  ? "bg-sky-300/70"
                  : "bg-slate-600/40"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
