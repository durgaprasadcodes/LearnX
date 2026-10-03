import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, ArrowRight, RotateCcw, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import api from "../services/api";

export default function VerifyOtp() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail, verifyGoogleOtp } = useAuth();

  const emailParam = searchParams.get("email") || "";
  const googleIdParam = searchParams.get("google_id") || "";

  const [email, setEmail] = useState(emailParam);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(600); // 10 minutes (Redis TTL)
  const [resending, setResending] = useState(false);

  const inputRefs = useRef([]);

  // Auto focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleDigitChange = (index, value) => {
    // Only accept numeric characters
    const cleanVal = value.replace(/[^0-9]/g, "");
    const updated = [...otpDigits];

    if (cleanVal.length > 1) {
      // User pasted multiple digits
      const chars = cleanVal.slice(0, 6).split("");
      chars.forEach((c, i) => {
        if (i < 6) updated[i] = c;
      });
      setOtpDigits(updated);
      const nextIdx = Math.min(chars.length, 5);
      inputRefs.current[nextIdx]?.focus();
      return;
    }

    updated[index] = cleanVal;
    setOtpDigits(updated);

    // Auto-advance
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (!pasteData) return;

    const updated = [...otpDigits];
    pasteData.split("").forEach((c, i) => {
      if (i < 6) updated[i] = c;
    });
    setOtpDigits(updated);

    const nextIdx = Math.min(pasteData.length, 5);
    inputRefs.current[nextIdx]?.focus();
  };

  const fullOtp = otpDigits.join("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (fullOtp.length !== 6) {
      setError("Please enter the complete 6-digit OTP code.");
      return;
    }
    if (!email) {
      setError("Please specify the email address receiving the OTP.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (googleIdParam) {
        // Google OAuth linking verification
        await verifyGoogleOtp(email, googleIdParam, fullOtp);
      } else {
        // Standard email registration verification
        await verifyEmail(email, fullOtp);
      }

      setSuccess("Verification successful! Redirecting to home page...");
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (err) {
      const serverMsg = err.response?.data?.detail || err.response?.data?.message;
      if (err.response?.status === 404) {
        setError(
          serverMsg ||
            "No pending OTP found for this email, or the OTP has expired. Please request a new code."
        );
      } else {
        setError(serverMsg || "Invalid or expired OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      setError("Please provide your email to resend OTP.");
      return;
    }
    setResending(true);
    setError("");

    try {
      if (googleIdParam) {
        window.location.href = `${API_BASE_URL}/auth/google/login`;
        return;
      }
      // Re-trigger registration OTP via backend
      await api.post("/auth/register", {
        name: email.split("@")[0],
        email: email,
        password: "TempSecretPassword!1",
      });
      setCountdown(600);
      setSuccess(`A new OTP has been dispatched to ${email}`);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Could not resend OTP. If the account is already registered, please go to Login."
      );
    } finally {
      setResending(false);
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
        <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-3 text-purple-400">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Enter Security Code</h1>
        <p className="text-sm text-zinc-400 mt-1 max-w-sm mx-auto">
          We sent a 6-digit verification code to{" "}
          <b className="text-purple-300">{email || "your email address"}</b>
        </p>
      </div>

      {/* Verification Card */}
      <div className="w-full max-w-md bg-[#0d0a17] border border-zinc-800/80 rounded-2xl p-6 sm:p-8 relative z-10 shadow-2xl">
        
        {/* Status Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Email display/change if empty */}
        {!emailParam && (
          <div className="mb-5">
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Confirm Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full px-4 py-2 rounded-xl bg-[#141022] border border-zinc-800 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 6 Digit Input Group */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-3 text-center">
              6-Digit One-Time Password
            </label>
            <div className="flex items-center justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-[#141022] border border-zinc-800 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 transition-colors"
                />
              ))}
            </div>
          </div>

          {/* Countdown & Resend Option */}
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>
              Expires in: <b className="text-purple-300 font-mono">{formatTime(countdown)}</b>
            </span>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resending || countdown > 540}
              className={`flex items-center gap-1 transition-colors cursor-pointer ${
                countdown > 540 ? "text-zinc-600 cursor-not-allowed" : "text-purple-400 hover:text-purple-300"
              }`}
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
              <span>{resending ? "Sending..." : "Resend OTP"}</span>
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || fullOtp.length !== 6}
            className={`w-full py-2.5 px-4 rounded-xl text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              fullOtp.length === 6
                ? "bg-purple-600 hover:bg-purple-500 active:bg-purple-700"
                : "bg-zinc-800/80 text-zinc-500 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <span>Verifying code...</span>
            ) : (
              <>
                <span>Complete Verification</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Want to use another email?{" "}
          <Link
            to="/register"
            className="text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-2 ml-1"
          >
            Go back
          </Link>
        </p>
      </div>
    </div>
  );
}
