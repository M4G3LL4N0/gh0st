# Privacy Policy

## Data Collection

**gh0st collects no personal data by default.**

- No analytics
- No telemetry
- No crash reporting
- No tracking pixels
- No ad SDKs
- No account required
- No hosted database

## What Stays On Your Device

All of the following are stored locally and encrypted:

- Conversations and messages
- Attachments and files
- Agents and preferences
- Encrypted continuation state
- API keys (encrypted in vault)

## What Goes to xAI

Only when you send a message:

- The message content (encrypted in transit via HTTPS)
- Optional: file content you explicitly attach
- Optional: tool results from web search, X search, code execution

**Strict mode** sends `store:false` and verifies ZDR header before sending.

## Third-Party Services

| Service | Purpose | Data Sent |
|---------|---------|-----------|
| xAI API | AI inference | Message content, attachments, tool calls |
| External MCP | User-enabled tools | Only what you explicitly send |

## Your Rights

- **Access**: All your data is in `~/.gh0st/` (encrypted)
- **Portability**: Encrypted export/import between devices
- **Deletion**: `gh0st wipe` removes all local data
- **Control**: Toggle tools, agents, privacy modes per conversation

## No Tracking

We don't know:
- Who you are
- What you chat about
- How often you use gh0st
- Which model you prefer
- Whether you use strict mode

## Changes

We may update this policy. Changes will be in the changelog. Continued use constitutes acceptance.

## Contact

Privacy questions: privacy@gh0st.dev