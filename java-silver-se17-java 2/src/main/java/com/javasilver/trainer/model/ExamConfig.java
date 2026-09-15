package com.javasilver.trainer.model;

import java.util.List;

public record ExamConfig(
        String certification,
        String examName,
        String examCode,
        int questionCount,
        int durationMinutes,
        double passPercent,
        int javaVersion,
        List<Integer> questionCountOptions,
        List<Integer> durationMinuteOptions
) {
    public ExamConfig {
        questionCountOptions = questionCountOptions == null
                ? List.of(questionCount)
                : List.copyOf(questionCountOptions);
        durationMinuteOptions = durationMinuteOptions == null
                ? List.of(durationMinutes)
                : List.copyOf(durationMinuteOptions);
    }
}
