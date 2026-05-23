> # 🚧🚧🚧 BRANCH UNDER HEAVY RESTRUCTURING — DO NOT USE 🚧🚧🚧
>
> **This branch (`RM-alpha-12`) is currently undergoing major restructuring.**
> The code here is unstable, incomplete, and **must not be used** for any purpose.
> Please refer to the `main` branch instead.

---

<img src="r-machine.logo.svg" width="158px" align="center" alt="R-Machine logo" />

# R-Machine — Uniformity Under Change for TypeScript

Monorepo containing the R-Machine packages.

[![NPM Version](https://img.shields.io/npm/v/r-machine?label=latest)](https://www.npmjs.com/package/r-machine)
[![R-Machine CI status](https://github.com/codecarvings/r-machine/actions/workflows/ci.yml/badge.svg?event=push&branch=main)](https://github.com/codecarvings/r-machine/actions/workflows/ci.yml?query=branch%3Amain)

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`r-machine`](./packages/r-machine) | [![npm](https://img.shields.io/npm/v/r-machine)](https://www.npmjs.com/package/r-machine) | Core library |
| [`@r-machine/react`](./packages/r-machine-react) | [![npm](https://img.shields.io/npm/v/@r-machine/react)](https://www.npmjs.com/package/@r-machine/react) | React integration |
| [`@r-machine/next`](./packages/r-machine-next) | [![npm](https://img.shields.io/npm/v/@r-machine/next)](https://www.npmjs.com/package/@r-machine/next) | Next.js App Router integration |
| [`@r-machine/testing`](./packages/r-machine-testing) | [![npm](https://img.shields.io/npm/v/@r-machine/testing)](https://www.npmjs.com/package/@r-machine/testing) | Testing utilities |
| [`rmac`](./packages/r-machine-cli) | [![npm](https://img.shields.io/npm/v/@rmac)](https://www.npmjs.com/package/rmac) | Command-line interface for R-Machine |

## Examples

The [`examples/`](./examples) directory contains working applications:

| Example | Description |
|---------|-------------|
| [`react`](./examples/react) | React + Vite with client-side locale detection |
| [`next-with-app-path-strategy`](./examples/next-with-app-path-strategy) | Next.js App Router with path segment routing |
| [`next-with-app-path-strategy-no-proxy`](./examples/next-with-app-path-strategy-no-proxy) | Path strategy without proxy |
| [`next-with-app-origin-strategy`](./examples/next-with-app-origin-strategy) | Next.js App Router with origin-based routing |
| [`next-with-app-flat-strategy`](./examples/next-with-app-flat-strategy) | Next.js App Router with cookie-based locale detection |

## Monorepo Structure

```
r-machine/
├── packages/
│   ├── r-machine/           # Core library
│   ├── r-machine-react/     # React bindings
│   ├── r-machine-next/      # Next.js integration
│   ├── r-machine-testing/   # Testing utilities
│   └── rmac/                # Command-line interface for R-Machine
├── examples/                # Example applications
├── configs/                 # Shared TypeScript configs
└── scripts/                 # Utility scripts
```

## Development

This project uses **pnpm** as the package manager.

```bash
# Install dependencies
pnpm install

# Development mode
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Format and lint
pnpm check
```

## License

| Package | License |
|---|---|
| `r-machine` | [AGPL-3.0](./LICENSE) |
| `@r-machine/react` | [AGPL-3.0](./LICENSE) |
| `@r-machine/next` | [AGPL-3.0](./LICENSE) |
| `@r-machine/testing` | [AGPL-3.0](./LICENSE) |
| `rmac` | [AGPL-3.0](./LICENSE) |

> All packages are free for open source projects.
> If you need to use them in a proprietary project, reach out at 
> licensing@codecarvings.com to discuss a commercial arrangement.
