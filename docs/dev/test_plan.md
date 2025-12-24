# Test Plan & Verification Strategy

## 1. Automated Tests (`pytest`)
*   **Unit Tests**: `tests/` folder.
*   **Integration**: `test_consultation_flow.py` (Full end-to-end API test).

## 2. Batch Verification Suite (`batch_verify.py`)
*   **Purpose**: Validates system stability on large datasets.
*   **Usage**:
    ```bash
    python batch_verify.py
    ```
*   **Outputs**: `batch_verification_report.csv` (Pass/Fail status).

## 3. Accuracy Calibration (`calculate_accuracy.py`)
*   **Purpose**: Compares generated transcripts against Ground Truth (`.TextGrid` or `.txt`).
*   **Metrics**: Word Error Rate (WER) and Similarity Score (SequenceMatcher).
*   **Usage**:
    ```bash
    python calculate_accuracy.py
    ```

## 4. Manual Debugging Tools
*   **`debug_mismatches.py`**:
    *   Side-by-side view of Ground Truth vs Generated text.
    *   Highlight specific word differences (omissions, substitutions).
*   **`test_soap_generation.py`**:
    *   Sends a raw transcript to the LLM to verify SOAP structure.
    *   Validates "Strict Grounding" (no hallucinations).

## 5. Deployment Verification
Before deploying to production:
1.  Run `batch_verify.py` on the "Gold Set" (5 specific files).
2.  Ensure WER is < 20%.
3.  Ensure 0 "Risk Flags" are missed.
