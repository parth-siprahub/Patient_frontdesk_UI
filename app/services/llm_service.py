import google.generativeai as genai
import json
import asyncio
from typing import List, Dict, Any
from app.core.config import settings

# Configure global API key
genai.configure(api_key=settings.GOOGLE_API_KEY)

class GeminiService:
    @staticmethod
    async def generate_soap_note_async(transcript_text: str, speaker_labels: List[Dict[str, Any]] = None, patient_context: Dict[str, Any] = None) -> Dict[str, Any]:
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
            
        # Format Patient Context for Prompt
        context_str = "Unknown"
        if patient_context:
            context_str = (
                f"Name: {patient_context.get('first_name', '')} {patient_context.get('last_name', '')}\n"
                f"Age: {patient_context.get('age', 'N/A')}\n"
                f"Gender: {patient_context.get('gender', 'N/A')}\n"
                f"Medical History/Notes: {patient_context.get('notes', 'None provided')}"
            )
            
        # Initialize Model (gemini-2.0-flash is available and efficient)
        model = genai.GenerativeModel(
            'gemini-2.0-flash',
            generation_config={"response_mime_type": "application/json"}
        )
        
        prompt = f"""
        You are an expert medical scribe. Your task is to analyze the following Doctor-Patient consultation transcript and generate a professional, structured SOAP note encoded as JSON.
        
        Patient Context:
        {context_str}
        
        Transcript:
        {formatted_transcript}
        
        Instructions:
        1. Analyze the transcript in the context of the patient's demographics and history.
        2. Extrapolate the Subjective, Objective, Assessment, and Plan sections.
        3. **STRICT GROUNDING**: Do NOT infer information not present in the audio. If a vital sign or detail is not explicitly stated or strongly implied by the transcript, do NOT invent it.
        4. **UNCERTAINTY**: If a term is ambiguous (e.g., "measure" vs "mention") or if the speaker is unclear, flag it in the "low_confidence" list.
        5. Identify any Risk Flags (e.g., Suicide risk, Severe allergies, Abuse).
        6. Return STRICTLY valid JSON. No markdown formatting.
        
        Required JSON Structure:
        {{
            "soap_note": {{
                "subjective": "Patient's presenting complaints, history of present illness...",
                "objective": "Observations, physical findings (if mentioned), vitals...",
                "assessment": "Diagnosis or differential diagnoses...",
                "plan": "Treatment plan, medications, follow-up..."
            }},
            "low_confidence": ["list", "of", "ambiguous", "terms"],
            "risk_flags": ["Risk 1", "Risk 2"] 
        }}
        """
        
        # Offload the blocking API call to a thread
        loop = asyncio.get_event_loop()
        
        # Simple Retry Logic for 429 Errors
        max_retries = 3
        base_delay = 5
        
        for attempt in range(max_retries):
            try:
                response = await loop.run_in_executor(
                    None, 
                    lambda: model.generate_content(prompt)
                )
                break # Success
            except Exception as e:
                is_quota = "429" in str(e) or "quota" in str(e).lower() or "resource exhausted" in str(e).lower()
                if is_quota and attempt < max_retries - 1:
                    wait_time = base_delay * (2 ** attempt) # 5s, 10s
                    print(f"⚠️ Quota Warning: Retrying LLM in {wait_time}s... (Attempt {attempt+1}/{max_retries})")
                    await asyncio.sleep(wait_time)
                else:
                    raise Exception(f"Gemini generation failed after {attempt+1} attempts: {str(e)}")
        
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
