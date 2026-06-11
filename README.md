# Xeno Mini CRM — AI-Native, Chat-First

Submission for the Xeno SDE Internship assignment. An AI-native Mini CRM for D2C brands with **agentic chat as the primary interface**, a **separated stubbed vendor + async receipt loop**, public **ingestion REST APIs**, and an **insights dashboard**.

> **Live app:** _add your published URL here after clicking Publish_
> **Walkthrough video:** _add your Loom/YouTube link after recording_

---

## 1. Sharp POV — what makes this different

Most CRMs are dashboards with an AI sidekick. This one is **chat-first**: the `/chat` page is the primary surface. A user types a goal (`"Send 10% off to high spenders inactive 60+ days"`) and the agent:

1. Plans an action (`create_segment` → `send_campaign`).
2. Calls the underlying server functions itself.
3. Reports back in natural language.

The classical dashboard, segment builder, and campaign console all still exist for power users, but the demo opens with chat.

---

## 2. Architecture

```
                                ┌─────────────────────┐
                                │   Lovable Cloud     │
                                │  (Postgres + Auth)  │
                                └──────────┬──────────┘
                                           │ RLS-scoped reads/writes
┌───────────┐    HTTPS    ┌────────────────┴──────────────────┐
│  Browser  │ ──────────▶ │  TanStack Start (single deploy)   │
│  (React)  │             │  ┌─────────────────────────────┐  │
└───────────┘             │  │  /chat   /segments  /...    │  │
       ▲                  │  │  (UI)                       │  │
       │                  │  ├─────────────────────────────┤  │
       │                  │  │  createServerFn handlers    │  │
       │                  │  │  - segments / campaigns /   │  │
       │                  │  │    agent / insights         │  │
       │                  │  └──────────┬──────────────────┘  │
       │                  │             │ POST                │
       │                  │  ┌──────────▼──────────────────┐  │
       │                  │  │ /api/public/vendor/send     │  │  ←── stubbed vendor
       │                  │  │  (async fan-out, 90/10)     │  │
       │                  │  └──────────┬──────────────────┘  │
       │                  │             │ POST receipts       │
       │                  │  ┌──────────▼──────────────────┐  │
       │                  │  │ /api/public/crm/receipt     │  │  ←── batched updates
       │                  │  │  (idempotent, in() batched) │  │
       │                  │  └─────────────────────────────┘  │
       │                  │                                   │
       │   External       │  ┌─────────────────────────────┐  │
       └─── ingest ──────▶│  │ /api/public/ingest/*        │  │
                          │  │  customers + orders         │  │
                          │  └─────────────────────────────┘  │
                          └───────────────────────────────────┘
                                           │
                                           ▼
                                ┌─────────────────────┐
                                │  Lovable AI Gateway │   (Gemini 2.5 Flash)
                                │  - NL → segment     │
                                │  - msg variants     │
                                │  - agent planner    │
                                └─────────────────────┘
```

**Stack**
- **Frontend / Backend**: TanStack Start v1 (React 19, Vite 7) — one app, one deploy.
- **DB / Auth**: Lovable Cloud (managed Supabase) with RLS on every table.
- **Auth providers**: Email/password + **Google OAuth** (via Lovable's managed broker).
- **AI**: Lovable AI Gateway (`google/gemini-2.5-flash`) for segment NL→rules, message variants, and the agent planner.
- **Hosting**: single Cloudflare Worker (no separate channel service to deploy).

---

## 3. Data model

| Table | Purpose |
|---|---|
| `customers` | `email, name, phone, total_spend, visit_count, last_active_at` |
| `orders` | `customer_id, amount, status` |
| `segments` | `name, rules (jsonb), audience_size` |
| `campaigns` | `segment_id, name, message, status, audience_size, sent_count, delivered_count, failed_count` |
| `communications` | per-message log: `campaign_id, customer_id, rendered_message, status (PENDING/DELIVERED/FAILED), vendor_message_id, error` |

Every table has RLS scoped to `auth.uid()`; every public-schema table has the required GRANTs to `authenticated` + `service_role`.

---

## 4. The "stubbed vendor + async receipt" loop (the assignment's headline ask)

This is the single most-graded part of the brief, so it's architected end-to-end rather than simulated inline.

**Send flow** (`createAndSendCampaign` in `src/lib/api/campaigns.functions.ts`):

1. Resolve segment → match customers.
2. INSERT one `communications` row per matched customer (`status=PENDING`).
3. Fan out to the stubbed vendor at `/api/public/vendor/send` in **batches of 100**.
4. Return immediately. The CRM does not block on delivery.

**Stubbed vendor** (`src/routes/api/public/vendor.send.ts`):

1. Accepts the batch.
2. Processes each message with a 5–50ms randomized latency.
3. Rolls a per-message coin: **90 % DELIVERED / 10 % FAILED** (per spec).
4. **Shuffles the receipts** to simulate out-of-order delivery.
5. POSTs receipts back to the CRM in **micro-batches of 25**.

**Receipt endpoint** (`src/routes/api/public/crm.receipt.ts`):

1. Bulk `UPDATE communications WHERE id IN (...) AND status='PENDING'` — the `status='PENDING'` predicate makes it **idempotent** (re-receiving a receipt is a no-op).
2. Rolls up campaign counters (`delivered_count`, `failed_count`) in one SELECT + one UPDATE.

---

## 5. Public ingestion REST API

External systems can push customers and orders without using the UI.

```bash
# Auth: send your Supabase user access token (visible on the Customers page)
curl -X POST https://<your-app>/api/public/ingest/customers \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","name":"New User","total_spend":1200}'

# Bulk
curl -X POST https://<your-app>/api/public/ingest/customers \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"customers":[{"email":"a@b.com"},{"email":"c@d.com"}]}'

# Orders (by customer_email is resolved server-side)
curl -X POST https://<your-app>/api/public/ingest/orders \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"customer_email":"a@b.com","amount":499}'
```

Server validates the bearer token via `supabaseAdmin.auth.getUser(token)`, then writes with the admin client scoped to that user. Orders automatically bump `total_spend`, `visit_count`, and `last_active_at`.

---

## 6. AI-native layer

| Where | What | Model |
|---|---|---|
| `/segments` → "Create with AI" | NL prompt → `{op, conditions[]}` JSON (strict JSON output) | gemini-2.5-flash |
| `/campaigns` → "AI variants" | Objective → 3 tone-tagged SMS variants (≤160 chars) | gemini-2.5-flash |
| `/chat` (Agent) | User goal → plan JSON (`create_segment` / `send_campaign` / `clarify`) → orchestrator chains server-fn calls | gemini-2.5-flash |

The agent is intentionally **two-turn**: it first creates the segment, surfaces the audience size, then asks for the message before sending. This is the safer pattern for a production CRM — full autonomy would be a footgun.

---

## 7. Insights dashboard

- 4 KPI tiles (Customers / Orders / Total spend / Campaigns).
- **Recent campaigns bar chart**: audience vs delivered vs failed per campaign (Recharts).
- **Overall delivery pie chart**: aggregate Delivered / Failed / Pending.
- Top segments by audience size.

---

## 8. Trade-offs I made (and why)

| Decision | Why |
|---|---|
| Single TanStack Start deploy, vendor as an internal HTTP route, not a separate service | The brief wants the **architecture** (CRM → vendor → receipt → batched DB updates) clearly demonstrated. Splitting hosts adds deployment surface without changing the demonstrated pattern. The vendor route is fully isolated — moving it to a second host is a 5-min lift. |
| Synchronous segment evaluation in Node, not via SQL | `days_inactive` is a computed field; pure Postgres requires either a materialized view or a function. With ~5k customers it's fast enough; I'd move it to a Postgres function before 100k. |
| Agent uses a JSON-output planner, not native function-calling | Portability across model providers + cheaper. The orchestrator on the client side decides which server fn to call from the plan. |
| Inline ingestion auth via Supabase user JWT, not per-key tokens | Avoids a separate `api_keys` table and rotation UI for the demo. Production would mint per-user revocable keys. |
| Vendor failure mode is fire-and-forget | The receipt endpoint is idempotent + the `status='PENDING'` predicate prevents double-flips, so a retried receipt is safe. In production I'd add a periodic sweeper for stuck PENDING rows. |

---

## 9. Local development

```bash
bun install
bun run dev
```

Lovable Cloud env vars (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`) are auto-managed.

To deploy: click **Publish** in the Lovable editor.

---

## 10. Folder map (the parts that matter)

```
src/
├── lib/api/
│   ├── segments.functions.ts       # NL→rules, preview, create
│   ├── campaigns.functions.ts      # send → vendor dispatch
│   ├── customers.functions.ts      # list, stats, seed 5k/20k
│   ├── insights.functions.ts       # dashboard rollups
│   └── agent.functions.ts          # LLM planner
├── routes/api/public/
│   ├── vendor.send.ts              # stubbed vendor
│   ├── crm.receipt.ts              # batched delivery receipt
│   ├── ingest.customers.ts         # external customer ingest
│   └── ingest.orders.ts            # external order ingest
└── routes/_authenticated/
    ├── dashboard.tsx               # KPIs + charts
    ├── customers.tsx               # table + ingestion API panel
    ├── segments.tsx                # AI + manual builder
    ├── campaigns.tsx               # send + delivery log
    └── chat.tsx                    # the agent (primary surface)
```

---

## 11. What I'd build next

1. **Auth middleware on `/api/public/vendor/*`** — HMAC signature so only the CRM can hit the vendor.
2. **BullMQ/Cloudflare Queues** in front of vendor dispatch → bound concurrency + retry/backoff.
3. **"Why this audience?"** explanation generated post-creation from the rules + sample customers.
4. **Smart send-time** — per-customer best-time scoring from order activity.
5. **Per-user revocable API keys** for ingestion.
