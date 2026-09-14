# Lightbringer Constitutional Baseline — Pre-Frontier Model

**Experiment ID:** LB-EXP-001  
**Status:** Experiment harness prepared; no public result has yet been generated.  
**Company:** Aetomic LLC (Singapore)

## Purpose

This experiment records how the current Lightbringer reasoning architecture responds to a constitutional question **before integration with a frontier reasoning model**.

The objective is not to produce polished marketing copy. It is to preserve a reproducible, inspectable baseline of what the system actually concludes under a fixed set of source doctrines and a structured deliberation process.

The central question is:

> What principles should govern the participation of artificial intelligence in consequential real-world operations?

## Integrity Rules

1. The question presented to the system is fixed in `input.md`.
2. The governing source material is fixed in `doctrine.md`.
3. The final Markdown is written directly by the experiment runner.
4. The generated raw output is not manually edited.
5. Each run is stored in a new immutable run directory.
6. The runner records the model/provider configuration, input hashes, intermediate deliberation outputs, final output hash, and timestamps.
7. Human commentary, if any, must be published separately from the raw system output.
8. Future post-frontier runs should reuse the same input and doctrine wherever practicable so changes can be compared meaningfully.

## Deliberation Flow

The experiment uses four stages:

1. **Proposition** — derive candidate principles from the question and supplied doctrine.
2. **Adversarial Challenge** — attempt to invalidate, qualify, or expose weaknesses in those propositions.
3. **Assurance** — test the proposition/challenge set against operational governance constraints.
4. **Reconciliation** — produce the final constitutional position, including unresolved tensions where they remain.

The final reconciliation is emitted directly as Markdown and stored as `raw-output.md` inside the run directory.

## Files

- `input.md` — fixed constitutional question.
- `doctrine.md` — source doctrine supplied to the system.
- `run.mjs` — experiment runner.
- `.env.example` — local configuration template; never commit credentials.
- `runs/` — generated run records. Each execution creates a new directory.

A generated run contains:

- `raw-output.md` — verbatim final system output.
- `deliberation-record.json` — proposition, challenge, assurance, reconciliation metadata and intermediate outputs.
- `manifest.json` — timestamps, configuration identifiers and cryptographic hashes.

## Running the Experiment

Requires Node.js 20+.

Copy `.env.example` to `.env` locally or export the variables through your shell/CI environment. Do **not** commit `.env` or API credentials.

```bash
node research/lightbringer-constitutional-baseline/run.mjs
```

The runner deliberately refuses to overwrite an existing run directory.

## Publication Principle

Aetomic should not describe any result as an independently authored Lightbringer manifesto merely because a language model generated prose. The evidential value of this experiment comes from preserving the full process: source material, staged deliberation, model configuration and untouched final output.

A future human review may accept, reject, criticise or annotate the result. Such review must remain separate from the raw artifact.

---

© 2026 Aetomic LLC (Singapore).