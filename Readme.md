# AI Research Assistant System

An AI-powered research assistant over 15,000 ML-ArXiv papers — semantic search,
summarization, entity-tagged keyword extraction, a RAG chatbot, topic clustering,
and PDF-based paper matching.

## Live Demo
- Frontend: https://ai-research-assistant-eight-beta.vercel.app
- Backend API: https://thesharmanitin-ai-research-assistant.hf.space
- API health check: https://thesharmanitin-ai-research-assistant.hf.space/health

## Architecture
Split deployment, chosen for resource reasons:
- **Frontend (Next.js)** — deployed on Vercel — `app/`, `components/`, `lib/` in this repo
- **Backend (FastAPI + ML pipeline)** — deployed on Hugging Face Spaces (free CPU tier),
  since the ML models (sentence-transformers, BART, BERTopic) need more RAM than most
  free web-hosting tiers allow. Source code: `backend/`
- **Notebook** — original development notebook: `NLP_Project_organized.ipynb`

## Features
- Semantic search over ML-ArXiv papers (Sentence Transformers + FAISS)
- Abstract summarization (BART)
- Keyword extraction with entity-type classification (dictionary + zero-shot)
- RAG-based Q&A chatbot with cited sources (Groq)
- Topic clustering (BERTopic)
- PDF upload → similar paper matching

## Local Setup
See `backend/` for backend setup and `package.json` for frontend commands
(`npm install && npm run dev`).