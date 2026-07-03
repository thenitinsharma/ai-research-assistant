"use client";

import { useState } from "react";
import { api, AskResult } from "@/lib/api";
import ReactMarkdown from "react-markdown";

export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AskResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.ask(question, 5);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-8 py-12">
      <header className="mb-10">
        <p className="access-no text-archive mb-2">RETRIEVAL-AUGMENTED Q&A</p>
        <h1 className="font-serif text-3xl text-ink mb-2">Ask the archive</h1>
        <p className="text-ink-muted text-sm">
          Answers are grounded only in retrieved paper excerpts — every claim is cited back to its source.
        </p>
      </header>

      <div className="flex gap-2 mb-10">
        <textarea
          className="flex-1 border hairline bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-archive/40 rounded-sm resize-none"
          rows={2}
          placeholder="What are the main challenges in using deep learning for medical imaging?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAsk();
            }
          }}
        />
        <button
          onClick={handleAsk}
          disabled={loading}
          className="bg-ink text-bone px-6 text-sm font-medium rounded-sm hover:bg-archive transition-colors disabled:opacity-50"
        >
          {loading ? "Thinking…" : "Ask"}
        </button>
      </div>

      {error && (
        <div className="border border-stamp/40 bg-stamp/5 text-stamp text-sm px-4 py-3 rounded-sm mb-6">
          {error}
        </div>
      )}

      {loading && (
        <div className="index-card p-6 animate-pulse">
          <div className="h-3 w-32 bg-line rounded mb-4" />
          <div className="h-3 w-full bg-line rounded mb-2" />
          <div className="h-3 w-full bg-line rounded mb-2" />
          <div className="h-3 w-2/3 bg-line rounded" />
        </div>
      )}

      {!loading && result && (
        <div className="index-card p-7">
          <p className="access-no mb-2">ANSWER</p>
          <div className="text-ink leading-relaxed mb-6 [&_p]:mb-3 [&_p:last-child]:mb-0">
            <ReactMarkdown
              components={{
                strong: ({ children }) => <strong className="font-semibold text-archive">{children}</strong>,
                ol: ({ children }) => <ol className="list-decimal ml-5 space-y-1.5">{children}</ol>,
                ul: ({ children }) => <ul className="list-disc ml-5 space-y-1.5">{children}</ul>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              }}
            >
              {result.answer}
            </ReactMarkdown>
          </div>

          <div className="pt-4 border-t hairline">
            <p className="access-no mb-3">SOURCES CITED</p>
            <ol className="space-y-2">
              {result.sources.map((s, i) => (
                <li key={i} className="flex items-baseline justify-between gap-4 text-sm">
                  <span className="text-ink">
                    <span className="font-mono text-xs text-archive mr-2">[{i + 1}]</span>
                    {s.title.trim()}
                  </span>
                  <span className="stamp shrink-0 text-[10px]">{Math.round(s.score * 100)}%</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}