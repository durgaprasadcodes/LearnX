import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import {
  Sparkles,
  ShieldCheck,
  User,
  Mail,
  LogOut,
  FileText,
  TrendingUp,
  Cpu,
  CheckCircle2,
  Clock,
  KeyRound,
  ExternalLink,
} from "lucide-react";

export default function Dashboard() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05040a] text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-purple-300 font-mono tracking-wider">Loading user profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05040a] text-slate-100 flex flex-col relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-purple-700/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Floating Navbar */}
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 pt-32 pb-16 relative z-10">
        {/* Welcome Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-[#120a26]/90 via-[#0d0918]/80 to-[#150d2c]/90 border border-purple-500/20 p-6 sm:p-10 shadow-[0_10px_40px_rgba(0,0,0,0.6)] mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-purple-500/50 shadow-[0_0_25px_rgba(168,85,247,0.3)]"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-purple-600 to-fuchsia-600 flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-white shadow-[0_0_25px_rgba(168,85,247,0.3)]">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
            )}

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium mb-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Authenticated Session</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Welcome, {user?.name || "Learner"}
              </h1>
              <p className="text-sm text-zinc-400 flex items-center gap-2 mt-1">
                <Mail className="w-3.5 h-3.5 text-zinc-500" />
                <span>{user?.email || "user@learnx.io"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/profile"
              className="px-4 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:text-white text-xs font-medium transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.15)]"
            >
              <User className="w-4 h-4 text-purple-400" />
              <span>My Profile</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-medium transition-all flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>

        {/* Security & Authentication Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-2xl bg-[#0c0916] border border-zinc-800/80 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Auth Method
              </span>
              <KeyRound className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-lg font-bold text-white">
              {user?.picture ? "Google OAuth 2.0" : "Email & Password + OTP"}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Protected by FastAPI JWT & Redis OTP Verification
            </p>
          </div>

          <div className="rounded-2xl bg-[#0c0916] border border-zinc-800/80 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Token Security
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-lg font-bold text-emerald-400 flex items-center gap-1.5">
              <span>HttpOnly Cookies</span>
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Rotating refresh tokens & XSS-immune cookie storage
            </p>
          </div>

          <div className="rounded-2xl bg-[#0c0916] border border-zinc-800/80 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                User ID
              </span>
              <Clock className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-lg font-mono font-bold text-zinc-200 truncate">
              {user?.id ? `UID-${String(user.id).slice(0, 8)}` : "Verified Member"}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Registered in LearnX Postgres/SQLite Database
            </p>
          </div>
        </div>

        {/* Feature Hub & Actions */}
        <div className="rounded-2xl bg-[#0c0916] border border-zinc-800/80 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Quick Actions</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Explore tools available on your verified account
              </p>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
              3 Modules Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/courses"
              className="p-4 rounded-xl bg-[#130f22] hover:bg-[#1a142e] border border-purple-500/20 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-3 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-white group-hover:text-purple-300 transition-colors">
                  ATS Resume Scorer
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Upload your CV and receive AI matching scores and keyword gaps.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs text-purple-400 font-medium">
                <span>Open Scorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </Link>

            <Link
              to="/roadmaps"
              className="p-4 rounded-xl bg-[#130f22] hover:bg-[#1a142e] border border-purple-500/20 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-3 group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-white group-hover:text-purple-300 transition-colors">
                  Engineering Roadmaps
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Follow curated career roadmaps for Full-Stack, AI, and Cloud.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs text-purple-400 font-medium">
                <span>View Roadmaps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </Link>

            <Link
              to="/"
              className="p-4 rounded-xl bg-[#130f22] hover:bg-[#1a142e] border border-purple-500/20 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-3 group-hover:scale-105 transition-transform">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-white group-hover:text-purple-300 transition-colors">
                  LearnX Home & Tools
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Return to the main portal to explore tech stack and interactive forms.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs text-purple-400 font-medium">
                <span>Explore Home</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
