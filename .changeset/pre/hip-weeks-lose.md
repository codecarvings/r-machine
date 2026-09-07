---
"@r-machine/react": patch
---

Add ReactStandardImpl;
Add fallback and Suspense props to ReactStandardRMachine;
Add DelayedSuspense.create method;
Change ReactStandardImplProvider to accept an implFactory instead of an Impl object;
Change ReactStandardImpl to use the new impl factory logic without bins;
Change ReactStrategy.createToolset return type (Promise<>).
