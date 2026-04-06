# AI Beauty Studio Agent Rules

## Mission

Build working software with evidence, not optimism. This repository is quality-first: a task is not complete until the required verification has run and the results can be reported.

## User Interaction Rules

- Do not ask the user technical implementation questions.
- For any non-trivial task, ask the user thorough specification and direction questions before implementation.
- Ask the user only about specification, priorities, UX direction, operating policy, examples, constraints, and approval for dangerous actions.
- Present specification and direction questions in short multiple-choice format whenever practical.
- Translate technical tradeoffs into plain-language impact before asking for direction.
- Never ask the user to choose tools, libraries, frameworks, CI setup, infrastructure, or test technology.
- If the user has already delegated technical choices to the AI, treat every technical ambiguity as a local research task, not a user question.

## Spec Alignment Gate

Before starting any non-trivial implementation, complete a spec alignment pass using [docs/spec-alignment-checklist.md](C:/monetization/docs/spec-alignment-checklist.md).

- Ask enough non-technical questions to remove product ambiguity.
- Keep asking until the expected behavior, success criteria, and non-goals are explicit.
- Use plain language the user can answer quickly.
- Prefer short multiple-choice questions with 2-5 options and a recommended choice first.
- Use free-form questions only when multiple-choice would distort the intent.
- Group related questions so the user can respond efficiently.
- After the answers arrive, restate the confirmed direction before coding.
- If the task is trivial and unambiguous, you may skip the full checklist, but still avoid technical questions.

## Required Working Flow

1. Align on product direction first.
   For non-trivial work, ask the user the necessary specification and direction questions before coding, preferably in short multiple-choice form.
2. Discover truth locally.
   Read the relevant code, scripts, tests, and docs before deciding how to implement a change.
3. Confirm only product decisions.
   If an ambiguity can be resolved from the repo, resolve it locally instead of asking the user.
4. Restate the confirmed direction.
   Summarize the agreed behavior, constraints, and success criteria in plain language before implementation.
5. Implement the smallest safe change.
   Keep edits scoped, intentional, and easy to verify.
6. Run the correct verification tier.
   Use `scripts/verify-fast.ps1` for every change and before each push.
   Use `scripts/verify-full.ps1` when rehearsing runtime flows locally and a Docker-compatible runtime is available.
   GitHub Actions decides whether the diff also requires API smoke or browser E2E. Major user-facing studio flow changes must pass browser E2E before merge.
7. Report evidence.
   Every completion report must list the commands run, what passed, and anything still blocked.

## Non-Negotiables

- Never say something "should work" when it has not been checked.
- Never hide a failing test, broken build, missing dependency, or skipped verification.
- Never claim completion without evidence.
- Never start major user-facing work on an underspecified request without first clarifying the product direction.
- Never leave TODO/FIXME/WIP markers, conflict markers, or `@ts-ignore` / `@ts-expect-error` in guarded repo paths.
- Never let verification commands silently rewrite tracked files.

## Dangerous Actions

The following require explicit user approval every time:

- external publication or posting
- deleting user or application data
- money, billing, contract, or subscription actions
- destructive git history edits

If approval is missing, stop and ask.

## Branching And Delivery

- Do not develop directly on `main` except for an explicit snapshot or rescue commit requested by the user.
- Normal work starts from the latest `main` on a feature branch.
- Push feature branches and use PR-ready changes with passing local checks plus the required GitHub Actions tier.

## Definition Of Done

A task is done only when all of the following are true:

- code and required docs are updated together
- the required local verification passed
- the required GitHub Actions tier passed before merge or release
- tracked files were not mutated by verification
- risks, gaps, or blocked checks are explicitly reported

If any item is missing, treat the task as unfinished.
