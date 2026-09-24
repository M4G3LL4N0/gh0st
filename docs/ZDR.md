# Zero Data Retention (ZDR) Verification

## Overview

gh0st implements **verified** ZDR, not just requested ZDR. We distinguish between:
- **Requested**: `store:false` sent to xAI
- **Verified**: `x-zero-data-retention: true` header received

Never shows "ZDR VERIFIED" without actual header confirmation.

## Implementation

### Privacy Preflight

Before sending sensitive content in strict mode:

```typescript
async function verifyZDR(apiKey: string, baseUrl: string): Promise<ZDRResult> {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-Store": "false"
    },
    body: JSON.stringify({
      model: "grok-3",
      messages: [{ role: "user", content: "ZDR test" }],
      max_tokens: 1,
      store: false
    })
  });

  const headerValue = response.headers.get("x-zero-data-retention");
  const verified = headerValue === "true";

  return {
    verified,
    headerValue: headerValue || undefined,
    timestamp: Date.now(),
    error: verified ? undefined : `ZDR header: ${headerValue || "missing"}`
  };
}
```

### Strict Mode Enforcement

```typescript
async function sendWithZDR(options: ChatOptions) {
  if (options.store === false && !isZDRVerified()) {
    const verification = await verifyZDR();
    if (!verification.verified) {
      throw new Error("ZDR verification failed. Cannot send with store=false.");
    }
  }
  // Proceed with request...
}
```

### Verification Caching

- Cache verified state for **30 minutes** (conservative)
- Re-validate after:
  - Authentication changes
  - Account/config changes
  - Network changes
  - Manual re-verification

### Privacy Status Object

```typescript
interface PrivacyStatus {
  requestedStore: boolean;           // What we asked for
  zdrVerified: boolean;              // What we confirmed
  zdrVerifiedAt: number | null;      // Timestamp
  zdrHeaderValue: string | null;     // Raw header
  localVaultLocked: boolean;         // Vault state
  telemetryEnabled: boolean;         // Telemetry
  activeMcpDestinations: string[];   // External MCP
  remoteToolsEnabled: boolean;       // Web/X/Code/MCP
  runtimeMode: "browser" | "native" | "cli";
}
```

## User Experience

### ZDR Verified ✅
```
🟢 ZDR VERIFIED (verified 2 min ago)
   Header: x-zero-data-retention: true
   Strict mode active
```

### ZDR Not Verified ⚠️
```
🟡 ZDR NOT VERIFIED
   Header: missing / false / error
   Strict mode blocked
   [Verify Now] [Disable Strict Mode]
```

### Verification Failed ❌
```
🔴 ZDR VERIFICATION FAILED
   Error: x-zero-data-retention: false
   Your xAI account may not have ZDR enabled.
   Contact xAI support or disable strict mode.
```

## CLI Verification

```bash
$ gh0st zdr
🔍 Running ZDR preflight check...
✅ ZDR VERIFIED
   Header: x-zero-data-retention: true
   Verified at: 2024-01-15T10:30:00Z
```

## Edge Cases

### Network Failure During Verification
- Treat as unverified
- Block strict mode
- Show retry option

### Header Present But `false`
- Explicitly not ZDR
- Block strict mode
- Show account upgrade guidance

### Header Missing
- Ambiguous (proxy? old API version?)
- Block strict mode
- Show troubleshooting

### Verification Expired
- Silent re-verify on next sensitive request
- Or manual refresh

## Testing

### Unit Tests
```typescript
// Mock successful ZDR
mockFetch.mockResolvedValue({
  ok: true,
  headers: { get: () => "true" }
});
expect(await verifyZDR()).toEqual({ verified: true, ... });

// Mock failed ZDR
mockFetch.mockResolvedValue({
  ok: true,
  headers: { get: () => "false" }
});
expect(await verifyZDR()).toEqual({ verified: false, ... });

// Mock missing header
mockFetch.mockResolvedValue({
  ok: true,
  headers: { get: () => null }
});
expect(await verifyZDR()).toEqual({ verified: false, ... });
```

### Integration Tests
- Real xAI API key with ZDR enabled → verified
- Real xAI API key without ZDR → not verified
- Network timeout → error handling

## Security Considerations

1. **Preflight is harmless**: Uses minimal tokens, non-sensitive prompt
2. **No credential leakage**: Only sends test message
3. **Cache invalidation**: Conservative 30-min TTL
4. **Explicit user control**: Can disable strict mode knowingly
5. **No silent downgrade**: Blocks rather than degrades

## Compliance

- Aligns with xAI ZDR documentation
- Supports enterprise ZDR requirements
- Audit trail via verification timestamps
- Export includes ZDR status history