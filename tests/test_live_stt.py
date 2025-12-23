import pytest
import os
import asyncio
from gtts import gTTS
from app.services.stt_service import AssemblyAIService

@pytest.fixture
def test_audio_file_stt():
    """
    Generates a temporary MP3 file for STT testing.
    """
    filename = "stt_test.mp3"
    text = "The patient is experiencing a mild fever and cough."
    tts = gTTS(text=text, lang='en')
    tts.save(filename)
    
    yield filename
    
    # Cleanup
    if os.path.exists(filename):
        os.remove(filename)

@pytest.mark.asyncio
async def test_live_stt_service(test_audio_file_stt):
    """
    Verifies that AssemblyAIService correctly transcribes a real audio file
    and returns the expected structure.
    """
    print(f"Submitting {test_audio_file_stt} to AssemblyAI...")
    
    # We call the service directly
    result = await AssemblyAIService.transcribe_audio_async(test_audio_file_stt)
    
    # Assertions
    assert isinstance(result, dict)
    assert "text" in result
    assert "confidence" in result
    assert "id" in result
    
    # Check accuracy (gTTS is usually clear, but ASR can vary, so check keywords)
    transcript = result["text"].lower()
    print(f"Transcript received: {transcript}")
    
    assert "patient" in transcript
    assert "fever" in transcript
    assert "cough" in transcript
    
    print("STT Live Test Passed!")
