package com.javasilver.trainer.repository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.javasilver.trainer.exception.QuestionDataException;
import com.javasilver.trainer.model.Question;
import com.javasilver.trainer.model.QuestionFileManifest;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Repository;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Repository
public class JsonQuestionRepository implements QuestionRepository {

    private final ObjectMapper objectMapper;
    private List<Question> questions = List.of();
    private Map<String, Question> byId = Map.of();

    public JsonQuestionRepository(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void load() {
        try {
            var manifestResource = new ClassPathResource("question-bank/question-files.json");
            var manifest = objectMapper.readValue(manifestResource.getInputStream(), QuestionFileManifest.class);

            var loaded = new ArrayList<Question>();
            for (String file : manifest.files()) {
                var resource = new ClassPathResource("question-bank/" + file);
                var bank = objectMapper.readValue(
                        resource.getInputStream(),
                        new TypeReference<List<Question>>() { }
                );
                loaded.addAll(bank);
            }

            validate(loaded);
            this.questions = List.copyOf(loaded);

            var index = new HashMap<String, Question>();
            for (Question q : loaded) {
                index.put(q.id(), q);
            }
            this.byId = Map.copyOf(index);
        } catch (IOException e) {
            throw new QuestionDataException("問題バンクJSONの読み込みに失敗しました。", e);
        }
    }

    private void validate(List<Question> items) {
        var ids = new HashSet<String>();

        for (Question q : items) {
            if (q.id() == null || q.id().isBlank()) {
                throw new QuestionDataException("空の問題IDがあります。");
            }
            if (!ids.add(q.id())) {
                throw new QuestionDataException("問題IDが重複しています: " + q.id());
            }
            if (q.question() == null || q.question().isBlank()) {
                throw new QuestionDataException(q.id() + ": question が空です。");
            }
            if (q.choices().size() < 2) {
                throw new QuestionDataException(q.id() + ": choices は2件以上必要です。");
            }
            if (q.correctAnswers().isEmpty()) {
                throw new QuestionDataException(q.id() + ": correctAnswers が空です。");
            }
            if (q.difficulty() < 1 || q.difficulty() > 5) {
                throw new QuestionDataException(q.id() + ": difficulty は1〜5です。");
            }

            Set<String> choiceIds = new HashSet<>();
            for (var choice : q.choices()) {
                if (!choiceIds.add(choice.id())) {
                    throw new QuestionDataException(q.id() + ": 選択肢IDが重複しています: " + choice.id());
                }
            }
            for (String answer : q.correctAnswers()) {
                if (!choiceIds.contains(answer)) {
                    throw new QuestionDataException(q.id() + ": 存在しない正解IDです: " + answer);
                }
            }
            if (!q.multipleChoice() && q.correctAnswers().size() != 1) {
                throw new QuestionDataException(q.id() + ": 単一選択問題の正解は1つにしてください。");
            }
            if (q.multipleChoice() && q.correctAnswers().size() < 2) {
                throw new QuestionDataException(q.id() + ": 複数選択問題の正解は2つ以上にしてください。");
            }
        }
    }

    @Override
    public List<Question> findAll() {
        return questions;
    }

    @Override
    public Optional<Question> findById(String id) {
        return Optional.ofNullable(byId.get(id));
    }
}
