---
"rforge": patch
---

Install the R-Machine Skill into both `.claude/skills` and `.agents/skills`, and make re-runs version-aware.

`rforge skill` now seeds both Claude Code's `.claude/skills` and the vendor-neutral `.agents/skills` on a first install, so the Skill is picked up regardless of which agent tool runs. Re-runs no longer refuse with a blunt "already exists": each installed Skill carries a `.rforge-skill.json` manifest whose content hash is compared against the bundled Skill, so a re-run reports **up to date** (nothing written) or offers an **update** when the bundled Skill actually changed.

### Changed

- On a fresh install (no `--out`), copy the Skill into every location in `DEFAULT_TARGETS` (`.claude/skills` + `.agents/skills`). When the Skill is already present in some of those locations, update **only** the ones already present — a location the user removed is never resurrected. `--out <dir>` still targets exactly one directory, bypassing the multi-target policy.
- Stamp each installed Skill with a `.rforge-skill.json` manifest (`skill`, `rforgeVersion`, `sourceHash`, `installedAt`). A re-run classifies each target as `absent` / `current` / `stale` from its recorded `sourceHash`: all current → up-to-date (no write); an available update → interactive confirm (default yes) in a TTY, or exit 1 with a `--force` hint when non-interactive. `--force` refreshes every resolved target unconditionally.
