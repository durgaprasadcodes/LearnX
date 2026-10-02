import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Navbar from "../components/Navbar";
import {
  User,
  Mail,
  Image as ImageIcon,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  LogOut,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  Code2,
  KeyRound,
  Calendar,
  AlertCircle
} from "lucide-react";

export default function Profile({
  name: propName,
  email: propEmail,
  imag_url: propImagUrl,
  image_url: propImageUrl,
}) {
  const { user: authUser, logout, checkAuth } = useAuth();
  const navigate = useNavigate();

  // State to hold profile data
  const [profileData, setProfileData] = useState({
    id: authUser?.id || null,
    name: propName || authUser?.name || "",
    email: propEmail || authUser?.email || "",
    imag_url: propImagUrl || propImageUrl || authUser?.image_url || authUser?.picture || "",
  });

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [rawBackendData, setRawBackendData] = useState(null);
  const [showJsonView, setShowJsonView] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch freshest user data directly from backend
  const fetchBackendProfile = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    setErrorMsg("");

    try {
      let res;
      try {
        res = await api.get("/auth/get/me");
      } catch (err) {
        if (err.response?.status === 404) {
          res = await api.get("/me");
        } else {
          throw err;
        }
      }

      if (res.data) {
        setRawBackendData(res.data);
        const resolvedName = res.data.name || propName || authUser?.name || "";
        const resolvedEmail = res.data.email || propEmail || authUser?.email || "";
        const resolvedImage =
          res.data.image_url ||
          res.data.imag_url ||
          res.data.picture ||
          propImagUrl ||
          propImageUrl ||
          authUser?.image_url ||
          authUser?.picture ||
          "";

        setProfileData({
          id: res.data.id || authUser?.id,
          name: resolvedName,
          email: resolvedEmail,
          imag_url: resolvedImage,
        });
      }
    } catch (err) {
      console.warn("Could not fetch backend profile directly, using context fallback", err);
      if (authUser) {
        setProfileData({
          id: authUser.id,
          name: authUser.name || propName || "",
          email: authUser.email || propEmail || "",
          imag_url: authUser.image_url || authUser.picture || propImagUrl || propImageUrl || "",
        });
        setRawBackendData(authUser);
      } else {
        setErrorMsg("Failed to synchronize with backend. Please ensure backend server is running.");
      }
    } finally {
      if (showSpinner) setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendProfile();
  }, [authUser]);

  // Copy to clipboard helper
  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSignOut = async () => {
    if (logout) await logout();
    navigate("/login");
  };

  const avatarSrc =
    profileData.imag_url ||
    (profileData.email
      ? `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(profileData.email)}`
      : null);

  return (
    <div className="min-h-screen bg-[#05040a] text-slate-100 flex flex-col relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[360px] bg-purple-700/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-[450px] h-[450px] bg-fuchsia-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Floating Navbar */}
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 pt-32 pb-20 relative z-10">
        
        {/* Navigation Breadcrumb / Top Bar */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-purple-300 transition-colors px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 hover:border-purple-500/30"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchBackendProfile(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 text-xs font-semibold text-purple-300 hover:text-white px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition-all cursor-pointer disabled:opacity-50"
              title="Fetch latest data from /me endpoint"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span>{refreshing ? "Syncing..." : "Sync Backend Data"}</span>
            </button>

            <button
              onClick={() => setShowJsonView(!showJsonView)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5 text-purple-400" />
              <span>{showJsonView ? "Hide JSON" : "Inspect Backend JSON"}</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Developer JSON Inspector (Toggleable) */}
        {showJsonView && (
          <div className="mb-8 rounded-2xl bg-[#090614] border border-purple-500/30 p-5 shadow-[0_0_30px_rgba(168,85,247,0.15)] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-3 border-b border-purple-900/30 pb-2">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-mono font-semibold text-purple-200">
                  FastAPI Backend Response Payload (/auth/get/me)
                </span>
              </div>
              <button
                onClick={() => handleCopy(JSON.stringify(rawBackendData || profileData, null, 2), "json")}
                className="text-[11px] font-mono text-zinc-400 hover:text-white flex items-center gap-1"
              >
                {copiedField === "json" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedField === "json" ? "Copied JSON" : "Copy Payload"}
              </button>
            </div>
            <pre className="text-xs font-mono text-emerald-400 bg-black/60 p-4 rounded-xl overflow-x-auto border border-white/5">
              {JSON.stringify(rawBackendData || profileData, null, 2)}
            </pre>
          </div>
        )}

        {/* Hero Profile Glass Card */}
        <div className="rounded-3xl bg-gradient-to-r from-[#120a26]/90 via-[#0d0918]/90 to-[#160d2e]/90 border border-purple-500/30 p-6 sm:p-10 shadow-[0_15px_50px_rgba(0,0,0,0.7),0_0_35px_rgba(168,85,247,0.15)] mb-8 backdrop-blur-2xl">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
            
            {/* Avatar Section */}
            <div className="relative group shrink-0">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl p-1 bg-gradient-to-tr from-purple-500 via-fuchsia-500 to-indigo-500 shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={profileData.name || "User Avatar"}
                    className="w-full h-full object-cover rounded-[22px] bg-[#0d0a18]"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(profileData.email || "user")}`;
                    }}
                  />
                ) : (
                  <div className="w-full h-full rounded-[22px] bg-[#0d0a18] flex items-center justify-center text-4xl font-extrabold text-purple-300">
                    {profileData.name ? profileData.name.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
              </div>

              {/* Status Badge Indicator */}
              <div
                className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-[#0d0a18] border-2 border-purple-500 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]"
                title="Active HttpOnly Authenticated Session"
              >
                <CheckCircle2 className="w-4 h-4 fill-emerald-500/20" />
              </div>
            </div>

            {/* Profile Summary & Details */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium mb-2.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Account Profile</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center justify-center md:justify-start gap-3">
                <span>{profileData.name || "LearnX Member"}</span>
              </h1>

              <p className="text-sm sm:text-base text-zinc-400 mt-1.5 flex items-center justify-center md:justify-start gap-2">
                <Mail className="w-4 h-4 text-purple-400 shrink-0" />
                <span>{profileData.email || "No email available"}</span>
              </p>

              {/* Metadata Badges */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mt-5">
                <span className="px-3 py-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-mono text-zinc-300 flex items-center gap-1.5">
                  <KeyRound className="w-3 h-3 text-purple-400" />
                  <span>ID: {profileData.id ? `#${profileData.id}` : "Session UID"}</span>
                </span>

                <span className="px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>{profileData.imag_url ? "OAuth Google Profile" : "LearnX Standard"}</span>
                </span>

                <span className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>JWT Encrypted</span>
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5 w-full md:w-auto">
              <button
                onClick={handleSignOut}
                className="px-5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(244,63,94,0.15)]"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3 Detailed Attribute Cards for Name, Email, Image URL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* 1. Name Card */}
          <div className="rounded-2xl bg-[#0c0818]/90 border border-zinc-800/80 hover:border-purple-500/40 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <User className="w-5 h-5" />
              </div>
              <button
                onClick={() => handleCopy(profileData.name, "name")}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                title="Copy Name"
              >
                {copiedField === "name" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Account Name</p>
            <p className="text-lg font-bold text-white mt-1 truncate">
              {profileData.name || "Not provided"}
            </p>
            <p className="text-xs text-zinc-500 mt-2">
              Retrieved from backend payload property: <code className="text-purple-300 font-mono">name</code>
            </p>
          </div>

          {/* 2. Email Card */}
          <div className="rounded-2xl bg-[#0c0818]/90 border border-zinc-800/80 hover:border-purple-500/40 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Mail className="w-5 h-5" />
              </div>
              <button
                onClick={() => handleCopy(profileData.email, "email")}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                title="Copy Email"
              >
                {copiedField === "email" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Registered Email</p>
            <p className="text-lg font-bold text-white mt-1 truncate">
              {profileData.email || "No email bound"}
            </p>
            <p className="text-xs text-zinc-500 mt-2">
              Retrieved from backend payload property: <code className="text-purple-300 font-mono">email</code>
            </p>
          </div>

          {/* 3. Image URL Card */}
          <div className="rounded-2xl bg-[#0c0818]/90 border border-zinc-800/80 hover:border-purple-500/40 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <ImageIcon className="w-5 h-5" />
              </div>
              {profileData.imag_url && (
                <button
                  onClick={() => handleCopy(profileData.imag_url, "image_url")}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  title="Copy Image URL"
                >
                  {copiedField === "image_url" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>

            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Profile Image URL</p>
            <p className="text-sm font-mono font-medium text-purple-300 mt-1 truncate" title={profileData.imag_url || "None"}>
              {profileData.imag_url || "Default avatar active"}
            </p>
            <p className="text-xs text-zinc-500 mt-2">
              Retrieved from backend payload property: <code className="text-purple-300 font-mono">imag_url / picture</code>
            </p>
          </div>

        </div>

        {/* Quick Links / Dashboard Portal */}
        <div className="rounded-2xl bg-[#0c0818]/70 border border-zinc-800/80 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white">Need to upload a new resume or explore roadmaps?</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Your profile is verified and synced across the LearnX platform.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all flex items-center gap-2"
            >
              <span>Go to Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </main>
    </div>
  );
}
