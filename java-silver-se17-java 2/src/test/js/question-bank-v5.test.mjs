import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const bankDir = path.resolve(here, '../../main/resources/question-bank');
const manifest = JSON.parse(fs.readFileSync(path.join(bankDir, 'question-files.json'), 'utf8'));
const config = JSON.parse(fs.readFileSync(path.join(bankDir, 'exam-config.json'), 'utf8'));
const categories = new Set(JSON.parse(fs.readFileSync(path.join(bankDir, 'categories.json'), 'utf8')));
const questions = manifest.files.flatMap(file =>
  JSON.parse(fs.readFileSync(path.join(bankDir, file), 'utf8'))
);

const javaKeywords = new Set(('abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public record return sealed short static strictfp super switch synchronized this throw throws transient try var void volatile while yield permits non-sealed true false null String Object Integer Long Short Byte Double Float Character Boolean System Math RuntimeException Exception Error AutoCloseable StringBuilder ArrayList List').split(/\s+/));

function normalizeCode(code = '') {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/.*$/gm, ' ')
    .replace(/"(?:\\.|[^"\\])*"/g, ' STR ')
    .replace(/'(?:\\.|[^'\\])'/g, ' CHR ')
    .replace(/\b\d+(?:\.\d+)?[fFdDlL]?\b/g, ' NUM ')
    .match(/[A-Za-z_$][A-Za-z0-9_$]*|>>>=|>>>|>>|<<|==|!=|<=|>=|&&|\|\||\+\+|--|->|::|[{}()[\].,;:+\-*\/%<>=!&|?^~]/g)
    ?.map(token => /^[A-Za-z_$]/.test(token) && !javaKeywords.has(token) ? 'ID' : token)
    .join(' ') ?? '';
}

test('V13 cleaned bank contains 460 unique questions', () => {
  assert.equal(questions.length, 460);
  assert.equal(new Set(questions.map(q => q.id)).size, 460);
  assert.equal(config.questionCount, 60);
  assert.deepEqual(
    manifest.files,
    Array.from({ length: 37 }, (_, i) => `questions-${String(i + 1).padStart(3, '0')}.json`)
  );
});

test('V13 hard additions occupy JS17-0651 through JS17-0700', () => {
  const added = questions.filter(q => Number(q.id.slice(5)) >= 651);
  assert.deepEqual(
    added.map(q => q.id),
    Array.from({ length: 50 }, (_, i) => `JS17-${String(i + 651).padStart(4, '0')}`)
  );
  assert.equal(added.filter(q => q.difficulty === 5).length, 50);
  assert.ok(added.filter(q => q.multipleChoice).length >= 6);
});

test('cleaned bank has no exact or identifier/literal-only code duplicates', () => {
  const exact = new Set();
  const structural = new Set();
  for (const q of questions) {
    const exactKey = `${q.question.trim()}\n---\n${(q.code ?? '').trim()}`;
    assert.ok(!exact.has(exactKey), `${q.id}: exact duplicate`);
    exact.add(exactKey);
    const normalized = normalizeCode(q.code ?? '');
    if (normalized) {
      assert.ok(!structural.has(normalized), `${q.id}: structurally duplicate code`);
      structural.add(normalized);
    }
  }
});

test('all questions have complete review data', () => {
  for (const q of questions) {
    assert.ok(q.question && q.question.trim(), `${q.id}: question`);
    assert.ok(Array.isArray(q.choices) && q.choices.length >= 4, `${q.id}: choices`);
    assert.ok(Array.isArray(q.correctAnswers) && q.correctAnswers.length >= 1, `${q.id}: correctAnswers`);
    assert.ok(q.explanation && q.explanation.trim(), `${q.id}: explanation`);
    assert.ok(categories.has(q.category), `${q.id}: category`);
    assert.ok(Array.isArray(q.tags) && q.tags.length >= 1, `${q.id}: tags`);
    assert.ok(Number.isInteger(q.difficulty) && q.difficulty >= 1 && q.difficulty <= 5, `${q.id}: difficulty`);
    const choiceIds = q.choices.map(c => c.id);
    assert.equal(new Set(choiceIds).size, choiceIds.length, `${q.id}: duplicate choice id`);
    for (const answer of q.correctAnswers) assert.ok(choiceIds.includes(answer), `${q.id}: bad answer`);
    for (const choiceId of choiceIds) assert.ok(q.choiceExplanations?.[choiceId], `${q.id}: missing choice explanation`);
    if (q.multipleChoice) assert.ok(q.correctAnswers.length >= 2, `${q.id}: multipleChoice`);
    else assert.equal(q.correctAnswers.length, 1, `${q.id}: singleChoice`);
  }
});
