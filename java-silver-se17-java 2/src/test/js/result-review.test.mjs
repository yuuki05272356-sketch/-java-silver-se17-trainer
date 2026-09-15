import test from 'node:test';
import assert from 'node:assert/strict';
import { renderWrongAnswerDetail } from '../../main/resources/static/js/result-review.js';

const question = {
  id: 'JS17-9999',
  question: '次のコードの実行結果として正しいものはどれか。',
  code: 'var x = 10;\nSystem.out.println(x);',
  choices: [
    { id: 'A', text: '10' },
    { id: 'B', text: '0' },
    { id: 'C', text: 'コンパイルエラー' }
  ],
  category: '3. var',
  tags: ['var', 'type-inference'],
  difficulty: 4,
  multipleChoice: false
};

const feedback = {
  correct: false,
  correctAnswers: ['A'],
  explanation: 'var x は int と推論され、10が出力されます。',
  choiceExplanations: {
    A: '正しい。xは10で初期化されます。',
    B: '誤り。0は代入されていません。',
    C: '誤り。このvarの使用方法は有効です。'
  }
};

test('誤答詳細に問題文・コード・自分の回答・正解・解説を表示する', () => {
  const html = renderWrongAnswerDetail(question, ['B'], feedback, 7);

  assert.match(html, /問7/);
  assert.match(html, /次のコードの実行結果として正しいものはどれか/);
  assert.match(html, /var x = 10/);
  assert.match(html, /あなたの回答/);
  assert.match(html, /B\. 0/);
  assert.match(html, /正解/);
  assert.match(html, /A\. 10/);
  assert.match(html, /var x は int と推論され/);
  assert.match(html, /正しい。xは10で初期化されます/);
  assert.match(html, /誤り。0は代入されていません/);
  assert.match(html, /3\. var/);
  assert.match(html, /難易度 4/);
});

test('未回答でも「未回答」と正解を表示できる', () => {
  const html = renderWrongAnswerDetail(question, [], feedback, 3);

  assert.match(html, /未回答/);
  assert.match(html, /A\. 10/);
});

test('問題文や解説のHTMLをエスケープする', () => {
  const unsafeQuestion = { ...question, question: '<script>alert(1)</script>' };
  const unsafeFeedback = { ...feedback, explanation: '<b>danger</b>' };
  const html = renderWrongAnswerDetail(unsafeQuestion, ['B'], unsafeFeedback, 1);

  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<b>danger<\/b>/);
  assert.match(html, /&lt;b&gt;danger&lt;\/b&gt;/);
});
