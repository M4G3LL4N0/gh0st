# macOS Signing and Notarization

The current public release uses Tauri ad-hoc signing with the identity `-`. It is not Developer ID signed and is not notarized.

## Current release behavior

- macOS Apple Silicon builds are produced for `aarch64-apple-darwin`.
- The app bundle and DMG may trigger a Gatekeeper warning on first launch.
- If macOS blocks the app, use System Settings → Privacy & Security → Open Anyway after verifying the release checksum.
- Do not disable Gatekeeper globally.
- Do not use broad quarantine-removal commands as the default installation method.

## Future Developer ID release

A future frictionless release requires an Apple Developer Program account and these signing materials:

- Developer ID Application certificate
- Developer ID Installer certificate for the installer workflow
- Apple team ID
- Apple app/API credentials for notarization
- Certificate password or a securely managed CI signing mechanism

The exact secret names and credential flow must be finalized before adding a notarization job. Do not place certificates, passwords, private keys, or provisioning profiles in this repository.

## Suggested GitHub Actions secret categories

These are categories for a future workflow, not values to create now:

- `MACOS_CERTIFICATE_P12`
- `MACOS_CERTIFICATE_PASSWORD`
- `MACOS_SIGNING_IDENTITY`
- `APPLE_ID`
- `APPLE_APP_SPECIFIC_PASSWORD`
- `APPLE_TEAM_ID`

Use GitHub environment protection and least-privilege permissions when this workflow is implemented. The release workflow currently needs only `contents: write` for publishing release assets.

## Verification before enabling notarization

1. Build on a clean macOS runner.
2. Sign the app with the configured Developer ID identity.
3. Submit the signed artifact to Apple notarization.
4. Staple the notarization ticket.
5. Verify with `codesign`, `spctl`, and `xcrun stapler validate`.
6. Download the published artifact again and repeat the checks before changing the public status.

## Updater signing

Tauri updater artifacts require a separate updater signing identity. No updater private key is present in this repository, and auto-update remains disabled until signed updater artifacts are generated and the public key is configured.
