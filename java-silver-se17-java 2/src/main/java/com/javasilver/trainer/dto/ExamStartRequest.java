package com.javasilver.trainer.dto;

public record ExamStartRequest(
        Integer questionCount,
        Integer durationMinutes
) {
}
