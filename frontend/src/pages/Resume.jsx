import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Navbar from "../components/Navbar";
import AITextLoading from "../components/kokonutui/AITextLoading";
import {
  FileText,
  AlertCircle,
  Bot,
  User,
  Sparkles,
  Trash2,
  BookOpen,
  Paperclip,
  Send,
  Loader2,
} from "lucide-react";

// ─── Markdown-lite renderer ────────────────────────────────
function RenderMarkdown({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <div className="prose-sm text-slate-200 leading-relaxed space-y-1.5">
      {lines.map((line, i) => {
        // Bold
        let processed = line.replace(
          /\*\*(.*?)\*\*/g,
          '<strong class="text-white font-semibold">$1</strong>'
        );
        // Inline code
        processed = processed.replace(
          /`(.*?)`/g,
          '<code class="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 text-xs font-mono">$1</code>'
        );
        // Headers
        if (line.startsWith("### "))
          return (
            <h4
              key={i}
              className="text-sm font-bold text-purple-300 mt-3 mb-1"
              dangerouslySetInnerHTML={{ __html: processed.slice(4) }}
            />
          );
        if (line.startsWith("## "))
          return (
            <h3
              key={i}
              className="text-base font-bold text-white mt-4 mb-1"
              dangerouslySetInnerHTML={{ __html: processed.slice(3) }}
            />
          );
        if (line.startsWith("# "))
          return (
            <h2
              key={i}
              className="text-lg font-extrabold text-white mt-4 mb-2"
              dangerouslySetInnerHTML={{ __html: processed.slice(2) }}
            />
          );
        // Bullet
        if (line.startsWith("- ") || line.startsWith("* "))
          return (
            <div key={i} className="flex gap-2 items-start pl-2">
              <span className="mt-2 w-1 h-1 rounded-full bg-purple-400 shrink-0" />
              <span
                className="text-sm"
                dangerouslySetInnerHTML={{ __html: processed.slice(2) }}
              />
            </div>
          );
        // Numbered list
        const numberedMatch = line.match(/^(\d+)\.\s(.*)/);
        if (numberedMatch)
          return (
            <div key={i} className="flex gap-2 items-start pl-2">
              <span className="text-xs text-purple-400 font-bold mt-0.5 shrink-0">
                {numberedMatch[1]}.
              </span>
              <span
                className="text-sm"
                dangerouslySetInnerHTML={{ __html: numberedMatch[2] }}
              />
            </div>
          );
        // Empty line
        if (!line.trim()) return <div key={i} className="h-2" />;
        // Normal paragraph
        return (
          <p
            key={i}
            className="text-sm"
            dangerouslySetInnerHTML={{ __html: processed }}
          />
        );
      })}
    </div>
  );
}

// ─── Main Resume Page ──────────────────────────────────────
export default function Resume() {
  const { user } = useAuth();

  // ── Storage key helpers ────────────────────────────────────
  const getStorageKey = (resumeId) => {
    const userPrefix = user?.id || user?.email ? `user_${user.id || user.email}_` : "";
    return `resume_chat_${userPrefix}${resumeId}`;
  };

  const getResumesStorageKey = () => {
    const userPrefix = user?.id || user?.email ? `user_${user.id || user.email}_` : "";
    return `uploaded_resumes_${userPrefix}`;
  };

  const getAllConversationsKey = () => {
    const userPrefix = user?.id || user?.email ? `user_${user.id || user.email}_` : "";
    return `resume_conversations_${userPrefix}db_ready`;
  };

  // ── Save conversation to localStorage in clean JSON format ──
  const saveConversation = (resumeId, msgs) => {
    if (!resumeId) return;
    try {
      // Clean JSON messages array
      const payload = msgs.map((m) => ({
        role: m.role, // "user" | "ai"
        content: m.content,
        timestamp: m.timestamp || new Date().toISOString(),
        ...(m.sources && m.sources.length > 0 ? { sources: m.sources } : {}),
      }));

      // 1. Save specific resume conversation
      localStorage.setItem(getStorageKey(resumeId), JSON.stringify(payload));

      // 2. Also save structured dictionary for direct future database sync
      const allKey = getAllConversationsKey();
      const allRaw = localStorage.getItem(allKey);
      const allData = allRaw ? JSON.parse(allRaw) : {};
      allData[resumeId] = {
        resume_id: resumeId,
        user_id: user?.id || user?.email || "anonymous",
        updated_at: new Date().toISOString(),
        messages: payload,
      };
      localStorage.setItem(allKey, JSON.stringify(allData));
    } catch (err) {
      console.warn("Failed to persist conversation to localStorage:", err);
    }
  };

  // ── Load conversation from localStorage ───────────────────
  const loadConversation = (resumeId) => {
    if (!resumeId) return [];
    try {
      const saved = localStorage.getItem(getStorageKey(resumeId));
      return saved ? JSON.parse(saved) : [];
    } catch (err) {
      console.warn("Failed to retrieve conversation from localStorage:", err);
      return [];
    }
  };

  // Upload state (restored from localStorage)
  const [uploadedResumes, setUploadedResumes] = useState(() => {
    try {
      const userPrefix = user?.id || user?.email ? `user_${user.id || user.email}_` : "";
      const saved = localStorage.getItem(`uploaded_resumes_${userPrefix}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Chat state
  const [activeResumeId, setActiveResumeId] = useState(() => {
    try {
      const userPrefix = user?.id || user?.email ? `user_${user.id || user.email}_` : "";
      const saved = localStorage.getItem(`uploaded_resumes_${userPrefix}`);
      const parsed = saved ? JSON.parse(saved) : [];
      return parsed.length > 0 ? parsed[0].resume_id : null;
    } catch {
      return null;
    }
  });
  const [messages, setMessages] = useState([]); // { role: "user"|"ai", content, sources?, timestamp }
  const [chatLoading, setChatLoading] = useState(false);
  const [questionInput, setQuestionInput] = useState("");

  const chatEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Restore conversation whenever activeResumeId changes
  useEffect(() => {
    if (activeResumeId) {
      const history = loadConversation(activeResumeId);
      setMessages(history);
    } else {
      setMessages([]);
    }
  }, [activeResumeId]);

  // Auto-scroll inside messages container without shifting the page/window
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, chatLoading]);

  // Isolate scroll to only the LLM response/messages container.
  // When at top and scrolling up, or at bottom and scrolling down, allow page scroll.
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const onWheel = (e) => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const isAtTop = scrollTop <= 1;
      const isAtBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight - 2;

      const isScrollingUp = e.deltaY < 0;
      const isScrollingDown = e.deltaY > 0;

      if (isScrollingUp) {
        if (!isAtTop) {
          e.stopPropagation();
          e.preventDefault();
          el.scrollTop = Math.max(0, el.scrollTop + e.deltaY);
        }
      } else if (isScrollingDown) {
        if (!isAtBottom) {
          e.stopPropagation();
          e.preventDefault();
          const maxScroll = el.scrollHeight - el.clientHeight;
          el.scrollTop = Math.min(maxScroll, el.scrollTop + e.deltaY);
        }
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

  // ── Upload handler (existing API logic preserved) ──────────
  const handleUpload = async (_, files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError("");

    const results = [];

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await api.post("/resume/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (res.data?.resume_id) {
          results.push({
            resume_id: res.data.resume_id,
            filename: res.data.filename || file.name,
            total_pages: res.data.total_pages,
            total_chunks: res.data.total_chunks,
          });
        }
      } catch (err) {
        const detail =
          err.response?.data?.detail || `Failed to upload ${file.name}`;
        setUploadError(detail);
      }
    }

    if (results.length > 0) {
      setUploadedResumes((prev) => {
        const updated = [...prev, ...results];
        try {
          localStorage.setItem(getResumesStorageKey(), JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
      // Auto-select first uploaded resume if none active
      if (!activeResumeId) {
        setActiveResumeId(results[0].resume_id);
      }
    }

    setUploading(false);
  };

  // ── Chat handler (persists both user and LLM messages to localStorage) ──
  const handleChat = async (question) => {
    if (!question.trim() || !activeResumeId) return;

    const userMsg = {
      role: "user",
      content: question.trim(),
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    saveConversation(activeResumeId, newMessages);
    setChatLoading(true);

    try {
      const res = await api.post("/resume/chat", {
        resume_id: activeResumeId,
        question: question.trim(),
        k: 5,
      });

      const aiMsg = {
        role: "ai",
        content: res.data?.answer || "No response received.",
        sources: res.data?.sources || [],
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...newMessages, aiMsg];
      setMessages(finalMessages);
      saveConversation(activeResumeId, finalMessages);
    } catch (err) {
      const detail =
        err.response?.data?.detail || "Failed to get AI response.";
      const errorMsg = {
        role: "ai",
        content: `⚠️ Error: ${detail}`,
        timestamp: new Date().toISOString(),
      };
      const finalMessages = [...newMessages, errorMsg];
      setMessages(finalMessages);
      saveConversation(activeResumeId, finalMessages);
    } finally {
      setChatLoading(false);
    }
  };

  // ── Clear chat handler ─────────────────────────────────────
  const handleClearChat = () => {
    setMessages([]);
    if (activeResumeId) {
      saveConversation(activeResumeId, []);
    }
  };

  // ── Question submit helper ─────────────────────────────────
  const submitQuestion = () => {
    if (!activeResumeId || !questionInput.trim() || chatLoading || uploading)
      return;
    const q = questionInput.trim();
    setQuestionInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    handleChat(q);
  };

  // ── Remove resume ──────────────────────────────────
  const removeResume = (resumeId) => {
    setUploadedResumes((prev) => {
      const updated = prev.filter((r) => r.resume_id !== resumeId);
      try {
        localStorage.setItem(getResumesStorageKey(), JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      localStorage.removeItem(getStorageKey(resumeId));
      const allKey = getAllConversationsKey();
      const allRaw = localStorage.getItem(allKey);
      if (allRaw) {
        const allData = JSON.parse(allRaw);
        delete allData[resumeId];
        localStorage.setItem(allKey, JSON.stringify(allData));
      }
    } catch (e) {}

    if (activeResumeId === resumeId) {
      const remaining = uploadedResumes.filter(
        (r) => r.resume_id !== resumeId
      );
      setActiveResumeId(remaining.length > 0 ? remaining[0].resume_id : null);
    }
  };

  const activeResume = uploadedResumes.find(
    (r) => r.resume_id === activeResumeId
  );

  const canSend = Boolean(
    activeResumeId && questionInput.trim() && !chatLoading && !uploading
  );

  return (
    <div className="min-h-screen bg-[#05040a] text-slate-100 flex flex-col relative overflow-x-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[380px] bg-purple-700/12 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-fuchsia-600/8 rounded-full blur-[150px] pointer-events-none" />

      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 pt-28 pb-8 relative z-10 flex flex-col">
        {/* ─── Header ─────────────────────────────────── */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Career Advisor</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Resume Intelligence
          </h1>
          <p className="text-sm text-zinc-400 mt-1.5 max-w-xl">
            Upload your resume PDF directly from the composer below and ask any questions for skill analysis, interview prep, and roadmap suggestions.
          </p>
        </div>

        {/* ─── Preserved Uploaded Resumes List ─────────── */}
        {uploadedResumes.length > 0 && (
          <div className="rounded-2xl bg-[#0c0818]/90 border border-zinc-800/80 p-4 mb-4 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Indexed Resumes ({uploadedResumes.length})
                </h3>
              </div>
              <span className="text-[11px] text-zinc-500 hidden sm:inline">
                Click a resume to switch active context
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {uploadedResumes.map((resume) => (
                <div
                  key={resume.resume_id}
                  onClick={() => setActiveResumeId(resume.resume_id)}
                  className={`
                    flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border
                    ${
                      activeResumeId === resume.resume_id
                        ? "bg-purple-500/15 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)] text-white"
                        : "bg-white/[0.02] border-white/5 text-zinc-300 hover:border-purple-500/30 hover:bg-white/[0.04]"
                    }
                  `}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        activeResumeId === resume.resume_id
                          ? "bg-purple-500/25 text-purple-300"
                          : "bg-zinc-800/60 text-zinc-500"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate max-w-[150px]">
                        {resume.filename}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {resume.total_pages} page{resume.total_pages > 1 ? "s" : ""} · {resume.total_chunks} chunks
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {activeResumeId === resume.resume_id && (
                      <span className="text-[9px] font-mono text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded-full border border-purple-500/30">
                        Active
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeResume(resume.resume_id);
                      }}
                      className="p-1 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete resume"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Chat Section ────────────────────────────── */}
        <div
          data-lenis-prevent="true"
          className="flex flex-col rounded-2xl bg-[#0c0818]/90 border border-zinc-800/80 backdrop-blur-xl overflow-hidden shadow-2xl h-[650px] max-h-[85vh]"
        >
          {/* Chat Header */}
          <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  AI Career Advisor
                  {activeResume && (
                    <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 max-w-[200px] truncate">
                      {activeResume.filename}
                    </span>
                  )}
                </h2>
                <p className="text-[11px] text-zinc-500">
                  Powered by Groq LLM + FAISS Vector Search
                </p>
              </div>
            </div>

            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 px-2.5 py-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                Clear chat
              </button>
            )}
          </div>

          {/* Messages Area */}
          <div
            ref={messagesContainerRef}
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4"
            style={{ overscrollBehavior: "auto" }}
          >
            {messages.length === 0 && !chatLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center py-16 px-4">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 shadow-[0_0_25px_rgba(168,85,247,0.15)]">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {activeResumeId
                    ? "Ask anything about your resume"
                    : "Upload a resume to get started"}
                </h3>
                <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
                  {activeResumeId
                    ? 'Try asking: "What are my strongest skills?", "How can I improve my project section?", or "Give me a personalized interview prep roadmap"'
                    : "Use the 📎 PDF button in the composer below to upload your resume. Once indexed, you can chat with the AI."}
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "ai" && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-fuchsia-600 flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-purple-600/20 border border-purple-500/30 text-white"
                      : "bg-[#090614] border border-zinc-800/80 text-slate-200"
                  }`}
                >
                  {msg.role === "user" ? (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>
                  ) : (
                    <RenderMarkdown text={msg.content} />
                  )}

                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-zinc-800/60">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-1">
                        Sources
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {msg.sources.map((src, si) => (
                          <span
                            key={si}
                            className="text-[10px] font-mono text-purple-400/70 bg-purple-500/5 px-1.5 py-0.5 rounded border border-purple-500/10"
                          >
                            p{src.page_number}:c{src.chunk_index}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                    {user?.picture ? (
                      <img
                        src={user.picture}
                        alt=""
                        className="w-7 h-7 rounded-lg object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-zinc-400" />
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* AI Thinking State */}
            {chatLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-fuchsia-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="rounded-2xl bg-[#090614]/60 overflow-hidden border-0">
                  <AITextLoading
                    loadingStates={[
                      "Searching your resume chunks...",
                      "Analyzing relevant qualifications...",
                      "Generating personalized career insights...",
                      "Crafting response...",
                    ]}
                    interval={2200}
                  />
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* ─── Unified ChatGPT-style AI Composer ─────── */}
          <div className="p-3 sm:p-4 border-t border-zinc-800/80 bg-[#080512]/70 shrink-0">
            {/* Upload Error Banner if any */}
            {uploadError && (
              <div className="mb-2.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span className="truncate">{uploadError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadError("")}
                  className="text-rose-400 hover:text-rose-200 text-xs px-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Hidden file input for PDF picker */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleUpload(null, Array.from(e.target.files));
                  e.target.value = ""; // Reset so same file can be picked again
                }
              }}
            />

            {/* Single rounded rectangular glass/dark container */}
            <div className="relative rounded-2xl bg-[#090614] border border-purple-500/25 hover:border-purple-500/40 focus-within:border-purple-500/60 focus-within:shadow-[0_0_25px_rgba(168,85,247,0.2)] transition-all duration-300 p-2 sm:p-2.5 flex items-end gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
              {/* Left: PDF Attachment Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 hover:text-purple-200 border border-purple-500/30 hover:border-purple-500/50 transition-all shrink-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
                title={uploading ? "Uploading PDF..." : "Attach PDF Resume"}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                    <span className="text-xs font-semibold text-purple-300 hidden sm:inline">
                      Uploading...
                    </span>
                  </>
                ) : (
                  <>
                    <Paperclip className="w-4 h-4 text-purple-400 group-hover:rotate-45 transition-transform duration-200" />
                    <span className="text-xs font-semibold tracking-wide">PDF</span>
                  </>
                )}
              </button>

              {/* Center: Multiline Text Input / Textarea */}
              <div className="flex-1 min-w-0 flex items-center">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={questionInput}
                  onChange={(e) => {
                    setQuestionInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(
                      e.target.scrollHeight,
                      140
                    )}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitQuestion();
                    }
                  }}
                  placeholder={
                    uploading
                      ? "Uploading and indexing resume..."
                      : activeResumeId
                      ? "Ask anything about your resume..."
                      : "Upload a resume first to start chatting"
                  }
                  disabled={!activeResumeId || chatLoading || uploading}
                  className="w-full bg-transparent text-sm text-slate-100 placeholder:text-zinc-500 focus:outline-none resize-none py-2 px-2 max-h-36 min-h-[38px] leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Right: Send Button */}
              <button
                type="button"
                onClick={submitQuestion}
                disabled={!canSend}
                className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                  canSend
                    ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] hover:scale-105 active:scale-95"
                    : "bg-zinc-800/60 text-zinc-600 cursor-not-allowed border border-white/5"
                }`}
                title={
                  !activeResumeId
                    ? "Upload a resume first"
                    : !questionInput.trim()
                    ? "Type a question"
                    : "Send question (Enter)"
                }
              >
                {chatLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-purple-300" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
