import React, { useState } from "react";
import { Mail, Send, CheckCircle2, Globe, Users, Sparkles } from "lucide-react";
import { GlobeLive } from "@/components/ui/cobe-globe-live";

export default function ThreeFormsSection() {
  const [formData, setFormData] = useState({
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  const handleReset = () => {
    setFormData({ email: "", subject: "", message: "" });
    setSubmitted(false);
  };

  return (
    <section
      id="three-forms"
      className="relative py-20 sm:py-28 bg-[#05040a] border-t border-zinc-900 overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium mb-3">
            <Globe className="w-3.5 h-3.5 text-purple-400" />
            <span>Global Connect</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Connect With LearnX Worldwide
          </h2>
          <p className="mt-2 text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
            Join active learners and engineers across the globe. Drag and rotate the live globe or drop us a message.
          </p>
        </div>

        {/* 2-Column Responsive Grid: Live Interactive Globe on Left, Connect Form on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Cobe Live Interactive 3D Globe */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center">
            <div className="w-full max-w-[360px] sm:max-w-[420px] aspect-square relative flex items-center justify-center">
              <GlobeLive className="w-full h-full" />
            </div>

            <div className="flex items-center gap-5 mt-3 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-zinc-300 font-medium">6 Active Global Hubs</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-purple-400">
                <Users className="w-3.5 h-3.5" />
                <span>Interactive 3D Rotation</span>
              </div>
            </div>
          </div>

          {/* Right Column: Connect / Feedback Form Card */}
          <div className="lg:col-span-6">
            <div className="rounded-3xl bg-[#0c0818]/90 border border-zinc-800/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl hover:border-purple-500/30 transition-all">
              <div className="mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <span>Share Your Feedback</span>
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Have questions, ideas, or feedback? We'd love to hear from you.
                </p>
              </div>

              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Feedback Received
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-6">
                    Thank you for helping us improve LearnX. We review every message carefully.
                  </p>
                  <button
                    onClick={handleReset}
                    className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email Field */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="you@domain.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141022] border border-zinc-800 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Subject Field */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      placeholder="What's this regarding?"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#141022] border border-zinc-800 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>

                  {/* Message Field */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center justify-between">
                      <span>Message</span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {formData.message.length} chars
                      </span>
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      placeholder="Share your thoughts, questions, or suggestions..."
                      className="w-full px-4 py-2.5 rounded-xl bg-[#141022] border border-zinc-800 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    {loading ? (
                      <span>Submitting...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
