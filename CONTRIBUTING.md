# 🤝 Contributing to Magical Gaming Crew — Bedrock Bridge

Thank you for your interest in contributing to **Magical Gaming Crew — Bedrock Bridge**! We welcome contributions from developers, designers, system administrators, and Minecraft server owners of all skill levels.

---

## 📋 Table of Contents
1. [Code of Conduct](#-code-of-conduct)
2. [How Can You Contribute?](#-how-can-you-contribute)
3. [Development Environment Setup](#-development-environment-setup)
4. [Git & Branching Workflow](#-git--branching-workflow)
5. [Conventional Commit Specifications](#-conventional-commit-specifications)
6. [Code Style & Architecture Guidelines](#-code-style--architecture-guidelines)
7. [Pull Request (PR) Checklist](#-pull-request-pr-checklist)

---

## 📜 Code of Conduct

All contributors and participants are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it to understand our community standards and enforcement policies.

---

## 🧭 How Can You Contribute?

* 🐛 **Bug Reports**: Submit detailed reproduction steps via [GitHub Issues](../../issues/new?template=bug_report.md).
* 💡 **Feature Requests**: Propose new Minecraft Script API hooks, Discord commands, or UI dashboards via [Feature Requests](../../issues/new?template=feature_request.md).
* 📝 **Documentation**: Improve guides, fix typos, translate tutorials, or provide architecture diagrams.
* 💻 **Code Contributions**: Fix open issues or implement approved features.

---

## 🛠️ Development Environment Setup

### 📋 Prerequisites
* **Node.js**: `v20.0.0` or higher
* **npm**: `v9.0.0` or higher
* **PostgreSQL**: `v15` or higher (running locally or via Docker)
* **Git**

### 🚀 Setup Steps:
```bash
# 1. Fork and clone repository
git clone https://github.com/<your-username>/minecraft-bedrock-discord-chat.git
cd minecraft-bedrock-discord-chat

# 2. Install backend & root dependencies
npm install

# 3. Install frontend React dependencies
npm --prefix client install

# 4. Copy environment configuration
cp .env.example .env

# 5. Push database schema with Drizzle ORM
npm run db:push

# 6. Start concurrent development servers (Hono Backend on 3000 + React Vite on 5173)
npm run dev
```

---

## 🌿 Git & Branching Workflow

1. Always branch off the `main` branch:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feat/my-awesome-feature
   # or
   git checkout -b fix/issue-description
   ```
2. Keep your branch focused on a single logical change.

---

## 📝 Conventional Commit Specifications

We strictly follow the **[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)** specification:

```text
<type>(<optional scope>): <description>

[optional body]

[optional footer(s)]
```

### Allowed Types:
| Type | Purpose | Example |
| :--- | :--- | :--- |
| `feat` | New feature for the user or bridge | `feat(discord): add interactive button panel` |
| `fix` | Bug fix in code or behavior pack | `fix(bp): prevent request queue pileup on lag` |
| `docs` | Documentation changes only | `docs(readme): add docker deployment tutorial` |
| `refactor` | Code change that neither fixes a bug nor adds a feature | `refactor(db): migrate query layer to Drizzle ORM` |
| `perf` | Performance optimization | `perf(client): optimize head avatar rendering` |
| `test` | Adding or updating unit/security tests | `test(auth): add RBAC endpoint security test` |
| `chore` | Build process, release, or dependency updates | `chore(deps): update hono to v4.7` |

---

## 🏛️ Code Style & Architecture Guidelines

### 1. Backend (`src/`)
* Built on **Hono.js** and TypeScript strict mode.
* Database operations must use **Drizzle ORM** type-safe query builders (`src/db.ts` and `src/schema.ts`).
* Always validate inputs and handle errors gracefully with meaningful HTTP status codes.

### 2. Frontend (`client/src/`)
* Built on **React 18** and **Vite**.
* Styling utilizes custom Vanilla CSS design tokens (`client/src/index.css`) for high-performance zero-dependency styling.
* Modal dialogs and confirmations must use responsive slide-over Sheets (`Sheet.tsx` - Right on Desktop, Bottom Drawer on Mobile).

### 3. Behavior Pack (`MGC_Bridge[BP]/`)
* Built with official Minecraft Bedrock Script API (`@minecraft/server` and `@minecraft/server-net`).
* Ensure all HTTP operations are asynchronous and concurrency-guarded to maintain a strict 20.0 TPS rate on Bedrock servers.

---

## 🧪 Pull Request (PR) Checklist

Before submitting your Pull Request, verify the following:

- [ ] All unit and security tests pass: `npm test`
- [ ] TypeScript compilation and frontend build pass with 0 errors: `npm run build`
- [ ] Commits follow Conventional Commits formatting.
- [ ] No private keys, passwords, or secrets are committed.
- [ ] Relevant documentation has been updated.
