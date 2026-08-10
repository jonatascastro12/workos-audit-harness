# Security

WorkOS takes the security of this project seriously.

## Reporting a vulnerability

Please report suspected vulnerabilities privately to
[security@workos.com](mailto:security@workos.com). Do not open a public GitHub
issue for security reports.

Include as much detail as you can: the affected package, a proof of concept or
reproduction steps, and the impact you believe it has. We will acknowledge
your report and keep you informed of the fix's progress.

## Scope notes

- The ingestion proxy's security model is documented in
  [packages/proxy/README.md](packages/proxy/README.md) — read the trust model
  section before reporting expected behavior (e.g. event content being
  client-asserted is a documented property, not a vulnerability).
- Never include real API keys, device certificates, or captured audit events
  containing production data in a report.
