package com.javasilver.trainer.dto;

import java.util.List;

public record ExamStartRequest(
        Integer questionCount,
        Integer durationMinutes,
        List<String> excludedQuestionIds
) {
}
