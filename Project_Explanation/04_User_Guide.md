# 📖 User Guide: How to Run & Use TrueLedger

## 🚦 Getting Started

### 1. Installation
If you haven't already:
```bash
npm install
```

### 2. Database Sync
Ensure the database schema is up to date:
```bash
npx prisma generate
```

### 3. Run the App
Start the development server:
```bash
npm run dev
```
OPEN: [http://localhost:3000](http://localhost:3000)

---

## 🕹️ Dashboard Walkthrough

### Step 1: Login
*   Click **"Sign In"** on the landing page.
*   You can use the default test credentials or Sign Up.
*   *(Note: For this demo, check if `next-auth` is configured for unrestricted access or mock mode if you face issues).*

### Step 2: Issue a Certificate (AI Powered)
1.  Navigate to the **Upload** tab in the sidebar.
2.  **Drag & Drop** a certificate image (JPG/PNG).
3.  **Click the "AI Auto-Fill" Button** (Wand Icon).
    *   *Watch the AI scan your image and extract the title!*
4.  Review the data and click **"Create Certificate"**.
5.  Success! The certificate is now hashed and stored.

### Step 3: Verify a Certificate (Fraud Check)
1.  Navigate to the **Verify** tab.
2.  Enter a Certificate ID (or copy one from the "Certificates" list).
3.  Click **"Verify"**.
4.  **Observe the AI Analysis**:
    *   The system will display a "Trust Score".
    *   If the ID is valid (simulated), you see a Green Shield.
    *   If invalid/tampered, you see a Red Warning.

### Step 4: Analyze Trends
1.  Navigate to the **Analytics** tab.
2.  Explore the live dashboard.
3.  Hover over the charts to see specific data points for issuance and fraud attempts.

### Step 5: Manage Students
1.  Navigate to the **Students** tab.
2.  View the list of students eligible for certification.
3.  Use the action menu to View Profile or Issue Certificate directly.
