# Privacy-Gated Multi-Provider Architecture Design

**Date:** 2026-09-24
**Target:** gh0st `v1.0.0-rc.2`
**Status:** Approved design

## Objective

Extend the existing gh0st application from an xAI-specific client to a provider-neutral, privacy-gated client without rebuilding either repository or regressing the existing xAI, CLI, browser, macOS, iOS, website, security, and release infrastructure.

gh0st evaluates every `providerId/modelId` combination before user content can leave the device. A model is usable only when current evidence establishes acceptable zero-retention behavior for that exact combination.

The existing `v1.0.0-rc.1` release remains preserved. `v1.0.0-rc.2` is created only after the new gates, adapters, interfaces, tests, and release checks pass.

## Current constraints

- The application currently dispatches directly to `XAIClient` from the browser client and CLI commands.
- The current native Stronghold commands are stubs and the browser/CLI credential paths are not equivalent to a production secure credential store.
- The application must not claim a feature that is only a scaffold. A provider may be visible, but it is blocked until its privacy evidence authorizes it.
- The website is informational and must not collect API keys or proxy inference.
- OpenCode catalog and policy information is time-sensitive and must be refreshed from official sources.
- Live provider requests are optional for the release. If credentials are unavailable, deterministic adapter tests are required and live status is reported as pending.

## Architecture

### `packages/providers`

Define a small provider-neutral contract:

- `Provider`: `id`, display name, credential strategy, model discovery, transports, capabilities, privacy source, and usage metadata.
- `Model`: `providerId`, `modelId`, display name, protocol, context window, capabilities, optional pricing, and current privacy status/evidence reference.
- `ModelRef`: canonical `{ providerId, modelId }`; all selection and persistence use this identity.
- `ProviderAdapter`: `discoverModels`, `testConnection`, and provider-specific transport construction.
- `ProviderTransport`: provider-neutral request, stream-event, usage, and error types.
- `CapabilitySet`: text, vision, reasoning, streaming, tools, web search, X search, code execution, files, MCP, and structured output.

Supported transports are limited to the formats required by the actual adapters: OpenAI Responses-compatible, OpenAI Chat Completions-compatible, and Anthropic Messages-compatible. xAI remains on Responses. Zen and Go select their endpoint based on current official model metadata rather than model name alone.

### `packages/privacy-policy`

Own all privacy decisions and evidence normalization:

- `PrivacyStatus`: `RUNTIME_VERIFIED_ZDR`, `DOCUMENTED_ZDR`, `NOT_ZDR`, `UNKNOWN`, `STALE`, or `ERROR`.
- `PrivacyEvidence`: provider/model identity, status, retention days, training allowance, source type, official source URL, retrieval/expiry timestamps, evidence hash, and notes.
- `PrivacyPolicySource`: fetches and parses only approved official sources.
- `PrivacyPolicyCache`: stores normalized non-secret evidence separately from conversation data.
- `PrivacyGate`: `authorize(provider, model)` and a typed result that distinguishes allowed, blocked, stale, unknown, and error states.

Only `runtime_header`, `official_policy`, and `official_api_metadata` can authorize a model. Community sources, model self-report, blogs, Reddit, and issue reports are never sufficient.

### `packages/provider-runtime`

The only request-dispatch boundary:

1. Resolve `ModelRef` and provider adapter.
2. Resolve current evidence and capabilities.
3. Refresh expired evidence before authorization.
4. Call `privacyGate.authorize()`.
5. Resolve a provider-scoped credential through a secure adapter.
6. Bind the credential to the provider allowlisted origin.
7. Construct the selected transport and send the request.

A failed, unknown, stale, non-ZDR, or policy-error result throws before a request body, file chunk, tool payload, or conversation context is serialized for egress. There is no normal “use anyway” path.

### xAI adapter

Preserve the existing Responses API, `store=false`, streaming, tools, and ZDR inspector behavior. The adapter maps the exact `x-zero-data-retention: true` response header to `RUNTIME_VERIFIED_ZDR`; all other results remain blocked. Evidence is bound to the provider origin, credential/account context, endpoint, and model.

### OpenCode Zen adapter

- Provider ID: `opencode-zen`.
- Base: `https://opencode.ai/zen/v1`.
- Models: dynamically fetched from `https://opencode.ai/zen/v1/models`.
- Protocol: resolved from the current official Zen endpoint table; unresolved protocol is not dispatchable.
- Privacy: parsed from the current official Zen privacy section, including general zero-retention/no-training policy and explicit model exceptions.
- Space Bunny Free is allowed only while the refreshed official evidence says zero retention and no training.
- Free pricing is metadata from current official pricing; it never affects authorization.

### OpenCode Go adapter

- Provider ID: `opencode-go`.
- Base: `https://opencode.ai/zen/go/v1`.
- Models: dynamically fetched from `https://opencode.ai/zen/go/v1/models`.
- Protocol: resolved from the current official Go endpoint table.
- Privacy: parsed from the official model training/retention table.
- Go requests include a locally generated opaque per-conversation `x-opencode-session` value and an honest `gh0st/<version>` User-Agent where supported.
- No User-Agent or session behavior is used to evade provider restrictions.

## Privacy policy and evidence

The policy engine accepts only current official evidence and stores a hash of normalized evidence. Documented evidence expires after 24 hours by default. Refresh occurs on provider connection, model refresh, and first use after expiry. If refresh fails, the result becomes `ERROR` or `UNKNOWN`; cached evidence is never silently extended.

`DOCUMENTED_ZDR` requires both zero retention and no training unless the provider’s official policy explicitly defines a narrower acceptable condition. `NOT_ZDR` blocks positive retention, training use, or explicit provider exceptions. `STALE` blocks even if the cached result previously passed.

The policy parser is narrow and defensive. It validates the expected official section/table structure, normalizes model IDs, and returns `UNKNOWN` when a row cannot be confidently mapped. It never infers a default policy for an unrecognized model.

## Credentials

Define a provider-scoped `CredentialStore` interface. Raw credentials are never placed in ordinary config, model state, privacy evidence, logs, or exports.

- CLI: encrypted credential records using the existing security primitives with explicit session unlock; if persistent secure storage cannot be established, the CLI requires an ephemeral session credential and reports that state honestly.
- Browser: session-only credential memory/session storage; no raw key in `localStorage` or Zustand persistence.
- Tauri/macOS/iOS: Stronghold-backed adapter where the platform supports it, with the same interface and migration boundary.
- Each credential record is bound to a provider ID and allowlisted origin. Replacing or disconnecting a provider removes its credential record.
- Exports omit provider API keys entirely.

## User interfaces

### CLI

Add a compact command group:

- `gh0st providers`
- `gh0st provider add|remove|test`
- `gh0st models`
- `gh0st models --zdr`
- `gh0st model set provider/model`
- `gh0st privacy`
- `gh0st privacy check provider/model`

`chat`, `ask`, `status`, and `doctor` use the shared provider runtime and privacy gate. A model flag cannot bypass authorization.

### Browser, macOS, and shared iOS client

Add Settings → Providers with provider cards, connect/disconnect, credential state, refresh, models, and privacy evidence. Add a universal model picker grouped by provider. Model detail exposes capabilities, context, pricing, protocol, retention, training, source, and last check.

Use distinct labels:

- `ZDR VERIFIED` for runtime xAI evidence.
- `ZDR DOCUMENTED` for current official OpenCode policy.
- `BLOCKED` for non-ZDR.
- `UNKNOWN`, `STALE`, and `ERROR` for unresolved evidence.

Auto Private considers only currently authorized ZDR models. Fallback after provider failure is also restricted to authorized ZDR models. Files, agents, tools, and MCP use the same gate; MCP remains a separate privacy boundary.

## Testing strategy

The implementation is test-first at the policy and dispatch boundaries. Required coverage includes:

- canonical namespacing and Zen/Go same-name collision;
- every privacy state and evidence source type;
- xAI true-header allow and false/missing-header block;
- Zen documented 0-day/no-training allow and exception block;
- Go 0-day allow and 30-day/training block;
- stale expiry and refresh failure;
- unknown/unparseable official evidence block;
- dynamic model discovery and protocol selection;
- OpenCode session header and honest User-Agent;
- credential isolation and origin binding;
- no provider request before authorization;
- file-context authorization;
- provider capability filtering;
- ZDR-only fallback;
- existing xAI crypto and behavior tests.

Adapter tests use deterministic HTTP fixtures and mocks. Live tests are attempted only when credentials are already available through the secure adapter; otherwise the final report marks live verification pending.

## Website and release

Update the website positioning to “Private AI, regardless of provider,” while stating that gh0st blocks providers/models without acceptable evidence rather than claiming all providers are private.

Add provider/model sections, a privacy-gated product demo, updated security and FAQ pages, `/docs/providers`, `/docs/models`, and the updated application README. Add the new routes to the sitemap and preserve static export.

Create `v1.0.0-rc.2` only after:

- install and frozen lockfile validation;
- typecheck;
- all tests and privacy-gate tests;
- lint;
- production build;
- Zen/Go adapter tests;
- macOS build;
- macOS launch;
- public DMG checksum and signature verification.

Run website typecheck, lint, and build before deployment. Run `vercel whoami`; deploy only when authenticated. If deployment is unavailable, report exact commands without fabricating a URL. Inspect domain access before touching `gh0st.noaerth.com`.

## Non-goals

- No giant LangChain-style framework.
- No arbitrary provider protocol framework beyond the three required transport families.
- No privacy downgrade or normal non-ZDR bypass.
- No hosted gh0st policy service.
- No raw provider keys in the website, normal config, logs, or exports.
- No claim that a model is private based on provider-level documentation when model-specific evidence is absent.
- No live provider request without a valid, current, model-specific privacy decision.
