# Build log

Running journal at RUN-MD standard: what was built, why, and what proved it, in
real time. Newest entries at the top of each phase.

## Question banks — expansion to 655

### 2026-07-19 — another 50 questions per exam, domain-grouped

- Added 50 more questions to every exam, keeping each spread across its domains
  by blueprint weight: GitHub Actions 105, GitHub Advanced Security 110, AWS AI
  Practitioner 110, AWS Cloud Practitioner 105, AWS Solutions Architect
  Associate 105, Terraform Associate 120. That is 300 new questions, 655 total.

- Every batch was appended, run through the committed validator
  (`scripts/validate-banks.mjs`: schema, id and option-id patterns, id
  uniqueness, correctAnswerId resolves, each domain declared and fully covered,
  exam id matches file and enum, wrong-answer text strictly longer), and
  committed on its own so each commit is one exam-domain slice. All 655 pass.

- Content is hand-written to the same shape as before: real certification
  concepts, four options, correctness tracked by option id, a short teaching
  note on the correct answer and a longer one walking through why each distractor
  is wrong. 18 frontend unit tests still green, clean build.

## Timed exam mode

### 2026-07-19 — a real-exam clock that auto-submits

- Added a Practice/Timed toggle. Practice is the existing behaviour: each answer
  reveals correctness and its explanation as you go. Timed runs a single
  countdown for the whole session, sized to the exam's per-question pace times
  the number of questions, and it does not reveal answers until you submit, so
  you can change or skip answers like the real exam. At zero it auto-submits.

- The pace comes from a new `secondsPerQuestion` per exam in the registry, set
  to each certification's real allowance (GitHub Actions 100s, GHAS 92s, AI
  Practitioner and Cloud Practitioner 83s, Solutions Architect 120s, Terraform
  63s), so a timed session is at least as tight as the real thing. The field is
  data, so tightening the clock later is a registry edit, not a code change.

- The countdown runs off a wall-clock deadline, so moving between questions never
  adds or loses time, and it turns red and pulses under a minute. The timer math
  (`lib/timer.ts`) is pure and unit tested.

- Proof: 6 new unit tests for the session-duration and clock formatting (18
  frontend tests total), a clean build, and a headless-Chrome drive of the real
  built site: practice shows no timer; switching to Timed shows a countdown sized
  to the bank; answering in timed mode does not reveal correctness; the clock
  counts down and, at zero, auto-submits to the results screen; restart returns
  to a fresh question one. 12 browser checks pass.

## Content — question banks

### 2026-07-19 — every exam to 55-70 (five more per domain)

- Grew every exam by five more questions per domain on top of the first 35,
  again researching each blueprint first and keeping every question distinct from
  the existing set. New per-exam totals: GitHub Actions 55, GitHub Advanced
  Security 60, AWS AI Practitioner 60, AWS Cloud Practitioner 55, AWS Solutions
  Architect Associate 55, Terraform Associate 70. 355 questions in all.

- Same shape and the same committed validator gate as before, run after every
  domain batch, so all 355 pass the schema, id, domain-coverage, and
  longer-wrong-answer checks. Committed in domain-grouped batches.

### 2026-07-19 — every exam to 35 web-grounded questions

- Researched each exam's official blueprint on the web before writing (GH-200,
  GH-500, AIF-C01, CLF-C02, SAA-C03, Terraform Associate 003) and used the real
  domain taxonomies and their weightings to decide how many questions each
  domain gets. Two registries were corrected to match the official exams:
  GitHub Advanced Security moved to the GH-500 domains (features, secret
  scanning, Dependabot and dependency review, code scanning with CodeQL, best
  practices and remediation), and Terraform moved to objective-based domains
  (IaC concepts and purpose, basics, core workflow, state, modules,
  configuration and functions, HCP Terraform). Existing seeds were remapped, not
  discarded.

- Brought all six banks from 5 to 35 questions each (210 total), spread across
  every domain roughly in proportion to its exam weight, so the heavier domains
  (for example SAA secure architectures, AIF applications of foundation models,
  GHAS Dependabot) carry more questions. Each new question follows the same
  shape: a scenario stem, four options keyed by id, a short confirming
  explanation, and a longer teaching explanation on the wrong answer. Committed
  in domain-grouped batches so the history reads as real, reviewable work.

- Added a committed validator, `scripts/validate-banks.mjs`, run after every
  batch. It enforces the schema (required fields, id and option-id patterns),
  id uniqueness within a bank, that every correctAnswerId resolves to a real
  option, that each question's domain is one the registry declares for its exam
  and that every declared domain is covered by at least one question, that the
  exam id matches both the file and the schema enum, and that the wrong-answer
  explanation is the longer of the two. All six banks pass.

- Proof: the validator passes on all 210 questions, the 12 frontend unit tests
  still pass, and the production build is clean with all six banks synced in.
  Still deferred: a timed exam mode.

## Content — seed banks for the other five exams

### 2026-07-18 — every tab is playable now, five questions apiece

- Paused the full 250-question GitHub Actions bank on purpose (it waits on the
  research hand-off) and instead gave each of the other five exams a small,
  real, hand-written seed bank so the whole engine is exercisable end to end
  rather than one live tab and five placeholders.

- Wrote five questions each for GitHub Advanced Security, AWS AI Practitioner,
  AWS Cloud Practitioner, AWS Solutions Architect Associate, and HashiCorp
  Terraform Associate, all marked isSeed: true, following the same shape as the
  GitHub Actions seeds: a distinct id prefix per exam (ghas-, aip-, clf-, saa-,
  tf-), real domains drawn from each exam's official blueprint, and a short
  confirming explanationCorrect against a longer teaching explanationIncorrect.
  Each bank spreads its five questions so every domain listed for that exam is
  covered by at least one question.

- Filled in each exam's domains in the registry and flipped its status from
  coming-soon to active. Because the tab UI is driven entirely by the registry,
  this is what lights up the five tabs; no component changed.

- Proof: a schema check over all six banks passes. It enforces the required
  fields, the id and option-id patterns, id uniqueness within a bank, that each
  correctAnswerId resolves to a real option, that each question's domain is one
  the registry declares for that exam and that every declared domain is covered,
  that each question's exam id matches its file and the schema enum, and that
  explanationIncorrect is the longer field. The 12 frontend unit tests still
  pass and the production build is clean with all six banks synced in.

- Deferred still: the full research-backed GitHub Actions set, and a timed exam
  mode.

## Phase 5 — the six-exam tab switcher

### 2026-07-17 — one engine, six tabs, five of them waiting on content

- Built the tab UI straight off the registry (`data/exams.json`), so the tabs and
  their state are data, not hardcoded. Six tabs render; GitHub Actions is the one
  `active` exam and the rest carry a small "soon" pill from their `coming-soon`
  status. When the banks for the other five land, flipping their status in the
  registry lights up their tabs with no code change.

- Selecting an active exam loads its bank and starts it fresh; selecting a
  coming-soon exam shows a placeholder panel (the exam name and a short note)
  instead of a quiz. Switching exams resets the quiz cleanly and reshuffles, so
  you never carry one exam's answers into another. Persistence stays per exam:
  the results progress panel and the saved-attempt count are filtered to the exam
  you just took, keyed the same way the API stores them.

- Generalized `App` from the single hardcoded exam to a selected one throughout,
  including the submit path, which now sends the selected exam id.

- Proof: 12 frontend unit tests still pass and the build is clean. Drove the live
  site in headless Chrome: exactly six tabs, one active (GitHub Actions, not
  marked soon), five marked soon; the active exam renders a question; clicking a
  coming-soon exam shows its placeholder and no quiz; switching back to GitHub
  Actions returns to a fresh question one. 10 browser checks pass. Screens look
  right in both states.

## Phase 4 — persistence, proven against real DynamoDB

### 2026-07-17 — attempts, per-domain progress, and history end to end

- Filled in the three stub routes with real logic. `submit_attempt` grades the
  attempt server-side against the bundled answer key (a client cannot claim a
  score it did not earn), writes the attempt row, and rolls each domain's
  cumulative totals forward with a single ADD update per domain (no
  read-before-write). `get_attempts` queries the user's partition newest first;
  `get_progress` reads the per-domain aggregates and derives weak domains. The
  grading itself is a pure `grade.py` that mirrors the frontend's quiz.ts, so
  server and client agree on what a score means.

- Proved the grading in isolation: `test_grade.py` (pure, no AWS) checks
  id-based matching, unanswered-as-wrong, per-domain tallies, weak-domain
  ordering, subset grading with unknown ids ignored, and the real seed bank at
  100 and 0 percent. 11 checks pass.

- Proved persistence for real against DynamoDB Local in a container (no boto3
  mock of our code): two attempts for a user store and read back newest first;
  an all-correct attempt scores 100 and an all-wrong one scores 0, so the score
  is genuinely server-computed; validation returns 400 and 404; the per-domain
  aggregates accumulate across attempts (workflows seen 4 correct 2 at 0.5, then
  seen 6 correct 4 at 0.667 after a third attempt); the attempts counter
  increments per domain; and a second user sees none of the first user's data
  (per-user isolation). 18 integration checks pass.

- Wired the frontend to the API. A runtime `config.js` (injected at deploy,
  overwritten in the bucket with the real API base) drives whether the app runs
  backed or client-only. The device id is a UUID generated once in localStorage.
  On finish, when a backend is configured the app POSTs the attempt, shows the
  server score, a green "Saved to your history" note with the running attempt
  count, and a cumulative "your progress over all attempts" panel; when it is not
  configured, or the API is unreachable, it silently falls back to the client
  score and shows "local practice, not saved". So the live client-only dev site
  keeps working unchanged.

- Proved the whole loop in headless Chrome against the built site talking to the
  real handlers behind a thin local shim over DynamoDB Local: config.js was
  served pointing at the shim exactly as the deploy injects it. Two attempts
  saved and the note read "1 attempt total" then "2 attempts total"; the progress
  panel rendered; the server independently confirmed two stored attempts, four
  tracked domains, and ten question-views; and pointing config at an unreachable
  port fell back to "not saved". 9 browser checks pass, on top of the 12 frontend
  unit tests and a clean build.

- Still local: nothing is deployed to AWS. Deploy is step 6, after the six-exam
  tab UI in step 5.

## Phase 3 — CDK infrastructure, synthesized clean

### 2026-07-17 — three stacks stand up, mirroring the proven serverless shape

- Authored the infrastructure as AWS CDK in TypeScript under `infra/`, same
  data / api / hosting split as standup-brief and study-conscience, minus the
  parts v1 does not have (no secrets, no scheduler, no model call).

- DataStack: one DynamoDB table `ef-attempts-<stage>`, single-table design,
  keyed per user. PK is `USER#<uuid>` (the anonymous device id), SK is
  `ATTEMPT#<iso8601>#<exam>` for a finished attempt and `DOMAIN#<exam>#<domain>`
  for a rolling per-domain aggregate. Everything one user touches is one
  partition, so history and progress are each a single Query. PAY_PER_REQUEST,
  retained and point-in-time-recovered only in prod. The user id is opaque, so
  swapping the device id for a Cognito subject later needs no key change.

- ApiStack: a REST API with four Python 3.12 routes wired and IAM-granted:
  `POST /attempts` (read-write on the table), `GET /attempts` and
  `GET /progress` (read-only), and `GET /health`. No API key and no login, since
  v1 identifies a user by an opaque device id, so a write is always a user
  writing their own partition; the stage is throttled instead. Grading is meant
  to be server-authoritative, so the canonical banks are bundled into the lambda
  from repo-root `data/` via `scripts/sync-banks.mjs` (gitignored copy,
  regenerated before every synth and deploy), ready for the step-4 logic.

- HostingStack: a private S3 bucket (all public access blocked) behind CloudFront
  with Origin Access Control, serving the built React SPA from `web/dist`. The
  API base URL is injected as `config.js` at deploy so the frontend never
  hardcodes it, with 403 and 404 mapped back to `index.html` for the SPA.

- Step 3 is infrastructure only. `health` returns ok; `submit_attempt`,
  `get_attempts`, and `get_progress` are honest 501 stubs so nothing pretends to
  persist before step 4 fills in the scoring, aggregation, and history.

- Proof: `tsc --noEmit` is clean and `cdk synth` produces all three templates
  (`ef-dev-data`, `ef-dev-api`, `ef-dev-hosting`) with no errors and no
  deprecations after switching the table to `pointInTimeRecoverySpecification`.
  The synthesized resources check out: one DynamoDB table; four lambdas plus the
  REST API, stage, and grant policies; a private bucket with a CloudFront
  distribution and OAC. All five lambda handlers compile. Not deployed yet:
  deploy is step 6, and it needs the step-4 persistence logic first.

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
