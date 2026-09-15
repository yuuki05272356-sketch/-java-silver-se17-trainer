package com.javasilver.trainer.dto;

import com.javasilver.trainer.model.Choice;
import com.javasilver.trainer.model.Question;

import java.util.List;

/**
 * ブラウザへ公開する問題DTO。
 * 正解と解説は意図的に含めない。
 */
public record QuestionView(
        String id,
        String question,
        String code,
        List<Choice> choices,
        String category,
        List<String> tags,
        int difficulty,
        boolean multipleChoice
) {
    public static QuestionView from(Question q) {
        return new QuestionView(
                q.id(), q.question(), q.code(), q.choices(),
                q.category(), q.tags(), q.difficulty(), q.multipleChoice()
        );
    }
}
