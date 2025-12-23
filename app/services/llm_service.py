import google.generativeai as genai
import json
import asyncio
from typing import List, Dict, Any
from app.core.config import settings

# Configure global API key
genai.configure(api_key=settings.GOOGLE_API_KEY)

class GeminiService:
    @staticmethod
    async def generate_soap_note_async(transcript_text: str, speaker_labels: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Generates a structured SOAP note from the transcript using Gemini.
        Returns a dictionary matching the SOAP note schema.
        """
        # Construct a speaker-aware transcript if labels are provided
        formatted_transcript = transcript_text
        if speaker_labels:
            formatted_lines = []
            for utter in speaker_labels:
                 # utter is expected to be a dict like {'speaker': 'A', 'text': '...', ...}
                 speaker = utter.get('speaker', 'Unknown')
                 text = utter.get('text', '')
                 formatted_lines.append(f"Speaker {speaker}: {text}")
            formatted_transcript = "\n".join(formatted_lines)
            
        # Initialize Model (gemini-1.5-flash is efficient and good for this)
        model = genai.GenerativeModel(
            'gemini-1.5-flash',
            generation_config={"response_mime_type": "application/json"}
        )
        
        prompt = f"""
        You are an expert medical scribe. Your task is to analyze the following Doctor-Patient consultation transcript and generate a professional, structured SOAP note encoded as JSON.
        
        Transcript:
        {formatted_transcript}
        
        Instructions:
        1. Analyze the transcript carefully.
        2. Extrapolate the Subjective, Objective, Assessment, and Plan sections.
        3. Identify any Risk Flags (e.g., Suicide risk, Severe allergies, Abuse).
        4. Return STRICTLY valid JSON. No markdown formatting.
        
        Required JSON Structure:
        {{
            "soap_note": {{
                "subjective": "Patient's presenting complaints, history of present illness...",
                "objective": "Observations, physical findings (if mentioned), vitals...",
                "assessment": "Diagnosis or differential diagnoses...",
                "plan": "Treatment plan, medications, follow-up..."
            }},
            "risk_flags": ["Risk 1", "Risk 2"] 
        }}
        """
        
        # Offload the blocking API call to a thread
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None, 
            lambda: model.generate_content(prompt)
        )
        
        try:
            # Parse JSON result
            result_json = json.loads(response.text)
            return result_json
        except json.JSONDecodeError:
            # Fallback if strict JSON fails (rare with response_mime_type set)
            print(f"JSON Decode Error. Raw response: {response.text}")
            # Attempt to clean potential markdown
            cleaned_text = response.text.replace("```json", "").replace("```", "").strip()
            try:
                return json.loads(cleaned_text)
            except:
                 raise Exception("Failed to generate valid JSON SOAP note")
        except Exception as e:
            raise Exception(f"Gemini generation failed: {str(e)}")
