# Security Policy

## Supported Scope

Security reports are accepted for:

- scripts that execute local or remote commands
- dependency vulnerabilities
- unsafe handling of secrets/API keys
- file path traversal or destructive behavior risks

## Reporting a Vulnerability

Please do not open public issues for sensitive vulnerabilities.

Instead:

1. Create a private report with:
   - affected file/path
   - reproduction steps
   - impact
   - suggested fix (if known)
2. Mark severity (low/medium/high/critical)
3. Share expected disclosure timeline

## Response Expectations

- Acknowledgment target: within 3 business days
- Triage target: within 7 business days
- Fix timeline depends on severity and complexity

## Secrets

Never commit real secrets. Use environment variables:

- `GEMINI_API_KEY`
- `GOOGLE_API_KEY`
- `CANVA_CLIENT_ID`
- `CANVA_CLIENT_SECRET`
