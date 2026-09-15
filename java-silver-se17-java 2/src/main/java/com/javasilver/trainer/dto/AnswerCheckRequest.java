package com.javasilver.trainer.dto;

import java.util.List;

public record AnswerCheckRequest(String questionId, List<String> selectedAnswers) {
    public AnswerCheckRequest {
        selectedAnswers = selectedAnswers == null ? List.of() : List.copyOf(selectedAnswers);
    }
}
