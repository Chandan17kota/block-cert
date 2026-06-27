# 🔐 TrueLedger: AI & Blockchain-Powered Certificate Verification System

TrueLedger is an enterprise-grade digital certificate automation, management, and verification platform. It bridges the gap between traditional document management and cryptographic trust by combining Next.js modern architecture, a simulated blockchain ledger audit trail, and a multi-layer AI/ML verification engine (PaddleOCR, CNN, and NLP).

---

## 🌟 System Architecture & Verification Flow

TrueLedger implements a **4-layer multi-model verification architecture** to authenticate digital certificates and detect sophisticated tampering or forgery.

```
                  ┌────────────────────────────────────────┐
                  │      Uploaded Certificate PDF / Image  │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │ 1️⃣ OCR Layer (PaddleOCR - MANDATORY)   │
                  │ - PP-OCRv4 DB++ & SVTR-LCNet           │
                  │ - Bounding boxes & Confidence extraction│
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
           ┌──────────────────────────┼──────────────────────────┐
           │                          │                          │
           ▼                          ▼                          ▼
┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
│2️⃣ Image Authenticity  │   │3️⃣ Text Consistency   │   │4️⃣ Layout Similarity  │
│ - EfficientNet-B3 CNN│   │ - DistilBERT NLP     │   │ - Siamese CNN        │
│ - Forgery detection  │   │ - Red-flag analysis  │   │ - Logo/Seal match    │
│ - Weight: 45%        │   │ - Weight: 35%        │   │ - Weight: 20%        │
└──────────┬───────────┘   └──────────┬───────────┘   └──────────┬───────────┘
           │                          │                          │
           └──────────────────────────┼──────────────────────────┘
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │     Weighted Score Aggregator (%)      │
                  │  0.45 * Image + 0.35 * Text + 0.2 * Lay│
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │            Verification Status         │
                  │  - LIKELY_ORIGINAL (Score > 65%)       │
                  │  - SUSPICIOUS (Score 40% - 65%)        │
                  │  - FAKE (Score < 40%)                  │
                  └────────────────────────────────────────┘
```

---

## ✨ Features

*   **🔒 Secure Authentication**: NextAuth.js custom JWT-based authentication with Google OAuth compatibility.
*   **🎓 Smart Certificate Issuance**: Dynamic certificate PDF rendering, storage, and QR code embedding.
*   **⛓️ Immutable Trust Ledger**: Simulated blockchain database audit logging. Once a certificate is generated, it is hashed (SHA-256) and recorded in an immutable-style system log.
*   **🤖 Multi-Layer AI Verification**:
    *   **PaddleOCR**: Extracts text and per-word confidence metrics.
    *   **EfficientNet-B3**: Inspects pixel structures, logos, and signatures for tampering artifacts.
    *   **DistilBERT**: Runs Natural Language Processing (NLP) to detect textual inconsistencies (e.g., phrasing differences, suspicious templates, spelling red flags).
    *   **Siamese CNN Layout Matcher**: Compares the physical visual layout, seal positions, and edge density against templates.
*   **📊 Analytics Dashboard**: Beautiful visual metrics showing active, pending, verified, and flagged certificates using `recharts`.
*   **💬 AI Assistant Chatbot**: Natural language querying over the database schema allowing admins to query stats (e.g., "How many certificates were verified today?").

---

## 📁 Project Structure

```bash
TrueLedger/
├── app/
│   ├── api/                    # Next.js Serverless API endpoints
│   │   ├── admin/              # Admin dashboard reports & stats APIs
│   │   ├── ai/                 # Subprocess triggers for AI risk engine
│   │   ├── certificates/       # CRUD operations for digital credentials
│   │   ├── signup/             # User registration
│   │   └── verify/             # Public verification verification API
│   ├── dashboard/              # Protected dashboards (Admin, Student, Company)
│   ├── signin/                 # Login page
│   ├── signup/                 # Registration page
│   └── verify/                 # Public verification search and status pages
├── components/                 # Reusable React components (UI, Charts, Chatbot)
├── lib/                        # Core system utilities
│   ├── ai/                     # Python bridges, NLP configurations, and types
│   ├── auth-config.ts          # NextAuth configuration
│   └── prisma.config.ts        # Database connection instantiation
├── prisma/                     # Database schemas and migration configurations
├── public/                     # Static assets (images, logos)
└── scripts/                    # Python AI Risk Engine codebase
    ├── ai_risk_engine.py       # Main python CLI entry point for 4-layer AI
    ├── download_models.py      # Automated script to cache PaddleOCR models locally
    └── requirements.txt        # Python dependency manifest
```

---

## 🛠️ Installation & Setup

### Prerequisites
*   **Node.js**: v18.x or newer
*   **Python**: v3.10 or newer (required for running the AI Risk Engine)
*   **PostgreSQL**: A running instance or connection URL

---

### Step 1: Clone and Install Node.js Dependencies
1. Navigate to the project root:
   ```bash
   cd TrueLedger
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

---

### Step 2: Setup Python Virtual Environment and Packages
1. Create a virtual environment inside the project root:
   ```bash
   python -m venv .venv
   ```
2. Activate the virtual environment:
   *   **Windows**:
       ```powershell
       .venv\Scripts\Activate.ps1
       ```
   *   **macOS/Linux**:
       ```bash
       source .venv/bin/activate
       ```
3. Install required Python packages:
   ```bash
   pip install -r scripts/requirements.txt
   ```

---

### Step 3: Pre-download AI Models
To prevent runtime download timeouts when analyzing certificates for the first time, run the pre-download script:
```bash
python scripts/download_models.py
```
This script downloads PaddleOCR, PP-OCRv4 detection/recognition modules, and local validation images to verify model integrity.

---

### Step 4: Database Configuration & Migration
1. Copy or create a `.env` file in the project root:
   ```env
   # PostgreSQL Connection
   DATABASE_URL="postgresql://postgres:password@localhost:5432/trueledger?schema=public"
   DIRECT_URL="postgresql://postgres:password@localhost:5432/trueledger?schema=public"

   # Authentication
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-32-char-random-auth-key-secret-here"
   JWT_SECRET="your-jwt-signing-secret-key-here"

   # Groq API Configuration (for the AI Chatbot Assistant)
   GROQ_API_KEY="gsk_..."
   ```

2. Run Prisma migrations to deploy database schema:
   ```bash
   npx prisma migrate dev --name init
   ```
3. Seed the initial admin, student, and verifier accounts:
   ```bash
   npx ts-node seed_users.ts
   ```

---

## 🚀 Running the Application

### 1. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the landing page.

### 2. Default Login Accounts
Use these pre-seeded accounts to explore the system:
*   **Institution Admin**: `admin@trueledger.com` | Password: `password123`
*   **Student**: `student@university.edu` | Password: `password123`
*   **Company Verifier**: `verifier@company.com` | Password: `password123`

---

## 🤖 Running the Python AI Engine via CLI
You can run the AI Risk Engine directly from the command line to analyze files:

1. **Full Multi-layer Analysis**:
   ```bash
   python scripts/ai_risk_engine.py analyze path/to/certificate.png
   ```
   *Runs OCR text extraction, CNN-based fake check, semantic verification, and structural layout evaluation, outputting a complete JSON audit log.*

2. **OCR Text Extraction Only**:
   ```bash
   python scripts/ai_risk_engine.py extract path/to/certificate.png
   ```

---

## 🔧 Recent Improvements & Stability Fixes

*   **Fixed File Selection Error**: Resolved JSON structure mismatches in frontend page parsing (`componentScores` mapping errors during upload analysis).
*   **Resolved PaddleOCR Connectivity Issues**: Patched environment configuration `PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK=True` to bypass online host connectivity checks, reducing analysis speed to sub-10 seconds.
*   **Subprocess Execution Stability**: Increased Node-Python bridge execution timeouts to 120 seconds to prevent cold-start model load crashes.