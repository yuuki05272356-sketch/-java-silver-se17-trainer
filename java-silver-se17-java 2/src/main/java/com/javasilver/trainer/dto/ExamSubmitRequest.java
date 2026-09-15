package com.javasilver.trainer.dto;

import java.util.List;
import java.util.Map;

public record ExamSubmitRequest(
        List<String> questionIds,
        Map<String, List<String>> answers
) {
    public ExamSubmitRequest {
        questionIds = questionIds == null ? List.of() : List.copyOf(questionIds);
        answers = answers == null ? Map.of() : Map.copyOf(answers);
    }
}
