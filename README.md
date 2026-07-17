# ExamForge

A certification practice-exam app. One engine, six exams, switchable by tab:
GitHub Actions, GitHub Advanced Security, AWS AI Practitioner, AWS Cloud
Practitioner, AWS Solutions Architect Associate, and HashiCorp Terraform
Associate.

The engine is built first against the GitHub Actions bank. The other five exams
are content poured into the same engine later, so they show as "coming soon"
until their question banks land.

## What it does (v1)

- Practice mode over a per-exam question bank.
- Answer randomization: on every render the option order is shuffled per
  question, so the correct answer is never positionally fixed. Correctness is
  tracked by option id, never by position.
- Every answered question shows an explanation: a standard explanation when you
  are right, a longer and more detailed one when you are wrong.
- Per-attempt score, per-domain performance, weak-domain identification, and full
  attempt history, kept per user.

## What v1 does NOT do

- No timed exam mode yet (practice mode only).
- No runtime AI or LLM feature of any kind. The questions are static,
  pre-written content and nothing in v1 makes a model call. An "AI weak-domain
  tutor" that coaches you on the domains you keep missing is a planned v2; it is
  deliberately out of scope here.

## How a user is identified

There is no login in v1. The frontend generates a stable id in the browser
(localStorage) and uses it as the persistence key. That keeps the full
per-user persistence loop real end to end while staying zero-auth. The data
model keys on that id, so a real account system (for example Cognito, keyed on
its subject id) can replace the generated id later without reshaping the data.

## Stack

- Frontend: React and TypeScript (Vite), its own visual identity, hosted on S3
  behind CloudFront.
- Backend: Python 3.12 Lambda behind API Gateway for scoring, progress, and
  attempt history.
- Storage: a single DynamoDB table, single-table design, keyed per user.
- Infrastructure: AWS CDK in TypeScript, split into data, api, and hosting
  stacks.

Same proven serverless shape as the standup-brief and study-conscience builds.

## Question bank

Questions live as structured JSON under `data/questions/<exam>.json`, validated
against `schema/question.schema.json`. The set of exams and their status lives in
`data/exams.json`. The GitHub Actions bank currently holds a small set of real
seed questions (marked `"isSeed": true`) that exist to prove the engine end to
end; they are replaced by the full research-backed set later.

## Repository layout

```
data/
  exams.json              the six exams and their status
  questions/
    github-actions.json   seed GitHub Actions questions
schema/
  question.schema.json    JSON Schema for one question
  README.md               schema notes
web/                       React + TypeScript frontend (added in step 2)
infra/                     CDK data / api / hosting stacks (added in step 3)
docs/                      run journals
BUILD_LOG.md               running build journal
```
