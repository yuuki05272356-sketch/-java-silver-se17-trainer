const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function choiceLabel(question, id) {
  const choice = question.choices.find(item => item.id === id);
  return choice ? `${choice.id}. ${choice.text}` : id;
}

export function renderWrongAnswerDetail(question, selectedAnswers, feedback, questionNumber) {
  const selected = Array.isArray(selectedAnswers) ? selectedAnswers : [];
  const correct = Array.isArray(feedback.correctAnswers) ? feedback.correctAnswers : [];
  const selectedSummary = selected.length
    ? selected.map(id => esc(choiceLabel(question, id))).join(' / ')
    : '未回答';
  const correctSummary = correct.length
    ? correct.map(id => esc(choiceLabel(question, id))).join(' / ')
    : '正解データなし';

  const choiceRows = question.choices.map(choice => {
    const isSelected = selected.includes(choice.id);
    const isCorrect = correct.includes(choice.id);
    const classes = [
      'result-review-choice',
      isCorrect ? 'is-correct' : '',
      isSelected && !isCorrect ? 'is-selected-wrong' : ''
    ].filter(Boolean).join(' ');
    const badges = [
      isSelected ? '<span class="review-badge selected">あなたの回答</span>' : '',
      isCorrect ? '<span class="review-badge correct">正解</span>' : ''
    ].join('');
    const explanation = feedback.choiceExplanations?.[choice.id] ?? '';

    return `<div class="${classes}">
      <div class="result-review-choice-head">
        <strong>${esc(choice.id)}. ${esc(choice.text)}</strong>
        <div class="review-badges">${badges}</div>
      </div>
      <p>${esc(explanation)}</p>
    </div>`;
  }).join('');

  return `<div class="result-review-detail">
    <div class="result-review-heading">
      <div>
        <div class="question-kicker">QUESTION ${questionNumber}</div>
        <h3>問${questionNumber}の詳細確認</h3>
      </div>
      <div class="question-meta result-review-meta">
        <span class="pill primary">${esc(question.category)}</span>
        <span class="pill">難易度 ${question.difficulty}</span>
        ${(question.tags ?? []).slice(0, 5).map(tag => `<span class="pill">#${esc(tag)}</span>`).join('')}
      </div>
    </div>

    <h4 class="result-review-question">${esc(question.question)}</h4>
    ${question.code ? `<div class="code-wrap result-review-code"><span class="code-label">Java 17</span><pre class="code"><code>${esc(question.code)}</code></pre></div>` : ''}

    <div class="result-answer-summary">
      <div><span>あなたの回答</span><strong>${selectedSummary}</strong></div>
      <div><span>正解</span><strong>${correctSummary}</strong></div>
    </div>

    <section class="result-explanation">
      <h4>解説</h4>
      <p>${esc(feedback.explanation ?? '')}</p>
    </section>

    <section class="result-choice-explanations">
      <h4>各選択肢の確認</h4>
      ${choiceRows}
    </section>
  </div>`;
}
