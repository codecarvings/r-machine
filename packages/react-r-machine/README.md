# react-r-machine

React bindings for R-Machine i18n library.

## Installation

```bash
pnpm add react-r-machine r-machine
```

## Usage

### Setup Provider

Wrap your application with `RMachineProvider`:

```tsx
import { RMachine } from "r-machine";
import { RMachineProvider } from "react-r-machine";

const rMachine = new RMachine(config);

function App() {
  return (
    <RMachineProvider rMachine={rMachine} locale="en">
      <YourApp />
    </RMachineProvider>
  );
}
```

### Use Translations

#### Single Namespace - `useR`

```tsx
import { useR } from "react-r-machine";

function MyComponent() {
  const t = useR("common");

  return <h1>{t.welcome}</h1>;
}
```

#### Multiple Namespaces - `useRKit`

```tsx
import { useRKit } from "react-r-machine";

function MyComponent() {
  const [common, auth] = useRKit("common", "auth");

  return (
    <div>
      <h1>{common.welcome}</h1>
      <button>{auth.login}</button>
    </div>
  );
}
```

## Suspense Support

Both `useR` and `useRKit` support React Suspense for async resource resolving. Wrap your components in a Suspense boundary:

```tsx
import { Suspense } from "react";

function App() {
  return (
    <RMachineProvider rMachine={rMachine} locale="en">
      <Suspense fallback={<div>Loading translations...</div>}>
        <YourApp />
      </Suspense>
    </RMachineProvider>
  );
}
```

## API

### `RMachineProvider`

Props:

- `rMachine`: RMachine instance
- `locale`: Current locale
- `children`: React children

### `useR(namespace)`

Returns translations for a single namespace.

### `useRKit(...namespaces)`

Returns an array of translations for multiple namespaces.
