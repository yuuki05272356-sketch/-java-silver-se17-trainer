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

test('V9 question bank contains 500 unique questions and supports full mock exam default', () => {
  assert.equal(questions.length, 500);
  assert.equal(new Set(questions.map(q => q.id)).size, 500);
  assert.equal(config.questionCount, 60);
  assert.deepEqual(manifest.files, Array.from({ length: 25 }, (_, i) => `questions-${String(i + 1).padStart(3, '0')}.json`));
});

test('new V9 questions occupy JS17-0301 through JS17-0500', () => {
  const added = questions.slice(300);
  const expected = Array.from({ length: 200 }, (_, i) => `JS17-${String(i + 301).padStart(4, '0')}`);
  assert.deepEqual(added.map(q => q.id), expected);
});

test('V9 additions are code-heavy and include difficult multiple-selection practice', () => {
  const added = questions.slice(300);
  assert.equal(added.length, 200);
  assert.equal(added.filter(q => q.code && q.code.trim()).length, 200);
  assert.ok(added.filter(q => q.code.split('\n').length >= 15).length >= 160);
  assert.ok(added.filter(q => q.multipleChoice).length >= 50);
  assert.ok(added.filter(q => q.difficulty >= 4).length >= 180);
});

test('all 500 questions have complete review data and no exact duplicate prompt/code pair', () => {
  const keys = new Set();
  for (const q of questions) {
    assert.ok(q.question && q.question.trim(), `${q.id}: question`);
    assert.ok(Array.isArray(q.choices) && q.choices.length >= 2, `${q.id}: choices`);
    assert.ok(Array.isArray(q.correctAnswers) && q.correctAnswers.length >= 1, `${q.id}: correctAnswers`);
    assert.ok(q.explanation && q.explanation.trim(), `${q.id}: explanation`);
    assert.ok(q.choiceExplanations && typeof q.choiceExplanations === 'object', `${q.id}: choiceExplanations`);
    assert.ok(q.category && q.category.trim(), `${q.id}: category`);
    assert.ok(Array.isArray(q.tags) && q.tags.length >= 1, `${q.id}: tags`);
    assert.ok(Number.isInteger(q.difficulty) && q.difficulty >= 1 && q.difficulty <= 5, `${q.id}: difficulty`);
    assert.ok(categories.has(q.category), `${q.id}: unknown category`);
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