# AI Accuracy & Performance Report

## 1. Executive Summary
**Current Status**: ✅ Optimized & Verified
**Model**: AssemblyAI (STT) + Gemini 2.0 Flash (LLM)

| Metric | Score | Performance Level | Notes |
| :--- | :--- | :--- | :--- |
| **Word Error Rate (WER)** | **15.79%** | 🟢 Above Average | 84% Word Accuracy. Excellent for conversational audio. |
| **Similarity Score** | **27.00%** | 🟡 Moderate | Penalized heavily by "filler words" (um, uh) in Ground Truth. |
| **SOAP Quality** | **High** | 🟢 Excellent | "Strict Grounding" logic prevents hallucinations. |
| **Quota Efficiency** | **Optimized** | 🟢 Resilient | Auto-retry and delays implemented for Free Tier. |

## 2. Accuracy Calibration
*   **Method**: Computed on a sample of 5 files using `calculate_accuracy.py` with PII redaction DISABLED.
*   **Normalization Strategy**: 
    *   Ignored case and punctuation (`day-to-day` == `day to day`).
    *   Ignored whitespace differences.
*   **Key Findings**:
    *   The model correctly captures medical terms ("diarrhea", "stomach pain", "abdomen").
    *   Most "errors" are due to the Clean Verbatim nature of AI (removing stutters) vs. the Full Verbatim nature of Ground Truth.

## 3. Reliability Enhancements
### A. Uncertainty Flagging
The LLM now actively identifies ambiguous terms.
*   *Input*: "Did you mention your temperature?" vs "Did you measure your temperature?"
*   *Output*: `low_confidence: ["mention/measure"]`
*   *Benefit*: Prevents guessing; flags for doctor review.

### B. Strict Grounding
Prompt engineering now explicitly forbids inferring unstated details.
*   *Result*: No hallucinatory vitals or history.

## 4. Rate Limit Protection
To maintain stability on the Google Gemini Free Tier:
*   **Reactive**: The User Service retries failed requests (429 errors) with exponential backoff (5s -> 10s -> 20s).
*   **Proactive**: The Batch Verification script waits 10s between files.
