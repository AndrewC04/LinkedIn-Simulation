# seed_resumes.py — Load Kaggle resume samples into MongoDB as candidate profiles
import pandas as pd
import pymongo
import os
import uuid
from dotenv import load_dotenv

load_dotenv()

client = pymongo.MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017"))
db = client["linkedin"]
members = db["members"]

# ── Load CSV ──────────────────────────────────────────────────────────────────
CSV_PATH = "Resume.csv"  # update path if needed
df = pd.read_csv(CSV_PATH)
print(f"Loaded {len(df)} resumes from CSV")

# ── Take a sample of 20 resumes ───────────────────────────────────────────────
sample = df.sample(n=20, random_state=42).reset_index(drop=True)

# ── Insert into MongoDB ───────────────────────────────────────────────────────
inserted = []
for i, row in sample.iterrows():
    member_id = f"kaggle_candidate_{i+1}"
    doc = {
        "member_id": member_id,
        "name": f"Candidate {i+1}",
        "resume_text": str(row.get("Resume_str", row.get("resume", ""))),
        "category": str(row.get("Category", "Unknown")),
        "source": "kaggle_resume_dataset"
    }
    # Upsert so re-running doesn't duplicate
    members.update_one({"member_id": member_id}, {"$set": doc}, upsert=True)
    inserted.append(member_id)
    print(f"  ✅ Inserted {member_id} — category: {doc['category']}")

print(f"\nDone! {len(inserted)} candidates loaded into MongoDB.")
print("Candidate IDs to use in /ai/submit:")
print(inserted)