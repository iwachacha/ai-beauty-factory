# Spec Alignment Checklist

Use this checklist before starting any non-trivial implementation. Ask in plain language and avoid technical jargon.

## Mandatory Topics

1. Goal
   What outcome does the user want?
2. Visible behavior
   What should change on screen, in workflow, or in output?
3. Success criteria
   What would make the user say "this is correct"?
4. Non-goals
   What should stay unchanged?
5. Scope boundary
   What is included now, and what is explicitly out of scope?
6. Priority
   What matters most right now: speed, accuracy, UX polish, safety, maintainability, or something else?
7. User or operator
   Who is the main person using the change?
8. Risk boundary
   Is there anything sensitive, dangerous, or irreversible that must be avoided?

## Optional Topics When Relevant

1. Content or tone direction
   Brand feel, writing style, mood, or visual direction
2. Operational policy
   Manual review rules, approval rules, publish policy, rollback expectations
3. Examples
   Good example, bad example, or concrete use case
4. Delivery slice
   First version versus later improvements

## Rules

- Do not ask technical implementation questions.
- Do not ask the user to choose tools, frameworks, libraries, CI settings, infrastructure, or test technology.
- If a technical ambiguity can be solved by reading the repo or researching locally, solve it locally.
- If a product ambiguity remains, ask until the expected behavior is clear.
- Before implementation, summarize the confirmed direction back to the user in plain language.
