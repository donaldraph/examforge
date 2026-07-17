# Build log

Running journal at RUN-MD standard: what was built, why, and what proved it, in
real time. Newest entries at the top of each phase.

## Phase 2 — the quiz engine, proven against the seed bank

### 2026-07-17 — core loop runs end to end in a real browser, no backend

- Built the frontend as a Vite + React + TypeScript SPA under `web/`, its own
  clean editorial identity (warm forge-ember accent, card layout), deliberately
  not terminal-styled. It runs entirely against the local seed bank; no backend
  exists yet, which is the point of this phase.

- Answer randomization. `lib/shuffle.ts` is a Fisher-Yates shuffle with an
  injectable RNG. The question card shuffles a question's options once per
  presentation (memoized on question id plus an attempt nonce), so options do not
  jump while you read, but a new attempt reshuffles them. Correctness is decided
  in `lib/quiz.ts` purely by option id, never by position.

- Provable randomness, not a claim. `shuffle.test.ts` seeds the RNG and shuffles
  a four-option question 40,000 times; the correct answer lands in each of the
  four slots within 5 percent of the uniform expectation, and a chi-square
  goodness-of-fit against uniform (3 dof) comes in under the 0.001 critical value
  of 16.27. A second test shuffles 200 distinct questions and confirms the target
  option is seen in every position. 12 unit tests pass in total.

- Explanations. Every answered question reveals an explanation inline: the
  standard `explanationCorrect` on a right answer, the longer, more detailed
  `explanationIncorrect` on a wrong one. Verified live that the wrong-answer text
  really is the longer field (correct replies 162 to 174 chars, wrong replies 520
  to 624 chars on the seed questions).

- Results. A finished attempt shows the score and percent, a per-domain
  breakdown, and the weak domains (accuracy at or below 70 percent), all computed
  client-side for now. This mirrors the persistence requirements that DynamoDB
  takes over in step 4.

- Question banks stay single-sourced. The canonical files live at repo-root
  `data/`; `scripts/sync-data.mjs` copies them into `web/public/data` before dev
  and build, so the app fetches them as static assets exactly as it will behind
  CloudFront. The synced copy is gitignored.

- Proof. Ran the built site under `vite preview` and drove it in headless Chrome:
  loaded the bank, answered all five questions, reached the results screen at the
  expected score with all four domains shown, and reloaded twelve times to
  confirm the correct answer for question one appeared in all four positions.
  Also cleared `npm audit` to zero by moving to current vite, vitest, and
  TypeScript majors; the build (`tsc -b && vite build`) is clean.

- Not built yet: the six-exam tab switcher (step 5), and any persistence, which
  is still client-side and resets on reload until step 4.

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
