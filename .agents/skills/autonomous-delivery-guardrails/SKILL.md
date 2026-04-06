---
name: autonomous-delivery-guardrails
description: Use for AI Beauty Studio repository work that must follow strict repo-specific guardrails: ask the user only about product direction, discover technical truth locally, choose the required verification tier, stop on missing evidence, and require approval for external publish/delete/money actions.
---

# Autonomous Delivery Guardrails

Use this skill for product, backend, frontend, script, CI, or workflow changes in this repository.

## Core Behavior

- Ask the user only about specification, direction, priorities, UX, operating policy, and approval for dangerous actions.
- Do not ask the user technical implementation questions when the answer can be discovered locally.
- Read the relevant code, tests, scripts, and docs before deciding how to implement a change.
- Do not report completion without command evidence.

## Required Verification

- Run `scripts/verify-fast.ps1` for ordinary code, config, docs, test, automation, or refactor work.
- Run `scripts/verify-full.ps1` before any push, and for changes that affect user-facing flows, persistence, generation, review, publishing, auth, hooks, CI, or environment scripts.
- If verification cannot run because of missing prerequisites, stop and report the missing prerequisite as a blocker. Do not silently skip it.

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
