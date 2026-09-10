---
"rforge": patch
---

Write the R-Machine agent routing stanza once, in `AGENTS.md`, and point `CLAUDE.md` at it.

Section A.5 of the bundled LLM Skill used to append the same stanza to **both** `CLAUDE.md` and `AGENTS.md`. It is now written only to `AGENTS.md` — the vendor-neutral file that Claude Code, Cursor, Codex and Copilot all read — while `CLAUDE.md` gets a bare `@AGENTS.md` line, which Claude Code resolves by inlining the target. One copy, wider reach, nothing to keep in sync.

Three failure modes the old wording allowed are now called out explicitly:

- **Next.js managed block.** `next dev` rewrites everything between `<!-- BEGIN:nextjs-agent-rules -->` and `<!-- END:nextjs-agent-rules -->` whenever it detects an agent, so a stanza appended inside those markers is silently lost. A.5 now says to append after the closing marker.
- **`@` imports are not resolved inside code fences or code spans**, so the line must be written bare.
- **`CLAUDE.md` symlinked to `AGENTS.md`** is one file, not two; writing both would duplicate the stanza.

Section C.5 additionally offers to collapse a duplicated `CLAUDE.md` from a project set up by an older skill version.
