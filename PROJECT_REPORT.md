# 🎓 TrueLedger: AI & Blockchain-Based Certificate Verification System

**Academic Project Report**

---

**Submitted by:** [Your Name/Team]  
**Department:** Computer Science & Engineering  
**Date:** January 2026  

---

## 📄 Abstract

Use of digital documentation has skyrocketed, but so has the prevalence of fraudulent certificates. Traditional verification methods—manual email checks or phone calls—are slow, prone to human error, and lack transparency. **TrueLedger** addresses this critical gap by merging **Blockchain-inspired immutability** with **Artificial Intelligence**. This system ensures that once a certificate is issued, its cryptographic hash is anchored in a secure ledger, making it tamper-proof. Simultaneously, an **Agentic AI Engine** (powered by TensorFlow.js and Groq Llama 3) continuously monitors the system for anomalies, providing real-time forensic analysis of certificate data. This report details the design, implementation, and testing of TrueLedger, a scalable solution for modern credential verification.

---

## 📑 Table of Contents

1.  [Introduction](#chapter-1-introduction)
2.  [Literature Survey](#chapter-2-literature-survey)
3.  [System Analysis](#chapter-3-system-analysis)
4.  [System Architecture](#chapter-4-system-architecture)
5.  [Database Design](#chapter-5-database-design)
6.  [AI & Security Algorithms](#chapter-6-ai--security-algorithms)
7.  [Implementation Details](#chapter-7-implementation-details)
8.  [Testing & Validation](#chapter-8-testing--validation)
9.  [Conclusion & Future Scope](#chapter-9-conclusion--future-scope)
10. [References](#chapter-10-references)

---

## Chapter 1: Introduction

### 1.1 Problem Statement
In the educational and corporate sectors, credential fraud is a multi-billion dollar problem. Fake degrees and altered transcripts undermine the integrity of institutions and pose risks to employers. 
*   **Lack of Centralization**: Verification often requires contacting the issuer directly.
*   **Tamper Vulnerability**: PDF certificates can be easily edited with software like Photoshop.
*   **Time Consumption**: Manual verification can take weeks.

### 1.2 Proposed Solution
TrueLedger provides a decentralized trust model where the "proof" of the certificate is decoupled from the physical file.
*   **Immutable Hashing**: We generate a unique SHA-256 hash for every issued document. If a single pixel changes, the hash changes, alerting the system.
*   **AI Forensics**: A neural network scans document metadata and titles to score the likelihood of fraud (e.g., detecting "Draft", "Copy", or inconsistent naming).
*   **Instant Verification**: Verifiers can instantly check validity via a unique ID or QR code.

### 1.3 Objectives
*   To design a secure web platform for certificate issuance.
*   To implement Role-Based Access Control (RBAC) for Admins, Students, and Verifiers.
*   To integrate a smart AI Chatbot for natural language querying of system data.
*   To ensure data integrity using cryptographic hashing.

---

## Chapter 2: Literature Survey

### 2.1 Existing Methods
*   **Manual Verification**: High cost, slow turnaround.
*   **Centralized Databases**: Vulnerable to SQL injection or internal manipulation by corrupt staff.
*   **Digital Signatures (PKI)**: Good, but often requires complex hardware tokens or proprietary software (Adobe Sign).

### 2.2 The TrueLedger Advantage
Unlike standard databases, TrueLedger employs a "Ledger-based" approach where every action is logged in a `CertificateLog` table, creating an audit trail similar to a blockchain. Unlike pure blockchain apps (which can be slow and expensive), TrueLedger uses a hybrid approach: secure fast database for storage + cryptographic hashing for integrity + AI for active monitoring.

---

## Chapter 3: System Analysis

### 3.1 Functional Requirements
1.  **User Management**:
    *   **Admin**: Register institutions, issue certificates.
    *   **Student**: View/Download certificates, share public links.
    *   **Verifier**: Validate certificates, view risk scores.
2.  **Certificate Lifecycle**:
    *   Issuance -> Pending -> Approved -> Verified/Rejected.
3.  **Intelligence Layer**:
    *   Chatbot must answer context-aware questions (e.g., "How many certificates did we issue today?").

### 3.2 Non-Functional Requirements
*   **Performance**: Verification must happen in < 1 second.
*   **Security**: Passwords hashed with bcrypt. API routes protected by JWT sessions.
*   **Scalability**: Built on Next.js Server Actions to handle concurrent requests efficiently.

---

## Chapter 4: System Architecture

### 4.1 High-Level Design
The system follows a modern **Model-View-Controller (MVC)** influenced architecture, adapted for the **Next.js App Router**:

*   **Frontend (View)**: React 19 Components, Tailwind CSS v4 for styling.
*   **Backend (Controller)**: Next.js Server Actions (RPC-style) and API Routes.
*   **Database (Model)**: PostgreSQL managed via Prisma ORM.

### 4.2 Module Description
1.  **Auth Module**: Handles storage of secure sessions using `next-auth`.
2.  **Core Ledger**: Manage ACID transactions for certificate creation.
3.  **AI Cortex**:
    *   **NeuralNet (Local)**: TensforFlow.js model running in the browser/server.
    *   **CognitiveBrain (Cloud)**: Groq Llama 3 integration for complex reasoning.

---

## Chapter 5: Database Design

The database is normalized to 3NF standards. We use **PostgreSQL**.

### 5.1 Entity Relationship (ER) Data Model

#### `User` Table
Stores authentication and profile data.
*   `id` (PK): UUID
*   `email`: Unique index
*   `role`: Enum (ADMIN, STUDENT, COMPANY)
*   `password`: Hashed string

#### `Certificate` Table
The core asset.
*   `id` (PK): UUID
*   `verificationHash`: The SHA-256 fingerprint.
*   `status`: State machine (PENDING, VERIFIED, etc.)
*   `s3Key`: Reference to the actual PDF file in Cloud Storage.

#### `CertificateLog` Table
The "Blockchain" element. Every change to a certificate is appended here.
*   `id`: UUID
*   `action`: (e.g., "ISSUED", "VIEWED", "VERIFIED")
*   `performedBy`: User ID
*   `timestamp`: Immutable record of when it happened.

---

## Chapter 6: AI & Security Algorithms

### 6.1 Cryptographic Hashing
We use the **SHA-256** algorithm.
`Hash = SHA256(StudentName + IssuerID + Date + CourseID)`
This hash is generated at the moment of issuance and stored. When a verifier uploads a document, we re-compute the hash. If `Computed_Hash != Stored_Hash`, the document is marked **TAMPERED**.

### 6.2 Neural Risk Engine (TensorFlow.js)
We implemented a custom class `NeuralRiskModel` in `lib/ai/neuralModel.ts`.
*   **Input**: Document Title & Description.
*   **Preprocessing**: Tokenization, Stop-word removal, Vectorization (Vocabulary mapping).
*   **Architecture**:
    *   Layer 1: Dense (32 units, ReLU) - simulates embedding.
    *   Layer 2: Dropout (0.2) - prevents overfitting.
    *   Layer 3: Dense (16 units, ReLU).
    *   Output: Dense (1 unit, Sigmoid) - probability of fraud (0-1).

### 6.3 Agentic Reasoner (Groq Llama 3)
Located in `lib/ai/brain.ts`.
*   **Role**: Acts as a "Cyber-Security Analyst".
*   **Workflow**:
    1.  **Synthesize**: Aggregates DB stats (Total certificates: 50, Risk High: 2).
    2.  **Prompt Engineering**: Feeds context into Llama 3-70b via Groq API.
    3.  **Response**: Returns a JSON object with `reasoning_path` and `suggested_action`.

---

## Chapter 7: Implementation Details

### 7.1 Tech Stack
*   **Framework**: Next.js 16 (React 19)
*   **Language**: TypeScript (Strict mode)
*   **Database**: PostgreSQL + Supabase
*   **ORM**: Prisma
*   **AI**: TensorFlow.js, Groq SDK

### 7.2 Key Code Snippets

**Certificate Hashing (Simplified):**
```typescript
import { createHash } from 'crypto';

export function signCertificate(data: any) {
  const payload = JSON.stringify(data);
  return createHash('sha256').update(payload).digest('hex');
}
```

**AI Inference:**
```typescript
// From neuralModel.ts
public predict(text: string): number {
    const encoded = this.encode(text);
    const input = tf.tensor2d([encoded]);
    return this.model.predict(input) as number;
}
```

---

## Chapter 8: Testing & Validation

### 8.1 Test Plan
1.  **Unit Testing**: Tested individual AI functions (e.g., ensuring `neuralModel.predict` returns 0-1).
2.  **Integration Testing**: Tested the full "Issuer -> Student -> Verifier" loop.
3.  **Security Testing**: Attempted SQL injection (blocked by Prisma) and Cross-Site Scripting (blocked by React).

### 8.2 Test Cases
| Test ID | Description | Input | Expected Output | Status |
| :--- | :--- | :--- | :--- | :--- |
| TC-01 | Login Valid | Valid Admin Creds | Redirect to Dashboard | ✅ Pass |
| TC-02 | Login Invalid | Wrong Password | Error Toaster | ✅ Pass |
| TC-03 | Issue Cert | Valid Student Data | Certificate Created | ✅ Pass |
| TC-05 | AI Risk Check | Title "Fake Degree" | Risk Score > 90% | ✅ Pass |

---

## Chapter 9: Conclusion & Future Scope

### 9.1 Conclusion
TrueLedger successfully demonstrates how **Web3 concepts** (immutability) can be combined with **Web2 UX** (Next.js) and **AI** (Forensics) to solve a real-world problem. The system provides a seamless experience for universities to issue trusted credentials and for employers to verify them instantly, eliminating fraud.

### 9.2 Future Scope
1.  **Public Blockchain**: Currently, we use an internal immutable ledger. Future versions could write hashes to **Ethereum** or **Polygon** for decentralized proofs.
2.  **Physical Integration**: Generate tamper-proof **NFC stickers** for physical diplomas that link to the digital ledger.
3.  **Federated Learning**: Train the AI model on data from multiple universities without sharing sensitive student data.

---

## Chapter 10: References
1.  Nakamoto, S. (2008). Bitcoin: A Peer-to-Peer Electronic Cash System.
2.  Next.js Documentation (2025). Server Actions & App Router.
3.  TensorFlow.js API Reference.
4.  Groq Cloud API Documentation.

