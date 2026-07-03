"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [results, setResults] = useState<{ title: string; score: number }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported.");
      return;
    }
    setError(null);
    setFile(f);
    setResults(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.uploadPdf(file, 5);
      setResults(res.similar_papers);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-8 py-12">
      <header className="mb-10">
        <p className="access-no text-archive mb-2">PAPER MATCHING</p>
        <h1 className="font-serif text-3xl text-ink mb-2">Match your own paper</h1>
        <p className="text-ink-muted text-sm">
          Upload a PDF and find the closest related papers already in the archive.
        </p>
      </header>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files?.[0] ?? null);
        }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-sm px-6 py-12 text-center cursor-pointer transition-colors mb-6 ${
          dragging ? "border-archive bg-archive-soft/40" : "border-line hover:border-archive/60"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        <p className="access-no mb-2">DROP PDF HERE OR CLICK TO BROWSE</p>
        <p className="font-serif text-ink">{file ? file.name : "No file selected"}</p>
      </div>

      {error && (
        <div className="border border-stamp/40 bg-stamp/5 text-stamp text-sm px-4 py-3 rounded-sm mb-6">
          {error}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="bg-ink text-bone px-6 py-3 text-sm font-medium rounded-sm hover:bg-archive transition-colors disabled:opacity-40 mb-10"
      >
        {loading ? "Matching…" : "Find similar papers"}
      </button>

      {results && (
        <div>
          <p className="access-no mb-3">CLOSEST MATCHES</p>
          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className="index-card p-4 flex items-center justify-between gap-4">
                <span className="text-sm text-ink">
                  <span className="access-no mr-3">{String(i + 1).padStart(3, "0")}</span>
                  {r.title.trim()}
                </span>
                <span className="stamp shrink-0">{Math.round(r.score * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
