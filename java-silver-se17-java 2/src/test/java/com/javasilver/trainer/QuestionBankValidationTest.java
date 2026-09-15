package com.javasilver.trainer;

import com.javasilver.trainer.repository.QuestionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.HashSet;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class QuestionBankValidationTest {

    @Autowired
    QuestionRepository repository;

    @Test
    void questionBankAcceptsAnyPositiveSizeAndKeepsDataConsistent() {
        var questions = repository.findAll();
        var ids = new HashSet<String>();
        questions.forEach(q -> ids.add(q.id()));

        assertFalse(questions.isEmpty());
        assertEquals(questions.size(), ids.size());
        assertTrue(questions.stream().allMatch(q -> q.difficulty() >= 1 && q.difficulty() <= 5));
        assertFalse(questions.stream().anyMatch(q -> q.correctAnswers().isEmpty()));
        assertTrue(questions.stream().allMatch(q -> q.category() != null && !q.category().isBlank()));
        assertTrue(questions.stream().allMatch(q -> q.choices().size() >= 2));
        assertTrue(questions.stream().allMatch(q -> q.choices().stream()
                .allMatch(choice -> q.choiceExplanations().containsKey(choice.id()))));
    }
}
