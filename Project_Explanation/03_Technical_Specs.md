# 🛠️ Technical Specifications & Stack

## 💻 Tech Stack

### Core Framework
*   **Next.js 16 (App Router)**: The backbone of the application. Uses React Server Components (RSC) for blazingly fast page loads and SEO.
*   **React 19**: Utilizing the latest React features including robust hook handling and transitions.
*   **TypeScript**: Ensures type safety and rigid code structure across the entire codebase.

### Styling & UI
*   **Tailwind CSS v4**: The latest engine for utility-first CSS.
*   **Shadcn/UI**: A collection of reusable components built on Radix UI primitives.
*   **Framer Motion**: Powering the smooth, physics-based animations in the dashboard.
*   **Lucide React**: Beautiful, consistent iconography.

### Data & Backend
*   **Prisma ORM**: The next-gen ORM for Node.js and TypeScript.
*   **PostgreSQL**: The robust relational database storing user data, certificates, and hashes.
*   **Supabase (Connection)**: Used as the cloud host for the Postgres database.
*   **Server Actions**: Backend logic is co-located with components for seamless data mutation.

### Artificial Intelligence
*   **Tesseract.js**: Pure JS port of the famous Tesseract OCR engine for client-side text recognition.
*   **Recharts**: Composable charting library built on React components.

---

## 📂 Folder Structure (Key Directories)

```bash
/app
  /api              # Backend API Routes (Next.js serverless functions)
  /dashboard        # Protected Application Area
    /upload         # AI Upload Logic
    /verify         # Fraud Analysis Logic
    /analytics      # Data Visualization
  /lib              # Shared utilities (Auth, Prisma client)
/components         # Reusable UI Blocks (Buttons, Cards, Modals)
/prisma             # Database Schema (schema.prisma)
```

## 🔒 Security Measures
1.  **Authentication**: Protected routes verify session tokens before rendering sensitive pages.
2.  **Input Validation**: Zod schemas ensure no malicious data enters the API.
3.  **Cryptographic Hashing**: Certificates are not just stored; they are hashed. This hash is the "Truth" against which all verifications are checked.
