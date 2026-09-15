package com.javasilver.trainer.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.javasilver.trainer.dto.AppMetaResponse;
import com.javasilver.trainer.exception.QuestionDataException;
import com.javasilver.trainer.model.ExamConfig;
import com.javasilver.trainer.repository.QuestionRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;

@Service
public class AppCatalogService {

    private final ObjectMapper objectMapper;
    private final QuestionRepository repository;
    private ExamConfig examConfig;
    private List<String> categories = List.of();

    public AppCatalogService(ObjectMapper objectMapper, QuestionRepository repository) {
        this.objectMapper = objectMapper;
        this.repository = repository;
    }

    @PostConstruct
    public void loadConfig() {
        try {
            examConfig = objectMapper.readValue(
                    new ClassPathResource("question-bank/exam-config.json").getInputStream(),
                    ExamConfig.class
            );
            categories = List.copyOf(objectMapper.readValue(
                    new ClassPathResource("question-bank/categories.json").getInputStream(),
                    new TypeReference<List<String>>() { }
            ));
        } catch (IOException e) {
            throw new QuestionDataException("試験設定の読み込みに失敗しました。", e);
        }
    }

    public ExamConfig examConfig() {
        return examConfig;
    }

    public AppMetaResponse meta() {
        var tags = repository.findAll().stream()
                .flatMap(q -> q.tags().stream())
                .distinct()
                .sorted()
                .toList();

        return new AppMetaResponse(examConfig, repository.findAll().size(), categories, tags);
    }
}
