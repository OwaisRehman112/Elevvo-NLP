import os
import io
import torch
import pandas as pd
import spacy
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from sentence_transformers import SentenceTransformer, util
from pypdf import PdfReader
from docx import Document

load_dotenv()
app = FastAPI()

model = SentenceTransformer(os.getenv("MODEL_NAME", "all-MiniLM-L6-v2"))
nlp = spacy.load("en_core_web_sm")

def clean_skills(tokens):
    # Filter out common generic words that aren't technical skills
    ignore_list = {"years", "experience", "senior", "junior", "role", "work", "ability"}
    return {t for t in tokens if t not in ignore_list and len(t) > 2}

def extract_dynamic_info(jd_doc, res_doc):
    # Skill Extraction Logic
    jd_keywords = clean_skills({t.text.lower() for t in jd_doc if t.pos_ in ["PROPN", "NOUN"]})
    res_keywords = clean_skills({t.text.lower() for t in res_doc if t.pos_ in ["PROPN", "NOUN"]})
    
    matched = sorted(list(jd_keywords.intersection(res_keywords)))
    missing = sorted(list(jd_keywords.difference(res_keywords)))
    
    # Role Extraction Logic: Ignore names (PERSON)
    # Look for the first noun phrase or Org that isn't a person's name
    potential_roles = [chunk.text for chunk in res_doc.noun_chunks 
                       if not any(ent.label_ == "PERSON" for ent in res_doc.ents if ent.text in chunk.text)]
    
    best_role = potential_roles[0] if potential_roles else "Professional"
    
    return matched, missing, best_role

@app.post("/api/screen")
async def screen_resume(job_desc: str = Form(...), file: UploadFile = File(...)):
    name = file.filename.lower()
    content = await file.read()
    
    try:
        if name.endswith('.pdf'):
            reader = PdfReader(io.BytesIO(content))
            resume_text = " ".join([p.extract_text() for p in reader.pages if p.extract_text()])
        elif name.endswith('.docx'):
            doc = Document(io.BytesIO(content))
            resume_text = " ".join([p.text for p in doc.paragraphs])
        else:
            resume_text = content.decode("utf-8")
    except:
        raise HTTPException(status_code=500, detail="Extraction failed")

    # Semantic Similarity
    jd_vec = model.encode(job_desc, convert_to_tensor=True)
    res_vec = model.encode(resume_text, convert_to_tensor=True)
    score = util.cos_sim(jd_vec, res_vec).item()

    # NLP Processing
    jd_doc = nlp(job_desc)
    res_doc = nlp(resume_text)
    
    matched, missing, role = extract_dynamic_info(jd_doc, res_doc)

    return {
        "matchScore": round(score * 100, 2),
        "bestRole": role.title(), # Capitalize properly
        "matchedSkills": matched[:10],
        "missingSkills": missing[:10],
        "extractedEntities": {
            "education": list(set([e.text for e in res_doc.ents if e.label_ in ["ORG"]]))[:3],
            "experience": list(set([e.text for e in res_doc.ents if e.label_ == "DATE"]))[:3],
            "certifications": list(set([e.text for e in res_doc.ents if e.label_ in ["PRODUCT", "WORK_OF_ART"]]))[:3]
        }
    }