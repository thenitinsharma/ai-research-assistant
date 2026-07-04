import os
import shutil
import tempfile

import numpy as np
import pandas as pd
import faiss
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from datasets import load_dataset
from sentence_transformers import SentenceTransformer
from transformers import pipeline
from keybert import KeyBERT
from bertopic import BERTopic
from pypdf import PdfReader
from groq import Groq

# --------------------------------------------------------------------------
# App setup
# --------------------------------------------------------------------------

app = FastAPI(title="AI Research Assistant API")

ALLOWED_ORIGINS = [
    o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "*").split(",") if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATE = {}  # holds model/index/dataframe, populated on startup

@app.get("/")
def root():
    return {
        "message": "AI Research Assistant API is running.",
        "docs": "/docs",
        "health": "/api/health",
    }


# --------------------------------------------------------------------------
# Request/response schemas
# --------------------------------------------------------------------------

class QueryRequest(BaseModel):
    query: str
    top_k: int = 5


class AskRequest(BaseModel):
    question: str
    top_k: int = 5


# --------------------------------------------------------------------------
# Startup: load dataset, embeddings, index, and models once
# --------------------------------------------------------------------------

DATA_DIR = os.environ.get("DATA_DIR", "data")


@app.on_event("startup")
def load_pipeline():
    """
    Loads everything from the precomputed 'data/' folder (see precompute.py)
    instead of downloading the dataset / building embeddings / fitting BERTopic
    on every cold start. Keeps free-tier deploys (e.g. Hugging Face Spaces) fast to boot.
    """
    parquet_path = f"{DATA_DIR}/papers.parquet"
    emb_path = f"{DATA_DIR}/paper_embeddings.npy"
    index_path = f"{DATA_DIR}/paper_faiss.index"
    topic_path = f"{DATA_DIR}/bertopic_model"

    have_precomputed = all(os.path.exists(p) for p in [parquet_path, emb_path, index_path, topic_path])

    print("Loading sentence transformer...")
    model = SentenceTransformer("all-MiniLM-L6-v2")

    if have_precomputed:
        print("Loading precomputed artifacts from data/ ...")
        df = pd.read_parquet(parquet_path)
        embeddings = np.load(emb_path)
        index = faiss.read_index(index_path)
        topic_model = BERTopic.load(topic_path)
    else:
        print("No precomputed data found - building from scratch (slow, only happens once).")
        dataset = load_dataset("CShorten/ML-ArXiv-Papers", split="train")
        df = pd.DataFrame(dataset)[["title", "abstract"]].head(15000)
        df["paper_text"] = (df["title"] + " " + df["abstract"]).str.replace("\n", "", regex=False).str.strip()

        embeddings = model.encode(df["paper_text"].to_list(), batch_size=32, show_progress_bar=True)
        embeddings_norm = embeddings.copy()
        faiss.normalize_L2(embeddings_norm)
        index = faiss.IndexFlatIP(embeddings_norm.shape[1])
        index.add(embeddings_norm)

        topic_model = BERTopic(embedding_model=model, verbose=True)
        topics, _ = topic_model.fit_transform(df["paper_text"].to_list(), embeddings)
        df["topic"] = topics
        df["topic_label"] = df["topic"].map(
            lambda t: topic_model.get_topic_info().set_index("Topic")["Name"].get(t, "Outlier")
        )

    print("Loading summarizer...")
    summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

    print("Loading KeyBERT...")
    kw_model = KeyBERT(model=model)

    print("Loading zero-shot classifier...")
    zero_shot = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

    print("Loading Groq client...")
    groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

    STATE.update(dict(
        df=df, model=model, embeddings=embeddings, index=index,
        summarizer=summarizer, kw_model=kw_model, zero_shot=zero_shot,
        groq_client=groq_client, topic_model=topic_model,
    ))
    print("Pipeline ready.")


CANDIDATE_LABELS = [
    "Programming Language", "Framework", "Library",
    "Algorithm", "Model Architecture", "Dataset",
    "Evaluation Metric", "Research Concept or Technique",
    "Application Domain", "Data Type or Modality",
    "Task or Problem Type", "Image Processing Task",
]

ENTITY_DICT = {
    "python": "Programming Language", "java": "Programming Language", "c++": "Programming Language",
    "fastapi": "Framework", "django": "Framework", "flask": "Framework", "react": "Framework",
    "pytorch": "Library", "tensorflow": "Library", "scikit-learn": "Library", "keras": "Library",
    "bert": "Model Architecture", "gpt": "Model Architecture", "resnet": "Model Architecture",
    "transformer": "Model Architecture", "lstm": "Model Architecture", "cnn": "Model Architecture",
    "cnns": "Model Architecture", "rnn": "Model Architecture", "alexnet": "Model Architecture",
    "convolutional neural network": "Model Architecture", "convolutional neural networks": "Model Architecture",
    "bleu": "Evaluation Metric", "f1 score": "Evaluation Metric", "accuracy": "Evaluation Metric",
    "precision": "Evaluation Metric", "recall": "Evaluation Metric",
    "imagenet": "Dataset", "coco": "Dataset", "mnist": "Dataset",
    "gradient descent": "Algorithm", "backpropagation": "Algorithm", "random forest": "Algorithm",
}


def get_entity_type(keyword: str, confidence_threshold: float = 0.25):
    keyword_clean = keyword.lower().strip()
    if keyword_clean in ENTITY_DICT:
        return ENTITY_DICT[keyword_clean], 1.0

    result = STATE["zero_shot"](keyword, CANDIDATE_LABELS, hypothesis_template="This term refers to a {}.")
    label, score = result["labels"][0], result["scores"][0]
    if score < confidence_threshold:
        return "Unclassified", score
    return label, score


def search_paper(query: str, top_k: int = 5):
    model, index, df = STATE["model"], STATE["index"], STATE["df"]
    query_embedding = model.encode([query])
    faiss.normalize_L2(query_embedding)
    D, I = index.search(query_embedding, top_k)
    return [
        {"score": float(score), "title": df.iloc[idx]["title"], "abstract": df.iloc[idx]["abstract"]}
        for score, idx in zip(D[0], I[0])
    ]


# --------------------------------------------------------------------------
# Endpoints
# --------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok", "papers_indexed": STATE["index"].ntotal if "index" in STATE else 0}


@app.post("/search")
def search(req: QueryRequest):
    """Semantic search + summary + keywords with entity types."""
    results = search_paper(req.query, top_k=req.top_k)
    for r in results:
        summary = STATE["summarizer"](r["abstract"], max_length=120, min_length=40, do_sample=False)
        r["summary"] = summary[0]["summary_text"]

        keywords = STATE["kw_model"].extract_keywords(
            r["abstract"], keyphrase_ngram_range=(1, 2), stop_words="english", top_n=5
        )
        r["keywords"] = []
        for kw, _ in keywords:
            entity_type, conf = get_entity_type(kw)
            r["keywords"].append({"keyword": kw, "entity_type": entity_type, "confidence": round(float(conf), 2)})
    return {"results": results}


@app.post("/ask")
def ask(req: AskRequest):
    """RAG Q&A over the paper index."""
    contexts = search_paper(req.question, top_k=req.top_k)

    context_text = ""
    for i, c in enumerate(contexts):
        context_text += f"[Paper {i+1}] Title: {c['title']}\nAbstract: {c['abstract'][:600]}\n\n"

    system_prompt = (
        "You are a research assistant. Answer the user's question using ONLY "
        "the provided paper excerpts. Cite papers as [Paper 1], [Paper 2], etc. "
        "If the excerpts don't contain enough information, say so honestly."
    )
    user_prompt = f"Context:\n{context_text}\nQuestion: {req.question}\n\nAnswer:"

    try:
        response = STATE["groq_client"].chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=800,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Groq API error: {e}")

    return {
        "question": req.question,
        "answer": response.choices[0].message.content,
        "sources": contexts,
    }


@app.get("/topics")
def get_topics():
    """List all discovered topics."""
    info = STATE["topic_model"].get_topic_info()
    return {"topics": info.to_dict(orient="records")}


@app.get("/topics/{topic_id}/papers")
def papers_by_topic(topic_id: int, n: int = 10):
    df = STATE["df"]
    rows = df[df["topic"] == topic_id][["title", "abstract"]].head(n)
    return {"papers": rows.to_dict(orient="records")}


@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...), top_k: int = 5):
    """Extract text from an uploaded PDF and return the most similar papers."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        reader = PdfReader(tmp_path)
        text = " ".join(page.extract_text() or "" for page in reader.pages).strip()
    finally:
        os.unlink(tmp_path)

    if not text:
        raise HTTPException(status_code=422, detail="Could not extract text from this PDF.")

    model, index, df = STATE["model"], STATE["index"], STATE["df"]
    pdf_embedding = model.encode([text[:2000]])
    faiss.normalize_L2(pdf_embedding)
    D, I = index.search(pdf_embedding, top_k)

    similar_papers = [
        {"title": df.iloc[idx]["title"], "score": float(score)}
        for score, idx in zip(D[0], I[0])
    ]
    return {"filename": file.filename, "similar_papers": similar_papers}
