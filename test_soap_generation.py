import asyncio
from app.services.llm_service import GeminiService
from app.models.base import PatientProfile

# Sample Ground Truth Transcript (day1_consultation01_patient.wav)
TRANSCRIPT = """
Hello, how are you? Oh hey, I've just had some diarrhea for the last three days, and it's been affecting me. 
I need to stay close to the toilet. And, yeah, it's been affecting my day-to-day activities. 
Yeah, so it's like loose and watery stool, going to the toilet quite often, and like some pain in my, like, lower stomach? 
Um, probably like six or seven times a day? Yeah. No, no blood, yeah, just watery and loose stool. 
Yep. So in my lower abdomen, so, like, ...yeah, just to one side. 
Um, haven't been eating much, just toast and water. 
No fever, no vomiting. Just the diarrhea and the stomach pain.
"""

async def main():
    print("Testing SOAP Note Generation...")
    
    # Mock Patient Profile
    patient = PatientProfile(
        id=None, user_id=None, first_name="Test", last_name="Patient",
        date_of_birth=None, gender="Male", medical_history="None"
    )
    
    try:
        soap = await GeminiService.generate_soap_note_async(TRANSCRIPT, patient_context=patient.dict())
        print("\n--- GENERATED SOAP NOTE ---")
        print(soap)
        print("---------------------------")
        
        # Quality Checks
        if soap.get("subjective") and "diarrhea" in soap["subjective"].lower():
            print("✅ Subjective: Captured chief complaint")
        else:
            print("❌ Subjective: Missed chief complaint")
            
        if soap.get("assessment") and ("gastroenteritis" in soap["assessment"].lower() or "viral" in soap["assessment"].lower()):
             print("✅ Assessment: Reasonable diagnosis found")
        
        if soap.get("plan") and "hydration" in soap["plan"].lower():
             print("✅ Plan: Includes hydration advice")

    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
