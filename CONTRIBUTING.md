# Contributing

Contributions are welcome. This repo is a practical reference, not an academic survey — pull requests that add real-world utility are preferred over comprehensive coverage.

---

## How to Contribute

### Fork and branch

```bash
git clone https://github.com/Technyder-Inc/sdlc-vibe-coding-skills.git
cd sdlc-vibe-coding-skills
git checkout -b your-branch-name
```

Branch naming:
- `add/topic-name` — new content
- `update/topic-name` — updating existing content
- `fix/topic-name` — correcting errors

### Make your changes

Follow the content guidelines below.

### Open a pull request

- Title: brief description of what was added or changed
- Body: explain what the contribution adds and why it is useful
- Link to source material if the content is based on external research

---

## Content Guidelines

### Cite sources

If content is based on a specific paper, whitepaper, study, or benchmark, cite it. Include:
- Author(s)
- Title
- Year
- Link if publicly available

This repo draws primarily from Google's "The New SDLC With Vibe Coding" (Addy Osmani, Shubham Saboo, Sokratis Kartakis, 2026). New contributions should cite equivalent-quality sources for any empirical claims.

### No stubs

Every file must have complete, usable content. A file with placeholder text ("TODO: fill this in") does not belong in the main branch. Write the content before opening the PR.

### Practical first

The audience for this repo is working developers and tech leads. Content should be directly applicable. Avoid theoretical content that does not lead to actionable guidance.

Preferred format for guides:
- What this is / why it matters
- Practical instructions or patterns
- Examples
- Common mistakes to avoid

### Keep it current

Content that references specific tool versions, API structures, or model behaviors has a shelf life. When contributing version-specific content, note the version explicitly so future maintainers know when it may need updating.

### No marketing language

Describe tools and approaches as they actually work, including limitations and failure modes. Content that reads as promotional copy for specific AI vendors or tools will not be merged.

---

## Credit

Contributors are credited in the commit history. If you would like to be credited in the file itself for a significant contribution, include a line at the bottom of the file:

```
*Contributed by [your name or GitHub handle]*
```

---

## Questions

Open an issue for questions about scope, content standards, or whether a contribution fits this repo before investing in a large PR.
