# SDLC Vibe Coding Skills

A practical reference for the new AI-assisted software development lifecycle, based on Google's Kaggle course **"The New SDLC With Vibe Coding"** by Addy Osmani, Shubham Saboo and Sokratis Kartakis (2026). Updated to v3 with expanded coverage of agent tools, skill architecture, production deployment patterns, and loop engineering.

## What This Is

This repo is a curated collection of skills, guides, templates, and checklists for developers, tech leads, and engineering teams navigating the shift from traditional software development to AI-assisted and agentic engineering.

## The Core Spectrum

```
Vibe Coding → Structured AI-Assisted Coding → Agentic Engineering → Loop Engineering
```

The differentiator is not whether you use AI. Almost everyone does. It is how much structure, verification, and human judgment surround the output — and how much of that runs without you.

| Tier | Description | Best For |
|------|-------------|----------|
| **Vibe Coding** | Casual prompts, accept output, paste errors back | Prototypes, scripts, hackathons, throwaway code |
| **Structured AI-Assisted** | Detailed prompts with constraints, manual review of critical paths | Features inside an established codebase |
| **Agentic Engineering** | Formal specs, memory files, automated evals, CI/CD gates, LLM judges | Production systems at team scale |
| **Loop Engineering** | Autonomous loops that dispatch agents, verify output, and self-correct on a schedule | Recurring, well-defined work that runs without human prompting |

## Repo Structure

```
00-overview/              Core concepts, the spectrum, and journey guide by stage
01-context-engineering/   Context types, static vs dynamic, rule file templates
02-sdlc-phases/           AI's role in each phase of the lifecycle
03-factory-model/         Factory model, agent harness, vibe-to-production, team workflows
04-skills-by-phase/       Practical skill guides per phase (incl. LLM-as-judge evals)
05-checklists/            Security (incl. agent-specific), evaluation framework, loop checklist
06-templates/             Spec, ADR, eval, and rule file templates
07-agent-tools/           Tool definitions, MCP integration, interoperability, selection patterns
08-agent-skills/          Skill architecture, composition, built-in vs custom, testing
09-loop-engineering/      Loop engineering — six primitives, maker-checker, durable state, loop risks
```

## 6-Module Course Map

| Module | Content |
|--------|---------|
| **Module 1: The New Paradigm** | Vibe coding spectrum, context engineering, factory model, harness effect |
| **Module 2: Agent Tools** | Tool schemas, MCP protocol, cross-provider interoperability, selection patterns |
| **Module 3: Agent Skills** | Skill architecture, composition patterns, built-in vs custom, testing |
| **Module 4: Evaluation** | Eval types, LLM-as-judge, golden sets, regression detection, CI integration |
| **Module 5: Production** | Vibe-to-production hardening, team workflows, developer modes |
| **Module 6: Loop Engineering** | Six primitives, maker-checker pattern, durable state, loop risks, safe loop design |

## How to Use

- New to AI-assisted coding? Start with [00-overview/the-spectrum.md](00-overview/the-spectrum.md)
- Find your stage in the journey: [00-overview/key-concepts.md](00-overview/key-concepts.md)
- Setting up context files? Go to [01-context-engineering/](01-context-engineering/)
- Working on a specific SDLC phase? See [02-sdlc-phases/](02-sdlc-phases/)
- Building agent tools? Start at [07-agent-tools/tool-definitions.md](07-agent-tools/tool-definitions.md)
- Designing agent skills? Start at [08-agent-skills/skill-architecture.md](08-agent-skills/skill-architecture.md)
- Setting up evals? See [05-checklists/evaluation-framework.md](05-checklists/evaluation-framework.md)
- Taking vibe code to production? See [03-factory-model/vibe-to-production.md](03-factory-model/vibe-to-production.md)
- Shipping AI-generated code? Run through [05-checklists/vibe-coding-security-checklist.md](05-checklists/vibe-coding-security-checklist.md)
- Need a spec or ADR template? Grab from [06-templates/](06-templates/)
- Building a loop? Start at [09-loop-engineering/](09-loop-engineering/README.md)
- Deploying a loop to production? Run through [05-checklists/loop-engineering-checklist.md](05-checklists/loop-engineering-checklist.md)

## Source

Based on: **The New SDLC With Vibe Coding** — Google Kaggle Course, Addy Osmani, Shubham Saboo, Sokratis Kartakis, 2026. Module 6 (Loop Engineering) based on Addy Osmani's "Loop Engineering" post, addyosmani.com, June 7, 2026. v3 expansion by Technyder Inc.

## License

MIT
