import React, { useRef, useState, useEffect } from "react";
import { Send, Paperclip, X, FileText, Loader2 } from "lucide-react";

export default function PromptBar({
  onSubmit,
  onFileAttach,
  placeholder = "Ask anything about your resume...",
  disabled = false,
  loading = false,
  maxFiles = 5,
  acceptedFileTypes = ".pdf",
  showFileAttach = true,
}) {
  const [value, setValue] = useState("");
  const [files, setFiles] = useState([]);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
    }
  }, [value]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (disabled || loading) return;
    const trimmed = value.trim();
    if (!trimmed && files.length === 0) return;
    onSubmit?.(trimmed, files);
    setValue("");
    setFiles([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles = [...files, ...selectedFiles].slice(0, maxFiles);
    setFiles(newFiles);
    onFileAttach?.(newFiles);
    e.target.value = "";
  };

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFileAttach?.(newFiles);
  };

  return (
    <div className="w-full">
      {/* Attached Files Preview */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3 px-1">
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 text-xs font-medium max-w-[200px]"
            >
              <FileText className="w-3.5 h-3.5 shrink-0 text-sky-500" />
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="ml-auto shrink-0 p-0.5 rounded-full hover:bg-sky-100 text-sky-400 hover:text-sky-600 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Input Bar */}
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`
            flex items-end gap-2 p-2 rounded-2xl
            bg-white
            border transition-all duration-300
            shadow-[0_2px_15px_rgba(14,165,233,0.08)]
            ${disabled
              ? "border-slate-200 opacity-60"
              : "border-sky-200 hover:border-sky-300 focus-within:border-sky-400 focus-within:shadow-[0_0_20px_rgba(14,165,233,0.12)]"
            }
          `}
        >
          {/* File Attach Button */}
          {showFileAttach && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || files.length >= maxFiles}
                className="shrink-0 p-2.5 rounded-xl text-slate-400 hover:text-sky-500 hover:bg-sky-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title={`Attach PDFs (${files.length}/${maxFiles})`}
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedFileTypes}
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 resize-none outline-none py-2.5 px-1 max-h-40 leading-relaxed disabled:cursor-not-allowed"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={disabled || loading || (!value.trim() && files.length === 0)}
            className={`
              shrink-0 p-2.5 rounded-xl transition-all cursor-pointer
              ${
                value.trim() || files.length > 0
                  ? "bg-sky-500 hover:bg-sky-600 text-white shadow-[0_2px_12px_rgba(14,165,233,0.3)]"
                  : "bg-slate-100 text-slate-400"
              }
              disabled:opacity-40 disabled:cursor-not-allowed
            `}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Helper Text */}
        <div className="flex items-center justify-between mt-2 px-2">
          <p className="text-[11px] text-slate-400">
            Shift + Enter for new line
          </p>
          {files.length > 0 && (
            <p className="text-[11px] text-sky-500">
              {files.length}/{maxFiles} files attached
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
