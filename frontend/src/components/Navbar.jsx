import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  User,
  LogOut,
  Sparkles,
  CheckCircle2,
  FileText,
  Home as HomeIcon,
  Menu,
  X,
  ArrowRight,
} from "lucide-react";
import RubberSegment from "./react-bits/RubberSegment";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ user: propUser, setUser: propSetUser }) {
  const auth = (() => {
    try {
      return useAuth();
    } catch (_) {
      return null;
    }
  })();

  const [internalUser, setInternalUser] = useState(null);
  const [siderOpen, setSiderOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const user = propUser !== undefined ? propUser : (auth?.user || internalUser);
  const setUser = propSetUser || (auth ? auth.setUser : setInternalUser);

  useEffect(() => {
    if (propUser === undefined && !auth?.user) {
      const saved = localStorage.getItem("learnx_user");
      if (saved) {
        try {
          setInternalUser(JSON.parse(saved));
        } catch (_) {}
      }
    }
  }, [propUser, auth?.user]);

  // Close sider on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setSiderOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    if (auth?.logout) {
      await auth.logout();
    } else {
      setUser(null);
      localStorage.removeItem("learnx_user");
      localStorage.removeItem("learnx_token");
    }
    setSiderOpen(false);
    navigate("/");
  };

  const navSegmentItems = [
    { value: "/", label: "Home" },
    { value: "/resume", label: "Resume" },
    { value: "/profile", label: "Profile" },
  ];

  const handleSegmentChange = (path) => {
    navigate(path);
  };

  return (
    <>
      {/* Floating Glassmorphism Navbar */}
      <header className="fixed top-0 inset-x-0 z-50 pt-6 px-4 pointer-events-none transition-all">
        <div className="max-w-5xl mx-auto h-20 px-6 sm:px-8 rounded-full bg-[#0c0818]/70 backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.65),0_0_30px_rgba(168,85,247,0.2)] flex items-center justify-between pointer-events-auto transition-all">
          
          {/* Brand Logo - LearnX */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 group">
              <div
                className="w-10 h-10 p-[1.5px] bg-gradient-to-tr from-purple-600 to-fuchsia-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] group-hover:shadow-[0_0_20px_rgba(216,180,254,0.6)] transition-all flex items-center justify-center"
                style={{ borderRadius: "50%" }}
              >
                <div
                  className="w-full h-full bg-[#0d0a18] flex items-center justify-center"
                  style={{ borderRadius: "50%" }}
                >
                  <Sparkles className="w-5 h-5 text-purple-300 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white flex items-center gap-1">
                Learn<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400">X</span>
              </span>
            </Link>
          </div>

          {/* Center Navigation - RubberSegment (for desktop) */}
          <div className="hidden md:flex items-center justify-center">
            <RubberSegment
              items={navSegmentItems}
              value={location.pathname}
              onChange={handleSegmentChange}
              trackColor="rgba(18, 12, 34, 0.65)"
              thumbColor="linear-gradient(135deg, #7c3aed 0%, #9333ea 50%, #c026d3 100%)"
              textColor="rgba(216, 180, 254, 0.75)"
              activeTextColor="#ffffff"
              size="md"
              radius={22}
              inset={3}
              stretch={110}
              squash={3}
              draggable={true}
              aria-label="LearnX Navigation"
            />
          </div>

          {/* Right Section: Simple User Icon (50% border radius) + Sider Hamburger Button */}
          <div className="flex items-center gap-2.5">
            {/* Simple User Icon with 50% border radius */}
            <button
              type="button"
              onClick={() => setSiderOpen(true)}
              title="Open Navigation"
              className="w-10 h-10 flex items-center justify-center p-0.5 bg-[#140e26] border border-purple-500/40 hover:border-purple-400 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all cursor-pointer group"
              style={{ borderRadius: "50%" }}
            >
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name || "User"}
                  className="w-full h-full object-cover"
                  style={{ borderRadius: "50%" }}
                />
              ) : (
                <div
                  className="w-full h-full bg-gradient-to-tr from-purple-600 to-fuchsia-600 flex items-center justify-center text-white font-bold text-xs shadow-inner"
                  style={{ borderRadius: "50%" }}
                >
                  {user?.name ? (
                    user.name.charAt(0).toUpperCase()
                  ) : (
                    <User className="w-4 h-4 text-purple-200" />
                  )}
                </div>
              )}
            </button>

            {/* Sider Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setSiderOpen(true)}
              className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
              style={{ borderRadius: "50%" }}
              title="Open navigation sider"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── Sider (Slide-out Navigation Drawer) ───────────────────────── */}
      {siderOpen && (
        <div className="fixed inset-0 z-50 pointer-events-auto">
          {/* Backdrop Overlay */}
          <div
            onClick={() => setSiderOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300"
          />

          {/* Sider Drawer Panel */}
          <aside
            data-lenis-prevent="true"
            className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-[#0c0818]/95 border-l border-purple-500/25 shadow-[-15px_0_50px_rgba(0,0,0,0.85)] z-50 flex flex-col justify-between p-6 overflow-y-auto backdrop-blur-2xl transition-transform duration-300"
          >
            {/* Top: Header & Close Button */}
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-purple-900/40">
                <Link
                  to="/"
                  onClick={() => setSiderOpen(false)}
                  className="flex items-center gap-2.5"
                >
                  <div
                    className="w-9 h-9 p-[1.5px] bg-gradient-to-tr from-purple-600 to-fuchsia-500 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                    style={{ borderRadius: "50%" }}
                  >
                    <div
                      className="w-full h-full bg-[#0d0a18] flex items-center justify-center"
                      style={{ borderRadius: "50%" }}
                    >
                      <Sparkles className="w-4 h-4 text-purple-300" />
                    </div>
                  </div>
                  <span className="font-extrabold text-xl tracking-tight text-white">
                    Learn<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400">X</span>
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={() => setSiderOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Close navigation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Profile Card inside Sider */}
              <div className="mt-6 p-4 rounded-2xl bg-[#140e26]/80 border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 p-0.5 bg-gradient-to-tr from-purple-500 to-fuchsia-500 shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                    style={{ borderRadius: "50%" }}
                  >
                    {user?.picture ? (
                      <img
                        src={user.picture}
                        alt={user.name || "User"}
                        className="w-full h-full object-cover"
                        style={{ borderRadius: "50%" }}
                      />
                    ) : (
                      <div
                        className="w-full h-full bg-[#181130] flex items-center justify-center text-white font-bold text-base"
                        style={{ borderRadius: "50%" }}
                      >
                        {user?.name ? (
                          user.name.charAt(0).toUpperCase()
                        ) : (
                          <User className="w-6 h-6 text-purple-300" />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate">
                      {user?.name || (user ? "User" : "Guest Explorer")}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {user?.email || "Welcome to LearnX AI"}
                    </p>
                    {user && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium mt-1">
                        <CheckCircle2 className="w-3 h-3" /> Logged In
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation Links in Sider */}
              <div className="mt-6 space-y-1.5">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-purple-300/60 mb-2">
                  Navigation
                </p>

                <Link
                  to="/"
                  onClick={() => setSiderOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                    location.pathname === "/"
                      ? "bg-purple-600/20 text-white border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)] font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <HomeIcon className="w-4 h-4 text-purple-400" />
                  <span>Home</span>
                </Link>

                <Link
                  to="/resume"
                  onClick={() => setSiderOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                    location.pathname === "/resume"
                      ? "bg-purple-600/20 text-white border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)] font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>Resume AI</span>
                </Link>

                <Link
                  to="/profile"
                  onClick={() => setSiderOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                    location.pathname === "/profile"
                      ? "bg-purple-600/20 text-white border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)] font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <User className="w-4 h-4 text-purple-400" />
                  <span>My Profile</span>
                </Link>
              </div>

              {/* Quick Action: Get Started in Sider */}
              <div className="mt-6 pt-4 border-t border-purple-900/30">
                <Link
                  to="/resume"
                  onClick={() => setSiderOpen(false)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold text-xs shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:shadow-[0_0_35px_rgba(168,85,247,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <span>Go to Resume AI</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Bottom: Auth Actions */}
            <div className="pt-6 border-t border-purple-900/40">
              {user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    to="/login"
                    onClick={() => setSiderOpen(false)}
                    className="flex items-center justify-center py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setSiderOpen(false)}
                    className="flex items-center justify-center py-2.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-slate-100 transition-colors shadow-md"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
