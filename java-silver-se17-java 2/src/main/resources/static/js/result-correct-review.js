import { api } from './api.js';
import { storage } from './storage.js';
import { renderWrongAnswerDetail } from './result-review.js';

const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export function renderCorrectAnswerItem(question, selectedAnswers, questionNumber) {
  const selected = Array.isArray(selectedAnswers) ? selectedAnswers : [];
  const answerText = selected.length ? selected.join(', ') : '未回答';

  return `<div class="result-item">
    <strong>問${questionNumber} · ${esc(question.category)} · <span class="review-badge correct">正解</span></strong>
    <div class="result-question-preview">${esc(question.question)}</div>
    <div class="result-answer-preview">あなたの回答：<strong>${esc(answerText)}</strong></div>
    <div class="result-item-actions">
      <button class="btn btn-primary" data-correct-detail-id="${esc(question.id)}">問題・コード・解説を確認</button>
    </div>
    <div class="result-review-panel" data-correct-detail-panel="${esc(question.id)}" hidden></div>
  </div>`;
}

async function toggleDetail(result, questionById, button) {
  const id = button.dataset.correctDetailId;
  const question = questionById.get(id);
  const panel = [...document.querySelectorAll('[data-correct-detail-panel]')]
    .find(el => el.dataset.correctDetailPanel === id);
  if (!question || !panel) return;

  if (panel.dataset.loaded === 'true' && !panel.hidden) {
    panel.hidden = true;
    button.textContent = '問題・コード・解説を確認';
    return;
  }

  panel.hidden = false;
  if (panel.dataset.loaded === 'true') {
    button.textContent = '詳細を閉じる';
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }

  button.disabled = true;
  button.textContent = '解説を読み込み中…';
  panel.innerHTML = '<div class="result-detail-loading">Javaサーバーから正解と解説を読み込み中…</div>';

  try {
    const feedback = await api.checkAnswer(id, result.answers?.[id] ?? []);
    const number = result.questionIds.indexOf(id) + 1;
    panel.innerHTML = renderWrongAnswerDetail(question, result.answers?.[id] ?? [], feedback, number);
    panel.dataset.loaded = 'true';
    button.textContent = '詳細を閉じる';
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (error) {
    panel.hidden = true;
    panel.innerHTML = '';
    button.textContent = '問題・コード・解説を確認';
    console.error('Failed to load correct answer detail.', error);
  } finally {
    button.disabled = false;
  }
}

let enhancing = false;

async function enhanceResultPage() {
  if (enhancing || document.querySelector('#correctReviewSection')) return;

  const headings = [...document.querySelectorAll('.section-title')];
  const wrongHeading = headings.find(el => el.textContent.trim().startsWith('間違えた問題'));
  const wrongList = wrongHeading?.nextElementSibling;
  if (!wrongHeading || !wrongList?.classList.contains('result-list')) return;

  const result = storage.loadState().examHistory?.[0];
  if (!result?.questionIds?.length) return;

  enhancing = true;
  try {
    const questions = await api.getQuestions();
    const questionById = new Map(questions.map(q => [q.id, q]));
    const wrongIds = new Set(result.wrongIds ?? []);
    const correctIds = result.questionIds.filter(id => !wrongIds.has(id));

    const heading = document.createElement('h2');
    heading.className = 'section-title';
    heading.id = 'correctReviewHeading';
    heading.textContent = `正解した問題 (${correctIds.length})`;

    const section = document.createElement('section');
    section.className = 'result-list';
    section.id = 'correctReviewSection';
    section.innerHTML = correctIds.length
      ? correctIds.map(id => {
          const question = questionById.get(id);
          if (!question) return '';
          return renderCorrectAnswerItem(
            question,
            result.answers?.[id] ?? [],
            result.questionIds.indexOf(id) + 1
          );
        }).join('')
      : '<div class="card empty">正解した問題はありません。</div>';

    wrongList.insertAdjacentElement('afterend', section);
    section.insertAdjacentElement('beforebegin', heading);

    section.querySelectorAll('[data-correct-detail-id]').forEach(button => {
      button.addEventListener('click', () => toggleDetail(result, questionById, button));
    });
  } finally {
    enhancing = false;
  }
}

if (typeof document !== 'undefined') {
  const observer = new MutationObserver(() => enhanceResultPage().catch(console.error));
  observer.observe(document.documentElement, { childList: true, subtree: true });
  enhanceResultPage().catch(console.error);
}
