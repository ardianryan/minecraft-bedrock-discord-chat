# 🛡️ Security Policy & International Compliance Standard (SECURITY.md)

The **Magical Gaming Crew (MGC) — Bedrock Bridge** ecosystem is engineered to meet rigorous international cybersecurity standards. We prioritize confidentiality, integrity, availability, and non-repudiation across all connected Minecraft Bedrock servers, Discord communities, and administrative web consoles.

---

## 🌐 International Security Standards & Compliance Matrix

Our security architecture adheres to globally recognized cybersecurity frameworks and RFC specifications:

| International Standard | Category | Implementation in MGC Bedrock Bridge | Status |
| :--- | :--- | :--- | :---: |
| **OWASP Top 10 (2021)** | Web Application Security | Anti-Injection, RBAC Access Control, XSS Sanitization, SSRF Shield | 🟢 **100% Compliant** |
| **RFC 6750** | Transport Security | OAuth 2.0 Bearer Token Header Authentication Protocol | 🟢 **Standardized** |
| **RFC 7519** | Session Security | JSON Web Token (JWT) Compact Representation with HMAC-SHA256 | 🟢 **Standardized** |
| **RFC 8446** | In-Transit Encryption | Transport Layer Security (TLS 1.3) over HTTPS / WebSocket | 🟢 **Enforced** |
| **NIST SP 800-63B** | Identity & Auth | Secure Token Lifecycles, Expiration Windows, Entropy Validation | 🟢 **Compliant** |
| **ISO/IEC 27001 (A.9 / A.12)** | Information Security | Comprehensive Audit Trails, Least Privilege RBAC, Secret Isolation | 🟢 **Aligned** |

---

## 🔒 Implemented Security Controls (Defense-in-Depth)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DEFENSE-IN-DEPTH ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Layer 7 (Application)  │ OWASP Sanitization, XSS Shield, RBAC Middleware       │
│  Layer 6 (Presentation) │ JSON Schema Validation, Safe ItemStack Memory Inject   │
│  Layer 5 (Session)      │ RFC 7519 JWT (HMAC-SHA256, Expiration Verification)  │
│  Layer 4 (Transport)    │ RFC 6750 Bearer Auth, TLS 1.3 HTTPS, CORS Whitelist   │
│  Layer 3 (Network)      │ Docker Localhost Isolation, Strict Port Binding       │
│  Layer 2 (Data Store)   │ Drizzle ORM Parameterized Queries (Anti-SQLi)         │
│  Layer 1 (Audit & Log)  │ Immutable Discord Webhook Audit Trails, Admin History  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1. 🛡️ In-Game Script API Bearer Authentication (RFC 6750)
- **Header-Enforced Auth**: Every HTTP request between Minecraft Bedrock (`MGC_Bridge[BP]`) and the Hono.js backend must carry a cryptographically secure `Authorization: Bearer <BRIDGE_API_KEY>` header.
- **Immediate Rejection**: Malformed, missing, or mismatched tokens trigger an immediate `401 Unauthorized` without exposing backend internal state or stack traces.

### 2. 👑 Role-Based Access Control (RBAC & NIST SP 800-63B)
- **Global Route Guard (`officeAdminMiddleware`)**: All administrative routes (`/api/office/*`) and sensitive player operations are strictly protected by session validation and role verification (`role === 'admin'`).
- **Privilege Escalation Prevention**: Non-admin users cannot promote themselves, delete users, or execute server panel actions.
- **Zero Client Trust**: All user capabilities and permissions are validated server-side on every request.

### 3. 💉 Complete Injection Defense (OWASP A03)
- **Parameterized SQL (Anti-SQLi)**: 100% of database interactions are built using **Drizzle ORM** with strictly typed template tags (`sql` / prepared statements). Direct string interpolation into raw queries is prohibited across the codebase.
- **Cross-Site Scripting (Anti-XSS)**: Chat messages from in-game, Discord, and Web are disarmed and sanitized before being broadcast or rendered in the DOM.
- **Native Memory Injection**: The admin `/give` and `/wipe_inventory` tools use native `@minecraft/server` Script API `ItemStack` objects injected directly into player inventory containers in memory, eliminating shell string command execution flaws.
- **Bedrock Selector Escaping**: Command fallbacks use normalized quotes and target selector syntax `@a[name="${ign}"]` to prevent selector injection.

### 4. 🔑 Session & Token Lifecycle Management (RFC 7519)
- **HMAC-SHA256 Signatures**: Web sessions use compact signed JWT tokens containing immutable user identifiers.
- **Strict Expiration**: Expired tokens are immediately invalidated (`/expired/`), preventing replay attacks.
- **Hot Secret Rotation**: Bearer API keys and JWT signing secrets can be rotated dynamically via environment configuration without database downtime.

### 5. 🖥️ Secure Hardware Panel Proxy (Anti-SSRF)
- **Credential Masking**: Pterodactyl and Crafty Controller API keys are stored exclusively in backend memory and are never sent to the browser.
- **URL & Domain Allowlisting**: Panel HTTP adapters only dispatch requests to explicitly configured node endpoints, preventing Server-Side Request Forgery (SSRF).

### 6. 📜 Immutable Audit Logging & Transparency (ISO/IEC 27001 A.12.4)
- **Discord Webhook Audit Trails**: All administrative interventions (kicks, bans, item injections, power toggles, server command dispatches) are pushed in real-time to the configured Discord `#audit-logs` channel with author tags and timestamps.
- **System Activity Timeline**: Retained in the persistent PostgreSQL database for forensic traceability.

---

## 📋 Supported Versions & Patch Lifecycle

We actively maintain and provide security updates for the following release lines:

| Release Line | Status | Security Support Level |
| :--- | :---: | :--- |
| **`v2.11.x`** | 🟢 Active | **Full Security Patches, Feature Updates & KiwEssentials Sync** |
| **`v2.10.x`** | 🟡 Maintenance | Critical CVE Patches Only |
| **`v2.9.x`** | 🔴 End-of-Life | Unsupported |
| **`< v2.9.0`** | 🔴 End-of-Life | Unsupported |

---

## 🚨 Reporting a Security Vulnerability

If you identify a security vulnerability, flaw, or potential exploit in this repository or its ecosystem:

> [!CAUTION]
> **DO NOT disclose vulnerabilities publicly in GitHub Issues, Discussions, or Discord channels.**

### 📬 Coordinated Disclosure Channels:
1. **GitHub Private Security Advisory (Preferred)**:
   - Navigate to the repository's **[Security Tab](../../security/advisories)** → Click **"Report a vulnerability"**.
2. **Direct Maintainer Contact**:
   - Email: `security@ardianryan.com`
   - Include:
     - **Component**: (e.g., Bedrock Script API, Hono REST Endpoint, Discord Bot, Drizzle ORM layer).
     - **Vulnerability Category**: (e.g., Auth Bypass, Command Injection, SSRF, Information Disclosure).
     - **Reproduction Steps / PoC**: Step-by-step instructions or cURL script demonstrating the issue.
     - **Estimated Impact & CVSS Score**.

---

## ⏳ Incident Response & SLA Timeline

| Milestone | Target SLA | Action Taken |
| :--- | :--- | :--- |
| **Acknowledgment** | $\le \mathbf{24\text{ hours}}$ | Maintainers verify receipt and open a private triage thread. |
| **Triage & Assessment** | $\le \mathbf{72\text{ hours}}$ | Reproduction verified, impact assessed, CVSS score assigned. |
| **Patch Development** | $\le \mathbf{7\text{ days}}$ | Fix developed, verified against automated test suites, and backported. |
| **Coordinated Release** | Agreed Date | Release of new minor/patch version with advisory credit. |

---

## 🛠️ Production Hardening Checklist for Server Operators

1. **Enforce HTTPS / TLS 1.3**: Always deploy behind a secure reverse proxy (Cloudflare Tunnel, Nginx, or Caddy) with automated SSL.
2. **Isolate Database Access**: Ensure PostgreSQL port (`5432`) is bound to `127.0.0.1` or the private Docker bridge network—never exposed to `0.0.0.0/0`.
3. **Set High-Entropy Secrets**: Define strings $\ge 32$ characters for `JWT_SECRET` and `BRIDGE_API_KEY` in your `.env` file.
4. **Run Automated Security Audits**: Run `npm test` regularly to execute the 20-point automated security verification suite.
