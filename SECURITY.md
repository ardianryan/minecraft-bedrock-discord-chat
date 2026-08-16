# 🛡️ Security Policy

The **Magical Gaming Crew** community takes the security and integrity of our codebase, servers, and connected accounts very seriously.

---

## 📋 Supported Versions

We provide security updates and patches for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 2.3.x   | :white_check_mark: |
| 2.2.x   | :white_check_mark: |
| 2.1.x   | :x:                |
| < 2.0.0 | :x:                |

---

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability within this repository or our bridge architecture, **please DO NOT open a public GitHub issue**.

Instead, please disclose it responsibly using one of the following methods:

1. **GitHub Security Advisory**: Go to the **Security** tab of the repository → Click **Report a vulnerability**.
2. **Direct Contact**: Send an email or private message to the maintainers with:
   - Description of the vulnerability.
   - Steps to reproduce the vulnerability (proof-of-concept script/request).
   - Potential impact and affected components (Web, Bedrock Script API, Discord Bot, Database).

---

## ⏳ Response Timeline

- **Initial Response**: Within **24–48 hours** of receiving the report.
- **Triage & Verification**: Within **3–5 business days**.
- **Fix & Disclosure**: We will coordinate the release of a security patch before public disclosure.

---

## 🔐 Security Best Practices for Self-Hosting

When deploying this bridge:
1. **Never commit `.env`**: Always keep your database passwords, JWT secrets, and Discord bot tokens private.
2. **Use HTTPS in Production**: Place a reverse proxy (e.g. Nginx, Cloudflare Tunnel, or Caddy) in front of Port 3000 to enforce TLS/HTTPS.
3. **Rotate Bearer Tokens**: Regularly regenerate your Bedrock Server API Bearer Token from the `/office` dashboard if credentials are suspected to be compromised.
4. **Protect PostgreSQL**: Do not expose your PostgreSQL port (5432) to the public internet without firewall restrictions.
