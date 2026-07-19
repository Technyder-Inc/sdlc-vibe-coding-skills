# Product Demo Video Engine

Every product should ship with proof, not only code. This module defines a reusable demo pipeline that converts a real product workflow into a reproducible video, supporting case study, QC evidence, and release review.

## Architecture

```text
Product release / feature change
          |
          v
  demo/demo.json contract
          |
          +--> Product capture or scripted source
          |       - HyperFrames: agent-authored HTML/CSS motion
          |       - Remotion: reusable React/TypeScript compositions
          |       - Native capture: device, browser, emulator, CLI
          |       - Hybrid: capture + coded overlays
          |
          v
   Source MP4 render
          |
          v
 FFmpeg normalize + encode
          |
          +--> master.mp4
          +--> thumbnail.png
          +--> qc.json
          |
          v
 Case-study evidence gate
          |
          v
      Release ready
```

## Why all three layers exist

- **HyperFrames** is the default for deterministic HTML scenes, website-to-video work, code diffs, motion cards, and agent-generated visual explanations.
- **Remotion** is the default when React components, data-driven sequences, reusable product UI, or composition-level TypeScript logic are central.
- **FFmpeg** is mandatory regardless of source engine. It normalizes dimensions, codec, pixel format, frame rate, audio loudness, fast-start metadata, thumbnail extraction, and machine-readable QC.

The source engine remains replaceable. The release contract stays stable.

## Outputs required for every product

```text
demo/
  demo.json             Release and render contract
  case-study.md         Problem, real workflow, evidence, result, limitations
  ...                   Engine-specific source files and approved assets
scripts/demo/
  demo-engine.mjs       Doctor, validation, render, QC, and release gate
.agents/skills/
  product-demo-video/   Codex-compatible reusable skill
.codex/
  hooks.json            Optional Codex stop-time reminder/validation hook
.github/workflows/
  demo-release.yml      Optional CI release gate

dist/demo/
  master.mp4
  thumbnail.png
  qc.json
```

## Install into a product repository

From this repository:

```bash
node 10-demo-engine/scripts/install-demo-infra.mjs /path/to/product
```

On Windows PowerShell:

```powershell
node .\10-demo-engine\scripts\install-demo-infra.mjs C:\path\to\product
```

The installer is intentionally conservative:

- It does not overwrite existing files unless `--force` is supplied.
- It appends a marked demo policy block to an existing `AGENTS.md`.
- It merges demo scripts into an existing `package.json` without replacing other scripts.
- It creates a minimal `package.json` only when the product does not have one.

## Configure the product

Edit `demo/demo.json` and replace the source render command and source output path. Examples:

### HyperFrames

```json
"source": {
  "command": "npx --yes hyperframes@0.9.2 render",
  "output": "demo/hyperframes/out.mp4"
}
```

Run the command from the product root only after confirming where the selected HyperFrames project writes its MP4. Keep the manifest path aligned with the actual result.

### Remotion

```json
"source": {
  "command": "npx --yes remotion@4.0.477 render demo/remotion/src/index.ts ProductDemo demo/source.mp4",
  "output": "demo/source.mp4"
}
```

Use the product's installed Remotion version when it already has one. Do not create duplicate Remotion dependency trees.

## Local commands

```bash
npm run demo:doctor
npm run demo:validate
npm run demo:render
npm run demo:release
```

- `demo:doctor` verifies Node.js, npm/npx, FFmpeg, ffprobe, and reports Codex availability.
- `demo:validate` checks the manifest, source command, case-study structure, and privacy declarations.
- `demo:render` runs the source renderer, normalizes the result with FFmpeg, extracts a thumbnail, and writes QC JSON.
- `demo:release` performs validation, render, and final artifact assertions.

## Codex IDE extension compatibility

The scaffold follows Codex's native repository conventions:

- Root `AGENTS.md` supplies durable repository instructions.
- `.agents/skills/product-demo-video/SKILL.md` is discoverable by Codex CLI and the IDE extension.
- `.codex/hooks.json` contains an optional project-local Stop hook.
- All operational commands are non-interactive and run from the repository root.
- Scripts are implemented in Node.js rather than Bash so they work in Windows, macOS, Linux, VS Code, Cursor, Windsurf, the Codex CLI, and Codex worktrees.

After installation, open the project root in the IDE. Restart Codex if the skill does not appear immediately. Review and trust the project hook through `/hooks` before expecting it to run.

## Case-study evidence standard

A case study is not sales copy. It is a traceable engineering record. It must include:

1. Problem
2. Real workflow
3. Implementation
4. Evidence
5. Result
6. Limitations

Never publish unsupported percentages, client value, time savings, accuracy, adoption, or ROI. Label estimates as estimates and explain how they were calculated.

## Release policy

A release is demo-ready only when:

- the product's normal tests pass;
- the source renderer exits successfully;
- FFmpeg produces a valid H.264 MP4 with `yuv420p` pixel format;
- output dimensions and frame rate match the manifest;
- duration does not exceed the declared maximum;
- the case study contains all required sections;
- privacy settings and redactions have been reviewed;
- a human has watched the final master video before publication.
