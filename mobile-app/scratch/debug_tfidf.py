import pandas as pd
import numpy as np
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Load data
path = r"c:\Users\user\OneDrive - Sri Lanka Institute of Information Technology\Documents\AI\E-Library\Python-ranker\book.csv"
df = pd.read_csv(path)
df['combined'] = (
    df['title'].fillna('') + " " + 
    df['authors'].fillna('') + " " + 
    df['description'].fillna('')
).str.lower()

# Vectorize
vectorizer = TfidfVectorizer(stop_words='english')
tfidf_matrix = vectorizer.fit_transform(df['combined'])

# Search
idea = "Magic"
query_vec = vectorizer.transform([idea.lower()])
cosine_sim = cosine_similarity(query_vec, tfidf_matrix).flatten()

# Results
top_indices = cosine_sim.argsort()[-5:][::-1]
print(f"Top scores for '{idea}':")
for idx in top_indices:
    print(f"Score: {cosine_sim[idx]:.4f} - Title: {df.iloc[idx]['title']}")
