# Spec: WorkOS Audit-Logs Ingestion Proxy + Plugin mTLS Auth

**Status:** Ready for implementation
**Audience:** Implementing agent (assume no prior context)
**Owner:** jonatas@workos.com

---

## 1. Problem & Goal

The WorkOS audit-logs Claude Code plugin currently emits events by calling the
WorkOS API directly with a full-access `sk_` API key:

```
POST https://api.workos.com/audit_logs/events
Authorization: Bearer <sk_...>
```

We want to roll this plugin out to **every company Mac** (for dogfooding + a
sales proof-point). We cannot ship an `sk_` key to every laptop:

- **WorkOS has no scoped/least-privilege API keys.** Any `sk_` grants full
  read/write to its entire environment (users, orgs, everything). There is no
  "audit-append-only" key. A leaked laptop key = full environment compromise.
- A secret on a machine the user controls cannot be hidden from that user.

**Goal:** No long-lived secret on laptops. The plugin authenticates to a
**server-side ingestion proxy** using a **device certificate already present on
every company Mac** (the Okta device-attestation cert, via mTLS). The proxy
holds the real `sk_` key, attributes each event to a real user (server-side, so
laptops can't spoof the actor), and forwards to WorkOS Audit Logs.

This gives us least privilege (a compromised laptop can only append audit
events, rate-limited) + integrity (actor identity is set by the proxy, not the
client).

---

## 2. Architecture

```
┌─────────────────────┐         mTLS (Okta device cert)        ┌──────────────────────────┐
│  Mac laptop          │  ───────────────────────────────────▶ │ Cloudflare Zero Trust      │
│  Claude Code plugin  │   POST /api/events                     │  (Access mTLS, edge)       │
│  → /usr/bin/curl     │   client cert = OktaManagement…        │   validates cert→CA chain  │
└─────────────────────┘                                         └────────────┬─────────────┘
                                                                              │ cf.tlsClientAuth
                                                                              ▼
                                                                 ┌──────────────────────────┐
                                                                 │ Cloudflare Worker (proxy)  │
                                                                 │  /api/events handler       │
                                                                 │  - re-verify cert/issuer   │
                                                                 │  - parse serial from CN    │
                                                                 │  - D1: serial → user        │
                                                                 │  - attach real sk_ key      │
                                                                 │  - forward to WorkOS        │
                                                                 └────────────┬─────────────┘
                                                                              │ Bearer sk_ (Doppler secret)
                                                                              ▼
                                                                 https://api.workos.com/audit_logs/events
```

---

## 3. Key facts established by prior investigation (do not re-derive)

These were empirically verified on a real company Mac. Treat as ground truth.

1. **The Okta device cert is usable by an unprivileged user process.** The
   identity lives in the System keychain with ACL "Allow all applications / not
   restricted." Its RSA-2048 private key successfully signed a TLS handshake
   from a normal `curl` invocation — no `sudo`, no GUI prompt.

2. **macOS `curl` must use the Secure Transport backend** to reference a
   keychain identity. macOS `curl` defaults to LibreSSL (which cannot touch the
   keychain). Force it:
   ```
   CURL_SSL_BACKEND=secure-transport
   ```

3. **`curl --cert` must select the identity by LABEL, not by SHA-1 hash.**
   Selecting by thumbprint/pubkey-hash silently fails
   (`SSL: Can't find the certificate ... and its private key`). Selecting by the
   cert's display **label** works. The label format is:
   ```
   OktaManagementAttestation for <DEVICE_SERIAL>
   ```
   e.g. `OktaManagementAttestation for KXVJ32DH30`.

4. **`security find-identity -v` HIDES the Okta cert.** The `-v` flag filters to
   OS-trusted identities; the Okta cert chains to an untrusted org CA, so `-v`
   returns 0. Enumerate WITHOUT `-v`:
   ```
   security find-identity -p ssl-client
   ```

5. **The Okta cert details:**
   - Subject: `CN=OktaManagementAttestation for <SERIAL>` (SERIAL = Mac serial)
   - Issuer: `DC=com, DC=okta, DC=workos / OU=<okta-org-id> / CN=Organization Intermediate Authority`
   - EKU: `TLS Web Client Authentication` (valid for mTLS client auth)
   - KU: `Digital Signature, Key Agreement`; RSA 2048-bit
   - It identifies the **device** (serial), NOT the user. User attribution must
     be done server-side via a serial→user lookup.

6. **The "untrusted chain" verify errors in local testing
   (`num=20 unable to get local issuer certificate`) are expected and
   irrelevant** — they occur only because the test server lacked the Okta CA.
   The production proxy configures the Okta org CA as its trust anchor, which
   resolves them.

7. **Caveat to validate end-to-end:** This is Okta's own attestation cert,
   re-purposed. It works today with zero provisioning (good for Claude Day). If
   Okta rotates/changes its device-trust flow, our auth breaks. The durable
   long-term option is issuing our own cert via the on-box Kandji SCEP-CA
   (`SCEP-CA, O=WorkOS`). Out of scope for v1; note as a follow-up.

---

## 4. Plugin changes

The plugin lives at the WorkOS audit plugin (`emit-event.mjs` / `emitEvent`).
Current behavior: `fetch()` to `api.workos.com` with `Authorization: Bearer <key>`.

**Required changes:**

1. **Remove the API key entirely.** Delete the `WORKOS_API_KEY` read, the
   `Authorization` header, and all key handling from config/onboarding. Nothing
   secret ships to the laptop.

2. **Repoint endpoint** to the proxy:
   `https://<proxy-hostname>/api/events` (final hostname TBD; see §6).

3. **Replace `fetch` with a shell-out to system `curl`** (Node's fetch/undici
   cannot use a keychain key):
   ```bash
   CURL_SSL_BACKEND=secure-transport \
   /usr/bin/curl -sS --fail-with-body -X POST \
     --cert "$CERT_LABEL" \
     -H 'Content-Type: application/json' \
     --data-binary @- \
     "https://<proxy-hostname>/api/events"
   ```
   - `--cert` value is the **label** (not hash) — see §3.3.
   - pipe the JSON event body to stdin (`--data-binary @-`).

4. **Discover `CERT_LABEL` at runtime** (do not hardcode the serial). Enumerate
   client identities, pick the one issued by the Okta org CA, read its label:
   ```bash
   security find-identity -p ssl-client      # NOTE: no -v (see §3.4)
   ```
   Match the line whose label starts with `OktaManagementAttestation for `.
   Cache the result for the session.

5. **Strip client-supplied identity fields.** Remove any `actor` /
   `organization_id` set client-side — the proxy sets these authoritatively.
   The plugin sends only the event payload (`action`, `occurred_at`,
   `target(s)`, `metadata`, `version`, etc.).

6. **Graceful degradation.** If no Okta identity is found, or `curl` returns a
   TLS/HTTP error, log locally and no-op. Never block or crash a Claude Code
   hook because audit emission failed.

7. **Setup skill** (`workos-audit-setup`): remove all API-key prompts. Replace
   with a preflight that (a) finds the cert label and (b) does a test handshake
   against the proxy, reporting success/failure.

---

## 5. Proxy implementation (Cloudflare Worker)

The proxy is scaffolded as a Cloudflare Worker full-stack app (React frontend +
file-based `/api/*` routes), provisioned with: a **D1 (SQLite) database**, an **R2 bucket**,
a **Durable Object** for state, **Doppler**-managed secrets (synced to GitHub
Actions secrets → Cloudflare), **GitHub Actions deploy** (workflow `Deploy`,
`workflow_dispatch`), and **Cloudflare Access (Zero Trust) SSO** in front.

### 5.1 Scaffold

The scaffold creates the repo, Worker, D1, R2, Doppler config, GH Actions
deploy, and a default Cloudflare Access SSO app on the hostname.

### 5.2 Ingest route — `POST /api/events`

Add `src/api/events.ts` (follow the template's file-based routing convention;
the scaffold ships an `/api/hello` example to copy from).

Handler logic:

```ts
export async function POST(request: Request, env: Env): Promise<Response> {
  // 1. mTLS gate (defense in depth; Access already enforced at edge — see §5.5)
  const tls = (request as any).cf?.tlsClientAuth;
  if (!tls || tls.certVerified !== "SUCCESS") {
    return new Response("client certificate required", { status: 401 });
  }

  // 2. Re-assert issuer is the Okta org CA (not just any cert Access trusts)
  if (!tls.certIssuerDN?.includes("Organization Intermediate Authority")) {
    return new Response("untrusted issuer", { status: 403 });
  }

  // 3. Parse device serial from subject CN:
  //    "CN=OktaManagementAttestation for KXVJ32DH30"
  const m = /OktaManagementAttestation for (\S+)/.exec(tls.certSubjectDN ?? "");
  const serial = m?.[1];
  if (!serial) return new Response("no device serial in cert", { status: 403 });

  // 4. Map serial → user via D1 (see §5.3)
  const row = await env.DB
    .prepare("SELECT email, user_id FROM device_user WHERE serial = ?")
    .bind(serial)
    .first<{ email: string; user_id: string }>();
  if (!row) return new Response("unknown device", { status: 403 });

  // 5. Validate body shape — only accept an audit event payload
  const event = await request.json();
  // (validate required fields: action, occurred_at, target(s); reject anything
  //  carrying its own actor/organization_id — we overwrite those)

  // 6. Forward to WorkOS with the REAL key + authoritative actor
  const res = await fetch("https://api.workos.com/audit_logs/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.WORKOS_API_KEY}`,   // Doppler secret
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...event,
      actor: { type: "user", id: row.user_id, name: row.email },
      organization_id: env.WORKOS_ORG_ID,
    }),
  });

  // 7. Log ingest (serial + resolved user) for the dogfood/audit story itself
  return new Response(res.ok ? "ok" : "upstream error", { status: res.ok ? 202 : 502 });
}
```

### 5.3 D1 schema — serial → user map

```sql
CREATE TABLE IF NOT EXISTS device_user (
  serial   TEXT PRIMARY KEY,
  email    TEXT NOT NULL,
  user_id  TEXT NOT NULL,         -- WorkOS user id for actor attribution
  updated  INTEGER NOT NULL        -- epoch seconds, last sync
);
```

Populate via a **nightly sync** from the device inventory source of truth
(Okta and/or Kandji), mapping device serial → owner email/user. Implement as a
scheduled Worker (Cron Trigger) or a GH Actions job that writes D1. Source-of-
truth selection is an open item (§7).

### 5.4 Secrets (Doppler → Worker)

- `WORKOS_API_KEY` — the real full-access `sk_`. Store as a **Doppler secret**;
  the GH Actions deploy syncs it into the Worker env. **Never** in the repo,
  `wrangler.toml`, or on any laptop.
- `WORKOS_ORG_ID` — Doppler config var.

### 5.5 Ingress — Cloudflare Zero Trust mTLS on the ingest path

The scaffold puts the whole app behind Access SSO by default. That would block headless
`curl`. Carve the ingest path into its own mTLS-gated Access app — the dashboard
keeps SSO, the ingest path uses the device cert.

Steps (Cloudflare Zero Trust dashboard / API):

1. **Upload the Okta org CA as an mTLS root.**
   Zero Trust → Settings → Authentication → **Mutual TLS Certificates** → add the
   Okta `Organization Intermediate Authority` cert; associate it with the app
   hostname. This is the trust anchor (resolves the §3.6 issuer errors).

2. **Create a path-scoped Access application** for
   `…/api/events` (separate from the default SSO app covering `/` and the
   dashboard). Path-scoping lets the two coexist on one hostname.

3. **Policy: action = Service Auth** (non-interactive — returns a hard 403 with
   **no SSO redirect**, which is what headless `curl` needs). Rule:
   require a **valid client certificate** whose Common Name matches
   `OktaManagementAttestation for *` (or "valid cert chaining to the configured
   mTLS root").

4. The Worker still re-checks `cf.tlsClientAuth` (§5.2 steps 1–3) — Access
   terminates TLS, so the Worker reads the validated cert fields from `cf`.

> The scaffold has no built-in capability for mTLS; the setup above is a
> manual one-time Cloudflare step.

### 5.6 Hardening

- **Rate-limit per device serial** (Cloudflare rate-limiting rule) — caps blast
  radius of a compromised laptop.
- **Reject non-event payloads** — strict body validation; the proxy exposes only
  audit-append, nothing else the full key could do.
- **Always overwrite** client-supplied `actor` / `organization_id`.
- **Log every ingest** with serial + resolved user.

### 5.7 Deploy

- `git push` → GH Actions `Deploy` workflow (`workflow_dispatch`).
- Local iteration: `npx wrangler dev` / `wrangler deploy` inside the app repo.

### 5.8 Dashboard (bonus, optional for v1)

The scaffolded React frontend (behind normal Access SSO) can show ingest
volume / per-user activity — a ready-made dogfooding proof-point for Claude Day.

---

## 6. Open items / decisions

1. **Final proxy hostname** — needed by both the plugin (§4.2) and the Access
   config (§5.5). TBD.
2. **serial→user source of truth** — Okta vs. Kandji inventory; sync mechanism
   (Cron-triggered Worker vs. GH Actions). (§5.3)
3. **Okta-cert durability** — v1 borrows Okta's attestation cert (zero
   provisioning). Follow-up: migrate to a WorkOS-issued cert via the on-box
   Kandji SCEP-CA for independence from Okta's flow. (§3.7)

---

## 7. Acceptance criteria

- [ ] Plugin contains **no** API key; grepping the plugin + its config finds no
      `sk_`.
- [ ] Plugin emits via `curl` using the Okta cert **by label** on the
      Secure Transport backend; succeeds on a stock company Mac with no setup
      beyond having the Okta cert.
- [ ] Hitting `/api/events` **without** a client cert returns 403 with **no**
      SSO redirect (Service Auth).
- [ ] Hitting `/api/events` **with** the Okta cert lands an event in WorkOS
      Audit Logs, attributed to the **correct user** (serial→user mapping
      works), with `organization_id` set server-side.
- [ ] A client attempting to spoof `actor`/`organization_id` in the body has
      those fields overwritten by the proxy.
- [ ] Real `sk_` key exists only as a Doppler secret / Worker env — never in
      repo, `wrangler.toml`, or on a laptop.
- [ ] Plugin failure modes (no cert, TLS error, proxy down) degrade gracefully
      and never block a Claude Code hook.

---

## 8. Test plan

1. **Local handshake (already proven):**
   ```bash
   CERT_LABEL="$(security find-identity -p ssl-client | grep -o 'OktaManagementAttestation for [^"]*')"
   CURL_SSL_BACKEND=secure-transport \
     curl -sv --cert "$CERT_LABEL" https://<proxy-hostname>/api/events -d '{}'
   ```
   Expect: TLS handshake completes, cert presented (server sees
   `CN=OktaManagementAttestation for <SERIAL>`).
2. **End-to-end against the real Access edge** — confirm Access mTLS accepts the
   cert AND that the handshake (not just chain validation) completes; Access
   terminates TLS itself, so verify there separately from the local test.
3. **Attribution** — emit a known event, confirm it appears in WorkOS Audit Logs
   under the expected user.
4. **Negative** — no-cert request → 403 no-redirect; unknown-serial cert → 403
   unknown device; spoofed actor in body → overwritten.
