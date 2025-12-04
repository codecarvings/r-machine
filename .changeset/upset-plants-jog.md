---
"@r-machine/react": patch
---

Change createReactStandardToolset function to return a promise;
Remove exportation of type ReactStandardRMachine;
Remove validation of suspense prop provided to the ReactRMachine component created by createReactStandardToolset;
Remove fallback and Suspense props from the ReactRMachine type returned by createReactToolset.
