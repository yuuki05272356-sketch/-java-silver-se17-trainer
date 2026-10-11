import test from 'node:test';
import assert from 'node:assert/strict';
import { answeredQuestionIds } from '../../main/resources/static/js/exam-cycle.js';

test('returns only questions that have actually been answered', () => {
  const stats = {
    Q1: { attempts: 2, correct: 1, incorrect: 1 },
    Q2: { attempts: 0, correct: 0, incorrect: 0 },
    Q3: { attempts: 1, correct: 1, incorrect: 0 }
  };

  assert.deepEqual(
    answeredQuestionIds(stats, ['Q1', 'Q2', 'Q3']),
    ['Q1', 'Q3']
  );
});

test('ignores stale question ids that are no longer in the bank', () => {
  const stats = {
    Q1: { attempts: 1 },
    OLD: { attempts: 5 }
  };

  assert.deepEqual(
    answeredQuestionIds(stats, ['Q1', 'Q2']),
    ['Q1']
  );
});

test('treats missing or invalid attempts as unanswered', () => {
  const stats = {
    Q1: {},
    Q2: { attempts: null },
    Q3: { attempts: 1 }
  };

  assert.deepEqual(
    answeredQuestionIds(stats, ['Q1', 'Q2', 'Q3']),
    ['Q3']
  );
});
