"use client";

import { useState } from "react";
import { api, SearchResult } from "@/lib/api";
import PaperCard from "@/components/PaperCard";

const SUGGESTIONS = [
  "deep learning for medical image analysis",
  "transformer architectures for NLP",
  "reinforcement learning in robotics",
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const runSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const { results } = await api.search(q, 5);
      setResults(results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      <header className="mb-10">
        <p className="access-no text-archive mb-2">CATALOG SEARCH</p>
        <h1 className="font-serif text-2xl sm:text-3xl text-ink mb-2">Find a paper</h1>
        <p className="text-ink-muted text-sm">
          Semantic search across 15,000 ML-ArXiv papers, with auto-generated summaries and
          entity-tagged keywords for each result.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(query);
        }}
        className="mb-3"
      >
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className="flex-1 min-w-0 border hairline bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-archive/40 rounded-sm"
            placeholder="e.g. deep learning for medical image analysis"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-ink text-bone px-6 py-3 text-sm font-medium rounded-sm hover:bg-archive transition-colors disabled:opacity-50"
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </div>
      </form>

      {!searched && (
        <div className="flex flex-wrap gap-2 mb-10">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => {
                setQuery(s);
                runSearch(s);
              }}
              className="text-xs text-ink-muted border hairline px-3 py-1.5 rounded-sm hover:border-archive hover:text-archive transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="border border-stamp/40 bg-stamp/5 text-stamp text-sm px-4 py-3 rounded-sm mb-6">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="index-card p-6 animate-pulse">
              <div className="h-3 w-24 bg-line rounded mb-3" />
              <div className="h-5 w-3/4 bg-line rounded mb-4" />
              <div className="h-3 w-full bg-line rounded mb-2" />
              <div className="h-3 w-2/3 bg-line rounded" />
            </div>
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && !error && (
        <p className="text-sm text-ink-muted">No results found. Try a different query.</p>
      )}

      {!loading &&
        results.map((r, i) => <PaperCard key={i} paper={r} index={i} />)}
    </div>
  );
}
