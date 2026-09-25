# Privacy-Gated Multi-Provider Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing gh0st application and website into a provider-neutral client that authorizes every `providerId/modelId` request through a fail-closed, evidence-backed ZDR gate, then publish and verify `v1.0.0-rc.2` without disturbing `v1.0.0-rc.1`.

**Architecture:** Add focused `@gh0st/providers`, `@gh0st/privacy-policy`, and `@gh0st/provider-runtime` packages. Move all inference dispatch, xAI verification, OpenCode Zen/Go adapters, credential resolution, capability filtering, and evidence refresh behind one runtime. Keep the website informational and static; do not collect keys or proxy inference.

**Tech Stack:** TypeScript 5.5, pnpm 9 workspace, Vitest 2, React 18, Tauri 2/Rust, Next.js 14 static export, existing `@noble/hashes` and browser Web Crypto security primitives.

## Global Constraints

- Do not rebuild either project from scratch; preserve the existing xAI Responses API, `store=false`, streaming, tools, CLI/browser/macOS surfaces, security architecture, GitHub infrastructure, and `v1.0.0-rc.1`.
- Canonical identity is always `providerId/modelId`; never resolve or persist a bare model ID.
- No request, file chunk, tool payload, or conversation context may leave the device before `PrivacyGate.authorize()` returns allow.
- Only `runtime_header`, `official_policy`, and `official_api_metadata` are acceptable evidence sources.
- `RUNTIME_VERIFIED_ZDR` is reserved for exact xAI `x-zero-data-retention: true`; OpenCode evidence is `DOCUMENTED_ZDR`, never runtime verification.
- Documented evidence expires after 24 hours; stale, unknown, non-ZDR, and error states block dispatch.
- No ordinary “use anyway” or privacy-bypass control; any test-only override must be development-configured, disabled by default, and absent from normal UI.
- Provider credentials are provider-scoped, origin-bound, excluded from exports/logs/config, and never written to browser `localStorage` or ordinary Zustand persistence.
- OpenCode model catalogs are fetched dynamically from `https://opencode.ai/zen/v1/models` and `https://opencode.ai/zen/go/v1/models`; no full catalog is hardcoded.
- OpenCode privacy evidence is parsed narrowly from current official Zen/Go policy pages; unparseable or contradictory data is `UNKNOWN`.
- Go requests use an opaque per-conversation `x-opencode-session` and honest `gh0st/<version>` User-Agent when supported; do not spoof or evade provider restrictions.
- Tools, files, and MCP use the same privacy gate; MCP remains a separate external boundary.
- The existing Vite warnings for Node built-ins in browser bundles must not be described as fixed unless separately resolved.
- Website deployment happens only after `vercel whoami` succeeds; never invent a production URL or custom-domain result.
- Before rc.2, run typecheck, tests, privacy/adapter tests, lint, build, macOS build, and macOS launch. Live provider calls are optional and only use already-secured credentials.

---

## File Map

### New application packages

- Create `packages/providers/package.json` and `src/types.ts` for provider/model/transports/capabilities/usage contracts.
- Create `packages/providers/src/registry.ts` for provider ID allowlists, canonical model references, and adapter registration.
- Create `packages/providers/src/capabilities.ts` for capability filtering and model capability normalization.
- Create `packages/providers/src/index.ts` for public exports.
- Create `packages/providers/src/providers.test.ts` for namespacing, collision, capability, and transport-selection tests.
- Create `packages/privacy-policy/package.json` and `src/types.ts` for status/evidence/decision types.
- Create `packages/privacy-policy/src/evidence.ts` for normalization, evidence hashing, and status calculation.
- Create `packages/privacy-policy/src/cache.ts` for local non-secret evidence persistence and expiry.
- Create `packages/privacy-policy/src/gate.ts` for fail-closed authorization and refresh orchestration.
- Create `packages/privacy-policy/src/official-html.ts` for narrowly scoped official policy extraction helpers.
- Create `packages/privacy-policy/src/zen-policy.ts` and `src/go-policy.ts` for official Zen/Go normalization.
- Create `packages/privacy-policy/src/privacy.test.ts` for all policy-state and parser tests.
- Create `packages/provider-runtime/package.json` and `src/types.ts` for runtime request/stream/usage contracts.
- Create `packages/provider-runtime/src/credentials.ts` for `CredentialStore` and provider-origin binding.
- Create `packages/provider-runtime/src/runtime.ts` for the only dispatch path.
- Create `packages/provider-runtime/src/xai-adapter.ts` for xAI transport/ZDR adaptation.
- Create `packages/provider-runtime/src/opencode-adapter.ts` for Zen/Go discovery, policy, transport selection, and headers.
- Create `packages/provider-runtime/src/fallback.ts` for ZDR-only authorized fallback selection.
- Create `packages/provider-runtime/src/runtime.test.ts` for no-egress-before-authorization, credential isolation, and fallback tests.

### Existing application files to modify

- Modify `packages/core/src/models.ts` and `src/constants.ts` to add namespaced model/provider state and privacy status without breaking xAI compatibility.
- Modify `packages/xai/src/client.ts`, `src/http-transport.ts`, `src/ws-transport.ts`, and `src/types.ts` so the xAI adapter supplies a real credential/base URL for ZDR verification and exposes normalized responses.
- Modify `packages/xai/src/index.ts` to export the adapter-facing types.
- Modify `pnpm-workspace.yaml` only if new workspace path aliases are not picked up automatically; add root `tsconfig.json` aliases for the three new packages.
- Modify `apps/cli/src/cli.ts`, `commands/chat.ts`, `commands/ask.ts`, `commands/status.ts`, `commands/doctor.ts`, and `commands/zdr.ts` to use the shared runtime.
- Create `apps/cli/src/commands/providers.ts`, `models.ts`, `model.ts`, and `privacy.ts` for the compact CLI command group.
- Modify `apps/client/src/store/index.ts` to store provider/model state, privacy evidence references, and no raw credentials.
- Create `apps/client/src/providers/providerStore.ts` and `providerRuntime.ts` for browser session credentials and shared runtime access.
- Modify `apps/client/src/App.tsx`, `components/Sidebar.tsx`, `components/Composer.tsx`, and `store/index.ts` to add Settings → Providers, universal model picker, privacy badges, model details, and fail-closed dispatch.
- Create `apps/client/src/components/providers/ProviderSettings.tsx`, `ModelPicker.tsx`, `ModelDetails.tsx`, and `PrivacyBadge.tsx` with accessible controls and explicit blocked reasons.
- Modify `apps/client/src-tauri/src/main.rs` and `gen/ios/src/main.rs` to expose provider-scoped Stronghold credential commands without returning secrets to logs/UI.
- Modify `apps/site` only for product consistency after the shared runtime is working; do not duplicate inference logic.

### Website files to modify/create

- Modify `gh0st-website/src/app/layout.tsx`, `src/app/page.tsx`, `src/app/security/page.tsx`, `src/app/privacy/page.tsx`, `src/app/faq/page.tsx`, and `src/components/sections/FAQ.tsx` for provider-neutral positioning and privacy-gate explanations.
- Create `gh0st-website/src/components/sections/ProviderExplorer.tsx` and `PrivacyGateDemo.tsx` for provider/model examples and blocked-model education.
- Create `gh0st-website/src/app/docs/providers/page.tsx`, `docs/models/page.tsx`, and `docs/privacy-gate/page.tsx`.
- Modify `gh0st-website/src/app/sitemap.ts`, `src/components/layout/Header.tsx`, and `Footer.tsx` for new routes.
- Update `gh0st-website/src/app/download/page.tsx` only after rc.2 exists; point the DMG/checksum to rc.2 without uploading binaries to Vercel.

### Release files to modify

- Modify all package versions and Tauri/Cargo manifests to `1.0.0-rc.2` only in the release phase.
- Update `CHANGELOG.md`, `README.md`, `docs/ZDR.md`, `docs/USER_GUIDE.md`, and `docs/RELEASE_CHECKLIST.md` with provider status, live-vs-mock evidence, and exact release checks.
- Modify `.github/workflows/release.yml` only for rc.2 release checks/assets if required; preserve the successful rc.1 tag and release.

---

### Task 1: Add provider contracts and workspace integration

**Files:**
- Create: `packages/providers/package.json`
- Create: `packages/providers/src/types.ts`
- Create: `packages/providers/src/capabilities.ts`
- Create: `packages/providers/src/registry.ts`
- Create: `packages/providers/src/index.ts`
- Create: `packages/providers/src/providers.test.ts`
- Modify: `pnpm-workspace.yaml`
- Modify: `tsconfig.json`
- Modify: `packages/core/src/models.ts`
- Modify: `packages/core/src/constants.ts`

**Interfaces:**
- Produces `ModelRef`, `ProviderDescriptor`, `ModelDescriptor`, `CapabilitySet`, `ProviderAdapter`, `ProviderTransport`, `UsageMetadata`, `parseModelRef()`, and `sameModelRef()`.
- `ModelRef` is `{ providerId: string; modelId: string }`; `parseModelRef("opencode-zen/space-bunny-free")` returns exactly those two fields.

- [ ] **Step 1: Write failing namespacing/collision tests**

Create tests that assert:

```ts
expect(parseModelRef("opencode-zen/space-bunny-free")).toEqual({
  providerId: "opencode-zen",
  modelId: "space-bunny-free",
});
expect(parseModelRef("opencode-go/space-bunny-free")).not.toEqual(
  parseModelRef("opencode-zen/space-bunny-free"),
);
expect(sameModelRef("opencode-zen/space-bunny-free", "opencode-go/space-bunny-free")).toBe(false);
```

- [ ] **Step 2: Run the new package test and verify it fails**

Run: `pnpm --filter @gh0st/providers test`
Expected: FAIL because the package and parser do not exist.

- [ ] **Step 3: Implement the contract and registry**

Use the following required fields in `types.ts`:

```ts
export type Protocol = "openai-responses" | "openai-chat-completions" | "anthropic-messages" | "unknown";
export type PrivacyStatus = "RUNTIME_VERIFIED_ZDR" | "DOCUMENTED_ZDR" | "NOT_ZDR" | "UNKNOWN" | "STALE" | "ERROR";
export interface ModelRef { providerId: string; modelId: string; }
export interface CapabilitySet {
  text: boolean; vision: boolean; reasoning: boolean; streaming: boolean;
  tools: boolean; webSearch: boolean; xSearch: boolean; codeExecution: boolean;
  files: boolean; mcp: boolean; structuredOutput: boolean;
}
export interface ModelDescriptor extends ModelRef {
  displayName: string; protocol: Protocol; contextWindow?: number;
  capabilities: CapabilitySet; pricing?: PricingMetadata; privacyStatus: PrivacyStatus;
  privacyEvidenceRef?: string;
}
```

The registry must reject bare model IDs, normalize provider IDs only from the explicit allowlist, and never merge Zen and Go entries.

- [ ] **Step 4: Add workspace aliases and package scripts**

Add package aliases for `@gh0st/providers`, `@gh0st/privacy-policy`, and `@gh0st/provider-runtime`; add `test`, `test:unit`, `typecheck`, `lint`, and `build` scripts matching existing workspace packages.

- [ ] **Step 5: Run package tests, typecheck, and lint**

Run: `pnpm install --frozen-lockfile && pnpm --filter @gh0st/providers test && pnpm --filter @gh0st/providers typecheck && pnpm --filter @gh0st/providers lint`
Expected: PASS with no lint errors.

- [ ] **Step 6: Commit the contract layer**

```bash
git add packages/providers pnpm-workspace.yaml tsconfig.json packages/core/src/models.ts packages/core/src/constants.ts pnpm-lock.yaml
git commit -m "feat: add provider and model contracts"
```

### Task 2: Implement the privacy policy engine and evidence cache

**Files:**
- Create: `packages/privacy-policy/package.json`
- Create: `packages/privacy-policy/src/types.ts`
- Create: `packages/privacy-policy/src/evidence.ts`
- Create: `packages/privacy-policy/src/cache.ts`
- Create: `packages/privacy-policy/src/gate.ts`
- Create: `packages/privacy-policy/src/official-html.ts`
- Create: `packages/privacy-policy/src/zen-policy.ts`
- Create: `packages/privacy-policy/src/go-policy.ts`
- Create: `packages/privacy-policy/src/index.ts`
- Create: `packages/privacy-policy/src/privacy.test.ts`
- Modify: `tsconfig.json`

**Interfaces:**
- Consumes `ModelRef` and `PrivacyStatus` from Task 1.
- Produces `PrivacyEvidence`, `PrivacyDecision`, `EvidenceStore`, `PolicySource`, `normalizeEvidence()`, `evaluateEvidence()`, and `PrivacyGate.authorize(ref, options)`.

- [ ] **Step 1: Write failing policy-state tests**

Use fixtures for:

```ts
const evidence = {
  status: "DOCUMENTED_ZDR" as const,
  retentionDays: 0,
  trainingAllowed: false,
  sourceType: "official_policy" as const,
  sourceUrl: "https://opencode.ai/docs/zen/",
  retrievedAt: 1_700_000_000_000,
  expiresAt: 1_700_086_400_000,
  evidenceHash: "fixture",
  providerId: "opencode-zen",
  modelId: "space-bunny-free",
};
const allowed = evaluateEvidence(evidence);
expect(allowed.allowed).toBe(true);
expect(evaluateEvidence({ ...evidence, retentionDays: 30 }).allowed).toBe(false);
expect(evaluateEvidence({ ...evidence, trainingAllowed: true }).allowed).toBe(false);
expect(evaluateEvidence({ ...evidence, expiresAt: Date.now() - 1 }).status).toBe("STALE");
```

- [ ] **Step 2: Run the policy tests and verify they fail**

Run: `pnpm --filter @gh0st/privacy-policy test`
Expected: FAIL because the package and gate do not exist.

- [ ] **Step 3: Implement evidence normalization and hashing**

Require all evidence to contain provider/model identity, source type, source URL, retrieval and expiry timestamps, status, retention/training fields, and a stable hash. Reject non-official source types and malformed timestamps.

- [ ] **Step 4: Implement the local cache and fail-closed gate**

`EvidenceStore` must serialize only non-secret normalized evidence. `PrivacyGate` must:

```ts
async authorize(ref: ModelRef, options: { now?: number; refresh?: () => Promise<PrivacyEvidence> }): Promise<PrivacyDecision> {
  const evidence = await this.getCurrentEvidence(ref, options);
  return evaluateEvidence(evidence, options.now ?? Date.now());
}
```

No catch path may turn an error into an allow. A missing refresh result is `UNKNOWN` or `ERROR`; an expired result is `STALE`.

- [ ] **Step 5: Implement narrow Zen/Go parsers**

Zen parsing must start at the official privacy heading, apply the general zero-retention/no-training rule, then apply explicit exception rows. Go parsing must parse the model/training/retention table. Return `UNKNOWN` when headings, table headers, or model rows do not match. Do not hardcode the model catalog; tests may use current Space Bunny and known exception fixtures.

- [ ] **Step 6: Add parser and gate regression tests**

Cover Zen Space Bunny allow, Zen explicit training/retention exception block, Go Space Bunny allow, Go 30-day block, Go training block, unknown model block, stale block, and malformed source block.

- [ ] **Step 7: Run policy verification and commit**

Run: `pnpm --filter @gh0st/privacy-policy test && pnpm --filter @gh0st/privacy-policy typecheck && pnpm --filter @gh0st/privacy-policy lint`
Expected: PASS.

```bash
git add packages/privacy-policy tsconfig.json pnpm-lock.yaml
git commit -m "feat: add fail-closed privacy policy engine"
```

### Task 3: Build the shared runtime and migrate xAI

**Files:**
- Create: `packages/provider-runtime/package.json`
- Create: `packages/provider-runtime/src/types.ts`
- Create: `packages/provider-runtime/src/credentials.ts`
- Create: `packages/provider-runtime/src/runtime.ts`
- Create: `packages/provider-runtime/src/xai-adapter.ts`
- Create: `packages/provider-runtime/src/fallback.ts`
- Create: `packages/provider-runtime/src/index.ts`
- Create: `packages/provider-runtime/src/runtime.test.ts`
- Modify: `packages/xai/src/client.ts`
- Modify: `packages/xai/src/http-transport.ts`
- Modify: `packages/xai/src/types.ts`
- Modify: `packages/xai/src/index.ts`
- Modify: `tsconfig.json`

**Interfaces:**
- `ProviderRuntime.execute({ ref, messages, tools?, files?, sessionId? }, options?)` accepts a `ProviderRequest` and returns normalized stream/response/usage.
- `ProviderRequest` contains `ref`, neutral `messages`, optional capability-filtered tools/files, and an opaque `sessionId`; it never contains a raw credential.
- `CredentialStore.get(ref.providerId)` returns a secret only after provider/origin validation.
- `xAIAdapter.verifyRuntimeEvidence(ref, credential, fetcher)` returns `RUNTIME_VERIFIED_ZDR` only for exact `x-zero-data-retention: true`.

- [ ] **Step 1: Write failing no-egress tests**

Create a fake transport with a counter:

```ts
const transport = { send: vi.fn() };
await expect(runtime.execute({ ref: { providerId: "xai", modelId: "grok-3" }, messages, transport })).rejects.toMatchObject({ code: "PRIVACY_BLOCKED" });
expect(transport.send).not.toHaveBeenCalled();
```

Repeat for `NOT_ZDR`, `UNKNOWN`, `STALE`, and `ERROR` evidence.

- [ ] **Step 2: Run the runtime tests and verify they fail**

Run: `pnpm --filter @gh0st/provider-runtime test`
Expected: FAIL because the runtime package is absent.

- [ ] **Step 3: Implement the credential interface and origin binding**

Use a `CredentialStore` interface with `get`, `set`, `delete`, and `has`. The resolver must reject a provider secret when its configured origin is not on the provider’s HTTPS allowlist. The runtime must resolve credentials only after the gate allows.

- [ ] **Step 4: Fix xAI runtime verification inputs**

Change the xAI client/transport path so `verifyZDR()` receives the real configured API key and base URL. Check `response.ok` and the exact lowercase header value. Bind evidence to provider, model, endpoint, and credential/account context.

- [ ] **Step 5: Route runtime requests through the gate**

Implement `execute()` in this order: refresh/evaluate evidence, authorize, resolve capability set, resolve credential, construct transport, serialize/send. Add a typed `PrivacyBlockedError` carrying status, reason, retention, training, source URL, and evidence timestamp.

- [ ] **Step 6: Add xAI and fallback tests**

Cover exact true header allow, false/missing header block, xAI model namespacing, request not sent before authorization, credential isolation, and fallback selecting only another currently authorized ZDR model.

- [ ] **Step 7: Run runtime/xAI verification and commit**

Run: `pnpm --filter @gh0st/xai test && pnpm --filter @gh0st/provider-runtime test && pnpm typecheck && pnpm build`
Expected: PASS.

```bash
git add packages/provider-runtime packages/xai tsconfig.json pnpm-lock.yaml
git commit -m "feat: route xAI through privacy runtime"
```

### Task 4: Add dynamic OpenCode Zen and Go adapters

**Files:**
- Create: `packages/provider-runtime/src/opencode-adapter.ts`
- Create: `packages/provider-runtime/src/opencode-http.ts`
- Create: `packages/provider-runtime/src/opencode.test.ts`
- Create: `packages/privacy-policy/src/fixtures/zen-privacy.html`
- Create: `packages/privacy-policy/src/fixtures/go-privacy.md`
- Create: `packages/privacy-policy/src/fixtures/opencode-models.json`
- Modify: `packages/privacy-policy/src/zen-policy.ts`
- Modify: `packages/privacy-policy/src/go-policy.ts`
- Modify: `packages/provider-runtime/src/index.ts`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- `OpenCodeAdapter(providerId, fetcher, policySource)` implements `ProviderAdapter`.
- `discoverModels()` calls the provider’s official `/models` endpoint and returns namespaced descriptors.
- `execute()` selects Responses, Chat Completions, or Messages from refreshed endpoint metadata.

- [ ] **Step 1: Add fixture tests for current official formats**

Fixture assertions must cover:

```ts
expect(await adapter.discoverModels()).toContainEqual(expect.objectContaining({
  providerId: "opencode-zen", modelId: "space-bunny-free",
}));
expect(await adapter.discoverModels()).toContainEqual(expect.objectContaining({
  providerId: "opencode-go", modelId: "space-bunny-free",
}));
expect(zenRef).not.toEqual(goRef);
```

Use the currently fetched endpoint formats: `/models` returns a `{ list, data: [{ id, object, created, owned_by }] }` shape; official docs provide the protocol/privacy tables.

- [ ] **Step 2: Run adapter tests and verify they fail**

Run: `pnpm --filter @gh0st/provider-runtime test -- opencode`
Expected: FAIL because the adapter is not implemented.

- [ ] **Step 3: Implement dynamic model discovery**

Use separate origins and endpoint paths for `opencode-zen` and `opencode-go`. Never use a shared provider ID, shared model cache, or model-name-only route. Treat missing model IDs as unavailable rather than retaining stale catalog entries.

- [ ] **Step 4: Implement protocol selection**

Parse the current official endpoint table for each provider. Map endpoints to `openai-responses`, `openai-chat-completions`, and `anthropic-messages`. If the protocol cannot be resolved, keep the model visible with `UNKNOWN` and block dispatch.

- [ ] **Step 5: Implement Go request metadata**

Generate a fresh opaque session ID per conversation. Add `x-opencode-session` on every Go request path and `User-Agent: gh0st/<version>`. Do not put user text in the session ID and do not spoof OpenCode’s user agent.

- [ ] **Step 6: Add current-policy fixtures and parser tests**

Use Zen general policy plus explicit exceptions, Go’s table, Space Bunny Zen/Go allow fixtures, and blocked 30-day/training fixtures. Test that pricing/free status does not affect privacy authorization and that a free model with training use is blocked.

- [ ] **Step 7: Run adapter/policy tests and commit**

Run: `pnpm --filter @gh0st/privacy-policy test && pnpm --filter @gh0st/provider-runtime test && pnpm typecheck && pnpm build`
Expected: PASS.

```bash
git add packages/provider-runtime packages/privacy-policy pnpm-lock.yaml
git commit -m "feat: add OpenCode Zen and Go adapters"
```

### Task 5: Add secure credential adapters and config migration

**Files:**
- Create: `packages/provider-runtime/src/credentials/session-store.ts`
- Create: `packages/provider-runtime/src/credentials/encrypted-file-store.ts`
- Create: `packages/provider-runtime/src/credentials/stronghold-store.ts`
- Create: `packages/provider-runtime/src/credentials/credentials.test.ts`
- Modify: `apps/cli/src/commands/doctor.ts`
- Modify: `apps/client/src/store/index.ts`
- Modify: `apps/client/src-tauri/src/main.rs`
- Modify: `apps/client/src-tauri/gen/ios/src/main.rs`
- Modify: `packages/storage/src/file-storage/file-storage.ts` only for credential/evidence separation
- Modify: `packages/core/src/models.ts` for `ProviderConnection` metadata without secret fields

**Interfaces:**
- `SessionCredentialStore`: in-memory/session-only, cleared on disconnect.
- `EncryptedFileCredentialStore`: explicit session unlock, encrypted records only.
- `StrongholdCredentialStore`: provider-scoped native adapter, no secret returned in status payloads.
- `ProviderConnection` stores `providerId`, `credentialRef`, `connectedAt`, `lastModelRefreshAt`, and `lastPolicyRefreshAt`, never the raw credential.

- [ ] **Step 1: Write failing credential isolation tests**

Assert that one provider’s credential cannot be read by another provider, origin mismatch is rejected, disconnect removes the record, and export serialization contains no secret.

- [ ] **Step 2: Run credential tests and verify they fail**

Run: `pnpm --filter @gh0st/provider-runtime test -- credentials`
Expected: FAIL because the stores do not exist.

- [ ] **Step 3: Implement session and encrypted-file adapters**

Use existing Web Crypto/Vault primitives for encrypted records. If persistent CLI unlock cannot be completed safely, require an ephemeral session credential and expose that state; do not write a plaintext fallback.

- [ ] **Step 4: Implement the Tauri Stronghold command boundary**

Add provider-scoped `set/get/delete/status` commands. The status command returns only boolean connection state and timestamps. Ensure logs and errors never contain secret values. Keep iOS command behavior aligned without inventing platform support.

- [ ] **Step 5: Migrate existing config without copying raw keys**

Read legacy xAI config only through a one-time migration into the selected credential adapter. Remove raw key fields from persisted app state and ensure exports omit them.

- [ ] **Step 6: Run credential/security tests and commit**

Run: `pnpm --filter @gh0st/provider-runtime test -- credentials && pnpm --filter @gh0st/security test:security && pnpm typecheck`
Expected: PASS.

```bash
git add packages/provider-runtime apps/cli/src/commands/doctor.ts apps/client/src/store/index.ts apps/client/src-tauri pnpm-lock.yaml
git commit -m "feat: add provider-scoped credential adapters"
```

### Task 6: Migrate CLI inference and add provider commands

**Files:**
- Modify: `apps/cli/src/cli.ts`
- Create: `apps/cli/src/commands/providers.ts`
- Create: `apps/cli/src/commands/models.ts`
- Create: `apps/cli/src/commands/model.ts`
- Create: `apps/cli/src/commands/privacy.ts`
- Modify: `apps/cli/src/commands/chat.ts`
- Modify: `apps/cli/src/commands/ask.ts`
- Modify: `apps/cli/src/commands/status.ts`
- Modify: `apps/cli/src/commands/doctor.ts`
- Modify: `apps/cli/src/commands/zdr.ts`
- Create: `apps/cli/src/commands/provider-cli.test.ts`

**Interfaces:**
- All inference commands call `ProviderRuntime.execute()`.
- `runProviders()`, `runModels()`, `runModelSet()`, and `runPrivacyCheck()` use shared formatting helpers.
- `--model` accepts `providerId/modelId`, rejects bare IDs, and cannot bypass the gate.

- [ ] **Step 1: Write failing CLI gate tests**

Test that `ask --model opencode-go/grok-4.7` is blocked before the mocked transport and prints retention reason; `--model opencode-zen/space-bunny-free` calls the transport only with documented evidence.

- [ ] **Step 2: Run CLI tests and verify they fail**

Run: `pnpm --filter @gh0st/cli test -- provider`
Expected: FAIL because the command group/runtime integration is absent.

- [ ] **Step 3: Register the compact command group**

Add exactly the provider/model/privacy commands listed in the approved design. Keep all existing commands registered and update descriptions to provider-neutral language.

- [ ] **Step 4: Replace direct xAI dispatch**

Refactor `ask`, `chat`, `status`, `doctor`, and `zdr` to load provider state, call the runtime, and print typed block states. Remove duplicated client-side policy checks once the shared runtime owns the gate.

- [ ] **Step 5: Add provider/model status rendering**

Print provider, canonical model, protocol, privacy status, retention, training, source, and last refresh. `--zdr` filters to allow-listed models only.

- [ ] **Step 6: Run CLI tests/build and commit**

Run: `pnpm --filter @gh0st/cli test && pnpm --filter @gh0st/cli typecheck && pnpm --filter @gh0st/cli build && pnpm build:cli`
Expected: PASS.

```bash
git add apps/cli
git commit -m "feat: add privacy-gated CLI providers"
```

### Task 7: Add shared browser/macOS/iOS provider UX and file gating

**Files:**
- Create: `apps/client/src/providers/providerStore.ts`
- Create: `apps/client/src/providers/providerRuntime.ts`
- Create: `apps/client/src/components/providers/ProviderSettings.tsx`
- Create: `apps/client/src/components/providers/ModelPicker.tsx`
- Create: `apps/client/src/components/providers/ModelDetails.tsx`
- Create: `apps/client/src/components/providers/PrivacyBadge.tsx`
- Modify: `apps/client/src/App.tsx`
- Modify: `apps/client/src/components/Sidebar.tsx`
- Modify: `apps/client/src/components/Composer.tsx`
- Modify: `apps/client/src/store/index.ts`
- Modify: `apps/client/src-tauri/src/main.rs`
- Modify: `apps/client/src-tauri/gen/ios/src/main.rs`
- Create: `apps/client/src/providers/ui-state.ts`
- Create: `apps/client/src/providers/provider-ui.test.ts`

**Interfaces:**
- `ProviderSettings` uses the same `ProviderRuntime` as CLI.
- `ModelPicker` receives `ModelDescriptor[]` and never enables blocked models.
- `PrivacyBadge` renders distinct `RUNTIME VERIFIED`, `DOCUMENTED ZDR`, `BLOCKED`, `UNKNOWN`, `STALE`, and `ERROR` states.
- `Composer` calls the runtime only after current model/evidence and capability checks.

- [ ] **Step 1: Write failing UI-state/gating tests**

Test pure UI state helpers: `canSendModel()` is false for blocked/unknown/stale/error models, `groupModelsByProvider()` keeps Zen and Go entries separate, and `privacyLabel()` returns distinct labels. Add a runtime test proving a file attachment cannot invoke a provider transport while blocked.

- [ ] **Step 2: Run UI tests and verify they fail**

Run: `pnpm --filter @gh0st/client test`
Expected: FAIL until provider store/runtime/UI are added.

- [ ] **Step 3: Implement provider store and runtime access**

Persist only provider IDs, model refs, evidence refs, timestamps, and connection metadata. Each conversation stores the selected `providerId/modelId` and evidence reference; old conversations remain readable, but new inference re-evaluates current evidence. Keep browser credentials session-only. Expose refresh/connect/disconnect/test actions.

- [ ] **Step 4: Add Settings → Providers and universal picker**

Use accessible buttons, labels, focus states, and explanatory blocked states. Group by provider. Show model details including protocol, capabilities, context, price/free metadata, privacy source, retention, training, and last check.

- [ ] **Step 5: Replace direct Composer xAI dispatch**

Remove direct `new XAIClient()` construction from the send path. The runtime must authorize the model, selected tools, and file/context payload before network work. A blocked model shows `Unavailable in gh0st` with source/reason and no bypass control.

- [ ] **Step 6: Add Auto Private and ZDR-only fallback**

Auto mode filters authorized models by capabilities, availability, and free preference. If a selected provider fails, invoke fallback only over currently authorized ZDR models; stop with a clear error if none exist.

- [ ] **Step 7: Wire native/iOS shared commands and privacy state**

Replace hard-coded native privacy status with shared runtime status. Keep iOS tooling limitations explicit; do not claim native signing/build success if unavailable.

- [ ] **Step 8: Run client tests/build and native compile, then commit**

Run: `pnpm --filter @gh0st/client test && pnpm --filter @gh0st/client typecheck && pnpm --filter @gh0st/client build && cargo check --manifest-path apps/client/src-tauri/Cargo.toml`
Expected: PASS.

```bash
git add apps/client
git commit -m "feat: add shared provider and privacy UX"
```

### Task 8: Update application docs and release metadata

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/ZDR.md`
- Modify: `docs/USER_GUIDE.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/SECURITY_AUDIT.md`
- Modify: `docs/RELEASE_CHECKLIST.md`
- Modify: `FINAL_STATUS.md`
- Modify: `package.json`
- Modify: all workspace `package.json` files
- Modify: `apps/client/src-tauri/tauri.conf.json`
- Modify: `apps/client/src-tauri/Cargo.toml`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Update documentation against the approved design**

Document xAI, Zen, Go, canonical namespacing, runtime-vs-documented evidence, 24-hour freshness, fail-closed behavior, credential boundaries, and live-vs-mock status. Link the application README to the website repository and preserve the existing GitHub infrastructure. Do not claim secure persistence where the adapter is session-only or pending.

- [ ] **Step 2: Bump all product versions to `1.0.0-rc.2`**

Update root/package manifests, Cargo/Tauri versions, lockfiles, CLI version output, and changelog. Do not move or overwrite the `v1.0.0-rc.1` tag.

- [ ] **Step 3: Run frozen install and full validation**

Run: `pnpm install --frozen-lockfile && pnpm typecheck && pnpm test && pnpm test:security && pnpm lint && pnpm build`
Expected: all commands exit 0; security tests include provider/privacy suites.

- [ ] **Step 4: Commit rc.2 preparation**

```bash
git add README.md CHANGELOG.md docs package.json apps/*/package.json apps/client/src-tauri pnpm-lock.yaml
git commit -m "release: prepare v1.0.0-rc.2"
```

### Task 9: Update the public website and docs

**Files:**
- Create: `gh0st-website/src/app/docs/providers/page.tsx`
- Create: `gh0st-website/src/app/docs/models/page.tsx`
- Create: `gh0st-website/src/app/docs/privacy-gate/page.tsx`
- Create: `gh0st-website/src/components/sections/ProviderExplorer.tsx`
- Create: `gh0st-website/src/components/sections/PrivacyGateDemo.tsx`
- Modify: `gh0st-website/src/app/layout.tsx`
- Modify: `gh0st-website/src/app/page.tsx`
- Modify: `gh0st-website/src/app/security/page.tsx`
- Modify: `gh0st-website/src/app/privacy/page.tsx`
- Modify: `gh0st-website/src/app/faq/page.tsx`
- Modify: `gh0st-website/src/components/sections/FAQ.tsx`
- Modify: `gh0st-website/src/components/layout/Header.tsx`
- Modify: `gh0st-website/src/components/layout/Footer.tsx`
- Modify: `gh0st-website/src/app/sitemap.ts`
- Modify: `gh0st-website/src/app/download/page.tsx`
- Modify: `gh0st-website/README.md`

- [ ] **Step 1: Add provider/model/privacy-gate copy and routes**

Use explicit status language. The demo must show Space Bunny Free as `FREE · ZDR` and a separate 30-day model as `BLOCKED`; it must not imply the website itself is connected to a provider.

- [ ] **Step 2: Update metadata and links**

Change the positioning to “Private AI, regardless of provider,” add provider-neutral descriptions, link `/docs/providers`, `/docs/models`, and `/docs/privacy-gate`, and add all routes to the sitemap.

- [ ] **Step 3: Update rc.2 download links only after the release exists**

Use the actual GitHub rc.2 release URL and checksum asset. Keep DMGs on GitHub, not Vercel.

- [ ] **Step 4: Run website validation and route checks**

Run: `pnpm typecheck && pnpm lint && pnpm build`
Expected: typecheck/lint/build pass. Serve `out/` and verify new routes, blocked-model UI, links, and 404 behavior.

- [ ] **Step 5: Commit and push website changes**

```bash
git add README.md src
 git commit -m "feat: add provider privacy website"
 git push origin main
```

### Task 10: Publish rc.2, deploy safely, and run the final matrix

**Files:**
- Modify if needed: `.github/workflows/release.yml`
- Modify: `README.md` GitHub homepage/links
- Modify: `gh0st-website` homepage links only after a real URL exists

- [ ] **Step 1: Verify all release gates from a clean checkout**

Run from a clean temporary clone: `pnpm install --frozen-lockfile && pnpm typecheck && pnpm test && pnpm test:security && pnpm lint && pnpm build`.
Expected: zero failures; record exact test counts.

- [ ] **Step 2: Build and launch the macOS artifact**

Run with the required Node/Cargo PATH: `pnpm tauri:build --target aarch64-apple-darwin --bundles app,dmg`, then launch the built binary from a temporary copy, verify codesign, record DMG checksum, and run `spctl` as an informational check. Do not claim notarization.

- [ ] **Step 3: Create and push the rc.2 tag**

```bash
git tag v1.0.0-rc.2 -m "gh0st v1.0.0-rc.2"
git push origin main
git push origin v1.0.0-rc.2
```

Use the repository’s configured release workflow. If the workflow needs a correction, fix it, rerun, and do not publish until the workflow is green.

- [ ] **Step 4: Download and verify the public DMG from a clean temp directory**

Use `gh release download v1.0.0-rc.2`, run `shasum -a 256 -c SHA256SUMS.txt`, mount/install/launch, and record the public asset digest. Do not upload a DMG to Vercel.

- [ ] **Step 5: Attempt Vercel deployment factually**

Run `vercel whoami`. If authenticated, run `vercel --prod` from the website repo and record the returned URL. If not authenticated, do not claim deployment; record the exact login and deploy commands. Inspect DNS/Vercel access before any custom-domain change.

- [ ] **Step 6: Update GitHub repository homepage fields**

Only after a real production URL exists, set the app and website repository homepage URLs with `gh repo edit --homepage`. Preserve existing repositories and infrastructure.

- [ ] **Step 7: Run the final verification matrix**

Report factual statuses for xAI, Zen, Go, Space Bunny Zen, Space Bunny Go, discovery, policy refresh, allow/block/unknown/stale/fallback gates, CLI, browser, macOS, iOS, website, deployment, and rc.2. Include exact test counts and distinguish runtime verified, documented current, unverified, and blocked.

- [ ] **Step 8: Commit final verification notes and push**

```bash
git add FINAL_STATUS.md README.md CHANGELOG.md docs/RELEASE_CHECKLIST.md .github/workflows/release.yml
git commit -m "release: verify v1.0.0-rc.2"
git push origin main
```

Do not commit generated build output, credentials, local evidence, or temporary files.
