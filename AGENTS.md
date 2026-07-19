# Repository Instructions for Coding Agents

## Mission

This repository defines reusable engineering standards. Treat a product as incomplete until it can be demonstrated with reproducible video evidence and a factual case study.

## Product demo rule

For every product repository or meaningful product release:

1. Add or update `demo/demo.json`.
2. Build the source composition with Remotion, HyperFrames, native screen capture, or a documented hybrid.
3. Pass the source render through FFmpeg normalization and QC.
4. Maintain `demo/case-study.md` using real workflows and evidence only.
5. Produce a reviewable master MP4, thumbnail, and QC JSON.
6. Do not expose client names, credentials, email addresses, account identifiers, or production data without explicit approval.

## Codex workflow

- Prefer the repository skill at `.agents/skills/product-demo-video/SKILL.md` when present.
- Read the nearest `AGENTS.md` before editing.
- Use existing package managers and lockfiles; do not replace them casually.
- Keep render commands deterministic and non-interactive.
- Run the repository's normal tests before the demo release gate.
- Run `npm run demo:doctor`, `npm run demo:validate`, and `npm run demo:release` when those scripts exist.
- Never fabricate metrics, testimonials, customer outcomes, screenshots, or feature behavior.
- When evidence is unavailable, state the limitation in the case study instead of inventing a result.

## Changes to this repository

When modifying the demo engine scaffold:

- Keep Node.js scripts cross-platform for Windows, macOS, and Linux.
- Keep FFmpeg and ffprobe as explicit prerequisites.
- Pin example video-engine versions in templates.
- Avoid activating project hooks automatically in unrelated repositories.
- Document any command whose behavior depends on a third-party CLI.
