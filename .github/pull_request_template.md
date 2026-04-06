## Summary

- What changed?
- Why was it needed?

## Product Alignment

- What user-facing outcome was requested?
- What behavior must change?
- What must stay unchanged?
- What technical choices were intentionally left to AI judgment?

## Verification

- [ ] `powershell -ExecutionPolicy Bypass -File .\scripts\verify-fast.ps1`
- [ ] `powershell -ExecutionPolicy Bypass -File .\scripts\verify-full.ps1` when a local runtime rehearsal was needed
- [ ] GitHub Actions API smoke passed or was not required for this diff
- [ ] GitHub Actions browser E2E passed or was not required for this diff

List the commands you actually ran and the result for each one.

## Unverified Or Blocked

- What could not be verified?
- What prerequisite was missing, if any?

## Risks

- Any known regressions, follow-ups, or operator steps?
