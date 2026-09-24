# Contributing to gh0st

Thank you for contributing! gh0st is a privacy-first AI client and we welcome contributions that maintain our security and usability standards.

## Code of Conduct

This project follows our [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you agree to uphold it.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Rust (for Tauri native builds)

### Development Setup

```bash
git clone https://github.com/M4G3LL4N0/gh0st.git
cd gh0st
pnpm install
pnpm build
pnpm dev:client
```

## Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `pnpm test`
5. Type check: `pnpm typecheck`
6. Lint: `pnpm lint`
7. Commit with conventional commits
8. Push and open a PR

## Code Standards

- TypeScript strict mode
- ESLint + Prettier
- Conventional commits
- No `any` types without justification
- Security-focused code review

## Security Guidelines

- Never log sensitive data (prompts, keys, vault contents)
- Use the crypto abstraction in `@gh0st/security`
- Encrypt all stored sensitive data
- Verify ZDR before sensitive requests
- No analytics or telemetry without explicit opt-in

## Pull Request Process

1. Ensure all CI checks pass
2. Update documentation if needed
3. Add tests for new functionality
4. Request review from maintainers
5. Address review feedback
6. Squash and merge

## Areas for Contribution

- **Core**: Conversation models, storage, encryption
- **xAI Integration**: Transport, tools, streaming
- **UI**: Components, accessibility, mobile
- **CLI**: Commands, UX, output formatting
- **Native**: Tauri, macOS/iOS specifics
- **Docs**: Guides, API docs, threat model
- **Testing**: Unit, integration, security tests

## License

By contributing, you agree your contributions will be licensed under the MIT License.