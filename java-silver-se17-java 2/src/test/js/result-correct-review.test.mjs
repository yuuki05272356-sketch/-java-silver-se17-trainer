import test from 'node:test';
import assert from 'node:assert/strict';
import { renderCorrectAnswerItem } from '../../main/resources/static/js/result-correct-review.js';

const question = {
  id: 'JS17-9999',
  question: '正解した問題もあとから確認できるか。',
  category: '23. override'
};

test('正解した問題に詳細確認ボタンを表示する', () => {
  const html = renderCorrectAnswerItem(question, ['B'], 12);
  assert.match(html, /問12/);
  assert.match(html, /正解/);
  assert.match(html, /B/);
  assert.match(html, /data-correct-detail-id="JS17-9999"/);
  assert.match(html, /問題・コード・解説を確認/);
});

test('問題文をHTMLエスケープする', () => {
  const html = renderCorrectAnswerItem({ ...question, question: '<script>x</script>' }, ['A'], 1);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
});
