import { api } from './api.js';
import { storage } from './storage.js';
import { renderWrongAnswerDetail } from './result-review.js';

const app = document.querySelector('#app');
let questions = [];
let questionById = new Map();
let meta = null;
let userState = storage.loadState();
let session = storage.loadActiveSession();
let currentResult = null;
let timerId = null;
let toastId = null;

const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const shuffled = array => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const nowIso = () => new Date().toISOString();

function formatTime(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function saveSession() {
  if (session) storage.saveActiveSession(session);
}

function saveUserState() {
  userState = storage.saveState(userState);
}

function recordAttempt(qid, correct) {
  const stat = userState.questionStats[qid] ?? {
    attempts: 0, correct: 0, incorrect: 0, lastAnsweredAt: null, lastResult: null
  };
  stat.attempts += 1;
  if (correct) stat.correct += 1;
  else stat.incorrect += 1;
  stat.lastAnsweredAt = nowIso();
  stat.lastResult = correct ? 'correct' : 'incorrect';
  userState.questionStats[qid] = stat;
}

function persistFlagsFromSession(qid) {
  const flag = session.flags[qid] ?? {};
  if (flag.review && !userState.reviewIds.includes(qid)) userState.reviewIds.push(qid);
  if (!flag.review) userState.reviewIds = userState.reviewIds.filter(id => id !== qid);
  if (flag.unknown && !userState.unknownIds.includes(qid)) userState.unknownIds.push(qid);
  if (!flag.unknown) userState.unknownIds = userState.unknownIds.filter(id => id !== qid);
}

function showToast(message) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  document.body.appendChild(el);
  clearTimeout(toastId);
  toastId = setTimeout(() => el.remove(), 1800);
}

function showModal(content) {
  const wrap = document.createElement('div');
  wrap.className = 'modal-backdrop';
  wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${content}</div>`;
  wrap.addEventListener('click', e => {
    if (e.target === wrap || e.target.closest('[data-close-modal]')) wrap.remove();
  });
  document.body.appendChild(wrap);
  return wrap;
}

function statsSummary() {
  const values = Object.values(userState.questionStats);
  const attempts = values.reduce((n, s) => n + s.attempts, 0);
  const correct = values.reduce((n, s) => n + s.correct, 0);
  const wrongIds = values.filter(s => s.incorrect > 0).length;
  return { attempts, wrongIds, accuracy: attempts ? Math.round(correct / attempts * 100) : 0 };
}

function homeView() {
  stopTimer();
  const config = meta.examConfig;
  const questionCountOptions = config.questionCountOptions ?? [config.questionCount];
  const durationMinuteOptions = config.durationMinuteOptions ?? [config.durationMinutes];
  const sum = statsSummary();
  const canResume = session && session.questionIds?.length;
  const last = userState.examHistory?.[0];

  app.innerHTML = `
  <main class="page">
    <div class="topbar">
      <div class="brand-wrap">
        <div class="brand"><div class="brand-badge">J17</div><div>Java Silver SE 17</div></div>
        <div class="subtitle">${esc(config.examCode)} / Java 17 + Spring Boot Edition</div>
      </div>
      <button class="btn btn-ghost" id="resetBtn">設定</button>
    </div>

    <section class="card hero">
      <h1>問題を解きながら、サイトのJavaコードも読む。</h1>
      <p>出題・JSON読込・答え合わせ・採点はJava 17で実装。現在の初期設定は${config.questionCount}問・${config.durationMinutes}分・合格ライン${config.passPercent}%です。問題数と制限時間は練習用に変更できます。</p>
      ${canResume ? `<div style="margin-top:18px"><button class="btn btn-primary" id="resumeBtn">途中から再開する</button></div>` : ''}
    </section>

    <div class="history-grid">
      <div class="card mini-stat"><span>累計回答</span><strong>${sum.attempts}</strong></div>
      <div class="card mini-stat"><span>累計正答率</span><strong>${sum.accuracy}%</strong></div>
      <div class="card mini-stat"><span>誤答経験あり</span><strong>${sum.wrongIds}</strong></div>
      <div class="card mini-stat"><span>見直し登録</span><strong>${userState.reviewIds.length}</strong></div>
    </div>

    <h2 class="section-title">モードを選ぶ</h2>
    <div class="mode-grid">
      <section class="card mode-card">
        <h2>模擬試験モード</h2>
        <p>JavaのExamServiceが問題バンクから選択した問題数だけランダム出題し、制限時間と採点もJava側で管理します。</p>
        <div class="exam-config-grid">
          <div class="field">
            <label for="examQuestionCount">問題数</label>
            <select id="examQuestionCount">
              ${questionCountOptions.map(n => `<option value="${n}" ${n === config.questionCount ? 'selected' : ''}>${n}問</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label for="examDurationMinutes">制限時間</label>
            <select id="examDurationMinutes">
              ${durationMinuteOptions.map(n => `<option value="${n}" ${n === config.durationMinutes ? 'selected' : ''}>${n}分</option>`).join('')}
            </select>
          </div>
        </div>
        <button class="btn btn-primary btn-wide" id="startExamBtn">${config.questionCount}問 / ${config.durationMinutes}分で開始</button>
        ${last ? `<button class="btn btn-outline btn-wide" id="lastResultBtn" style="margin-top:10px">前回の結果を見る（${last.percent}%）</button>` : ''}
      </section>

      <section class="card mode-card">
        <h2>学習モード</h2>
        <p>回答後にJava APIへ答えを送り、正誤と解説を受け取ります。</p>
        <div class="filter-grid">
          <div class="field"><label for="cat">カテゴリ</label><select id="cat"><option value="">すべて</option>${meta.categories.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select></div>
          <div class="field"><label for="tag">タグ</label><select id="tag"><option value="">すべて</option>${meta.tags.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('')}</select></div>
          <div class="field"><label for="diff">難易度</label><select id="diff"><option value="">すべて</option>${[1,2,3,4,5].map(d => `<option value="${d}">${'★'.repeat(d)}${'☆'.repeat(5-d)}</option>`).join('')}</select></div>
        </div>
        <div class="check-row">
          <label><input type="checkbox" id="onlyWrong"> 間違えた問題</label>
          <label><input type="checkbox" id="onlyWeak"> 苦手（正答率65%未満）</label>
          <label><input type="checkbox" id="onlyReview"> 見直し登録</label>
          <label><input type="checkbox" id="onlyUnknown"> 分からない登録</label>
          <label><input type="checkbox" id="randomize" checked> ランダム順</label>
        </div>
        <button class="btn btn-primary btn-wide" id="startLearnBtn" style="margin-top:16px">条件を指定して開始</button>
      </section>
    </div>

    <section class="card filter-card" style="margin-top:16px">
      <strong>Java Edition</strong>
      <div class="progress-meta"><span>登録問題 ${meta.questionCount}問</span><span>カテゴリ ${meta.categories.length}</span><span>Spring Boot API</span><span>正解データはサーバー側</span></div>
    </section>
  </main>`;

  document.querySelector('#startExamBtn')?.addEventListener('click', startExam);
  document.querySelector('#examQuestionCount')?.addEventListener('change', updateExamStartButton);
  document.querySelector('#examDurationMinutes')?.addEventListener('change', updateExamStartButton);
  updateExamStartButton();
  document.querySelector('#resumeBtn')?.addEventListener('click', resumeSession);
  document.querySelector('#startLearnBtn')?.addEventListener('click', startLearningFromFilters);
  document.querySelector('#lastResultBtn')?.addEventListener('click', () => resultView(userState.examHistory[0]));
  document.querySelector('#resetBtn')?.addEventListener('click', openSettings);
}

function openSettings() {
  showModal(`
    <h2>設定</h2>
    <p style="color:var(--muted);line-height:1.7">学習履歴はこのブラウザのlocalStorageに保存されています。</p>
    <div class="modal-footer">
      <button class="btn btn-ghost" data-close-modal>閉じる</button>
      <button class="btn btn-danger" id="doReset">学習データを全削除</button>
    </div>`);
  document.querySelector('#doReset')?.addEventListener('click', () => {
    if (!confirm('本当に学習履歴と進行中セッションを削除しますか？')) return;
    storage.resetAll();
    userState = storage.loadState();
    session = null;
    document.querySelector('.modal-backdrop')?.remove();
    homeView();
  });
}

function updateExamStartButton() {
  const questionCount = Number(document.querySelector('#examQuestionCount')?.value || meta.examConfig.questionCount);
  const durationMinutes = Number(document.querySelector('#examDurationMinutes')?.value || meta.examConfig.durationMinutes);
  const button = document.querySelector('#startExamBtn');
  if (!button) return;

  button.textContent = `${questionCount}問 / ${durationMinutes}分で開始`;
  button.disabled = questions.length < questionCount;
}

async function startExam() {
  try {
    const questionCount = Number(document.querySelector('#examQuestionCount')?.value || meta.examConfig.questionCount);
    const durationMinutes = Number(document.querySelector('#examDurationMinutes')?.value || meta.examConfig.durationMinutes);
    const started = await api.startExam(questionCount, durationMinutes);
    started.questions.forEach(q => questionById.set(q.id, q));
    session = {
      id: started.examId,
      mode: 'exam',
      questionIds: started.questions.map(q => q.id),
      index: 0,
      answers: {},
      flags: {},
      feedback: {},
      startedAt: started.startedAt,
      expiresAt: started.expiresAt
    };
    saveSession();
    questionView();
  } catch (error) {
    showToast(error.message);
  }
}

function startLearningFromFilters() {
  const category = document.querySelector('#cat').value;
  const tag = document.querySelector('#tag').value;
  const diff = Number(document.querySelector('#diff').value || 0);
  const onlyWrong = document.querySelector('#onlyWrong').checked;
  const onlyWeak = document.querySelector('#onlyWeak').checked;
  const onlyReview = document.querySelector('#onlyReview').checked;
  const onlyUnknown = document.querySelector('#onlyUnknown').checked;
  const randomize = document.querySelector('#randomize').checked;

  let pool = questions.filter(q =>
    (!category || q.category === category) &&
    (!tag || q.tags.includes(tag)) &&
    (!diff || q.difficulty === diff)
  );
  if (onlyWrong) pool = pool.filter(q => (userState.questionStats[q.id]?.incorrect ?? 0) > 0);
  if (onlyWeak) pool = pool.filter(q => {
    const s = userState.questionStats[q.id];
    return s?.attempts > 0 && (s.correct / s.attempts * 100) < 65;
  });
  if (onlyReview) pool = pool.filter(q => userState.reviewIds.includes(q.id));
  if (onlyUnknown) pool = pool.filter(q => userState.unknownIds.includes(q.id));
  if (!pool.length) return showToast('条件に一致する問題がありません');
  startLearning(randomize ? shuffled(pool) : pool);
}

function startLearning(pool) {
  session = {
    id: `learn-${Date.now()}`,
    mode: 'learning',
    questionIds: pool.map(q => q.id),
    index: 0,
    answers: {},
    flags: {},
    feedback: {},
    startedAt: nowIso(),
    expiresAt: null
  };
  saveSession();
  questionView();
}

function resumeSession() {
  if (!session) return homeView();
  session.feedback ??= {};
  session.questionIds = session.questionIds.filter(id => questionById.has(id));
  if (!session.questionIds.length) {
    session = null;
    storage.clearActiveSession();
    return homeView();
  }
  session.index = Math.min(session.index, session.questionIds.length - 1);
  if (session.mode === 'exam' && new Date(session.expiresAt).getTime() <= Date.now()) finishExam(true);
  else questionView();
}

function getCurrentQuestion() {
  return questionById.get(session.questionIds[session.index]);
}

function sessionCounts() {
  const ids = session.questionIds;
  const answered = ids.filter(id => (session.answers[id]?.length ?? 0) > 0).length;
  const review = ids.filter(id => session.flags[id]?.review).length;
  const unknown = ids.filter(id => session.flags[id]?.unknown).length;
  return { answered, review, unknown, total: ids.length };
}

function questionView(preserveScroll = false) {
  const previousY = window.scrollY;
  if (!session) return homeView();
  const q = getCurrentQuestion();
  if (!q) return homeView();

  const counts = sessionCounts();
  const selected = session.answers[q.id] ?? [];
  const feedback = session.feedback?.[q.id] ?? null;
  const checked = !!feedback;
  const isLearning = session.mode === 'learning';
  const review = session.flags[q.id]?.review;
  const unknown = session.flags[q.id]?.unknown;
  const progress = Math.round((counts.answered / counts.total) * 100);

  app.innerHTML = `
  <main class="page with-bottom-nav">
    <header class="exam-header">
      <div class="exam-header-inner">
        <div class="exam-title-row">
          <div class="exam-title">Java Silver SE 17 <span style="color:var(--muted);font-weight:600">${isLearning ? '学習' : '模擬試験'}</span></div>
          <div class="exam-actions">
            <button class="btn btn-outline" id="homeBtn">ホーム</button>
            ${!isLearning ? '<button class="btn btn-ghost" id="finishBtn">終了確認</button>' : ''}
          </div>
        </div>
        <div class="stats-strip" style="margin-top:10px;margin-bottom:8px">
          <div class="stat"><span class="stat-label">現在位置</span><span class="stat-value">問${session.index + 1} / ${counts.total}</span></div>
          <div class="stat"><span class="stat-label">${isLearning ? 'モード' : '残り時間'}</span><span class="stat-value ${!isLearning ? 'timer' : ''}" id="timer">${isLearning ? 'Java API採点' : '--:--'}</span></div>
          <div class="stat"><span class="stat-label">回答済み</span><span class="stat-value">${counts.answered} / ${counts.total}</span></div>
          <div class="stat"><span class="stat-label">要確認</span><span class="stat-value">? ${counts.unknown} / ⚑ ${counts.review}</span></div>
        </div>
        <div class="progress-wrap"><div class="progress-line"><div style="width:${progress}%"></div></div></div>
      </div>
    </header>

    <section class="card question-card">
      <div class="question-kicker">QUESTION ${session.index + 1} · ${q.multipleChoice ? '複数選択' : '単一選択'}</div>
      <h1 class="question-title">${esc(q.question)}</h1>
      ${q.code ? `<div class="code-wrap"><span class="code-label">Java 17</span><pre class="code"><code>${esc(q.code)}</code></pre></div>` : ''}
      <div class="choice-list">
        ${q.choices.map(c => {
          const selectedNow = selected.includes(c.id);
          let cls = selectedNow ? 'selected' : '';
          if (checked && feedback.correctAnswers.includes(c.id)) cls += ' correct';
          else if (checked && selectedNow && !feedback.correctAnswers.includes(c.id)) cls += ' incorrect';
          return `<label class="choice ${cls}">
            <input type="${q.multipleChoice ? 'checkbox' : 'radio'}" name="answer" value="${c.id}" ${selectedNow ? 'checked' : ''} ${checked ? 'disabled' : ''}>
            <span class="choice-text"><span class="choice-prefix">${c.id}.</span>${esc(c.text)}</span>
          </label>`;
        }).join('')}
      </div>

      <div class="question-meta">
        <span class="pill primary">${esc(q.category)}</span>
        <span class="pill">難易度 ${'★'.repeat(q.difficulty)}${'☆'.repeat(5-q.difficulty)}</span>
        ${q.tags.slice(0, 5).map(t => `<span class="pill">#${esc(t)}</span>`).join('')}
      </div>

      ${isLearning && !checked ? '<button class="btn btn-primary btn-wide" id="checkBtn" style="margin-top:20px">Javaで答え合わせ</button>' : ''}
      ${checked ? renderFeedback(q, feedback) : ''}
    </section>

    <nav class="bottom-nav" aria-label="問題ナビゲーション">
      <div class="bottom-nav-inner">
        <button class="btn btn-outline" id="prevBtn" ${session.index === 0 ? 'disabled' : ''}>← 前へ</button>
        <button class="btn btn-outline" id="listBtn">問題一覧</button>
        <button class="btn btn-outline ${review ? 'active-review' : ''}" id="reviewBtn">⚑ 見直し</button>
        <button class="btn btn-outline ${unknown ? 'active-unknown' : ''}" id="unknownBtn">? 分からない</button>
        <button class="btn btn-primary" id="nextBtn">${session.index === counts.total - 1 ? (isLearning ? '終了' : '次へ') : '次へ →'}</button>
      </div>
    </nav>
  </main>`;

  document.querySelectorAll('input[name="answer"]').forEach(input => input.addEventListener('change', onAnswerChange));
  document.querySelector('#prevBtn')?.addEventListener('click', () => move(-1));
  document.querySelector('#nextBtn')?.addEventListener('click', () => move(1));
  document.querySelector('#listBtn')?.addEventListener('click', openQuestionList);
  document.querySelector('#reviewBtn')?.addEventListener('click', () => toggleFlag('review'));
  document.querySelector('#unknownBtn')?.addEventListener('click', () => toggleFlag('unknown'));
  document.querySelector('#checkBtn')?.addEventListener('click', checkLearningAnswer);
  document.querySelector('#finishBtn')?.addEventListener('click', openFinishConfirm);
  document.querySelector('#homeBtn')?.addEventListener('click', () => { saveSession(); homeView(); });

  if (!isLearning) startTimer(); else stopTimer();
  if (preserveScroll) window.scrollTo(0, previousY); else window.scrollTo(0, 0);
}

function renderFeedback(q, feedback) {
  return `<div class="feedback ${feedback.correct ? 'good' : 'bad'}">
    <h3>${feedback.correct ? '✓ 正解' : '✕ 不正解'}</h3>
    <p><strong>正解：</strong>${feedback.correctAnswers.join(', ')}</p>
    <p>${esc(feedback.explanation)}</p>
    <ul class="explanation-list">${q.choices.map(c => `<li><strong>${c.id}.</strong> ${esc(feedback.choiceExplanations?.[c.id] ?? '')}</li>`).join('')}</ul>
  </div>`;
}

function onAnswerChange(e) {
  const q = getCurrentQuestion();
  if (!q || session.feedback?.[q.id]) return;
  session.answers[q.id] = q.multipleChoice
    ? [...document.querySelectorAll('input[name="answer"]:checked')].map(x => x.value)
    : [e.target.value];
  saveSession();
  questionView(true);
}

function toggleFlag(flag) {
  const q = getCurrentQuestion();
  session.flags[q.id] ??= {};
  session.flags[q.id][flag] = !session.flags[q.id][flag];
  saveSession();
  questionView(true);
}

function move(delta) {
  if (!session) return;
  const next = session.index + delta;
  if (next < 0) return;
  if (next >= session.questionIds.length) {
    if (session.mode === 'exam') return openFinishConfirm();
    storage.clearActiveSession();
    session = null;
    return homeView();
  }
  session.index = next;
  saveSession();
  questionView();
}

async function checkLearningAnswer() {
  const q = getCurrentQuestion();
  const selected = session.answers[q.id] ?? [];
  if (!selected.length) return showToast('選択肢を選んでください');
  if (session.feedback?.[q.id]) return;

  const button = document.querySelector('#checkBtn');
  if (button) { button.disabled = true; button.textContent = 'Javaで採点中…'; }

  try {
    const feedback = await api.checkAnswer(q.id, selected);
    session.feedback[q.id] = feedback;
    recordAttempt(q.id, feedback.correct);
    persistFlagsFromSession(q.id);
    saveUserState();
    saveSession();
    questionView(true);
  } catch (error) {
    if (button) { button.disabled = false; button.textContent = 'Javaで答え合わせ'; }
    showToast(error.message);
  }
}

function openQuestionList() {
  const counts = sessionCounts();
  const modal = showModal(`
    <h2>問題一覧</h2>
    <p style="color:var(--muted);margin:0">回答済み ${counts.answered}/${counts.total} · 分からない ${counts.unknown} · 見直し ${counts.review}</p>
    <div class="question-grid">
      ${session.questionIds.map((id, i) => {
        const answered = (session.answers[id]?.length ?? 0) > 0;
        const f = session.flags[id] ?? {};
        return `<button class="qnum ${answered ? 'answered' : ''} ${f.review ? 'review' : ''} ${f.unknown ? 'unknown' : ''} ${i === session.index ? 'current' : ''}" data-qindex="${i}">${i + 1}</button>`;
      }).join('')}
    </div>
    <div class="legend"><span>未回答</span><span class="l-answered">回答済み</span><span class="l-review">見直し</span><span class="l-unknown">分からない</span></div>
    <div class="modal-footer"><button class="btn btn-ghost" data-close-modal>閉じる</button></div>`);
  modal.querySelectorAll('[data-qindex]').forEach(btn => btn.addEventListener('click', () => {
    session.index = Number(btn.dataset.qindex);
    saveSession();
    modal.remove();
    questionView();
  }));
}

function openFinishConfirm() {
  const c = sessionCounts();
  showModal(`
    <h2>終了前確認</h2>
    <p style="line-height:1.8">回答済み <strong>${c.answered}/${c.total}</strong><br>未回答 <strong>${c.total - c.answered}</strong>問<br>見直し <strong>${c.review}</strong>問<br>分からない <strong>${c.unknown}</strong>問</p>
    <p style="color:var(--muted)">終了するとJavaサーバーで採点します。</p>
    <div class="modal-footer">
      <button class="btn btn-ghost" data-close-modal>試験に戻る</button>
      <button class="btn btn-danger" id="confirmFinish">Javaで採点して終了</button>
    </div>`);
  document.querySelector('#confirmFinish')?.addEventListener('click', () => {
    document.querySelector('.modal-backdrop')?.remove();
    finishExam(false);
  });
}

async function finishExam(auto = false) {
  if (!session || session.mode !== 'exam') return;
  stopTimer();
  const exam = session;

  try {
    const graded = await api.submitExam(exam.questionIds, exam.answers);

    for (const grade of graded.questionResults) {
      if (grade.answered) recordAttempt(grade.questionId, grade.correct);
      persistFlagsFromSession(grade.questionId);
    }

    const result = {
      id: exam.id,
      finishedAt: nowIso(),
      startedAt: exam.startedAt,
      autoFinished: auto,
      score: graded.score,
      total: graded.total,
      percent: graded.percent,
      passed: graded.passed,
      passLine: graded.passLine,
      questionIds: exam.questionIds,
      answers: exam.answers,
      flags: exam.flags,
      wrongIds: graded.wrongIds,
      reviewIds: exam.questionIds.filter(id => exam.flags[id]?.review),
      unknownIds: exam.questionIds.filter(id => exam.flags[id]?.unknown),
      categories: graded.categories
    };

    userState.examHistory = [result, ...(userState.examHistory ?? [])].slice(0, 20);
    saveUserState();
    storage.clearActiveSession();
    session = null;
    currentResult = result;
    resultView(result);
  } catch (error) {
    showToast(`採点できませんでした: ${error.message}`);
    session = exam;
    saveSession();
    questionView();
  }
}

function resultView(result) {
  stopTimer();
  if (!result) return homeView();
  const degree = Math.min(360, Math.round(result.percent * 3.6));
  const cats = Object.entries(result.categories ?? {}).sort((a, b) => a[0].localeCompare(b[0], 'ja'));

  app.innerHTML = `
  <main class="page">
    <div class="topbar">
      <div class="brand"><div class="brand-badge">J17</div><div>模擬試験結果</div></div>
      <button class="btn btn-outline" id="resultHome">ホーム</button>
    </div>
    <section class="card result-hero">
      <div class="score-ring" style="--score-deg:${degree}deg"><div><strong>${result.percent}%</strong><span>${result.score} / ${result.total}</span></div></div>
      <h1 class="${result.passed ? 'result-pass' : 'result-fail'}">${result.passed ? '合格ライン到達' : 'あと一歩'}</h1>
      <p>合格ライン ${result.passLine}% ${result.autoFinished ? '· 時間切れで自動採点' : ''}</p>
    </section>

    <h2 class="section-title">カテゴリ別正答率</h2>
    <section class="card" style="padding:12px 18px;overflow:auto">
      <table class="category-table"><thead><tr><th>カテゴリ</th><th>正解</th><th>正答率</th></tr></thead><tbody>
      ${cats.map(([cat, v]) => `<tr><td>${esc(cat)}</td><td>${v.correct}/${v.total}</td><td>${v.percent}%</td></tr>`).join('')}
      </tbody></table>
    </section>

    <h2 class="section-title">間違えた問題 (${result.wrongIds?.length ?? 0})</h2>
    <section class="result-list">
      ${(result.wrongIds ?? []).length ? result.wrongIds.map(id => {
        const q = questionById.get(id); if (!q) return '';
        const num = result.questionIds.indexOf(id) + 1;
        const selected = result.answers?.[id] ?? [];
        const answerText = selected.length ? selected.join(', ') : '未回答';
        return `<div class="result-item">
          <strong>問${num} · ${esc(q.category)}</strong>
          <div class="result-question-preview">${esc(q.question)}</div>
          <div class="result-answer-preview">あなたの回答：<strong>${esc(answerText)}</strong></div>
          <div class="result-item-actions">
            <button class="btn btn-primary" data-detail-id="${esc(id)}">問題・コード・解説を確認</button>
            <button class="btn btn-outline" data-review-id="${esc(id)}">この問題をもう一度解く</button>
          </div>
          <div class="result-review-panel" data-detail-panel="${esc(id)}" hidden></div>
        </div>`;
      }).join('') : '<div class="card empty">全問正解です。</div>'}
    </section>

    <h2 class="section-title">見直し問題 (${result.reviewIds?.length ?? 0})</h2>
    <section class="result-list">
      ${(result.reviewIds ?? []).length ? result.reviewIds.map(id => {
        const q = questionById.get(id); if (!q) return '';
        return `<div class="result-item"><strong>${esc(q.id)}</strong><div style="margin-top:6px;line-height:1.6">${esc(q.question)}</div><button class="btn btn-outline" data-review-id="${id}">学習モードで開く</button></div>`;
      }).join('') : '<div class="card empty">見直し登録はありません。</div>'}
    </section>
  </main>`;

  document.querySelector('#resultHome')?.addEventListener('click', homeView);
  document.querySelectorAll('[data-detail-id]').forEach(btn => btn.addEventListener('click', () => {
    toggleResultWrongDetail(result, btn);
  }));
  document.querySelectorAll('[data-review-id]').forEach(btn => btn.addEventListener('click', () => {
    const q = questionById.get(btn.dataset.reviewId);
    if (q) startLearning([q]);
  }));
}

async function toggleResultWrongDetail(result, button) {
  const id = button.dataset.detailId;
  const q = questionById.get(id);
  const panel = [...document.querySelectorAll('[data-detail-panel]')]
    .find(el => el.dataset.detailPanel === id);
  if (!q || !panel) return;

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
    result.answerFeedback ??= {};
    let feedback = result.answerFeedback[id];
    if (!feedback) {
      feedback = await api.checkAnswer(id, result.answers?.[id] ?? []);
      result.answerFeedback[id] = feedback;

      const historyResult = (userState.examHistory ?? []).find(item => item.id === result.id);
      if (historyResult) historyResult.answerFeedback = result.answerFeedback;
      saveUserState();
    }

    const num = result.questionIds.indexOf(id) + 1;
    panel.innerHTML = renderWrongAnswerDetail(q, result.answers?.[id] ?? [], feedback, num);
    panel.dataset.loaded = 'true';
    button.textContent = '詳細を閉じる';
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (error) {
    panel.hidden = true;
    panel.innerHTML = '';
    button.textContent = '問題・コード・解説を確認';
    showToast(`解説を読み込めませんでした: ${error.message}`);
  } finally {
    button.disabled = false;
  }
}

function startTimer() {
  stopTimer();
  const update = () => {
    if (!session || session.mode !== 'exam') return;
    const el = document.querySelector('#timer');
    const ms = new Date(session.expiresAt).getTime() - Date.now();
    if (ms <= 0) return finishExam(true);
    if (el) {
      el.textContent = formatTime(ms);
      el.classList.toggle('danger', ms <= 5 * 60_000);
    }
  };
  update();
  timerId = setInterval(update, 1000);
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

async function init() {
  app.innerHTML = '<main class="page"><section class="card empty">Javaサーバーから問題バンクを読み込み中…</section></main>';
  try {
    [meta, questions] = await Promise.all([api.getMeta(), api.getQuestions()]);
    questionById = new Map(questions.map(q => [q.id, q]));
    userState.reviewIds = (userState.reviewIds ?? []).filter(id => questionById.has(id));
    userState.unknownIds = (userState.unknownIds ?? []).filter(id => questionById.has(id));
    if (session?.questionIds) session.questionIds = session.questionIds.filter(id => questionById.has(id));
    if (session?.mode === 'exam' && new Date(session.expiresAt).getTime() <= Date.now()) finishExam(true);
    else homeView();
  } catch (error) {
    console.error(error);
    app.innerHTML = `<main class="page"><section class="card hero"><h1>Javaサーバー接続エラー</h1><p>${esc(error.message)}</p><p><code>mvn spring-boot:run</code> でSpring Bootを起動してから <code>http://localhost:8080</code> を開いてください。</p></section></main>`;
  }
}

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(console.warn));
}

init();
