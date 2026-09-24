# Development Guide

## Prerequisites

- Node.js 20+
- pnpm 9+
- Rust 1.75+ (for Tauri)
- Xcode Command Line Tools (macOS)
- Android Studio (for iOS Tauri - future)

## Quick Start

```bash
# Clone
git clone https://github.com/gh0st/gh0st.git
cd gh0st

# Install deps
pnpm install

# Build all packages
pnpm build

# Dev server (browser)
pnpm dev:client

# CLI dev
pnpm dev:cli

# Site dev
pnpm dev:site

# Tauri dev (macOS)
pnpm tauri:dev
```

## Project Structure

```
gh0st/
├── apps/
│   ├── client/          # React + Vite + Tauri
│   ├── cli/             # Node.js CLI
│   └── site/            # Vite + React static site
├── packages/
│   ├── core/            # Types, models, constants
│   ├── security/        # Crypto, vault
│   ├── storage/         # IndexedDB storage
│   ├── xai/             # xAI API client
│   ├── files/           # File processing
│   └── ui/              # React primitives
├── docs/                # Documentation
└── pnpm-workspace.yaml  # Workspace config
```

## Commands

### Root
```bash
pnpm build              # Build all packages + apps
pnpm test               # Run all tests
pnpm test:unit          # Unit tests only
pnpm test:security      # Security-focused tests
pnpm lint               # Lint all
pnpm typecheck          # TypeScript check all
```

### Client (apps/client)
```bash
pnpm dev                # Vite dev server
pnpm build              # Production build
pnpm preview            # Preview build
pnpm tauri:dev          # Tauri dev (macOS/iOS)
pnpm tauri:build        # Tauri production build
```

### CLI (apps/cli)
```bash
pnpm dev                # tsx watch mode
pnpm build              # TypeScript compile
pnpm start              # Run built CLI
```

### Site (apps/site)
```bash
pnpm dev                # Vite dev server
pnpm build              # Static build
pnpm preview            # Preview build
```

## Testing

```bash
# All tests
pnpm test

# Unit tests with verbose output
pnpm test:unit

# Security tests (encryption, ZDR, vault)
pnpm test:security

# Specific package
pnpm --filter=@gh0st/security test
pnpm --filter=@gh0st/xai test
```

## Type Checking

```bash
# All packages
pnpm typecheck

# Specific package
pnpm --filter=@gh0st/core typecheck
```

## Linting

```bash
# All
pnpm lint

# Auto-fix
pnpm lint -- --fix
```

## Adding a Package

1. Create directory: `packages/new-package/`
2. Add `package.json` with workspace dependencies
3. Add `tsconfig.json` extending root
4. Add to `pnpm-workspace.yaml` if needed
5. Export from root `tsconfig.json` paths

## Adding a CLI Command

1. Create `apps/cli/src/commands/new-command.ts`
2. Export `runNewCommand` function
3. Register in `apps/cli/src/cli.ts`
4. Add tests in `apps/cli/src/commands/new-command.test.ts`

## Adding a UI Component

1. Create in `packages/ui/src/ComponentName.tsx`
2. Export from `packages/ui/src/index.ts`
3. Add to `apps/client` or `apps/site` as needed
4. Follow existing patterns: `cn()`, Tailwind, accessibility

## Security Checklist for Changes

- [ ] No plaintext secrets in logs/config
- [ ] Encrypted storage for sensitive data
- [ ] ZDR verified before strict mode requests
- [ ] Vault locked when not in use
- [ ] Secure memory wiping for keys
- [ ] No new analytics/telemetry
- [ ] Origin validation for local server
- [ ] CSP headers for browser

## Debugging

### Browser DevTools
- React DevTools for component tree
- Network tab for xAI API calls
- Application tab for IndexedDB

### CLI Debugging
```bash
DEBUG=gh0st:* pnpm dev:cli
```

### Tauri DevTools
- Cmd+Option+I (macOS) for WebView inspector
- `cargo run` for Rust backend logs

## Common Issues

### Port Already in Use
```bash
# Kill process on port 1420
lsof -ti:1420 | xargs kill -9
```

### IndexedDB Corruption
```bash
# Clear browser data for localhost:1420
# Or in DevTools: Application > Storage > Clear site data
```

### Tauri Build Fails
```bash
# Clean and rebuild
cd apps/client/src-tauri
cargo clean
pnpm tauri:build
```

### Type Errors After Package Changes
```bash
# Rebuild packages
pnpm build
# Restart TS server in editor
```

## Release Process

1. Update version in `package.json` files
2. Update `CHANGELOG.md`
3. Run full test suite: `pnpm test && pnpm typecheck && pnpm lint`
4. Build all: `pnpm build && pnpm tauri:build`
5. Create git tag: `git tag v1.0.0`
6. Push: `git push origin main --tags`
7. GitHub Actions builds and releases

## Environment Variables

```bash
# xAI API key (for testing)
export XAI_API_KEY=your-key

# gh0st config directory
export GH0ST_DATA_DIR=~/.gh0st

# Log level
export GH0ST_LOG_LEVEL=debug
```

## Editor Setup

### VS Code
Recommended extensions:
- TypeScript Hero
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Rust Analyzer (for Tauri)

Settings:
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## Performance Profiling

```bash
# Bundle analysis
pnpm --filter=@gh0st/client build -- --analyze

# Runtime profiling
# Chrome DevTools > Performance
# React DevTools > Profiler
```

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.