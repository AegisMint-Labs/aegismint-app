# Security Policy

AegisMint Labs is committed to ensuring the security, integrity, and privacy of users interacting with our decentralized applications and developer tooling. This document outlines our vulnerability disclosure process, reporting channels, and security standards for `aegismint-app`.

---

## Supported Versions

Security updates are actively provided for the following releases:

| Component | Package / Path | Supported Versions | Status |
| :--- | :--- | :--- | :--- |
| Next.js Frontend | `apps/web` | `v0.1.x` | Supported |
| TypeScript SDK | `packages/sdk` | `v0.1.x` | Supported |

---

## Reporting a Vulnerability

If you discover a security vulnerability or suspect an exploit vector affecting our web application or client SDK, **do not disclose or discuss it publicly**.

Please submit reports through either of the following channels:

1. **GitHub Security Advisories (Preferred)**:
   - Visit the [Security Advisories](https://github.com/AegisMint-Labs/aegismint-app/security/advisories) tab of this repository.
   - Click **Report a vulnerability** to submit a private draft report.

2. **Email**:
   - Send details to **security@aegismint.io**.
   - Please include:
     - Clear description and reproduction steps (PoC).
     - Target component (`apps/web` or `@aegismint/sdk`).
     - Impact assessment on end-user funds, signatures, or data privacy.

### Response SLA & Coordination Timeline

- **Initial Acknowledgment**: Within 24 hours of receipt.
- **Triage & Severity Rating**: Within 48 hours.
- **Remediation Updates**: At least every 72 hours until a fix is released.
- **Coordinated Disclosure**: Public disclosure will be scheduled following patch deployment and verification.

---

## Scope

### In Scope
- **Transaction Assembly & Signing**: Flaws in `@aegismint/sdk` that could generate malformed transactions, alter signers, or misdirect funds.
- **XDR Serialization**: Deserialization or type conversion vulnerabilities within ScVal encoders.
- **Client Security**: Cross-Site Scripting (XSS), clickjacking, open redirects, or insecure dependency vulnerabilities in `apps/web`.
- **Wallet Session Safety**: Unauthorized wallet invocation or state poisoning in Freighter integration context.

### Out of Scope
- Third-party browser extension vulnerabilities (e.g., Freighter, Albedo) outside of our integration layer.
- Upstream Stellar Soroban RPC infrastructure or public testnet node outages.
- Social engineering, phishing, or physical attacks targeting contributors.

---

## Safe Harbor

AegisMint Labs will not initiate legal action against researchers who:
- Perform testing in good faith without degrading service availability.
- Avoid accessing or modifying data belonging to other users.
- Provide reasonable time for remediation prior to public disclosure.
