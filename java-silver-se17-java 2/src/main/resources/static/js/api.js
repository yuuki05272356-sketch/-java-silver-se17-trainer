async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {})
    }
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      message = body.message ?? message;
    } catch (_) {
      // JSONでないエラー本文は無視する。
    }
    throw new Error(message);
  }

  return response.status === 204 ? null : response.json();
}

export const api = {
  getMeta() {
    return request('/api/meta');
  },

  getQuestions() {
    return request('/api/questions');
  },

  checkAnswer(questionId, selectedAnswers) {
    return request('/api/answers/check', {
      method: 'POST',
      body: JSON.stringify({ questionId, selectedAnswers })
    });
  },

  startExam(questionCount, durationMinutes) {
    return request('/api/exams/start', {
      method: 'POST',
      body: JSON.stringify({ questionCount, durationMinutes })
    });
  },

  submitExam(questionIds, answers) {
    return request('/api/exams/submit', {
      method: 'POST',
      body: JSON.stringify({ questionIds, answers })
    });
  }
};
