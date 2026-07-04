# AI Research Assistant System

An AI-powered research assistant built over 15,000 papers from the ML-ArXiv-Papers dataset. It combines semantic search, automatic summarization, entity-tagged keyword extraction, a retrieval-augmented (RAG) chatbot, topic clustering, and PDF-based paper matching into a single tool for exploring machine learning research.

Built as my second project during my internship at **Coding Block School of Technology (CBSOT)**.

## Live Demo

| | Link |
|---|---|
| Frontend | https://ai-research-assistant-eight-beta.vercel.app |
| Backend API | https://thesharmanitin-ai-research-assistant.hf.space |
| API health check | https://thesharmanitin-ai-research-assistant.hf.space/health |

## Features

- **Semantic Search** — finds relevant papers by meaning, not just keyword match, using Sentence Transformers embeddings and a FAISS index over 15,000 papers.
- **Abstract Summarization** — condenses each paper's abstract into a short, readable summary using BART (`facebook/bart-large-cnn`).
- **Keyword Extraction with Entity Typing** — pulls out key terms from each abstract with KeyBERT, then classifies each one (Programming Language, Framework, Model Architecture, Dataset, Evaluation Metric, etc.) using a curated dictionary with a zero-shot classification fallback.
- **RAG Chatbot** — ask a question in plain English and get an answer grounded only in retrieved paper excerpts, with sources cited back — powered by Groq (`openai/gpt-oss-120b`).
- **Topic Clustering** — automatically groups papers into research areas using BERTopic, no manual labeling required.
- **PDF Upload & Matching** — upload your own paper (PDF) and find the closest related papers already in the archive.

## Architecture

This project uses a split deployment, chosen for resource reasons:

- **Frontend** — Next.js + Tailwind, deployed on **Vercel**. Source: `app/`, `components/`, `lib/`
- **Backend** — FastAPI + ML pipeline, deployed on **Hugging Face Spaces** (free CPU tier), since the models used (Sentence Transformers, BART, BART-MNLI, BERTopic) need more RAM than most free web-hosting tiers provide. Source: `backend/`
- **Notebook** — the original development notebook used to build and test the pipeline: `NLP_Project_organized.ipynb`

```
┌─────────────┐        HTTPS        ┌──────────────────┐
│   Next.js   │ ──────────────────► │     FastAPI       │
│  (Vercel)   │ ◄────────────────── │ (Hugging Face      │
│             │        JSON         │  Spaces, Docker)   │
└─────────────┘                     └────────┬───────────┘
                                              │
                        ┌─────────────────────┼─────────────────────┐
                        ▼                     ▼                     ▼
                Sentence Transformers   BART / BART-MNLI       BERTopic +
                    + FAISS index        (summarize +          Groq (RAG)
                                        entity typing)
```

## Tech Stack

**Backend:** Python, FastAPI, Sentence Transformers, FAISS, Hugging Face Transformers (BART, BART-MNLI), KeyBERT, BERTopic, PyPDF, Groq API

**Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS

**Deployment:** Hugging Face Spaces (Docker, backend), Vercel (frontend)

## Project Structure

```
.
├── NLP_Project_organized.ipynb   # original development notebook
├── backend/
│   ├── main.py                   # FastAPI app — all endpoints
│   ├── precompute.py             # one-time script: builds embeddings, FAISS index, BERTopic model
│   ├── requirements.txt
│   └── Dockerfile                # Hugging Face Spaces deployment
├── app/                          # Next.js pages (Search, Ask, Topics, Upload)
├── components/                   # UI components (Sidebar, PaperCard, EntityTag)
├── lib/
│   └── api.ts                    # typed client for the backend API
└── package.json
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET`  | `/health` | Health check |
| `POST` | `/search` | Semantic search → summary + entity-tagged keywords |
| `POST` | `/ask` | RAG Q&A over the archive, with cited sources |
| `GET`  | `/topics` | List discovered topic clusters |
| `GET`  | `/topics/{id}/papers` | Papers belonging to a given cluster |
| `POST` | `/upload-pdf` | Upload a PDF, get the most similar papers |

## Running Locally

**Backend**
```bash
cd backend
pip install -r requirements.txt
python precompute.py          # builds data/ (embeddings, FAISS index, BERTopic model) — one-time
cp .env.example .env          # add your GROQ_API_KEY
uvicorn main:app --reload --port 8000
```

**Frontend**
```bash
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_BASE_URL
npm run dev
```
Open http://localhost:3000.

## What I Learned

- Building a full retrieval pipeline (embeddings → FAISS → summarization → keyword extraction) from a raw dataset.
- Combining a rule-based dictionary with zero-shot classification for entity typing — useful when labeled training data isn't available.
- Adapting quickly when Groq deprecated the model I originally built the RAG chatbot on, and swapping in a replacement without breaking the pipeline.
- Splitting a deployment across two free-tier platforms (Hugging Face Spaces for the ML backend, Vercel for the frontend) to work within resource constraints, and wiring them together with CORS-restricted API calls.

## Author

**Nitin Kumar Sharma**
B.Tech CSE (AI & ML), AKTU — GSSoC '26 Contributor
[GitHub](https://github.com/thenitinsharma) · [LinkedIn](https://linkedin.com/in/thenitinsharma)
