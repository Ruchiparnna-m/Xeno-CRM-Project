# Complete Walkthrough Video Script — Word for Word

> Read this aloud while recording. Actions are in **bold**. Exact words to say are in quotes.

---

## 0:00 – 0:25 — OPENING (Your face in corner + title slide)

**[Show a simple title slide: "Xeno Mini CRM — AI-Native, Chat-First" + your name]**

"Hi, I'm [Your Name], and this is my submission for the Xeno SDE Internship.

I built an AI-native Mini CRM for D2C brands. But here's the thing — most CRMs bolt AI onto a dashboard. I flipped that. This CRM is chat-first. The agent is the primary interface, not a sidekick.

Three things I optimized for:
One — a sharp point of view. Chat-first, not dashboard-first.
Two — a real stubbed vendor with an async receipt loop. Not a fake simulation.
Three — AI at the decision points. Segment creation, message writing, campaign planning — not just sprinkled on top."

---

## 0:25 – 1:00 — ARCHITECTURE (Show README.md diagram in browser)

**[Switch to browser. Show the README.md file with the architecture diagram.]**

"Here's the architecture. One TanStack Start deploy on Cloudflare. The CRM talks to a stubbed vendor through a separate internal HTTP route at slash-api-slash-public-slash-vendor-slash-send. The vendor processes messages asynchronously, shuffles receipts out of order, and posts them back to slash-api-slash-public-slash-crm-slash-receipt. The receipt endpoint does batched UPDATE WHERE id IN queries — so it's fast and idempotent.

Database is Lovable Cloud — Postgres with Row Level Security on every table. Every user only sees their own data.

For AI, I use the Lovable AI Gateway with Gemini 2.5 Flash. It powers three things: natural language to segment rules, message variant generation, and the agent planner that turns a user goal into an execution plan."

---

## 1:00 – 1:25 — SIGN IN

**[Navigate to /auth in your app.]**

"Let's sign in. I have two auth options: email-password and Google OAuth, both running through Lovable's managed auth broker."

**[Click "Sign in with Google". Complete the sign-in flow.]**

"And we're in. Landed on the dashboard."

---

## 1:25 – 2:00 — SEED DATA + DASHBOARD

**[You should now be on /dashboard.]**

"First, I need data. The brief mentioned scale — so my seeder generates five thousand customers and about twenty thousand orders. Let me run it."

**[Click the "Seed demo data (5,000 customers)" button.]**

"This takes a few seconds because it's doing chunked inserts. While it runs, you can see the dashboard structure: four KPI tiles at the top, a campaign funnel bar chart, and a delivery pie chart. The pie is empty right now — we'll come back to it after we send a campaign."

**[Wait for seeding to complete. The KPIs should update.]**

"Done. We now have five thousand customers, twenty thousand orders, and you can see the total spend and visit metrics rolled up."

---

## 2:00 – 2:40 — SEGMENT BUILDER + AI NL TO RULES

**[Click "Segments" in the sidebar, or navigate to /segments.]**

"Now let's build an audience segment. I'll use the AI natural language builder."

**[Click the "Create with AI" tab or button. Type in the prompt field:]**

**Type:** "High spenders who haven't been active in 60 days"

**[Click "Generate Rules". Wait for AI response.]**

"The model returns strict JSON conditions. You can see it translated my sentence into rules: total spend greater than a threshold, and last active date more than 60 days ago. I can edit these before saving if I want."

**[Click "Preview Audience".]**

"Preview shows me exactly how many customers match — and I can see the list below."

**[Click "Save Segment".]**

"Saved. This segment is now available for campaigns."

---

## 2:40 – 3:25 — CAMPAIGN + AI MESSAGE VARIANTS

**[Navigate to /campaigns.]**

"Now I'll create a campaign targeting that segment. I'll pick the segment I just created."

**[Select the segment from the dropdown.]**

"For the message, I'll use the AI variant generator. I'll describe my objective."

**[Type in the objective field:]**

**Type:** "Win them back with a 15% off code"

**[Click "Generate AI Variants". Wait.]**

"The model returns three message variants with different tones: friendly, urgent, and value-focused. Each is under 160 characters — SMS-length. I'll pick the friendly one."

**[Select the friendly variant.]**

"Now I'll send it."

**[Click "Send Campaign". Wait for confirmation.]**

"Behind the scenes, the CRM inserted one PENDING communication row per matched customer, then fanned out the batch to the stubbed vendor. The CRM returned immediately — it does not block on delivery."

---

## 3:25 – 4:10 — ASYNC RECEIPT LOOP IN ACTION

**[Navigate back to /dashboard.]**

"Now here's the interesting part. Let's refresh the dashboard."

**[Refresh the page.]**

"Look at the delivery pie chart. It now shows approximately ninety percent delivered and ten percent failed. That's not a fake number — the vendor actually processed each message with randomized latency, rolled a per-message coin, and posted receipts back in micro-batches of twenty-five, out of order. The receipt endpoint at slash-api-slash-public-slash-crm-slash-receipt received those receipts and did batched UPDATE WHERE id IN queries. Because of the status equals PENDING predicate, it's idempotent — receiving the same receipt twice is a no-op."

**[Navigate to /campaigns and click on the campaign you just sent to open its detail view.]**

"If I open the campaign detail, I can see the per-message delivery log. Each row has a vendor message ID, the rendered message, the status, and for failures, the error reason."

---

## 4:10 – 5:00 — THE AGENT (Chat-First Interface)

**[Navigate to /chat.]**

"Now for the headline feature — the agent. This is the primary interface. I'll describe a goal in plain English and the agent will plan and execute it."

**[Type in the chat input:]**

**Type:** "Send a free-shipping offer to customers who've visited more than 5 times but spent less than 2000 rupees"

**[Press Enter. Wait for the agent's response.]**

"The agent analyzed my goal, created a segment with the right rules, and told me the audience size. Now it's asking me for the message before sending. This two-turn pattern is intentional — I didn't want the agent to auto-send without human confirmation. That's safer for a production CRM."

**[Type your reply:]**

**Type:** "Use this message: Hey {{name}}, free shipping on your next order — today only"

**[Press Enter. Wait.]**

"And it executed. It created the campaign, fanned it out to the vendor, and reported back with the delivery summary."

**[Navigate to /campaigns to show the new campaign in the list.]**

"The campaign appears in the list with the segment, audience size, and status."

---

## 5:00 – 5:35 — INGESTION API (Browser + Terminal side by side)

**[Navigate to /customers. Scroll to the "Ingestion API" panel.]**

"Finally, let's show the public ingestion API. External systems can push customers and orders without using the UI."

**[Arrange your screen so the browser is on the left and a terminal window is on the right.]**

"I'll copy the curl command from this panel and run it in my terminal."

**[Click the copy button next to the curl command. Paste it into your terminal. Run it.]**

"This POSTs to slash-api-slash-public-slash-ingest-slash-customers with my Supabase access token. The server validates the token, resolves my user ID, and writes the record."

**[Press Enter in terminal. Show the 200 OK response.]**

"Two hundred OK. Now I'll refresh the customers table."

**[Refresh the customers page.]**

"The new customer appears. Same endpoint supports bulk insert too — you can send an array of customers in one request."

---

## 5:35 – 6:00 — CLOSING

**[Navigate back to /dashboard for a clean closing shot.]**

"To close — I documented my trade-offs in the README.

One: I used a single deploy with the vendor as an internal HTTP route rather than a separate service. The architectural pattern is identical — moving it to a second host is a five-minute lift.

Two: The agent uses JSON-output planning instead of native function-calling. That's more portable across model providers.

Three: days-inactive is computed in Node rather than Postgres. For five thousand rows it's fast enough; at a hundred thousand I'd move it to a Postgres function.

What I'd build next: HMAC signature auth on the vendor endpoint, a queue like BullMQ for bounded concurrency and retry, and smart send-time optimization per customer.

Thanks for watching. The live app and full README are linked below."

**[End recording.]**

---

## Post-Recording Checklist

- [ ] Trim any long pauses or mistakes at the start/end.
- [ ] Add title card at 0:00 if you didn't record with one.
- [ ] Upload to Loom / YouTube (unlisted) / Google Drive.
- [ ] Copy the video link.
- [ ] Open `README.md`, replace `_add your Loom/YouTube link after recording_` with your actual link.
- [ ] Re-publish the app so the updated README goes live.
