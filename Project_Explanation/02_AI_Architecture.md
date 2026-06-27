# 🤖 AI & Intelligent Features Architecture

TrueLedger integrates "Intense" AI features to elevate it from a simple CRUD app to an intelligent platform. Here is a breakdown of the AI modules:

---

## 1. ✨ Smart AI Extract (Optical Character Recognition)
**Found in:** `Dashboard > Upload`

### How it works:
*   **Engine**: We utilize **Tesseract.js**, a powerful WASM-based OCR engine running entirely in the browser (Client-Side AI).
*   **Workflow**:
    1.  User selects a certificate image.
    2.  The AI engine pre-processes the image (grayscale, contrast adjustment).
    3.  It scans the text geometry to identify key lines.
    4.  **Heuristic Analysis**: The code looks for keywords like "Certificate of Completion", "Awarded to", and detects patterns to intelligently guess which line is the **Title** and which is the **Description**.
    5.  **Confidence Scoring**: The AI returns a confidence score (0-100%) indicating how sure it is about the text it read.

### Technical Value:
*   **Privacy Preserving**: Since OCR happens in the browser, sensitive data is extracted *before* it even hits the server.
*   **UX Enhancement**: Saves the admin from typing manual details.

---

## 2. 🕵️‍♂️ AI Fraud Analysis & Forensics
**Found in:** `Dashboard > Verify`

### How it works:
*   **Simulation Engine**: When a verification request is made, the system runs a multi-step check.
*   **Analysis Vectors**:
    1.  **Metadata Integrity**: Checks if the ID format matches the standard schema.
    2.  **Blockchain Anchor**: Verifies if the hash exists in the immutable ledger.
    3.  **Content Analysis**: Evaluates the request source and frequency (simulated).
*   **Trust Score**: The system calculates a weighted "Trust Score".
    *   *Score > 90*: **Valid** (Green)
    *   *Score < 50*: **Suspicious/Fraud** (Red)

### Real-World Application:
In a production environment, this would connect to a Python/TensorFlow backend that analyzes common forgery techniques (e.g., mismatched fonts, photoshopped pixels).

---

## 3. 📊 Predictive Live Analytics
**Found in:** `Dashboard > Analytics`

### How it works:
*   **Data Visualization**: Uses **Recharts** to render complex datasets.
*   **Metrics**:
    *   **Issuance Trends**: Time-series analysis of certification growth.
    *   **Threat Detection Grid**: A breakdown of "Valid" vs "Fraud" attempts.
*   **Live Simulation**: The "LIVE UPDATING" badge represents real-time websocket connections (simulated for demo) where AI is constantly monitoring the stream of verification requests.

---

## 🧠 Why "Intense" AI?
By exposing these metrics and analysis tools, TrueLedger provides **transparency**. Users don't just see "Verified"; they see *why* it was verified and *how confident* the system is, building deeper trust in the platform.
