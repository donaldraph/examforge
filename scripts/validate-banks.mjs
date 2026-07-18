// Validates every question bank in data/questions against schema/question.schema.json
// and the exam registry: required fields, id and option-id patterns, id uniqueness,
// correctAnswerId resolves to a real option, each question's domain is one the
// registry declares for its exam and every declared domain is covered, exam id
// matches the file and the schema enum, and explanationIncorrect is the longer field.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schema = JSON.parse(readFileSync(path.join(root, 'schema/question.schema.json')));
const registry = JSON.parse(readFileSync(path.join(root, 'data/exams.json')));
const enumExams = schema.properties.exam.enum;
const idRe = new RegExp(schema.properties.id.pattern);
const optIdRe = new RegExp(schema.properties.options.items.properties.id.pattern);
const required = schema.required;
const diffs = schema.properties.difficulty.enum;

let fail = 0;
const err = (m) => { console.log('  FAIL: ' + m); fail++; };

for (const exam of registry.exams) {
  const file = path.join(root, 'data/questions', exam.id + '.json');
  let bank;
  try { bank = JSON.parse(readFileSync(file)); }
  catch (e) {
    if (exam.status === 'active') err(`${exam.id}: active but bank missing/unparseable (${e.message})`);
    else console.log(`${exam.id}: coming-soon, no bank (ok)`);
    continue;
  }
  console.log(`\n${exam.id} (${exam.status}) - ${bank.length} questions`);
  const ids = new Set();
  const domainsSeen = new Set();
  const registryDomains = new Set(exam.domains);

  for (const q of bank) {
    const tag = q.id || '(no id)';
    for (const r of required) if (!(r in q)) err(`${tag}: missing required field ${r}`);
    for (const k of Object.keys(q)) if (!(k in schema.properties)) err(`${tag}: unknown field ${k}`);
    if (!idRe.test(q.id)) err(`${tag}: id fails pattern`);
    if (ids.has(q.id)) err(`${tag}: duplicate id`); ids.add(q.id);
    if (q.exam !== exam.id) err(`${tag}: exam ${q.exam} != ${exam.id}`);
    if (!enumExams.includes(q.exam)) err(`${tag}: exam not in enum`);
    if (!diffs.includes(q.difficulty)) err(`${tag}: bad difficulty ${q.difficulty}`);
    if (!q.domain || !registryDomains.has(q.domain)) err(`${tag}: domain "${q.domain}" not in registry`);
    domainsSeen.add(q.domain);
    if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 8) err(`${tag}: options count`);
    const optIds = new Set();
    for (const o of q.options) {
      if (!optIdRe.test(o.id)) err(`${tag}: option id "${o.id}" fails pattern`);
      if (optIds.has(o.id)) err(`${tag}: duplicate option id ${o.id}`); optIds.add(o.id);
      if (!o.text || !o.text.length) err(`${tag}: empty option text`);
    }
    if (!optIds.has(q.correctAnswerId)) err(`${tag}: correctAnswerId ${q.correctAnswerId} not an option`);
    if (!q.explanationCorrect?.length) err(`${tag}: empty explanationCorrect`);
    if (!q.explanationIncorrect?.length) err(`${tag}: empty explanationIncorrect`);
    if (q.explanationIncorrect.length <= q.explanationCorrect.length)
      err(`${tag}: explanationIncorrect not longer than explanationCorrect`);
  }
  for (const d of registryDomains) if (!domainsSeen.has(d)) err(`${exam.id}: registry domain "${d}" has no question`);
}

console.log(fail === 0 ? '\nALL CHECKS PASS' : `\n${fail} CHECK(S) FAILED`);
process.exit(fail === 0 ? 0 : 1);
