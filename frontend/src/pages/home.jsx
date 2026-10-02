import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import TechStackSection from "../components/TechStackSection";
import ThreeFormsSection from "../components/ThreeFormsSection";
import { useAuth } from "../context/AuthContext";
import { Sparkles, Terminal, ArrowUp } from "lucide-react";

export default function Home() {
  const { user, setUser } = useAuth();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#06060c] text-slate-100 flex flex-col justify-between selection:bg-purple-600 selection:text-white">
      
      {/* ======================================================== */}
      {/* PART 1: NAVBAR & KOKONUTUI BEAMS BACKGROUND HERO */}
      {/* ======================================================== */}
      <section className="w-full relative">
        {/* Navbar with conditional auth profile vs user icon/login/signup and route navigation */}
        <Navbar user={user} setUser={setUser} />
        
        {/* Hero with KokonutUI BeamsBackground canvas animation */}
        <HeroSection user={user} />
      </section>

      {/* ======================================================== */}
      {/* PART 2: TECH STACK WITH DEVICONS & REACT BITS CURVED LOOP */}
      {/* ======================================================== */}
      <TechStackSection />

      {/* ======================================================== */}
      {/* PART 3: 3 INTERACTIVE ANIMATED FORMS IN PURPLE+BLACK THEME */}
      {/* ======================================================== */}
      <ThreeFormsSection />

      {/* Footer */}
      <footer className="w-full border-t border-purple-900/30 bg-[#040308] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-fuchsia-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-white text-lg tracking-tight">Learn<span className="text-purple-400">X</span></span>
              <p className="text-[11px] text-purple-300/60">AI Learning Platform • FastAPI • React 19 • KokonutUI • React Bits</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400">
            <Link to="/" className="hover:text-purple-300 transition-colors">Home</Link>
            <Link to="/courses" className="hover:text-purple-300 transition-colors">Courses</Link>
            <Link to="/roadmaps" className="hover:text-purple-300 transition-colors">Roadmaps</Link>
            <Link to="/community" className="hover:text-purple-300 transition-colors">Community</Link>
            <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-mono">
              <Terminal className="w-3.5 h-3.5" />
              FastAPI Docs
            </a>
          </div>

          <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
            Designed in Obsidian Purple & Black
          </p>
        </div>
      </footer>

      {/* Floating Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-purple-600/80 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.6)] backdrop-blur-md transition-all cursor-pointer hover:scale-110"
          title="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
