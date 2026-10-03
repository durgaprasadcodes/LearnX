import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import DarkVeil from "./react-bits/DarkVeil";
import { Sparkles, ArrowRight } from "lucide-react";

export default function HeroSection({ user }) {
  const navigate = useNavigate();

  const scrollToForms = () => {
    const el = document.getElementById("three-forms");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTech = () => {
    const el = document.getElementById("tech-stack");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#05040a] flex flex-col items-center justify-center pt-24 pb-16 px-4">
      
      {/* 1. REACT BITS DARKVEIL WEBGL SHADER CANVAS BACKGROUND */}
      <div className="absolute inset-0 w-full h-full pointer-events-none opacity-85">
        <DarkVeil
          hueShift={-0.1}
          noiseIntensity={0.03}
          scanlineIntensity={0.12}
          speed={0.55}
          warpAmount={0.35}
          resolutionScale={1}
        />
      </div>

      {/* Subtle radial dark vignette around the edges to blend into page */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,#05040a_85%)]" />

      {/* 2. CENTERED HERO CONTENT (MATCHING IMAGE 2) */}
      <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center px-4">
        

        {/* Big Bold Headline from Image 2 */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-[1.08] max-w-4xl drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]"
        >
          Become emboldened by the flame of ambition
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-6 text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl leading-relaxed font-normal"
        >
          Accelerate your engineering journey with LearnX. Engineered with production-grade FastAPI, LangChain FAISS semantic screening, and real-time interactive intelligence.
        </motion.p>

        {/* Centered Action Buttons (Get started + Learn more from Image 2) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          {/* Primary Button: White Pill "Get started" */}
          <button
            onClick={() => navigate("/resume")}
            className="px-8 py-3.5 rounded-full bg-white text-black font-bold text-sm sm:text-base hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all shadow-[0_0_35px_rgba(255,255,255,0.4)] cursor-pointer flex items-center gap-2"
          >
            <span>Get started</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </button>

          {/* Secondary Button: Dark Translucent Glass Pill "Learn more" */}
          <button
            onClick={scrollToTech}
            className="px-8 py-3.5 rounded-full bg-[#150f26]/80 hover:bg-[#201838] text-white font-semibold text-sm sm:text-base border border-white/10 hover:border-white/25 hover:scale-105 active:scale-95 transition-all backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] cursor-pointer"
          >
            Learn more
          </button>
        </motion.div>

        {/* Quick Highlights Row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 pt-8 border-t border-purple-900/30 flex flex-wrap items-center justify-center gap-8 sm:gap-14 text-xs font-mono text-purple-300/80"
        >
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            FastAPI Latency &lt;15ms
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            LangChain FAISS Engine
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            HttpOnly Cookie Security
          </span>
        </motion.div>

      </div>
    </div>
  );
}
