# Release Checklist

**Version**: 1.0.0-rc.1
**Date**: 2026-09-24

---

## CORE

### Clean Install
- [x] `pnpm install --frozen-lockfile` completes without errors
- [x] All dependencies resolved
- [x] No peer dependency conflicts

### Build
- [x] `pnpm build` - All 9 packages build successfully
- [x] `pnpm build:client` - Browser client builds (1.1 MB)
- [x] `pnpm build:cli` - CLI executable builds
- [x] `pnpm build:site` - Static site builds (190 KB)

### Typecheck
- [x] `pnpm typecheck` - All 9 packages pass
- [x] No `any` types without justification
- [x] Strict mode enabled

### Tests
- [x] `pnpm test` - All test suites pass
- [x] `pnpm test:security` - 27/27 security tests pass
- [x] Unit tests exist for crypto, vault, ZDR, file processing

### Lint
- [x] `pnpm lint` - Clean (ESLint 9 flat config)
- [x] No TypeScript errors
- [x] Import order enforced

---

## PRIVACY

### Encryption
- [x] AES-256-GCM via Web Crypto API
- [x] HKDF-SHA-256 key derivation
- [x] Argon2id passphrase derivation (64MB, 3i, 4p)
- [x] 12-byte random nonces
- [x] Versioned ciphertext format (v1)
- [x] Authenticated encryption (AEAD)

### Key Management
- [x] Master key never stored plaintext
- [x] Per-purpose derived keys (6 purposes)
- [x] Secure memory wiping on lock
- [x] Key rotation supported
- [x] Export uses separate passphrase

### ZDR Verification
- [x] Preflight check with `store: false`
- [x] `x-zero-data-retention` header validation
- [x] 30-minute cache with re-validation
- [x] Strict mode blocks when unverified
- [x] No silent fallback to standard retention
- [x] Privacy status UI shows real state

### Secrets Handling
- [x] No API keys in source code
- [x] No keys in logs or diagnostics
- [x] Test secrets filtered (`THIS_MUST_NEVER_APPEAR_IN_LOGS`)
- [x] No keys in exported plaintext
- [x] No keys in IndexedDB plaintext
- [x] No keys in CLI config plaintext

### Localhost Security
- [x] Binds to 127.0.0.1 only
- [x] Origin validation (127.0.0.1/localhost only)
- [x] Session token required
- [x] CSRF-style protection
- [x] Restrictive CORS

---

## CLI

### Commands
- [x] `gh0st --help`
- [x] `gh0st doctor` / `--fix` / `--setup`
- [x] `gh0st zdr`
- [x] `gh0st ask "question"`
- [x] `gh0st chat`
- [x] `gh0st web`
- [x] `gh0st status`
- [x] `gh0st agents` / `--create` / `--list`
- [x] `gh0st chats` / `--all`
- [x] `gh0st export` / `--plaintext`
- [x] `gh0st import <file>`
- [x] `gh0st lock`
- [x] `gh0st wipe` / `--force`

### Functionality
- [x] Interactive chat with streaming
- [x] One-shot questions
- [x] File attachments (PDF, text, images)
- [x] Agent selection
- [x] Tool toggles
- [x] Model selection
- [x] Strict mode toggle
- [x] Encrypted export/import
- [x] Vault lock/unlock
- [x] Secure wipe

---

## BROWSER

### Local Startup
- [x] `pnpm dev:client` starts on :1420
- [x] Vite + React 18 + TypeScript
- [x] Hot module replacement
- [x] Tailwind CSS + custom theme

### Security
- [x] Loopback server bound to 127.0.0.1
- [x] Origin validation
- [x] Session token required
- [x] CSP headers
- [x] No eval/unsafe-inline

### Features
- [x] Streaming chat
- [x] Message rendering (MD, code, tables)
- [x] File drag & drop
- [x] Agent selector
- [x] Tool toggles
- [x] Privacy indicator
- [x] Model selector
- [x] Privacy inspector
- [x] Vault lock/unlock UI

---

## MACOS

### Build
- [x] Rust compilation (cargo tauri build)
- [x] App bundle creation (gh0st.app)
- [x] DMG creation (3.3 MB)
- [x] Ad-hoc signing (identity "-")
- [x] Universal binary (ARM64)
- [x] Minimum macOS 13.0

### App Bundle
- [x] CFBundleIdentifier: `dev.gh0st`
- [x] CFBundleDisplayName: `gh0st`
- [x] CFBundleShortVersionString: `1.0.0-rc.1`
- [x] LSMinimumSystemVersion: `13.0`
- [x] LSApplicationCategoryType: `public.app-category.developer-tools`
- [x] CFBundleIconFile: `icon.icns`
- [x] NSHumanReadableCopyright: `MIT License`
- [x] Entitlements configured
- [x] App sandbox enabled
- [x] Network client permission
- [x] File access (user-selected, downloads)

### Runtime
- [x] App launches successfully
- [x] Transparent title bar
- [x] Menu bar integration
- [x] System tray with menu
- [x] Global shortcut (⌘⇧G)
- [x] Window hide on close
- [x] File drag & drop
- [x] Native file picker
- [x] Dark/Light mode
- [x] Window state restoration
- [ ] Secure Enclave / Keychain vault
- [ ] App lock (timeout)
- [ ] Face ID / Touch ID unlock
- [ ] Settings/API-key entry flow

### Distribution
- [x] .app bundle created
- [x] DMG created (3.3 MB)
- [x] Ad-hoc signed
- [ ] Developer ID signed (requires Apple Developer Program)
- [ ] Notarized (requires Apple Developer Program)
- [ ] App Store (requires Apple Developer Program)

---

## IOS

### Project Setup
- [x] Xcode 15+ available (Xcode 26.4)
- [x] Rust targets installed (aarch64-apple-ios, aarch64-apple-ios-sim, x86_64-apple-ios)
- [ ] Homebrew installed (required for xcodegen/cocoapods)
- [ ] xcodegen installed
- [ ] cocoapods installed
- [ ] `cargo tauri ios init` completed
- [ ] Xcode project generated
- [ ] Simulator build tested
- [ ] Device build tested
- [ ] TestFlight upload tested

### Runtime
- [ ] Safe areas / Dynamic Island
- [ ] Keyboard avoidance
- [ ] Touch targets (44pt minimum)
- [ ] Smooth scrolling
- [ ] Background privacy blur
- [ ] Secure Enclave vault
- [ ] Face ID / Touch ID unlock
- [ ] Dynamic Type support
- [ ] Reduced motion support
- [ ] Orientation resilience
- [ ] Dark/Light mode

---

## OPEN SOURCE

### Repository
- [x] MIT License
- [x] README.md (comprehensive)
- [x] SECURITY.md
- [x] PRIVACY.md
- [x] CONTRIBUTING.md
- [x] CODE_OF_CONDUCT.md
- [x] CHANGELOG.md
- [x] ROADMAP.md

### GitHub Templates
- [x] Bug report template
- [x] Feature request template
- [x] Security advisory template

### CI/CD
- [x] CI workflow (typecheck, lint, test, build)
- [x] Security workflow (audit, secret scan)
- [x] Release workflow (macOS, iOS artifacts)
- [x] Dependency audit
- [x] Secret scanning (TruffleHog)

### Documentation
- [x] docs/ARCHITECTURE.md
- [x] docs/THREAT_MODEL.md
- [x] docs/CRYPTOGRAPHY.md
- [x] docs/ZDR.md
- [x] docs/REFERENCE_RESEARCH.md
- [x] docs/DEVELOPMENT.md
- [x] docs/CURRENT_STATE.md
- [x] docs/BUILD_REPORT.md
- [x] docs/SECURITY_AUDIT.md
- [x] docs/USER_GUIDE.md
- [x] docs/RELEASE_CHECKLIST.md

### Security
- [x] No secrets in repo
- [x] No API keys committed
- [x] No private exports
- [x] No personal files
- [x] No Apple credentials
- [x] No generated local state
- [x] .gitignore comprehensive
- [x] Secret scanning configured

---

## FINAL VERIFICATION

### Commands to Run Before Release

```bash
# Full verification suite
pnpm verify

# Or individually:
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm lint
pnpm build

# CLI verification
./apps/cli/dist/cli.js --help
./apps/cli/dist/cli.js doctor
./apps/cli/dist/cli.js zdr

# macOS
pnpm mac:build
open apps/client/src-tauri/target/release/bundle/macos/gh0st.app
pnpm mac:dmg

# iOS (when tooling available)
pnpm ios:init
pnpm ios:build
pnpm ios:dev
```

---

## SIGN-OFF

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Security Review | | | |
| Privacy Review | | | |
| macOS Build | | | |
| iOS Build | | |
| Release Manager | | | |

---

**Release Decision**:
- [x] **PRERELEASE READY** - v1.0.0-rc.1 artifacts published and verified
- [ ] **STABLE READY** - Native client integrations, signing, and iOS remain incomplete

**Version**: 1.0.0-rc.1
**Date**: 2026-09-24