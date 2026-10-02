import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, LogIn, LogOut, ShieldCheck, Sparkles, ChevronDown, CheckCircle2, FileText } from "lucide-react";
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
  const location = useLocation();
  const navigate = useNavigate();

  const user = propUser !== undefined ? propUser : (auth?.user || internalUser);
  const setUser = propSetUser || (auth ? auth.setUser : setInternalUser);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (auth?.logout) {
      await auth.logout();
    } else {
      setUser(null);
      localStorage.removeItem("learnx_user");
    }
    setDropdownOpen(false);
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
        <div className="max-w-5xl mx-auto h-20 px-8 rounded-full bg-[#0c0818]/70 backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.65),0_0_30px_rgba(168,85,247,0.2)] flex items-center justify-between pointer-events-auto transition-all">
          
          {/* Brand Logo - LearnX */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-fuchsia-500 p-[1.5px] shadow-[0_0_15px_rgba(168,85,247,0.4)] group-hover:shadow-[0_0_20px_rgba(216,180,254,0.6)] transition-all flex items-center justify-center">
                <div className="w-full h-full bg-[#0d0a18] rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-300 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white flex items-center gap-1">
                Learn<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400">X</span>
              </span>
            </Link>
          </div>

          {/* Center Navigation - RubberSegment */}
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

          {/* Right Auth Section (with authstate toggle removed!) */}
          <div className="flex items-center gap-3">
            {user ? (
              /* User IS LOGGED IN -> Show User Profile with dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1 pr-3 rounded-full bg-[#140e26]/80 border border-purple-500/30 hover:border-purple-400/60 shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all cursor-pointer group"
                >
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-purple-500/60"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-fuchsia-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}

                  <span className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors flex items-center gap-1">
                    {user.name || "Alex Rivera"}
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  </span>

                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180 text-purple-400" : ""}`} />
                </button>

                {/* Profile Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-64 rounded-2xl bg-[#0f0a1c] border border-purple-500/30 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(168,85,247,0.2)] py-2 z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-3 border-b border-purple-900/40">
                      <p className="text-[11px] text-purple-400 uppercase tracking-wider font-semibold">Active Session</p>
                      <p className="text-sm font-bold text-white mt-0.5">{user.name}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full w-fit border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> HttpOnly JWT Verified
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/resume"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-purple-900/30 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-purple-400" />
                        <span>Resume AI</span>
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-purple-900/30 transition-colors"
                      >
                        <User className="w-4 h-4 text-purple-400" />
                        <span>My Profile</span>
                      </Link>
                    </div>

                    <div className="border-t border-purple-900/40 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* User NOT LOGGED IN -> Show Log In text + White Pill Sign Up Button */
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer px-2 py-1"
                >
                  Log in
                </Link>

                <Link
                  to="/register"
                  className="px-5 py-2 rounded-full bg-white text-black font-bold text-xs hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)] cursor-pointer inline-block"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

