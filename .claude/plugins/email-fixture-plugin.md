---
name: email-fixture-plugin
description: |
  Generates and validates fixture payloads for email provider adapters.
  Ensures test fixtures match real provider API response shapes.
type: testing
trigger: manual
---

# email-fixture-plugin

## Purpose

Maintain realistic test fixtures for each email provider adapter. Fixtures
are the foundation of normalization tests — if they don't match real API
responses, the tests prove nothing.

## Fixture locations

```
tests/fixtures/
  gmail/
    message-simple.json       # Basic email, no attachments
    message-with-attachment.json  # Email with PDF attachment
    message-thread.json       # Part of a thread (has threadId)
    message-labels.json       # Email with multiple labels
  office365/
    message-simple.json       # Basic Graph API response
    message-with-attachment.json
    message-conversation.json # Part of a conversation
    message-categories.json   # Email with categories
  imap/
    message-simple.eml        # Raw RFC 5322 message
    message-with-attachment.eml
    message-thread.eml        # Has In-Reply-To and References
    message-multipart.eml     # Multipart MIME
  attachments/
    sample.pdf                # Small PDF for extraction tests
    sample.txt                # Plain text file
    sample.docx               # DOCX for extraction tests
```

## Fixture validation rules

Each fixture must:
1. Be a real (anonymized) response from the provider API, not hand-crafted.
2. Include all fields that the normalizer reads.
3. Have a corresponding `.expected.json` with the expected `NormalizedMessage`.
4. Be small (< 50KB) to keep tests fast.

## How to generate fixtures

```bash
# Gmail: Use the API Explorer to get a real message, anonymize it
# Office 365: Use Graph Explorer to get a real message, anonymize it
# IMAP: Save a real .eml file from a test mailbox, anonymize it
```

## Anonymization rules

- Replace real email addresses with `test@example.com` variants.
- Replace real names with generic names (Alice, Bob, etc.).
- Replace real subjects with descriptive test subjects.
- Keep the structure and field types intact.
- Keep attachment metadata but replace content with small test files.

## Usage

```bash
# Validate all fixtures have matching .expected.json
npx tsx scripts/validate-fixtures.ts

# Generate a new fixture from a live API response
npx tsx scripts/generate-fixture.ts gmail <message-id>
```

## Integration

- `email-provider-agent` uses fixtures for normalization tests.
- `testing-agent` validates fixture completeness.
- `email-provider-adapter` skill references fixture structure.
- Each adapter's `normalize.test.ts` imports from `tests/fixtures/<provider>/`.
