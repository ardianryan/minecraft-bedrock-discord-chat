# 🤝 Contributing to Magical Gaming Crew — Bedrock Bridge

Thank you for your interest in contributing to **Bedrock Bridge**! We welcome contributions from developers, designers, and community members of all skill levels.

---

## 🧭 How Can You Contribute?

You can contribute in many ways:
- 🐛 **Reporting Bugs**: Let us know if something isn't working as expected.
- 💡 **Suggesting Features**: Share your ideas for new Minecraft Script API hooks or Discord integrations.
- 📝 **Improving Documentation**: Fix typos, add examples, or expand guides.
- 💻 **Submitting Code**: Fix open issues or implement approved features.

---

## 🛠️ Development Setup

1. **Fork and Clone** the repository:
   ```bash
   git clone https://github.com/<your-username>/discordmchat.git
   cd discordmchat
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   npm --prefix client install
   ```

3. **Configure Environment**:
   ```bash
   cp .env.example .env
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

5. **Run the Test Suite**:
   ```bash
   npm test
   ```

---

## 🌿 Branching & Git Workflow

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```
2. Commit your changes with clear, descriptive commit messages:
   ```bash
   git commit -m "feat(discord): add interactive dropdown for player selection"
   ```
3. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
4. Open a **Pull Request (PR)** against the `main` branch.

---

## 🧪 Testing & Code Standards

Before opening a Pull Request:
1. **Ensure all unit tests pass**:
   ```bash
   npm test
   ```
2. **Ensure production builds without errors**:
   ```bash
   npm run build
   ```
3. **Keep code clean**: Follow TypeScript strict typing and keep sensitive credentials out of commits.

---

## 📜 Code of Conduct

Please note that this project is released with a [Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project, you agree to abide by its terms.
