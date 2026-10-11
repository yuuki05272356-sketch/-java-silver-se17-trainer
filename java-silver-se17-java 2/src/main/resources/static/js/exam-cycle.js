export function answeredQuestionIds(questionStats = {}, validIds = []) {
  const valid = new Set(validIds);
  return Object.entries(questionStats)
    .filter(([id, stat]) => valid.has(id) && Number(stat?.attempts ?? 0) > 0)
    .map(([id]) => id);
}
