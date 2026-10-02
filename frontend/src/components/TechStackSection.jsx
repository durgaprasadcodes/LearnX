import React from "react";
import CurvedLoop from "./react-bits/CurvedLoop";
import DepthCarousel from "./DepthCarousel";
import { Cpu, Sparkles } from "lucide-react";

const depthCarouselTechItems = [
  {
    name: "FastAPI",
    category: "Backend REST Engine",
    iconClass: "devicon-fastapi-plain colored",
    desc: "Asynchronous Python framework with OpenAPI docs, Pydantic schemas, and JWT rotation.",
    badge: "CORE API",
  },
  {
    name: "React.js",
    category: "Frontend Client UI",
    iconClass: "devicon-react-original colored",
    desc: "Component architecture with React 19, Framer Motion, and dynamic glassmorphic panels.",
    badge: "CLIENT UI",
  },
  {
    name: "Python 3.12",
    category: "Core Language & AI",
    iconClass: "devicon-python-plain colored",
    desc: "Powers LangChain document processing, PyMuPDF parsing, and FAISS vector similarity.",
    badge: "RUNTIME",
  },
  {
    name: "MySQL & Supabase",
    category: "Persistent Storage",
    iconClass: "devicon-mysql-plain colored",
    desc: "Relational storage for user authentication models, cryptographic hashes, and tokens.",
    badge: "DATABASE",
  },
  {
    name: "Redis Cache",
    category: "In-Memory Cache & OTP",
    iconClass: "devicon-redis-plain colored",
    desc: "Sub-millisecond temporary memory for OTP email verification and rate-limiting auth flows.",
    badge: "CACHE",
  },
  {
    name: "SQLAlchemy",
    category: "ORM & Alembic",
    iconClass: "devicon-sqlalchemy-plain colored",
    desc: "Declarative database models with seamless version-controlled schema migrations.",
    badge: "ORM",
  },
  {
    name: "Tailwind CSS",
    category: "Design System",
    iconClass: "devicon-tailwindcss-plain colored",
    desc: "Obsidian dark and neon purple palette with responsive glassmorphism and animations.",
    badge: "STYLING",
  },
  {
    name: "Docker",
    category: "Containerization",
    iconClass: "devicon-docker-plain colored",
    desc: "Isolated multi-stage container deployment for API, Redis, and vector stores.",
    badge: "DEVOPS",
  },
];

export default function TechStackSection() {
  return (
    <section id="tech-stack" className="relative py-20 bg-[#05040a] overflow-hidden border-t border-purple-900/20">
      
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-80 h-80 bg-fuchsia-900/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/40 border border-purple-800/40 text-purple-300 text-xs font-semibold mb-4 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            PART 2 • PRODUCTION ARCHITECTURE
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Integrated <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-300">Tech Stack</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-400 leading-relaxed">
            Engineered with industry-grade Python FastAPI, FAISS semantic vector search, MySQL/Supabase database models, and modern React 19.
          </p>
        </div>

        {/* 1. CURVED LOOP - CLEAN PLAIN BACKGROUND, ZERO BORDER, WORKING TOUCH/MOUSE SWIPING */}
        <div className="w-full my-6 bg-transparent">
          <CurvedLoop
            marqueeText="FASTAPI • REACT.JS • LANGCHAIN • FAISS • MYSQL • REDIS • PYTHON • SUPABASE • ALEMBIC • JWT • DOCKER • VITE • "
            speed={1.8}
            curveAmount={110}
            interactive={true}
            className="text-purple-300 hover:text-white transition-colors"
          />
        </div>

        {/* 2. REACT BITS DEPTH CAROUSEL WITH REAL DEVICONS & TECH STACK CARDS */}
        <div className="my-14">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-700/40 text-[11px] font-mono text-purple-300 mb-2">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>3D DEPTH PERSPECTIVE • POWERED BY GSAP</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Tech Stack 3D Depth Carousel
            </h3>
            <p className="text-xs text-purple-300/70 mt-1">
              Real Devicon icons & tech stack cards floating in 3D perspective • Swipe, drag, or click to explore
            </p>
          </div>

          <div style={{ height: "520px", position: "relative" }} className="w-full">
            <DepthCarousel
              items={depthCarouselTechItems}
              cardWidth={310}
              cardHeight={400}
              depth={220}
              spread={95}
              tilt={22}
              tiltDirection="right"
              perspective={1400}
              visibleCards={4}
              falloff={0.2}
              blur={6}
              autoplay
              loop
            />
          </div>
        </div>

      </div>
    </section>
  );
}
