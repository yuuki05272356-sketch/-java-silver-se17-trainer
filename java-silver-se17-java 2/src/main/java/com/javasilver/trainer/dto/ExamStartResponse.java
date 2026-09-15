package com.javasilver.trainer.dto;

import java.time.Instant;
import java.util.List;

public record ExamStartResponse(
        String examId,
        Instant startedAt,
        Instant expiresAt,
        List<QuestionView> questions
) {
}
