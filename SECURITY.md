# 🛡️ Security Policy & Vulnerability Management

The **Magical Gaming Crew (MGC)** project prioritizes the confidentiality, integrity, and availability of all connected Minecraft Bedrock servers, Discord communities, and administrative web consoles.

---

## 📋 Supported Versions & Patch Lifecycle

We actively maintain and provide security updates for the following release lines:

| Release Line | Status | Security Support Level |
| :--- | :---: | :--- |
| **`v2.3.x`** | 🟢 Active | **Full Security & Feature Updates** |
| **`v2.2.x`** | 🟡 Maintenance | Critical CVE Patches Only |
| **`v2.1.x`** | 🔴 End-of-Life | Unsupported |
| **`< v2.0.0`** | 🔴 End-of-Life | Unsupported |

---

## 🚨 Reporting a Security Vulnerability

If you identify a security vulnerability, flaw, or potential exploit in this repository or its ecosystem:

> [!CAUTION]
> **DO NOT disclose vulnerabilities publicly in GitHub Issues, Discussions, or Discord channels.**

### 📬 Coordinated Disclosure Channels:
1. **GitHub Private Security Advisory (Preferred)**:
   - Navigate to the repository's **[Security Tab](../../security/advisories)** → Click **"Report a vulnerability"**.
2. **Direct Maintainer Contact**:
   - Email: `security@ardianryan.com` or private contact via repository maintainer.
   - Please include:
     - **Component**: (e.g., Bedrock Script API, Hono REST Endpoint, Discord Bot, Drizzle ORM layer).
     - **Vulnerability Type**: (e.g., Auth Bypass, Remote Command Execution, Rate Limit Denial, SSRF, Token Leakage).
     - **Reproduction Steps / PoC**: Step-by-step instructions or cURL script demonstrating the issue.
     - **Estimated Impact & Severity**: (e.g., CVSS estimate).

---

## ⏳ Incident Response & SLA Timeline

| Milestone | Target SLA | Action Taken |
| :--- | :--- | :--- |
| **Acknowledgment** | $\le \mathbf{24\text{ hours}}$ | Maintainers verify receipt and open a private triage thread. |
| **Triage & Assessment** | $\le \mathbf{72\text{ hours}}$ | Reproduction verified, impact assessed, CVSS assigned. |
| **Patch Development** | $\le \mathbf{7\text{ days}}$ | Fix developed, tested against test suite, and backported. |
| **Coordinated Release** | Agreed Date | Release of new minor/patch version with advisory credit. |

---

## 🔒 Threat Model & Built-in Security Controls

Our bridge implements defense-in-depth security across all architectural layers:

```
[ Minecraft Bedrock Client / BDS ]
       │  (Bearer Token Authentication in Authorization Header)
       ▼
[ Hono.js REST API Gateway ] ────► [ Role-Based Access Control (RBAC) ]
       │                                     │
       ▼                                     ▼
[ Drizzle ORM (Type-Safe Parameterized) ]  [ JWT Session Authentication ]
       │                                     │
       ▼                                     ▼
[ PostgreSQL Database (Local Isolation) ]  [ Discord Bot (Privileged Intents Guard) ]
```

### 1. 🛡️ In-Game Script API Authentication
* All requests between Minecraft Bedrock (`MGC_Bridge[BP]`) and Hono backend must supply a valid `Authorization: Bearer <API_KEY>` header.
* Missing or invalid bearer tokens are rejected immediately with `401 Unauthorized`.

### 2. 👑 Role-Based Access Control (RBAC) & Command Execution
* Sensitive endpoints (`/api/office/*`, slash command execution `/command`, kick `/kick`, ban `/ban`) require **Administrator** role verification.
* Commands executed via Discord or Web Console are audit-logged with Discord User IDs.

### 3. 🐘 SQL Injection Prevention (Drizzle ORM)
* All queries utilize Drizzle ORM's strictly typed parameterized query builders. Raw string concatenation is prohibited across the codebase.

### 4. 🔑 Credential & Token Hygiene
* Bot tokens, database connection URIs, and JWT secret keys are never committed to version control (`.gitignore` enforces isolation).
* Bearer tokens can be hot-rotated at any time from the `/office` dashboard.

---

## 🛠️ Production Hardening Checklist for Server Operators

1. **Enforce HTTPS / TLS 1.3**: Always deploy behind a secure reverse proxy (Cloudflare Tunnel, Nginx, or Caddy) with automated SSL.
2. **Isolate Database Access**: Ensure PostgreSQL port (`5432`) is bound to `127.0.0.1` or the private Docker bridge network—never exposed to `0.0.0.0/0`.
3. **Set Strong JWT Secrets**: Define a high-entropy string for `JWT_SECRET` in your `.env` file ($\ge 32$ characters).
4. **Regular Security Audits**: Run `npm run test` regularly to execute automated regression and authentication test suites.
