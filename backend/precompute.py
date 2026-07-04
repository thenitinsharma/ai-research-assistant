import numpy as np
import pandas as pd
import faiss
from datasets import load_dataset
from sentence_transformers import SentenceTransformer
from bertopic import BERTopic

OUT_DIR = "data"
import os
os.makedirs(OUT_DIR, exist_ok=True)

print("Loading dataset...")
dataset = load_dataset("CShorten/ML-ArXiv-Papers", split="train")
df = pd.DataFrame(dataset)[["title", "abstract"]].head(15000)
df["paper_text"] = (df["title"] + " " + df["abstract"]).str.replace("\n", "", regex=False).str.strip()

print("Encoding embeddings...")
model = SentenceTransformer("all-MiniLM-L6-v2")
embeddings = model.encode(df["paper_text"].to_list(), batch_size=32, show_progress_bar=True)
np.save(f"{OUT_DIR}/paper_embeddings.npy", embeddings)

print("Building FAISS index...")
embeddings_norm = embeddings.copy()
faiss.normalize_L2(embeddings_norm)
index = faiss.IndexFlatIP(embeddings_norm.shape[1])
index.add(embeddings_norm)
faiss.write_index(index, f"{OUT_DIR}/paper_faiss.index")

print("Fitting BERTopic (this is the slow part, a few minutes)...")
topic_model = BERTopic(embedding_model=model, verbose=True)
topics, _ = topic_model.fit_transform(df["paper_text"].to_list(), embeddings)
df["topic"] = topics
df["topic_label"] = df["topic"].map(
    lambda t: topic_model.get_topic_info().set_index("Topic")["Name"].get(t, "Outlier")
)
topic_model.save(f"{OUT_DIR}/bertopic_model", serialization="pickle")

print("Saving dataframe...")
df.to_parquet(f"{OUT_DIR}/papers.parquet")

print("\nDone. Copy the contents of the 'data/' folder into backend/data/ before deploying.")
print(f"Files created: {os.listdir(OUT_DIR)}")
