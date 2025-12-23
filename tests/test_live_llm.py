import pytest
import asyncio
from app.services.llm_service import GeminiService

@pytest.mark.asyncio
async def test_live_llm_service():
    """
    Verifies that GeminiService correctly generates a SOAP note from text
    and returns valid JSON matching the schema.
    """
    transcript_text = """
    Doctor: Good morning, John. What brings you in today?
    Patient: I've been having this really bad pain in my lower back for about three days.
    Doctor: I see. Does it radiate down your legs?
    Patient: No, it just stays in the lower back. It hurts when I bend over.
    Doctor: Okay. Any history of injury?
    Patient: I lifted some heavy boxes in the garage last weekend.
    Doctor: It sounds like a muscle strain. I'll prescribe some ibuprofen and I want you to rest for a few days.
    """
    
    transcript_utterances = [
        {"speaker": "A", "text": "Good morning, John. What brings you in today?"},
        {"speaker": "B", "text": "I've been having this really bad pain in my lower back for about three days."},
        # ... sample utterances for context test
    ]
    
    print("Submitting transcript to Gemini...")
    
    # Call service
    result = await GeminiService.generate_soap_note_async(transcript_text, transcript_utterances)
    
    # Assertions
    assert isinstance(result, dict)
    # Check strictly for required keys
    assert "soap_note" in result
    assert "risk_flags" in result
    
    soap = result["soap_note"]
    assert "subjective" in soap
    assert "objective" in soap
    assert "assessment" in soap
    assert "plan" in soap
    
    # Content Checks
    subjective = soap["subjective"].lower()
    assert "back" in subjective or "pain" in subjective
    
    assessment = soap["assessment"].lower()
    assert "strain" in assessment or "muscle" in assessment
    
    plan = soap["plan"].lower()
    assert "ibuprofen" in plan or "rest" in plan
    
    print(f"SOAP Note Generated: {result}")
    print("LLM Live Test Passed!")
