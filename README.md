# FairShare

**Continuous, usage-aware settlement engine for shared households.**

Built for the PayPal AI Hackathon. FairShare is an operating system for household economic equilibrium. It makes invisible structural costs visible and settles them in real-time via PayPal — before resentment becomes conflict.

## 🚀 Features
- **AI Bill Ingestion:** Upload a utility bill (PDF or Image). The AI (Gemini 3.8 Flash with OpenRouter fallback) extracts the amount and category.
- **The Fairness Ledger (AG Grid):** Complete transparency on every calculation, split rule, and balance.
- **Continuous IoT Feed:** Simulates real-time smart plug data (e.g., 5kWh usage) and attributes it dynamically.
- **Low-Friction Logging:** 1-tap buttons for "Invisible Labor" (Groceries, Mental Load).
- **PayPal Settlement Fabric:**
  - **Invoicing:** Generates real PayPal invoices for roommates who over-benefited (Red balances).
  - **Payouts:** Executes real PayPal payouts to reimburse roommates who overpaid (Green balances).

## 🛠️ Tech Stack
- **Framework:** Next.js 14 (App Router, TypeScript, Tailwind CSS)
- **Ledger UI:** AG Grid Community
- **AI:** Google Gemini 3.8 Flash (Direct SDK) with OpenRouter Fallback
- **Payments:** PayPal REST API (Invoicing v2, Payouts v1)

## 🧪 How to Run Locally
1. Clone the repo.
2. Create a `.env.local` file with the following variables:
```env
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_secret
PAYPAL_API_BASE=https://api-m.sandbox.paypal.com
PAYPAL_BUSINESS_EMAIL=your_sandbox_business_email
PAYPAL_CURRENCY=GBP
GEMINI_API_KEY=your_gemini_key
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODELS=google/gemini-3.8-flash
```
3. Run `npm install`.
4. Run `npm run dev`.
5. Open `http://localhost:3000`.

## 🏆 Hackathon Context
- **Why PayPal?** Settlement is not advice; it is a financial action. We use PayPal Invoicing and Payouts as the continuous settlement fabric.
- **Why AG Grid?** Transparency over precision. The ledger explicitly shows the math so roommates can trust the system.
- **AI Usage:** We use AI for multimodal document extraction and natural language reasoning, not just arithmetic.