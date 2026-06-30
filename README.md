# SDLC Vibe Coding Skills

A practical reference for the new AI-assisted software development lifecycle, based on Google's whitepaper **"The New SDLC With Vibe Coding"** by Addy Osmani, Shubham Saboo and Sokratis Kartakis (2026).

## What This Is

This repo is a curated collection of skills, guides, templates, and checklists for developers, tech leads, and engineering teams navigating the shift from traditional software development to AI-assisted and agentic engineering.

## The Core Spectrum

```
Vibe Coding → Structured AI-Assisted Coding → Agentic Engineering
```

The differentiator is not whether you use AI. Almost everyone does. It is how much structure, verification, and human judgment surround the output.

| Tier | Description | Best For |
|------|-------------|----------|
| **Vibe Coding** | Casual prompts, accept output, paste errors back | Prototypes, scripts, hackathons, throwaway code |
| **Structured AI-Assisted** | Detailed prompts with constraints, manual review of critical paths | Features inside an established codebase |
| **Agentic Engineering** | Formal specs, memory files, automated evals, CI/CD gates, LLM judges | Production systems at team scale |

## Repo Structure

```
00-overview/              Core concepts and the spectrum
01-context-engineering/   Context types, static vs dynamic, rule file templates
02-sdlc-phases/           AI's role in each phase of the lifecycle
03-factory-model/         The factory model, agent harness, developer modes
04-skills-by-phase/       Practical skill guides per phase
05-checklists/            Security, spec quality, agentic engineering checklists
06-templates/             Spec, ADR, eval, and rule file templates
```

## How to Use

- New to AI-assisted coding? Start with [00-overview/the-spectrum.md](00-overview/the-spectrum.md)
- Setting up context files? Go to [01-context-engineering/](01-context-engineering/)
- Working on a specific SDLC phase? See [02-sdlc-phases/](02-sdlc-phases/)
- Need a spec or ADR template? Grab from [06-templates/](06-templates/)
- Shipping AI-generated code? Run through [05-checklists/vibe-coding-security-checklist.md](05-checklists/vibe-coding-security-checklist.md)

## Source

Based on: **The New SDLC With Vibe Coding** — Addy Osmani, Shubham Saboo, Sokratis Kartakis, Google, 2026.

## License

MIT
