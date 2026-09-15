package com.javasilver.trainer.dto;

import java.util.List;
import java.util.Map;

public record ExamResultResponse(
        int score,
        int total,
        double percent,
        boolean passed,
        double passLine,
        List<String> wrongIds,
        Map<String, CategoryScore> categories,
        List<QuestionGrade> questionResults
) {
}
