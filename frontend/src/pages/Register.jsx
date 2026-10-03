import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Lock, ArrowRight, Sparkles, AlertCircle } from "lucide-react";

export default function Register() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await register(name, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Registration failed. Email may already be in use."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05040a] text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-purple-700/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Brand Header */}
      <div className="text-center mb-8 relative z-10">
        <Link to="/" className="inline-flex items-center gap-2.5 group mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-fuchsia-500 p-[1.5px] shadow-[0_0_20px_rgba(168,85,247,0.4)] group-hover:scale-105 transition-all flex items-center justify-center">
            <div className="w-full h-full bg-[#0d0a18] rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-300" />
            </div>
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">
            Learn<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400">X</span>
          </span>
        </Link>
        <h1 className="text-3xl font-bold text-white tracking-tight">Create Account</h1>
        <p className="text-sm text-zinc-400 mt-1">Join the LearnX learning & AI platform</p>
      </div>

      {/* Register Card */}
      <div className="w-full max-w-md bg-[#0d0a17] border border-zinc-800/80 rounded-2xl p-6 sm:p-8 relative z-10 shadow-2xl">
        
        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={loginWithGoogle}
          className="w-full py-2.5 px-4 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/70 text-white font-medium text-sm transition-all flex items-center justify-center gap-3 cursor-pointer mb-6"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Sign up with Google</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center mb-6">
          <div className="border-t border-zinc-800 w-full" />
          <span className="bg-[#0d0a17] px-3 text-xs text-zinc-500 uppercase tracking-wider font-mono">
            Or with email
          </span>
          <div className="border-t border-zinc-800 w-full" />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Manual Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141022] border border-zinc-800 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141022] border border-zinc-800 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141022] border border-zinc-800 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? (
              <span>Creating your account...</span>
            ) : (
              <>
                <span>Create Account & Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Already registered?{" "}
          <Link
            to="/login"
            className="text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-2 ml-1"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
