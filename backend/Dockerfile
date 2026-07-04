# Dockerfile for the AI Research Assistant backend.
# Works on Hugging Face Spaces (Docker SDK, free CPU tier) as well as
# Render/Railway if you decide to pay for those later.

FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Precomputed artifacts (papers.parquet, paper_embeddings.npy, paper_faiss.index,
# bertopic_model/) must live in ./data before building the image.
# Run `python precompute.py` locally first and copy its data/ output here.
COPY . .

# Hugging Face Spaces expects the app to listen on 7860
ENV PORT=7860
EXPOSE 7860

# HF Spaces caches models under /app - give the HF cache a writable home
ENV HF_HOME=/app/.cache/huggingface

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
