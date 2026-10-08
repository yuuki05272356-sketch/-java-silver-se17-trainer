export function normalizeExamCycleIds(ids = [], validIds = []) {
  const valid = new Set(validIds);
  return [...new Set(ids)].filter(id => valid.has(id));
}

export function advanceExamCycle(previousIds = [], selectedIds = [], totalQuestionCount = 0) {
  if (totalQuestionCount <= 0) return [];

  const previous = new Set(previousIds);
  const selected = [...new Set(selectedIds)];
  const unseenSelected = selected.filter(id => !previous.has(id));

  if (previous.size + unseenSelected.length >= totalQuestionCount) {
    return selected.filter(id => previous.has(id));
  }

  return [...previous, ...unseenSelected];
}
