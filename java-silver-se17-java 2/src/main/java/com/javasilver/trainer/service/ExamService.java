package com.javasilver.trainer.service;

import com.javasilver.trainer.dto.CategoryScore;
import com.javasilver.trainer.dto.ExamResultResponse;
import com.javasilver.trainer.dto.ExamStartRequest;
import com.javasilver.trainer.dto.ExamStartResponse;
import com.javasilver.trainer.dto.ExamSubmitRequest;
import com.javasilver.trainer.dto.QuestionGrade;
import com.javasilver.trainer.dto.QuestionView;
import com.javasilver.trainer.repository.QuestionRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ExamService {

    private final QuestionRepository repository;
    private final QuestionService questionService;
    private final AppCatalogService catalogService;

    public ExamService(
            QuestionRepository repository,
            QuestionService questionService,
            AppCatalogService catalogService
    ) {
        this.repository = repository;
        this.questionService = questionService;
        this.catalogService = catalogService;
    }

    public ExamStartResponse start() {
        return start((ExamStartRequest) null);
    }

    public ExamStartResponse start(ExamStartRequest request) {
        var config = catalogService.examConfig();
        int questionCount = request == null || request.questionCount() == null
                ? config.questionCount()
                : request.questionCount();
        int durationMinutes = request == null || request.durationMinutes() == null
                ? config.durationMinutes()
                : request.durationMinutes();

        return start(questionCount, durationMinutes);
    }

    public ExamStartResponse start(int questionCount, int durationMinutes) {
        var config = catalogService.examConfig();

        if (!config.questionCountOptions().contains(questionCount)) {
            throw new IllegalArgumentException(
                    "問題数は " + joinOptions(config.questionCountOptions()) + " 問から選択してください。"
            );
        }
        if (!config.durationMinuteOptions().contains(durationMinutes)) {
            throw new IllegalArgumentException(
                    "制限時間は " + joinOptions(config.durationMinuteOptions()) + " 分から選択してください。"
            );
        }

        var pool = new ArrayList<>(repository.findAll());
        if (pool.size() < questionCount) {
            throw new IllegalArgumentException("模擬試験に必要な問題数が不足しています。");
        }

        Collections.shuffle(pool);
        var selected = pool.subList(0, questionCount).stream()
                .map(QuestionView::from)
                .toList();

        var startedAt = Instant.now();
        var expiresAt = startedAt.plus(durationMinutes, ChronoUnit.MINUTES);

        return new ExamStartResponse(UUID.randomUUID().toString(), startedAt, expiresAt, selected);
    }

    private String joinOptions(List<Integer> options) {
        return options.stream()
                .map(String::valueOf)
                .reduce((left, right) -> left + ", " + right)
                .orElse("");
    }

    public ExamResultResponse grade(ExamSubmitRequest request) {
        if (request.questionIds().isEmpty()) {
            throw new IllegalArgumentException("採点対象の問題がありません。");
        }

        int correctCount = 0;
        var wrongIds = new ArrayList<String>();
        var grades = new ArrayList<QuestionGrade>();
        var categoryCounters = new LinkedHashMap<String, int[]>();

        for (String id : request.questionIds()) {
            var q = questionService.getQuestion(id);
            var selected = request.answers().getOrDefault(id, List.of());
            var answered = !selected.isEmpty();
            var correct = answered && questionService.sameAnswers(selected, q.correctAnswers());

            if (correct) {
                correctCount++;
            } else {
                wrongIds.add(id);
            }
            grades.add(new QuestionGrade(id, answered, correct));

            var counter = categoryCounters.computeIfAbsent(q.category(), ignored -> new int[2]);
            counter[0]++;
            if (correct) {
                counter[1]++;
            }
        }

        int total = request.questionIds().size();
        double percent = Math.round(correctCount * 1000.0 / total) / 10.0;
        double passLine = catalogService.examConfig().passPercent();

        Map<String, CategoryScore> categories = new LinkedHashMap<>();
        categoryCounters.forEach((name, count) -> categories.put(name, CategoryScore.of(count[0], count[1])));

        return new ExamResultResponse(
                correctCount,
                total,
                percent,
                percent >= passLine,
                passLine,
                List.copyOf(wrongIds),
                Map.copyOf(categories),
                List.copyOf(grades)
        );
    }
}
