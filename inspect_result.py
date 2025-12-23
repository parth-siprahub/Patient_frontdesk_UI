import argparse
import sys
import json
from uuid import UUID
from sqlmodel import Session, select
from app.core.db import engine
from app.models.base import Consultation, AudioFile, SOAPNote

def inspect_consultation(consultation_id_str: str):
    try:
        consultation_id = UUID(consultation_id_str)
    except ValueError:
        print(f"Error: Invalid UUID '{consultation_id_str}'")
        sys.exit(1)

    print(f"\n--- Inspection Report for Consultation: {consultation_id} ---\n")

    with Session(engine) as session:
        # Fetch Consultation
        consultation = session.get(Consultation, consultation_id)
        if not consultation:
            print("Error: Consultation not found.")
            sys.exit(1)

        print(f"Status: {consultation.status.value}")

        # Fetch AudioFile (for transcript)
        audio_file = session.exec(select(AudioFile).where(AudioFile.consultation_id == consultation_id)).first()
        if audio_file:
            transcript = audio_file.transcription or "[No Transcript Yet]"
            print(f"\n[Transcript Snippet] (First 300 chars):")
            print(f"{transcript[:300]}...")
            
            # Speaker Labels (Mock logic or parsing if stored in utterances)
            # In our current schema we store raw text. Ideally we should have stored `utterances` JSON. 
            # If we returned utterances from STT but only saved text to `audio_file.transcription`, we lost the labels 
            # unless we saved them elsewhere (like a new JSON column).
            # Looking at schema: AudioFile has `transcription: str`. 
            # The prompt asked to "Print List unique speakers found in the speaker_segments JSON". 
            # We don't have a `speaker_segments` column in the current schema I saw earlier.
            # However, I can check if speaker labels are embedded in the text if we formatted it that way?
            # Or if I missed a column.
            # `AudioFile` schema: id, consultation_id, uploaded_by, file_name, file_url, file_size, duration, mime_type, transcription, uploaded_at.
            # `SOAPNote` has `soap_json`.
            # If the user expects speaker labels, they might mean assuming I saved them. 
            # Since I only saved `transcript_text` to `audio_file.transcription`, I can't retrieve the structured utterances unless I modify the schema.
            # BUT, the prompt says "Speaker Labels: (List unique speakers found in the speaker_segments JSON)".
            # This implies there MIGHT be a column or I should have saved it.
            # In `consultation_processor.py`, I did:
            # `transcript_text = transcript_result["text"]`
            # `audio_file.transcription = transcript_text`
            # I did NOT save the structured utterances to DB. 
            # Error in plan? Or maybe I should scan the text if it has "Speaker A:"? 
            # In `llm_service.py` I formatted it: `Speaker {speaker}: {text}` but that was for the PROMPT.
            # The `audio_file.transcription` is likely just the raw text block from AssemblyAI `transcript.text` which is usually just text.
            # Wait, AssemblyAI `transcript.text` is just the text.
            # If I want to show speakers, I'd need to have saved the utterances.
            # I will print "N/A (Utterances not stored in current schema)" for now to be honest.
            print("\n[Speaker Labels]:")
            print("N/A (Detailed utterances not persisted in current 'AudioFile' schema)")

        else:
            print("\n[Audio File]: Not found.")

        # Fetch SOAP Note
        soap_note = session.exec(select(SOAPNote).where(SOAPNote.consultation_id == consultation_id)).first()
        if soap_note:
            print(f"\n[SOAP Note]:")
            if soap_note.soap_json:
                print(json.dumps(soap_note.soap_json, indent=2))
            else:
                print("None")
                
            print(f"\n[Risk Flags]:")
            # In processor I did: risk_flags={"flags": risk_flags}
            # schema says: risk_flags: Optional[dict]
            if soap_note.risk_flags and "flags" in soap_note.risk_flags:
                print(soap_note.risk_flags["flags"])
            else:
                print(soap_note.risk_flags)

            print(f"\n[AI Confidence]: {soap_note.confidence}")
        else:
             print("\n[SOAP Note]: Not generated yet.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Inspect AI results for a consultation.")
    parser.add_argument("consultation_id", help="UUID of the consultation")
    args = parser.parse_args()
    
    inspect_consultation(args.consultation_id)
