import assemblyai as aai
import asyncio
from app.core.config import settings

# Configure global API key
aai.settings.api_key = settings.ASSEMBLYAI_API_KEY

class AssemblyAIService:
    @staticmethod
    async def transcribe_audio_async(file_path: str) -> dict:
        """
        Asynchronously transcibes audio using AssemblyAI with polling.
        Enables Speaker Diarization and PII Redaction.
        """
        transcriber = aai.Transcriber()
        
        # Configure for Medical domain requirements
        config = aai.TranscriptionConfig(
            speaker_labels=True,  # Speaker Diarization
            redact_pii=True,      # PII Redaction
            redact_pii_policies=[
                aai.PIIRedactionPolicy.medical_process,
                aai.PIIRedactionPolicy.medical_condition,
                aai.PIIRedactionPolicy.person_name,
                aai.PIIRedactionPolicy.phone_number,
            ],
            language_code="en_us",
            punctuate=True,
            format_text=True,
            # Word Boost for Neurology (Accent Adaptation)
            word_boost=[
                "Levetiracetam", 
                "Donepezil", 
                "Carbamazepine", 
                "Sumatriptan", 
                "Topiramate", 
                "Valproate",
                "Gabapentin",
                "Memantine"
            ],
            boost_param="high"
        )

        # 1. Transcribe (Blocking call offloaded to thread)
        # transcriber.transcribe() handles polling internally.
        loop = asyncio.get_event_loop()
        transcript = await loop.run_in_executor(
            None,
            lambda: transcriber.transcribe(file_path, config=config)
        )
            
        if transcript.status == aai.TranscriptStatus.error:
            raise Exception(f"Transcription failed: {transcript.error}")
            
        return {
            "text": transcript.text,
            "utterances": [
                {
                    "speaker": u.speaker,
                    "text": u.text,
                    "start": u.start,
                    "end": u.end
                } for u in transcript.utterances
            ] if transcript.utterances else [],
            "confidence": transcript.confidence,
            "id": transcript.id
        }
