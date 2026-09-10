# Security Policy

## Supported versions

R-Machine is pre-1.0. Only the most recently published version receives security
fixes; there are no long-term support branches yet. Once 1.0 ships, this section
will state a real support window.

## Reporting a vulnerability

**Please do not open a public issue, pull request or discussion for a security
problem.**

Report it privately, either way:

- [Open a private security advisory](https://github.com/codecarvings/r-machine/security/advisories/new)
  on GitHub — preferred, as it keeps the report, the discussion and the eventual
  advisory in one place.
- Or write to <hello@codecarvings.com> with `SECURITY` in the subject.

Please include the affected package and version, what an attacker can achieve,
and a minimal reproduction if you have one.

## What to expect

R-Machine is maintained by one person, so response times are best-effort rather
than contractual:

- **Acknowledgement** within 5 working days.
- **An assessment** — whether it is a vulnerability, and how serious — within 15
  working days.
- **A fix**, released and disclosed, as fast as the severity warrants.

You will be credited in the advisory unless you ask not to be. Please give a fix
a reasonable chance to ship before disclosing publicly.

## Scope

In scope: anything that lets untrusted input cross a boundary R-Machine is meant
to enforce. The one worth naming, because it is specific to this library, is
**server-only code or data reaching the client bundle** — the `prv/` resource
folder, fenced with `import "server-only"`, and the server toolset. If you find a
way to make either reach a browser, that is a security bug: report it here.

Out of scope: vulnerabilities in `examples/`, which are demonstrations rather
than deployable applications, and in the repository's own tooling.
