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
const questions = manifest.files.flatMap(file => JSON.parse(fs.readFileSync(path.join(bankDir, file), 'utf8')));
const added = questions.slice(200);

test('V8 question bank contains 300 unique questions and supports full mock exam default', () => {
  assert.equal(questions.length, 300);
  assert.equal(new Set(questions.map(q => q.id)).size, 300);
  assert.equal(config.questionCount, 60);
  assert.deepEqual(manifest.files, Array.from({ length: 15 }, (_, i) => `questions-${String(i + 1).padStart(3, '0')}.json`));
});

test('new V8 questions occupy JS17-0201 through JS17-0300', () => {
  assert.equal(added.length, 100);
  assert.deepEqual(added.map(q => q.id), Array.from({ length: 100 }, (_, i) => `JS17-${String(i + 201).padStart(4, '0')}`));
});

test('V8 additions are code-heavy and include difficult multiple-selection practice', () => {
  assert.equal(added.filter(q => q.code && q.code.trim()).length, 100);
  assert.ok(added.filter(q => q.code.split('\n').length >= 15).length >= 80);
  assert.ok(added.filter(q => q.multipleChoice).length >= 20);
  assert.ok(added.filter(q => q.difficulty >= 4).length >= 85);
});

test('all 300 questions have complete review data and no exact duplicate prompt/code pair', () => {
  const keys = new Set();
  for (const q of questions) {
    assert.ok(q.question && q.question.trim(), `${q.id}: question`);
    assert.ok(q.code == null || typeof q.code === 'string', `${q.id}: code`);
    assert.ok(Array.isArray(q.choices) && q.choices.length >= 2, `${q.id}: choices`);
    assert.ok(Array.isArray(q.correctAnswers) && q.correctAnswers.length >= 1, `${q.id}: correctAnswers`);
    assert.ok(q.explanation && q.explanation.trim(), `${q.id}: explanation`);
    assert.ok(q.choiceExplanations && typeof q.choiceExplanations === 'object', `${q.id}: choiceExplanations`);
    assert.ok(q.category && q.category.trim(), `${q.id}: category`);
    assert.ok(categories.has(q.category), `${q.id}: unknown category`);
    assert.ok(Array.isArray(q.tags) && q.tags.length >= 1, `${q.id}: tags`);
    assert.ok(Number.isInteger(q.difficulty) && q.difficulty >= 1 && q.difficulty <= 5, `${q.id}: difficulty`);

    const choiceIds = q.choices.map(c => c.id);
    assert.equal(new Set(choiceIds).size, choiceIds.length, `${q.id}: duplicate choice id`);
    for (const answer of q.correctAnswers) assert.ok(choiceIds.includes(answer), `${q.id}: answer ${answer}`);
    for (const choiceId of choiceIds) assert.ok(q.choiceExplanations[choiceId], `${q.id}: explanation for ${choiceId}`);
    if (q.multipleChoice) assert.ok(q.correctAnswers.length >= 2, `${q.id}: multipleChoice`);
    else assert.equal(q.correctAnswers.length, 1, `${q.id}: singleChoice`);

    const key = `${q.question.trim()}\n---\n${(q.code ?? '').trim()}`;
    assert.ok(!keys.has(key), `${q.id}: exact duplicate prompt/code`);
    keys.add(key);
  }
});

test('V8 single-choice answer positions are not concentrated in one option', () => {
  const singles = added.filter(q => !q.multipleChoice);
  const counts = new Map();
  for (const q of singles) counts.set(q.correctAnswers[0], (counts.get(q.correctAnswers[0]) ?? 0) + 1);
  assert.ok(Math.max(...counts.values()) <= 18);
});