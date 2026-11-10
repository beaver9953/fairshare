# FairShare

**Continuous, usage-aware settlement engine for shared households.**

Built for the PayPal AI Hackathon 2026. FairShare is an operating system for household economic equilibrium. It makes invisible structural costs visible and settles them in real-time via PayPal — before resentment becomes conflict.

## 🚀 Features
- **AI Bill Ingestion:** Upload a utility bill (PDF or Image). The AI extracts the amount and category.
- **The Fairness Ledger (AG Grid):** Complete transparency on every calculation, split rule, and balance.
- **Continuous IoT Feed:** Simulates real-time smart plug data (e.g., 5kWh usage) and attributes it dynamically.
- **Low-Friction Logging:** 1-tap buttons for "Invisible Labor" (Groceries, Mental Load).
- **PayPal Settlement Fabric:**
  - **Invoicing:** Generates real PayPal invoices for roommates who over-benefited (Red balances).
  - **Payouts:** Executes real PayPal payouts to reimburse roommates who overpaid (Green balances).

## 🛠️ How We Used PayPal and AI

### PayPal Developer Platform (Sandbox)
The PayPal integration is the core execution layer of FairShare, not a bolted-on feature. We implemented both sides of the settlement lifecycle:
1. **PayPal Invoicing (v2 API):** When a roommate over-benefits (red balance), we generate a real, payable invoice using the `/v2/invoicing/invoices` endpoint.
2. **PayPal Payouts (v1 API):** When a roommate over-contributes (green balance), we execute a real reimbursement using the `/v1/payments/payouts` endpoint.
3. **OAuth2 Authentication:** We manually generate access tokens using the Client Credentials grant type.

### AI Tools & Models
1. **Google Gemini 3.8 Flash:** Primary multimodal AI engine. We send base64 images of bills to Gemini to extract structured JSON data (category, description, totalCost).
2. **OpenRouter:** AI failover engine. If Gemini experiences high demand (503 errors) or times out after 8 seconds, the backend automatically pivots to OpenRouter using the `openai` SDK format.

## 🏆 Additional Sponsor Integrations
- **AG Grid (Community):** The "Fairness Ledger" is built on AG Grid. We leverage `cellStyle` for conditional formatting (red for debt, green for credit) and modular architecture for performance.
- **Render:** Cloud hosting. We deployed on Render with environment variables and a custom `/api/health` endpoint pinged by a cron job to prevent free-tier sleep.

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
Run npm install.

Run npm run dev.

Open http://localhost:3000.

## 🏆 Hackathon Context
Why PayPal? Settlement is not advice; it is a financial action. We use PayPal Invoicing and Payouts as the continuous settlement fabric.

Why AG Grid? Transparency over precision. The ledger explicitly shows the math so roommates can trust the system.

AI Usage: We use AI for multimodal document extraction and natural language reasoning, not just arithmetic.