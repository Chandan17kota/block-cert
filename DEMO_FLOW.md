# 🎓 TrueLedger - Complete Demo Walkthrough

This document serves as a script for demonstrating the **TrueLedger** system. It covers the complete lifecycle of a digital certificate: **Issuance (Admin)** -> **Reception (Student)** -> **Verification (Third Party/AI)**.

---

## 🎭 The Cast (Credentials)

Use these accounts to demonstrate the different roles.

| Role | Username | Email | Password | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Institution** | `admin` | `admin@trueledger.com` | `password123` | Issues certificates. |
| **Student** | `alicestudent` | `student@university.edu` | `password123` | Receives & shares certificates. |
| **Verifier** | `acmecorp` | `verifier@company.com` | `password123` | Validates authenticity via AI & Blockchain. |

---

## 🎬 Scene 1: The Trust Anchor (Institution Admin)

**Goal**: Issue a tamper-proof certificate to a student.

1.  **Login**:
    *   Go to login page.
    *   Sign in as **Institution Admin** (`admin@trueledger.com` / `password123`).
2.  **Dashboard**:
    *   Show the **Admin Dashboard**. Point out stats (Total Certificates Issued, Pending Approvals).
    *   *Highlight*: "This dashboard gives the university full oversight of credential issuance."
3.  **Issue Certificate**:
    *   Navigate to **"Issue Certificate"** or **"Manage Certificates"**.
    *   Select `Issue New`.
    *   **Fill the Form**:
        *   **Student Name**: Alice Student
        *   **Course**: Computer Science
        *   **Date**: Today's date
    *   **Click Issue**:
        *   *Explain*: "At this moment, the system generates a secure SHA-256 hash of the data and anchors it to our simulated ledger. This ensures the record is immutable."
4.  **Logout**:
    *   Sign out of the Admin account.

---

## 🎬 Scene 2: The Achievement (Student)

**Goal**: View the certificate and get the proof to share.

1.  **Login**:
    *   Sign in as **Student** (`student@university.edu` / `password123`).
2.  **My Certificates**:
    *   Navigate to the **Student Dashboard**.
    *   You should see the certificate just issued by the Admin.
3.  **View & Download**:
    *   Click on the certificate to view the digital version.
    *   **Download PDF**: Click the download button.
    *   *Explain*: "Alice now has a portable PDF. Traditionally, this PDF could be photoshopped. But with TrueLedger, we have AI constraints."
4.  **Get ID/Link**:
    *   Copy the **Certificate ID** (e.g., `CERT-12345...`) shown on the screen.
5.  **Logout**:
    *   Sign out.

---

## 🎬 Scene 3: The Truth Test (Verifier / Employer)

**Goal**: innovative verification using Blockchain lookup and AI Tamper Detection.

1.  **Login**:
    *   Sign in as **Verifier** (`verifier@company.com` / `password123`).
2.  **Method A: Quick Lookup (Blockchain/DB Check)**:
    *   Go to **"Verify Certificate"**.
    *   Enter the **Certificate ID** you copied from the Student account.
    *   Click **Verify**.
    *   *Result*: System returns "✅ Verified: Genuine Certificate". It shows the original issuer and date. All data matches the immutable record.
3.  **Method B: AI Tamper Detection (The "Wow" Factor)**:
    *   *Scenario*: "Imagine someone tries to edit the PDF name from 'Alice' to 'Bob' using Photoshop."
    *   Go to the **"AI Forensics"** or **"Upload Verification"** tab.
    *   **Upload** the genuine PDF (or image) downloaded earlier.
    *   **Click Analyze**:
        *   *Explain*: "The system is now running OCR to read the text and a CNN (Convolutional Neural Network) to check for pixel inconsistencies, font mismatches, and copy-paste artifacts."
    *   *Result*:
        *   **Status**: 🟢 **Authentic** (Confidence > 95%).
        *   **OCR Extraction**: Shows the text matches the database record.
4.  **Logout**:
    *   End of demo.

---

## 🔑 Key Technology Talking Points

During the demo, mention these technical pillars:

*   **Next.js 16**: Using Server Actions for secure, fast data handling.
*   **Prisma & PostgreSQL**: Robust relational data management.
*   **AI Layer**: Tesseract.js for OCR and TensorFlow (or custom Python logic) for structural analysis of the image.
*   **Encryption**: All certificates are hashed; we don't just store files, we store cryptographic proofs.
