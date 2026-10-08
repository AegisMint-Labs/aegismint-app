# Contributing to AegisMint App & SDK

Thank you for your interest in contributing to AegisMint Labs! This monorepo hosts the AegisMint decentralized application (`apps/web`) and the official TypeScript SDK (`packages/sdk`) for interacting with Soroban smart contracts on the Stellar network.

---

## 🤝 Code of Conduct

We are dedicated to providing a welcoming, diverse, and harassment-free environment for all contributors. Please be respectful and constructive in all communication, code reviews, and community discussions.

---

## 🏗️ Repository Architecture

This repository is managed as a `pnpm` workspace monorepo:

- **`apps/web`**: Next.js 14 (App Router) frontend interface powered by Tailwind CSS and Freighter wallet integration (`@stellar/freighter-api`, `@stellar/stellar-sdk`).
- **`packages/sdk`**: Strongly typed TypeScript SDK (`@aegismint/sdk`) with Soroban ScVal encoders, contract clients, and RPC helper methods.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20.x` or later (LTS recommended)
- **pnpm**: `v9.x` (`corepack enable` or `npm install -g pnpm`)
- **Stellar Wallet**: [Freighter Wallet](https://www.freighter.app/) browser extension configured for Stellar Testnet.

### Setup & Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/AegisMint-Labs/aegismint-app.git
   cd aegismint-app
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Configure environment variables**:
   Create a `.env.local` file inside `apps/web/`:
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   ```
   Configure testnet contract identifiers and RPC endpoints.

4. **Run development servers**:
   ```bash
   # Start all packages in dev mode
   pnpm dev

   # Or run only the Next.js web application
   pnpm --filter aegismint-web dev
   ```

5. **Build all packages**:
   ```bash
   pnpm build
   ```

---

## 💻 Development Workflow

### Building Packages

```bash
# Build the entire monorepo
pnpm build

# Build only the TypeScript SDK
pnpm --filter @aegismint/sdk build

# Build only the Next.js dApp
pnpm --filter aegismint-web build
```

### Code Quality & Formatting

```bash
# Run ESLint across workspace
pnpm lint

# Check TypeScript types across packages
pnpm --filter @aegismint/sdk typecheck
```

---

## 📝 Commit Convention

We strictly follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat(scope): add new feature`
- `fix(scope): resolve bug`
- `docs(scope): update documentation`
- `style(scope): formatting and code style`
- `refactor(scope): internal refactoring`
- `test(scope): test suites and mocks`
- `chore(scope): build, dependencies, or toolchain maintenance`

### Recognized Scopes:
- `web`: Frontend user interface (`apps/web`)
- `sdk`: TypeScript SDK (`packages/sdk`)
- `encoders`: Soroban XDR & ScVal encoding routines
- `escrow`: Escrow settlement and marketplace UI
- `factory`: Asset factory deployment interface
- `wallet`: Freighter wallet connection & session state
- `ci`: CI/CD workflows and automation

---

## 🔍 Pull Request Process

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Verify that `pnpm build` completes without errors or type warnings.
3. Commit your changes following conventional commit syntax.
4. Push to your fork and submit a Pull Request to `AegisMint-Labs/aegismint-app` on branch `main`.
5. Ensure all continuous integration checks pass.

### PR Requirements
- [ ] Code follows existing TypeScript and React conventions.
- [ ] Next.js production build passes cleanly (`pnpm build`).
- [ ] No regression or unhandled errors in Freighter wallet integration.
- [ ] Documentation updated for any new SDK methods or environment variables.

---

## 🔒 Security

For responsible disclosure of security vulnerabilities, please refer to [SECURITY.md](SECURITY.md) or email **security@aegismint.io**.

---

## 📄 License

Contributions are licensed under the MIT License.
