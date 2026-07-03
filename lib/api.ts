const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export type Keyword = { keyword: string; entity_type: string; confidence: number };

export type SearchResult = {
  score: number;
  title: string;
  abstract: string;
  summary: string;
  keywords: Keyword[];
};

export type AskResult = {
  question: string;
  answer: string;
  sources: { score: number; title: string; abstract: string }[];
};

export type Topic = {
  Topic: number;
  Count: number;
  Name: string;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json();
}

export const api = {
  search: (query: string, top_k = 5) =>
    request<{ results: SearchResult[] }>("/search", {
      method: "POST",
      body: JSON.stringify({ query, top_k }),
    }),

  ask: (question: string, top_k = 5) =>
    request<AskResult>("/ask", {
      method: "POST",
      body: JSON.stringify({ question, top_k }),
    }),

  topics: () => request<{ topics: Topic[] }>("/topics"),

  papersByTopic: (topicId: number, n = 10) =>
    request<{ papers: { title: string; abstract: string }[] }>(`/topics/${topicId}/papers?n=${n}`),

  uploadPdf: async (file: File, top_k = 5) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/upload-pdf?top_k=${top_k}`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`);
    return res.json() as Promise<{ filename: string; similar_papers: { title: string; score: number }[] }>;
  },
};
