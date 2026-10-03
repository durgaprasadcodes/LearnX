import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import AITextLoading from "../components/kokonutui/AITextLoading";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import {
  Sparkles,
  Plus,
  Home,
  FileText,
  Database,
  Compass,
  LayoutTemplate,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  Globe,
  Sliders,
  Paperclip,
  Send,
  Loader2,
  Bot,
  User,
  Trash2,
  AlertCircle,
  Check,
  Copy,
  Menu,
  X,
  Code2,
  Lightbulb,
  ExternalLink,
  Upload,
} from "lucide-react";

// ─── Markdown-lite renderer ────────────────────────────────
function RenderMarkdown({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <div className="prose-sm text-slate-200 leading-relaxed space-y-2">
      {lines.map((line, i) => {
        let processed = line.replace(
          /\*\*(.*?)\*\*/g,
          '<strong class="text-white font-semibold">$1</strong>'
        );
        processed = processed.replace(
          /`(.*?)`/g,
          '<code class="px-1.5 py-0.5 rounded bg-blue-500/10 text-cyan-300 text-xs font-mono">$1</code>'
        );

        if (line.startsWith("### "))
          return (
            <h4
              key={i}
              className="text-sm font-bold text-cyan-300 mt-3 mb-1"
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
        if (line.startsWith("- ") || line.startsWith("* "))
          return (
            <div key={i} className="flex gap-2 items-start pl-2">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
              <span
                className="text-sm"
                dangerouslySetInnerHTML={{ __html: processed.slice(2) }}
              />
            </div>
          );
        const numberedMatch = line.match(/^(\d+)\.\s(.*)/);
        if (numberedMatch)
          return (
            <div key={i} className="flex gap-2 items-start pl-2">
              <span className="text-xs text-cyan-400 font-bold mt-0.5 shrink-0">
                {numberedMatch[1]}.
              </span>
              <span
                className="text-sm"
                dangerouslySetInnerHTML={{ __html: numberedMatch[2] }}
              />
            </div>
          );
        if (!line.trim()) return <div key={i} className="h-1.5" />;
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

export default function Resume() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const displayName =
    user?.name || user?.email?.split("@")[0] || "Durga Prasad";

  // ── Storage Keys ──────────────────────────────────────────
  const userPrefix =
    user?.id || user?.email ? `user_${user.id || user.email}_` : "";

  const getResumesStorageKey = () => `uploaded_resumes_${userPrefix}`;
  const getChatsStorageKey = () => `rag_chats_${userPrefix}`;

  // ── Resumes state ─────────────────────────────────────────
  const [uploadedResumes, setUploadedResumes] = useState(() => {
    try {
      const saved = localStorage.getItem(getResumesStorageKey());
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeResumeId, setActiveResumeId] = useState(() => {
    try {
      const saved = localStorage.getItem(getResumesStorageKey());
      const parsed = saved ? JSON.parse(saved) : [];
      return parsed.length > 0 ? parsed[0].resume_id : null;
    } catch {
      return null;
    }
  });

  const activeResume = uploadedResumes.find(
    (r) => r.resume_id === activeResumeId
  );

  // ── Chat sessions state ───────────────────────────────────
  const defaultRecentChats = [
    {
      id: "sample_1",
      title: "House Price Prediction",
      messages: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: "sample_2",
      title: "FastAPI Deployment",
      messages: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: "sample_3",
      title: "Machine Learning Guide",
      messages: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: "sample_4",
      title: "Explain Docker Bind Mount",
      messages: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: "sample_5",
      title: "Resume Analysis",
      messages: [],
      createdAt: new Date().toISOString(),
    },
  ];

  const [chatSessions, setChatSessions] = useState(() => {
    try {
      const saved = localStorage.getItem(getChatsStorageKey());
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return defaultRecentChats;
    } catch {
      return defaultRecentChats;
    }
  });

  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [questionInput, setQuestionInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAllChats, setShowAllChats] = useState(false);
  const [docDrawerOpen, setDocDrawerOpen] = useState(false);
  const [webSearchActive, setWebSearchActive] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll inside chat
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, chatLoading]);

  // Persist chat sessions to localStorage
  const persistChatSessions = (sessions) => {
    try {
      localStorage.setItem(getChatsStorageKey(), JSON.stringify(sessions));
    } catch (err) {
      console.warn("Failed to persist chats:", err);
    }
  };

  // ── Switch Chat Session ───────────────────────────────────
  const handleSelectChat = (chat) => {
    setActiveChatId(chat.id);
    setMessages(chat.messages || []);
    if (chat.resumeId) {
      setActiveResumeId(chat.resumeId);
    }
    setSidebarOpen(false);
  };

  // ── Create New Chat ───────────────────────────────────────
  const handleNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setQuestionInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setSidebarOpen(false);
  };

  // ── Delete Chat Session ───────────────────────────────────
  const handleDeleteChat = (e, chatId) => {
    e.stopPropagation();
    const updated = chatSessions.filter((c) => c.id !== chatId);
    setChatSessions(updated);
    persistChatSessions(updated);
    if (activeChatId === chatId) {
      handleNewChat();
    }
  };

  // ── Upload Resume Handler ─────────────────────────────────
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
      const updated = [...uploadedResumes, ...results];
      setUploadedResumes(updated);
      try {
        localStorage.setItem(getResumesStorageKey(), JSON.stringify(updated));
      } catch (e) {}

      // Select newly uploaded resume
      setActiveResumeId(results[0].resume_id);
    }

    setUploading(false);
  };

  // ── Delete Resume ─────────────────────────────────────────
  const handleRemoveResume = (resumeId) => {
    const updated = uploadedResumes.filter((r) => r.resume_id !== resumeId);
    setUploadedResumes(updated);
    try {
      localStorage.setItem(getResumesStorageKey(), JSON.stringify(updated));
    } catch (e) {}

    if (activeResumeId === resumeId) {
      setActiveResumeId(updated.length > 0 ? updated[0].resume_id : null);
    }
  };

  // ── Submit Question ───────────────────────────────────────
  const submitQuestion = async (customPrompt) => {
    const query = (customPrompt || questionInput).trim();
    if (!query || chatLoading || uploading) return;

    setQuestionInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Determine resume context
    let targetResumeId = activeResumeId;
    if (!targetResumeId && uploadedResumes.length > 0) {
      targetResumeId = uploadedResumes[0].resume_id;
      setActiveResumeId(targetResumeId);
    }

    const userMsg = {
      role: "user",
      content: query,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    // Save or update active session
    let currentId = activeChatId;
    let updatedSessions = [...chatSessions];

    if (!currentId) {
      currentId = `chat_${Date.now()}`;
      setActiveChatId(currentId);
      const newSession = {
        id: currentId,
        title: query.length > 30 ? `${query.slice(0, 30)}...` : query,
        messages: newMessages,
        resumeId: targetResumeId,
        createdAt: new Date().toISOString(),
      };
      updatedSessions = [newSession, ...updatedSessions];
    } else {
      updatedSessions = updatedSessions.map((c) =>
        c.id === currentId
          ? { ...c, messages: newMessages, resumeId: targetResumeId }
          : c
      );
    }

    setChatSessions(updatedSessions);
    persistChatSessions(updatedSessions);
    setChatLoading(true);

    // If no resume uploaded, provide friendly guidance and open picker
    if (!targetResumeId) {
      setTimeout(() => {
        const aiMsg = {
          role: "ai",
          content: `I'm ready to analyze your profile and answer **"${query}"**!\n\nPlease attach your PDF resume using the **📎 PDF** button in the composer so I can extract your exact projects, skills, and experience to give you personalized insights.`,
          timestamp: new Date().toISOString(),
        };
        const finalMsgs = [...newMessages, aiMsg];
        setMessages(finalMsgs);
        setChatSessions((prev) =>
          prev.map((c) => (c.id === currentId ? { ...c, messages: finalMsgs } : c))
        );
        persistChatSessions(
          updatedSessions.map((c) =>
            c.id === currentId ? { ...c, messages: finalMsgs } : c
          )
        );
        setChatLoading(false);
      }, 700);
      return;
    }

    // Request Groq LLM + FAISS vector search
    try {
      const res = await api.post("/resume/chat", {
        resume_id: targetResumeId,
        question: query,
        k: 5,
      });

      const aiMsg = {
        role: "ai",
        content: res.data?.answer || "No response received.",
        sources: res.data?.sources || [],
        timestamp: new Date().toISOString(),
      };

      const finalMsgs = [...newMessages, aiMsg];
      setMessages(finalMsgs);
      const synced = updatedSessions.map((c) =>
        c.id === currentId ? { ...c, messages: finalMsgs } : c
      );
      setChatSessions(synced);
      persistChatSessions(synced);
    } catch (err) {
      const detail =
        err.response?.data?.detail || "Failed to analyze resume with AI.";
      const errorMsg = {
        role: "ai",
        content: `⚠️ Error: ${detail}`,
        timestamp: new Date().toISOString(),
      };
      const finalMsgs = [...newMessages, errorMsg];
      setMessages(finalMsgs);
      const synced = updatedSessions.map((c) =>
        c.id === currentId ? { ...c, messages: finalMsgs } : c
      );
      setChatSessions(synced);
      persistChatSessions(synced);
    } finally {
      setChatLoading(false);
    }
  };

  // ── Handle Card Clicks from Hero ──────────────────────────
  const handleCardClick = (type) => {
    if (type === "chat_docs") {
      if (!activeResumeId && uploadedResumes.length === 0) {
        fileInputRef.current?.click();
      } else {
        submitQuestion(
          "Analyze my resume and provide a comprehensive summary of my core skills, experience, and top achievements."
        );
      }
    } else if (type === "skills") {
      submitQuestion(
        "Based on my resume, what key technical skills, frameworks, or tools should I learn next to maximize my career potential?"
      );
    } else if (type === "insights") {
      submitQuestion(
        "Generate the top 5 technical and behavioral interview questions tailored to the projects and experience listed on my resume."
      );
    } else if (type === "explore") {
      submitQuestion(
        "Create a personalized 6-month career growth roadmap based on my background to transition into high-impact engineering roles."
      );
    }
  };

  // Copy helper
  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const displayedChats = showAllChats
    ? chatSessions
    : chatSessions.slice(0, 5);

  return (
    <div
      data-lenis-prevent="true"
      className="flex h-screen w-full bg-[#060810] text-slate-100 overflow-hidden font-sans select-none"
    >
      {/* Hidden PDF picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleUpload(null, Array.from(e.target.files));
            e.target.value = "";
          }
        }}
      />

      {/* ─── Mobile Sidebar Overlay ───────────────────────── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* ─── Left Sidebar ──────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#090c18] border-r border-[#1a1f36] flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Workspace Brand Header */}
        <div className="p-4 flex items-center justify-between border-b border-[#181d33]">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center text-base font-extrabold tracking-tight">
                <span className="text-white">RAG</span>
                <span className="text-blue-400">Chat</span>
              </div>
              <p className="text-[10px] text-zinc-400 font-medium -mt-0.5">
                Your AI Workspace
              </p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* + New Chat Button */}
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold text-sm shadow-[0_0_20px_rgba(99,102,241,0.35)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="px-3 py-1 space-y-0.5">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Home className="w-4 h-4 text-zinc-400" />
            <span>Home</span>
          </Link>

          <button
            type="button"
            onClick={() => setDocDrawerOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-zinc-400" />
              <span>Documents</span>
            </div>
            {uploadedResumes.length > 0 && (
              <span className="text-[10px] font-mono text-blue-300 bg-blue-500/15 px-1.5 py-0.5 rounded-full border border-blue-500/25">
                {uploadedResumes.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setDocDrawerOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <Database className="w-4 h-4 text-zinc-400" />
            <span>Knowledge Base</span>
          </button>

          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Compass className="w-4 h-4 text-zinc-400" />
            <span>Explore</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              submitQuestion("Show me best-practice resume templates and standard section structures for tech roles.");
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <LayoutTemplate className="w-4 h-4 text-zinc-400" />
            <span>Templates</span>
          </button>
        </nav>

        {/* Recent Chats Section */}
        <div className="flex-1 overflow-y-auto px-3 py-3 border-t border-[#181d33] min-h-0 select-text">
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400">
              Recent Chats
            </span>
          </div>

          <div className="space-y-1">
            {displayedChats.map((chat) => {
              const isActive = activeChatId === chat.id;
              return (
                <div
                  key={chat.id}
                  onClick={() => handleSelectChat(chat)}
                  className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                    isActive
                      ? "bg-blue-600/20 text-white font-medium border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MessageSquare
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? "text-blue-400" : "text-zinc-500"
                      }`}
                    />
                    <span className="truncate max-w-[155px]">
                      {chat.title}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteChat(e, chat.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                    title="Delete chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {chatSessions.length > 5 && (
            <button
              onClick={() => setShowAllChats(!showAllChats)}
              className="mt-2 w-full text-left px-3 py-1.5 text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>{showAllChats ? "Show less" : "Show more"}</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform ${
                  showAllChats ? "rotate-180" : ""
                }`}
              />
            </button>
          )}
        </div>

        {/* User Profile Card (Bottom) */}
        <div className="p-3 border-t border-[#181d33]">
          <Link
            to="/profile"
            className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-all group cursor-pointer border border-transparent hover:border-blue-500/20"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/40"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#090c18]" />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-xs font-semibold text-white truncate max-w-[130px]">
                  {displayName}
                </p>
                <p className="text-[10px] text-zinc-400 truncate max-w-[130px]">
                  AI Explorer
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        </div>
      </aside>

      {/* ─── Main Chat Workspace ───────────────────────────── */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-[#060810] relative">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-gradient-to-b from-blue-600/10 via-purple-600/5 to-transparent blur-[140px] pointer-events-none" />

        {/* Top Header Bar */}
        <header className="h-14 px-4 sm:px-6 border-b border-[#181d33] flex items-center justify-between shrink-0 bg-[#060810]/80 backdrop-blur-md relative z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm sm:text-base font-bold text-white">Chat</h2>
              <span className="hidden sm:inline text-xs text-zinc-400">
                Ask anything, analyze documents, or explore ideas...
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeResume && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-mono max-w-[220px]">
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{activeResume.filename}</span>
              </div>
            )}

            <button
              onClick={() => setDocDrawerOpen(true)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/5 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Resumes</span>
            </button>

            {messages.length > 0 && (
              <button
                onClick={handleNewChat}
                className="text-xs px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </header>

        {/* Error Banner */}
        {uploadError && (
          <div className="mx-4 mt-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{uploadError}</span>
            </div>
            <button
              onClick={() => setUploadError("")}
              className="text-rose-400 hover:text-rose-200"
            >
              ✕
            </button>
          </div>
        )}

        {/* ─── Center Hero (When NO messages) ───────────────── */}
        {messages.length === 0 && !chatLoading && (
          <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-4 py-8 relative z-10">
            {/* Lottie Animation Globe */}
            <div className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center my-2 pointer-events-none select-none relative">
              <DotLottieReact
                src="https://lottie.host/6a2f3d30-ec29-4b6c-8708-4f0102deb22f/QcfyWPAhD7.lottie"
                loop
                autoplay
                className="w-full h-full object-contain"
              />
            </div>

            {/* Greeting Header */}
            <div className="text-center mt-3 mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
                <span>Hi,</span>
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                  {displayName}
                </span>
              </h1>
              <p className="text-sm sm:text-base text-zinc-400 mt-1.5 font-normal">
                How can I help you today?
              </p>
            </div>

            {/* 4 Interactive Quick Action Cards (Identical layout to screenshot) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full max-w-4xl px-2">
              {/* Card 1: Chat with Documents */}
              <button
                type="button"
                onClick={() => handleCardClick("chat_docs")}
                className="flex flex-col text-left p-4 rounded-2xl bg-[#0b0e1b]/85 hover:bg-[#11162a] border border-[#1b223d] hover:border-blue-500/40 transition-all duration-200 group shadow-lg cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3 group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                  Chat with Documents
                </span>
                <span className="text-xs text-zinc-400 mt-1">
                  Upload and ask questions
                </span>
              </button>

              {/* Card 2: Generate Code */}
              <button
                type="button"
                onClick={() => handleCardClick("skills")}
                className="flex flex-col text-left p-4 rounded-2xl bg-[#0b0e1b]/85 hover:bg-[#11162a] border border-[#1b223d] hover:border-teal-500/40 transition-all duration-200 group shadow-lg cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-3 group-hover:scale-110 transition-transform">
                  <Code2 className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-white group-hover:text-teal-300 transition-colors">
                  Generate Code
                </span>
                <span className="text-xs text-zinc-400 mt-1">
                  Build, debug and explain
                </span>
              </button>

              {/* Card 3: Get Insights */}
              <button
                type="button"
                onClick={() => handleCardClick("insights")}
                className="flex flex-col text-left p-4 rounded-2xl bg-[#0b0e1b]/85 hover:bg-[#11162a] border border-[#1b223d] hover:border-amber-500/40 transition-all duration-200 group shadow-lg cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-110 transition-transform">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                  Get Insights
                </span>
                <span className="text-xs text-zinc-400 mt-1">
                  Summarize and analyze
                </span>
              </button>

              {/* Card 4: Explore Ideas */}
              <button
                type="button"
                onClick={() => handleCardClick("explore")}
                className="flex flex-col text-left p-4 rounded-2xl bg-[#0b0e1b]/85 hover:bg-[#11162a] border border-[#1b223d] hover:border-purple-500/40 transition-all duration-200 group shadow-lg cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">
                  Explore Ideas
                </span>
                <span className="text-xs text-zinc-400 mt-1">
                  Brainstorm and learn
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ─── Active Message Stream (When messages exist) ─── */}
        {(messages.length > 0 || chatLoading) && (
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 max-w-4xl w-full mx-auto select-text"
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "ai" && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_12px_rgba(99,102,241,0.35)]">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 relative group ${
                    msg.role === "user"
                      ? "bg-blue-600/20 border border-blue-500/30 text-white shadow-md"
                      : "bg-[#0b0e1b] border border-[#1a2038] text-slate-200 shadow-lg"
                  }`}
                >
                  {msg.role === "user" ? (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>
                  ) : (
                    <>
                      <RenderMarkdown text={msg.content} />

                      {/* Cited Sources */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-zinc-800/60">
                          <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold mb-1">
                            Cited Chunks
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {msg.sources.map((src, si) => (
                              <span
                                key={si}
                                className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20"
                              >
                                p{src.page_number}:c{src.chunk_index}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action buttons (Copy) */}
                      <div className="mt-2.5 pt-1.5 border-t border-zinc-800/40 flex items-center justify-end">
                        <button
                          onClick={() => copyToClipboard(msg.content, idx)}
                          className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                    {user?.picture ? (
                      <img
                        src={user.picture}
                        alt=""
                        className="w-8 h-8 rounded-xl object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-zinc-400" />
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* AI Generating Animation */}
            {chatLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="rounded-2xl bg-[#0b0e1b] border border-[#1a2038] overflow-hidden p-2">
                  <AITextLoading
                    loadingStates={[
                      "Searching vector store...",
                      "Analyzing resume qualifications...",
                      "Synthesizing Groq insights...",
                      "Formatting response...",
                    ]}
                    interval={2000}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Bottom Input / Composer Bar ─────────────────── */}
        <div className="w-full max-w-4xl mx-auto px-4 pb-4 pt-2 relative z-10 shrink-0">
          <div className="relative rounded-2xl bg-[#0b0e1b] border border-[#1b223d] hover:border-blue-500/40 focus-within:border-blue-500/60 shadow-[0_8px_30px_rgba(0,0,0,0.6)] focus-within:shadow-[0_0_25px_rgba(59,130,246,0.2)] transition-all duration-300 p-2 sm:p-2.5 flex items-center gap-2">
            {/* 📎 Attach button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              title={uploading ? "Uploading PDF..." : "Attach PDF resume"}
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              ) : (
                <Paperclip className="w-5 h-5" />
              )}
            </button>

            {/* Textarea */}
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
                activeResume
                  ? `Ask anything about ${activeResume.filename}...`
                  : "Type your message here..."
              }
              disabled={chatLoading || uploading}
              className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-zinc-500 focus:outline-none resize-none py-1.5 px-2 max-h-36 min-h-[38px] leading-relaxed disabled:opacity-50"
            />

            {/* Send Button */}
            <button
              type="button"
              onClick={() => submitQuestion()}
              disabled={!questionInput.trim() || chatLoading || uploading}
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                questionInput.trim() && !chatLoading
                  ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] hover:scale-105 active:scale-95"
                  : "bg-zinc-800/60 text-zinc-600 cursor-not-allowed border border-white/5"
              }`}
            >
              {chatLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Action Pills Row (Matching Screenshot) */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mt-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setWebSearchActive(!webSearchActive)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                webSearchActive
                  ? "bg-blue-500/15 border-blue-500/40 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                  : "bg-white/[0.03] border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Web Search</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-white/[0.03] border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>Attach Files</span>
            </button>

            <button
              type="button"
              onClick={() => setAdvancedMode(!advancedMode)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                advancedMode
                  ? "bg-purple-500/15 border-purple-500/40 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                  : "bg-white/[0.03] border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Advanced</span>
            </button>
          </div>
        </div>
      </main>

      {/* ─── Documents Drawer / Modal ──────────────────────── */}
      {docDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-[#0b0e1b] border border-[#1b223d] rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#181d33] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">
                  Indexed Documents & Resumes ({uploadedResumes.length})
                </h3>
              </div>
              <button
                onClick={() => setDocDrawerOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
              {uploadedResumes.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm text-zinc-400">
                    No documents uploaded yet.
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Attach a PDF resume to enable personalized career & skill
                    insights.
                  </p>
                </div>
              ) : (
                uploadedResumes.map((r) => (
                  <div
                    key={r.resume_id}
                    onClick={() => {
                      setActiveResumeId(r.resume_id);
                      setDocDrawerOpen(false);
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      activeResumeId === r.resume_id
                        ? "bg-blue-600/15 border-blue-500/40 text-white shadow-[0_0_12px_rgba(59,130,246,0.2)]"
                        : "bg-white/[0.02] border-white/5 text-zinc-300 hover:border-blue-500/30 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate max-w-[240px]">
                          {r.filename}
                        </p>
                        <p className="text-[10px] text-zinc-400">
                          {r.total_pages} page{r.total_pages > 1 ? "s" : ""} · {r.total_chunks} chunks indexed
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {activeResumeId === r.resume_id && (
                        <span className="text-[10px] font-mono text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30">
                          Active
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveResume(r.resume_id);
                        }}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-[#181d33] flex items-center justify-between bg-[#080b15]">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>Upload New PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setDocDrawerOpen(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white cursor-pointer hover:bg-white/5"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
