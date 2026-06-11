# Walkthrough video — 5–6 min script

Record this with Loom or any screen recorder, then paste the link into README.md.

## 0:00 – 0:30 — Opening (talking head + intro slide)
- "Hi, I'm [name]. This is my submission for the Xeno SDE Internship: an AI-native, **chat-first** Mini CRM for D2C brands."
- "Three things I optimised for: (1) a sharp POV — chat as the primary interface, not a sidekick; (2) a real stubbed vendor with an async receipt loop, not inline simulation; (3) AI at the decision points, not sprinkled cosmetically."

## 0:30 – 1:00 — Architecture diagram (show README diagram)
- "One TanStack Start deploy on Cloudflare. The 'vendor' is a separate internal HTTP route — `/api/public/vendor/send` — so the CRM truly fans out, gets out-of-order receipts at `/api/public/crm/receipt`, and writes them back in batched UPDATE-IN queries."
- "Lovable Cloud for Postgres + Auth with RLS on every table. Lovable AI Gateway, Gemini 2.5 Flash, for NL→rules, message variants, and the agent planner."

## 1:00 – 1:30 — Sign in
- Open `/auth`. "Email/password and Google OAuth, both via Lovable's managed broker."
- Sign in with Google.
- Land on `/dashboard`.

## 1:30 – 2:00 — Seed data + dashboard
- Click **Seed demo data (5k customers)**. While it loads: "This generates 5,000 customers and ~20,000 orders, per the brief's scale assumption."
- When done: "KPI tiles, recent-campaign bar chart, overall delivery pie. The pie is empty right now — we'll come back."

## 2:00 – 2:45 — Segment builder + AI NL→rules
- Go to `/segments`.
- Type in the AI prompt: **"High spenders who haven't been active in 60 days"**.
- "The model returns strict JSON conditions. We render those into the rule builder UI — you can edit before saving."
- Click preview → show audience count. Save.

## 2:45 – 3:30 — Campaign with AI message variants
- Go to `/campaigns`. Pick the segment.
- Type objective: **"Win them back with a 15% off code"** → click AI variants.
- Show the 3 tones (friendly / urgent / value). Pick one. Send.
- "Behind the scenes: the CRM inserts N PENDING communication rows, then fires the batch at the stubbed vendor."

## 3:30 – 4:15 — Show the async receipt loop in action
- Refresh dashboard → pie now shows ~90 % delivered, ~10 % failed. "The vendor processed asynchronously and POSTed receipts back in micro-batches of 25, out of order. The receipt endpoint batched the DB updates."
- Open campaign detail page → show per-message log with vendor_message_id and failure reasons.

## 4:15 – 5:00 — The Agent (the headline feature)
- Open `/chat`. Type: **"Send a free-shipping offer to customers who've visited more than 5 times but spent less than ₹2000"**.
- "The agent plans → creates the segment → tells me the audience size → asks for the message."
- Reply: **"Use this message: Hey {{name}}, free shipping on your next order — today only"**.
- "It fans out to the vendor automatically." Show the campaign appear in the list.

## 5:00 – 5:30 — Ingestion API
- Open Customers → show the **Ingestion API** panel.
- Copy the curl, paste into a terminal beside the browser, run it.
- Refresh customers list → new record appears.
- "External systems push customers and orders without using the UI. Auth is the user's Supabase JWT — production would mint per-user revocable keys."

## 5:30 – 6:00 — Close
- "Trade-offs I documented in the README: single deploy with vendor as an internal route, JSON-output agent instead of function-calling, computed `days_inactive` in Node. What I'd build next: HMAC on the vendor, BullMQ/Cloudflare Queues for bounded concurrency, smart send-times."
- "Thanks for watching — links in the README."

---

## Recording tips
- Keep the terminal visible during the ingestion demo so the curl response is on screen.
- Record at 1080p; zoom the browser to ~110 % so chart labels are readable.
- One full take is better than 10 cuts. Re-record the whole thing rather than editing.
