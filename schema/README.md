# Question schema

`question.schema.json` (JSON Schema draft-07) defines one practice-exam question.

## The load-bearing rule

Correctness is tracked by option **id**, never by position. `options[]` order is
authoring order only. The frontend shuffles it on every render, so the correct
answer is never positionally fixed, and it decides right or wrong by comparing
the chosen option id against `correctAnswerId`. Any consumer that ranks answers
by position is wrong.

## Fields

- `id` — stable, unique within an exam. Convention `<exam-prefix>-<number>`,
  e.g. `gha-001`.
- `exam` — the owning exam, must match an id in `data/exams.json`.
- `domain` — the exam domain, used for per-domain scoring and weak-domain
  tracking. Free text so each exam can bring its own domain taxonomy.
- `difficulty` — `easy`, `medium`, or `hard`.
- `stem` — the question text.
- `options[]` — two to eight `{ id, text }` choices; ids unique within the
  question.
- `correctAnswerId` — the id of the single correct option; must be one of
  `options[].id`.
- `explanationCorrect` — shown on a correct answer (standard).
- `explanationIncorrect` — shown on a wrong answer, deliberately longer and more
  detailed.
- `tags[]` — optional, for future filtering.
- `isSeed` — true for hand-written seed questions that only exist to prove the
  engine.

## Validating a bank

Every object in `data/questions/<exam>.json` must satisfy this schema, and its
`correctAnswerId` must be present in that question's `options[]`. A validator is
added alongside the engine so a malformed bank fails loudly instead of silently
scoring wrong.
