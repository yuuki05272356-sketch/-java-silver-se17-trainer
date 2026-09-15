package com.javasilver.trainer.dto;

import java.util.List;
import java.util.Map;

public record AnswerCheckResponse(
        boolean correct,
        List<String> correctAnswers,
        String explanation,
        Map<String, String> choiceExplanations
) {
}
