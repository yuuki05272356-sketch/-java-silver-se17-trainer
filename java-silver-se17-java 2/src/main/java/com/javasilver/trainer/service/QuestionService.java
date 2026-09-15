package com.javasilver.trainer.service;

import com.javasilver.trainer.dto.AnswerCheckRequest;
import com.javasilver.trainer.dto.AnswerCheckResponse;
import com.javasilver.trainer.dto.QuestionView;
import com.javasilver.trainer.exception.QuestionNotFoundException;
import com.javasilver.trainer.model.Question;
import com.javasilver.trainer.repository.QuestionRepository;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;

@Service
public class QuestionService {

    private final QuestionRepository repository;

    public QuestionService(QuestionRepository repository) {
        this.repository = repository;
    }

    public List<QuestionView> search(String category, String tag, Integer difficulty) {
        return repository.findAll().stream()
                .filter(q -> category == null || category.isBlank() || q.category().equals(category))
                .filter(q -> tag == null || tag.isBlank() || q.tags().contains(tag))
                .filter(q -> difficulty == null || q.difficulty() == difficulty)
                .map(QuestionView::from)
                .toList();
    }

    public AnswerCheckResponse check(AnswerCheckRequest request) {
        var q = getQuestion(request.questionId());
        var correct = sameAnswers(request.selectedAnswers(), q.correctAnswers());
        return new AnswerCheckResponse(correct, q.correctAnswers(), q.explanation(), q.choiceExplanations());
    }

    public Question getQuestion(String id) {
        return repository.findById(id).orElseThrow(() -> new QuestionNotFoundException(id));
    }

    public boolean sameAnswers(List<String> selected, List<String> correct) {
        return selected.size() == correct.size()
                && new HashSet<>(selected).equals(new HashSet<>(correct));
    }
}
