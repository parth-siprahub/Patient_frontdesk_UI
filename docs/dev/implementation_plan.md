# Implementation Plan - LLM Integration (Context-Aware SOAP Notes)

**Goal**: Re-enable Gemini 1.5 Flash to generate accurate, structured SOAP notes. Enhance the prompt to include Patient Context (Age, Gender, Medical History) for higher clinical relevance.

## User Review Required
> [!IMPORTANT]
> **Google API Key**: You must define `GOOGLE_API_KEY` in your `.env` file. The current key may be invalid or missing.
> **Prompt Engineering**: The prompt will be updated to be "Context Aware".

## Proposed Changes

### App Core & Services

#### [MODIFY] [llm_service.py](file:///Users/sindhu/Projects/DB-API_Integrated_NeuroAssist/app/services/llm_service.py)
- **Update Signature**: Change `generate_soap_note_async` to accept `patient_context: dict`.
- **Update Prompt**: Inject `Age`, `Gender`, `Allergies`, and `Medical History` into the system instructions.
- **Refinement**: Ensure strictly typed JSON output for `soap_note` and `risk_flags`.

#### [MODIFY] [consultation_processor.py](file:///Users/sindhu/Projects/DB-API_Integrated_NeuroAssist/app/services/consultation_processor.py)
- **Fetch Context**: Query `PatientProfile` using `consultation.patient_id`.
- **Enable Logic**: Uncomment step 4 (LLM Call) and step 5 (SOAP Note Creation).
- **Pass Context**: Supply the fetched profile data to the `GeminiService`.

### LLM Service (`app/services/llm_service.py`)
- [DONE] **Strict Grounding**: Add prompt instructions to forbid hallucination.
- [DONE] **Uncertainty Flagging**: Add `low_confidence` list to JSON schema.
- [DONE] **Reliability**: Add retry logic for 429 Errors.

### Database Models (`app/models/base.py`)
- [DONE] **Schema Update**: Add `low_confidence` (JSON) field to `SOAPNote`.

### Verification Suite (New Files)
- [DONE] `batch_verify.py`: Batch processing script.
- [DONE] `calculate_accuracy.py`: Metrics calculation.
- [DONE] `debug_mismatches.py`: Visual debugging.

## Verification Plan

### Automated Tests
1.  [DONE] **Unit Test**: Run `pytest tests/test_live_llm.py`.
    *   *Action*: I will likely need to update this test to supply a mock `patient_context`.
2.  [DONE] **Integration Test**: Run `pytest tests/test_live_chain.py`.
    *   *Action*: Revert the "Expect No SOAP Note" assertion. It should now expect a valid SOAP note.

### Manual Verification
- [DONE] Use `inspect_result.py` to print the generated SOAP note and verify it reflects the patient's specific context (e.g., if patient is 80 years old, the assessment should consider age).
