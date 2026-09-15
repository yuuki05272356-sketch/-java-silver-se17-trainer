package com.javasilver.trainer.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;
import java.util.Map;

/**
 * 問題バンクJSONをJavaオブジェクトへ変換するモデル。
 * Silver学習ポイント: record / List / Map / null / defensive copy。
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record Question(
        String id,
        String question,
        String code,
        List<Choice> choices,
        List<String> correctAnswers,
        String explanation,
        Map<String, String> choiceExplanations,
        String category,
        List<String> tags,
        int difficulty,
        boolean multipleChoice
) {
    public Question {
        choices = choices == null ? List.of() : List.copyOf(choices);
        correctAnswers = correctAnswers == null ? List.of() : List.copyOf(correctAnswers);
        choiceExplanations = choiceExplanations == null ? Map.of() : Map.copyOf(choiceExplanations);
        tags = tags == null ? List.of() : List.copyOf(tags);
    }
}
