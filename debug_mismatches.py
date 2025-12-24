import os
import re
from sqlmodel import Session, select, create_engine
from app.models.base import AudioFile
from difflib import ndiff

DATABASE_URL = "sqlite:///batch_verification.db"
TRANSCRIPT_DIR = "test-audio-transcripts"

def parse_textgrid(file_path):
    # (Same simple parser as before)
    text_content = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        for line in lines:
            line = line.strip()
            if line.startswith('text = "'):
                content = line[8:-1]
                if content:
                    content = re.sub(r'<UNIN[^>]*>', '', content)
                    content = re.sub(r'<UNSURE>', '', content)
                    content = re.sub(r'</UNSURE>', '', content)
                    content = content.replace('uh', '').replace('um', '').strip() 
                    if content:
                        text_content.append(content)
    except Exception:
        return ""
    return " ".join(text_content)

def normalize_text(text):
    if not text: return ""
    text = text.lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    return " ".join(text.split())

def main():
    engine = create_engine(DATABASE_URL)
    filename = "day1_consultation01_patient.wav"
    
    with Session(engine) as session:
        af = session.exec(select(AudioFile).where(AudioFile.file_name == filename)).first()
        if not af: return

        tg_path = os.path.join(TRANSCRIPT_DIR, f"{os.path.splitext(filename)[0]}.TextGrid")
        ground_truth = normalize_text(parse_textgrid(tg_path))
        generated = normalize_text(af.transcription)
        
        print(f"--- NORMALIZED COMPARISON FOR {filename} ---")
        print("\n[GROUND TRUTH]:")
        print(ground_truth[:200])
        print("\n[GENERATED]:")
        print(generated[:200])
        
        print("\n[KEY MISMATCHES]:")
        diff = ndiff(ground_truth.split(), generated.split())
        delta = [x for x in diff if x.startswith('- ') or x.startswith('+ ')]
        for line in delta[:30]:
            print(line)

if __name__ == "__main__":
    main()
