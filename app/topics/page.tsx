"use client";

import { useEffect, useState } from "react";
import { api, Topic } from "@/lib/api";

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [papers, setPapers] = useState<{ title: string; abstract: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [papersLoading, setPapersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .topics()
      .then((res) => setTopics(res.topics.filter((t) => t.Topic !== -1)))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load topics."))
      .finally(() => setLoading(false));
  }, []);

  const openTopic = async (topicId: number) => {
    setSelected(topicId);
    setPapersLoading(true);
    try {
      const res = await api.papersByTopic(topicId, 10);
      setPapers(res.papers);
    } catch {
      setPapers([]);
    } finally {
      setPapersLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      <header className="mb-10">
        <p className="access-no text-archive mb-2">BERTopic CLUSTERING</p>
        <h1 className="font-serif text-2xl sm:text-3xl text-ink mb-2">Browse by topic</h1>
        <p className="text-ink-muted text-sm">
          Papers are auto-clustered into research areas. Select a cluster to see its papers.
        </p>
      </header>

      {error && (
        <div className="border border-stamp/40 bg-stamp/5 text-stamp text-sm px-4 py-3 rounded-sm mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-ink-muted">Loading topic index…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
          {topics.map((t) => (
            <button
              key={t.Topic}
              onClick={() => openTopic(t.Topic)}
              className={`text-left index-card p-4 transition-colors ${
                selected === t.Topic ? "border-archive" : ""
              }`}
            >
              <p className="access-no mb-1">CLUSTER {t.Topic} · {t.Count} PAPERS</p>
              <p className="font-serif text-ink text-sm leading-snug">
                {t.Name.replace(/^\d+_/, "").split("_").join(", ")}
              </p>
            </button>
          ))}
        </div>
      )}

      {selected !== null && (
        <div>
          <p className="access-no mb-3">PAPERS IN CLUSTER {selected}</p>
          {papersLoading ? (
            <p className="text-sm text-ink-muted">Loading papers…</p>
          ) : (
            <div className="space-y-3">
              {papers.map((p, i) => (
                <div key={i} className="index-card p-5">
                  <p className="access-no mb-1">No. {String(i + 1).padStart(3, "0")}</p>
                  <h3 className="font-serif text-ink mb-2">{p.title.trim()}</h3>
                  <p className="text-sm text-ink-muted leading-relaxed">
                    {p.abstract.trim().slice(0, 220)}…
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
