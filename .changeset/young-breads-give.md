---
"@r-machine/next": patch
---

- Added checks to ensure that server elements (NextServerRMachine, bindLocale, getLocale, etc..) are not used in client components. 
- Fixed NextToolsetBuilder return type.
- Fixed pathBuilder return value for implicitDefaultLocale.
- Removed AnyNextPlainStrategy and AnyNextPathStrategy types.
