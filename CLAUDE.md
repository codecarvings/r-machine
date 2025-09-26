# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo for R-Machine, a TypeScript library for internationalization (i18n) and localization. The main package is located at `packages/r-machine/` and serves as an i18n/translation library.

## Package Manager

This project uses **pnpm** as the package manager. The required version is specified in `package.json` as `pnpm@10.17.1`.

## Common Commands

### Development
- `pnpm dev` - Run development mode using tsx with custom conditions
- `pnpm dev:play` - Run play.ts file for quick experimentation
- `pnpm build` - Build all packages in the monorepo
- `pnpm clean` - Clean all packages

### Code Quality
- `pnpm check` - Format and fix code using Biome (auto-fixes issues)
- `pnpm check:dry` - Check code without making changes
- `pnpm check:semver` - Check semantic versioning consistency

### Testing
- `pnpm test` - Run all tests using Vitest
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:ui` - Run tests with Vitest UI

### Package-specific Commands
Navigate to `packages/r-machine/` for package-specific operations:
- `pnpm build` - Build the r-machine package using zshy
- `pnpm test` - Run tests with type checking for this package
- `pnpm test:watch` - Run tests in watch mode with type checking
- `pnpm clean` - Clean build artifacts

## Architecture

### Monorepo Structure
- **Root**: Contains workspace configuration, shared tooling, and scripts
- **`packages/r-machine/`**: Main i18n library package
- **`configs/`**: Shared TypeScript configuration
- **`scripts/`**: Utility scripts (e.g., semver checking)

### Build System
- **zshy**: Used for building packages (custom build tool)
- **TypeScript**: Strict configuration with NodeNext module resolution
- **Vitest**: Testing framework with project-based configuration for monorepo
- **Biome**: Code formatting and linting

### Development Conditions
The project uses custom export conditions:
- `@r-machine/source` condition maps to TypeScript source files during development
- Production builds use standard ESM/CJS exports

## Code Quality Tools

- **Biome**: Primary linter and formatter
- **Husky**: Git hooks for pre-commit checks
- **lint-staged**: Runs Biome on staged TypeScript/JSON files and Prettier on Markdown files
- **TypeScript**: Strict type checking with additional compiler options

## Testing Setup

Tests are configured to run across all packages using Vitest with project discovery. Each package can have its own test configuration while sharing the root Vitest config.

## Rules

### 1 — Before Coding

- **BP-1 (MUST)** Ask the user clarifying questions.
- **BP-2 (SHOULD)** Draft and confirm an approach for complex work.  
- **BP-3 (SHOULD)** If ≥ 2 approaches exist, list clear pros and cons.

### 2 — While Coding

- **C-1 (MUST)** Name functions with existing domain vocabulary for consistency.  
- **C-2 (SHOULD NOT)** Introduce classes when small testable functions suffice.  
- **C-3 (SHOULD)** Prefer simple, composable, testable functions.
- **C-4 (MUST)** Use `import type { … }` for type-only imports.
- **C-5 (SHOULD NOT)** Add comments except for critical caveats; rely on self‑explanatory code.
- **C-6 (MUST)** Must follow Biome's Linting & formatting rules

### 3 - Git

- **GH-1 (MUST**) Use Conventional Commits format when writing commit messages: https://www.conventionalcommits.org/en/v1.0.0
- **GH-2 (SHOULD NOT**) Refer to Claude or Anthropic in commit messages.
