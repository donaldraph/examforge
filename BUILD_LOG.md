# Build log

Running journal at RUN-MD standard: what was built, why, and what proved it, in
real time. Newest entries at the top of each phase.

## Phase 1 — scaffold, schema, seed questions

### 2026-07-17 — engine designed to receive the real question set

- Decision up front: how a user is identified for persistence. Chose an
  anonymous device id (a UUID the browser generates and keeps in localStorage)
  over Cognito for v1. It makes the full per-user persistence loop real end to
  end with zero auth infra, and because the data model keys on that id, a real
  account system can replace it later (keyed on a Cognito subject id) without
  reshaping the data. Recorded in the README.

- Question schema (`schema/question.schema.json`, draft-07). The load-bearing
  rule is that correctness is tracked by option id, never by position, so the
  frontend is free to shuffle `options[]` on every render. `correctAnswerId`
  points at an option id and the engine compares ids, not positions. `domain` is
  free text so each of the six exams can bring its own domain taxonomy;
  `explanationIncorrect` is a separate, deliberately longer field than
  `explanationCorrect`.

- Exam registry (`data/exams.json`): the six exams with a `status` of `active`
  or `coming-soon`. GitHub Actions is the only active one; the other five carry
  empty domain lists until their banks land. The tab UI reads status from here.

- Seeded five real, hand-written GitHub Actions questions
  (`data/questions/github-actions.json`), all marked `"isSeed": true`. They span
  all four official domains (author and maintain workflows, consume workflows,
  author and maintain actions, manage GitHub Actions in the enterprise) and exist
  only to prove the engine; they are replaced by the full research-backed set
  later.

- Proved the bank against the schema with a check script: all five questions
  have required fields, ids match the convention and are unique, option ids are
  unique per question, every `correctAnswerId` is a real option, and all four
  domains are covered. All pass.

- Deliberately not built yet: the frontend quiz engine (step 2), the CDK stacks
  (step 3), and persistence (step 4). This phase only designs the schema and
  proves it can hold real content.
