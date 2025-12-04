# @r-machine/react

## 1.0.0-alpha.6

### Patch Changes

- 5288e2c: Change createReactStandardToolset function to return a promise;
  Remove exportation of type ReactStandardRMachine;
  Remove validation of suspense prop provided to the ReactRMachine component created by createReactStandardToolset;
  Remove fallback and Suspense props from the ReactRMachine type returned by createReactToolset.
- Updated dependencies [5288e2c]
  - r-machine@1.0.0-alpha.6

## 1.0.0-alpha.5

### Patch Changes

- 99e56a5: Add ReactStandardImpl;
  Add fallback and Suspense props to ReactStandardRMachine;
  Add DelayedSuspense.create method;
  Change ReactStandardImplProvider to accept an implFactory instead of an Impl object;
  Change ReactStandardImpl to use the new impl factory logic without bins;
  Change ReactStrategy.createToolset return type (Promise<>).
- Updated dependencies [99e56a5]
  - r-machine@1.0.0-alpha.5

## 1.0.0-alpha.4

### Patch Changes

- 315569e: Added @r-machine/react/utils export path.
  Added DelayedSuspense component.
  Added localeDetector and localeStore to ReactStandardStrategyConfig.
  Added ReactStandardImplProvider class.
  Removed "impl" from ReactStandardStrategyConfig.
- Updated dependencies [315569e]
- Updated dependencies [315569e]
  - r-machine@1.0.0-alpha.4

## 1.0.0-alpha.3

### Patch Changes

- 67952cd: Remove currentLocale from information provided by $ argument in ReactStrategyImpl.writeLocale function
- Updated dependencies [67952cd]
  - r-machine@1.0.0-alpha.3

## 1.0.0-alpha.2

### Patch Changes

- 7ffa541: Add changeset
- Updated dependencies [7ffa541]
  - r-machine@1.0.0-alpha.2

## 1.0.0-alpha.1

### Patch Changes

- b57d000: Initial release
