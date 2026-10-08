import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceExamCycle, normalizeExamCycleIds } from '../../main/resources/static/js/exam-cycle.js';

test('normalizes cycle ids to unique ids that still exist', () => {
  assert.deepEqual(
    normalizeExamCycleIds(['Q1', 'Q1', 'OLD'], ['Q1', 'Q2']),
    ['Q1']
  );
});

test('keeps accumulating unseen questions before a full cycle', () => {
  assert.deepEqual(
    advanceExamCycle(['Q1', 'Q2'], ['Q3', 'Q4'], 5),
    ['Q1', 'Q2', 'Q3', 'Q4']
  );
});

test('when a cycle completes, carry only filler repeats into the next cycle', () => {
  assert.deepEqual(
    advanceExamCycle(['Q1', 'Q2', 'Q3', 'Q4'], ['Q5', 'Q2', 'Q3'], 5),
    ['Q2', 'Q3']
  );
});
