import os
import re
import csv
from sqlmodel import Session, select, create_engine
from app.models.base import AudioFile
from difflib import SequenceMatcher
# import Levenshtein - Removed to use internal simple_wer

DATABASE_URL = "sqlite:///batch_verification.db"
TRANSCRIPT_DIR = "test-audio-transcripts"
REPORT_FILE = "accuracy_report.csv"

def simple_wer(ref, hyp):
    """
    Calculation of WER with Levenshtein distance.
    Works on lists of words.
    """
    r = ref.split()
    h = hyp.split()
    # costs will hold the costs, like in the Levenshtein distance algorithm
    costs = [[0 for _ in range(len(h) + 1)] for _ in range(len(r) + 1)]
    
    for i in range(len(r) + 1):
        costs[i][0] = i
    for j in range(len(h) + 1):
        costs[0][j] = j
        
    for i in range(1, len(r) + 1):
        for j in range(1, len(h) + 1):
            if r[i-1] == h[j-1]:
                costs[i][j] = costs[i-1][j-1]
            else:
                sub = costs[i-1][j-1] + 1
                ins = costs[i][j-1] + 1
                del_ = costs[i-1][0] + 1 # optimization? No, standard algorithm
                del_ = costs[i-1][j] + 1
                costs[i][j] = min(sub, ins, del_)
                
    return costs[len(r)][len(h)] / len(r) if len(r) > 0 else 0.0

def parse_textgrid(file_path):
    """
    Parses a TextGrid file and extracts the text from intervals.
    Clean up tags like <UNSURE>...</UNSURE> -> ...
    <UNIN/> -> (remove)
    """
    text_content = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        for line in lines:
            line = line.strip()
            if line.startswith('text = "'):
                # Extract text inside quotes
                # Handle cases where line is `text = ""`
                content = line[8:-1] # remove text = " and last "
                if content:
                    # Clean tags
                    # Remove <UNIN/> and similar variants
                    content = re.sub(r'<UNIN[^>]*>', '', content)
                    # Remove <UNSURE> tags but keep content: <UNSURE>text</UNSURE> -> text
                    content = re.sub(r'<UNSURE>', '', content)
                    content = re.sub(r'</UNSURE>', '', content)
                    
                    content = content.replace('uh', '').replace('um', '').strip() # Optional: remove fillers vs ground truth? 
                    # Actually, if ground truth HAS 'um', we should keep it. 
                    # But the sample has 'um'.
                    # Let's keep it simple: just strip tags.
                    
                    if content:
                        text_content.append(content)
                        
    except Exception as e:
        print(f"Error parsing {file_path}: {e}")
        return ""
        
    return " ".join(text_content)

def normalize_text(text):
    if not text:
        return ""
    # Lowercase
    text = text.lower()
    
    # 1. Handle dates (simple normalization for YYYY-MM-DD to spoken format?)
    # Actually, let's just ensure numbers are separated clearly.
    
    # 2. Replace punctuation with SPACE (Crucial for day-to-day -> day to day)
    # Old: re.sub(r'[^\w\s]', '', text) -> daytoday
    # New: re.sub(r'[^\w\s]', ' ', text) -> day to day
    text = re.sub(r'[^\w\s]', ' ', text)
    
    # 3. Collapse whitespace
    return " ".join(text.split())

def main():
    engine = create_engine(DATABASE_URL)
    results = []
    
    with Session(engine) as session:
        audio_files = session.exec(select(AudioFile)).all()
        print(f"Found {len(audio_files)} processed files in DB.")
        
        for af in audio_files:
            # Map filename: day1_consultation01_doctor.wav -> day1_consultation01_doctor.TextGrid
            base_name = os.path.splitext(af.file_name)[0]
            tg_path = os.path.join(TRANSCRIPT_DIR, f"{base_name}.TextGrid")
            
            if os.path.exists(tg_path):
                ground_truth = parse_textgrid(tg_path)
                generated = af.transcription or ""
                
                # Normalize
                gt_norm = normalize_text(ground_truth)
                gen_norm = normalize_text(generated)
                
                # Calculate Metrics
                # 1. Similarity (SequenceMatcher) - 0.0 to 1.0 (Higher is better)
                similarity = SequenceMatcher(None, gt_norm, gen_norm).ratio()
                
                # 2. WER - 0.0 to Infinity (Lower is better)
                # Simple implementation or skip if too complex for snippet
                wer = simple_wer(gt_norm, gen_norm)
                
                results.append({
                    "Filename": af.file_name,
                    "Similarity Score": f"{similarity:.2%}",
                    "WER": f"{wer:.2%}",
                    "Length GT (chars)": len(gt_norm),
                    "Length Gen (chars)": len(gen_norm)
                })
            else:
                print(f"Warning: No ground truth found for {af.file_name}")

    # Write Report
    if results:
        keys = results[0].keys()
        with open(REPORT_FILE, 'w', newline='') as output_file:
            dict_writer = csv.DictWriter(output_file, keys)
            dict_writer.writeheader()
            dict_writer.writerows(results)
            
        # Calculate Averages
        avg_sim = sum(float(r["Similarity Score"].strip('%')) for r in results) / len(results)
        avg_wer = sum(float(r["WER"].strip('%')) for r in results) / len(results)
        
        print("\n" + "="*50)
        print("AGGREGATE ACCURACY METRICS")
        print("="*50)
        print(f"Total Files Compared: {len(results)}")
        print(f"Average Similarity:   {avg_sim:.2f}%")
        print(f"Average WER:          {avg_wer:.2f}%")
        print(f"Detailed report saved to: {REPORT_FILE}")
        print("="*50)
    else:
        print("No matches found/calculated.")

if __name__ == "__main__":
    main()
