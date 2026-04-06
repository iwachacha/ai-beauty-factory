---
name: autonomous-delivery-guardrails
description: Use for AI Beauty Studio repository work that must follow strict repo-specific guardrails: ask the user thorough non-technical specification questions, discover technical truth locally, choose the required verification tier, stop on missing evidence, and require approval for external publish/delete/money actions.
---

# Autonomous Delivery Guardrails

Use this skill for product, backend, frontend, script, CI, or workflow changes in this repository.

## Core Behavior

- Ask the user thorough non-technical specification and direction questions before any non-trivial implementation.
- Ask the user only about specification, direction, priorities, UX, operating policy, examples, constraints, and approval for dangerous actions.
- Do not ask the user technical implementation questions when the answer can be discovered locally.
- Do not ask the user to choose tools, libraries, frameworks, CI setup, infrastructure, or test technology.
- Read the relevant code, tests, scripts, and docs before deciding how to implement a change.
- Do not report completion without command evidence.

## Spec Alignment

- Use `docs/spec-alignment-checklist.md` before starting any non-trivial work.
- Keep asking specification and direction questions until expected behavior, success criteria, and non-goals are clear.
- Ask in plain language the user can answer quickly.
- Group related questions so the user can reply efficiently.
- After the user answers, restate the confirmed direction before writing code.
- If the user has already delegated technical choices to the AI, treat technical ambiguity as a local research task.

## Required Verification

- Run `scripts/verify-fast.ps1` for every change and before each push.
- Run `scripts/verify-full.ps1` when you need a local rehearsal of runtime flows and a Docker-compatible runtime is available.
- Expect GitHub Actions to escalate to API smoke for runtime or CI changes and to browser E2E for major user-facing studio flow changes.
- If a required verification tier cannot run because of missing prerequisites, stop and report the missing prerequisite as a blocker. Do not silently skip it.

## Stop Conditions

Stop and ask the user before:

- external publication or posting
- deleting data
- billing, money, or contract actions
- destructive history edits

If tests fail, builds fail, or verification mutates tracked files, do not call the task complete.

## Reporting

Every completion report must include:

- what changed
- which verification commands were run
- what passed
- what remains blocked or unverified
