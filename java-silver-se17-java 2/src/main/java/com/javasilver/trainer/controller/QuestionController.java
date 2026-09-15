package com.javasilver.trainer.controller;

import com.javasilver.trainer.dto.AnswerCheckRequest;
import com.javasilver.trainer.dto.AnswerCheckResponse;
import com.javasilver.trainer.dto.AppMetaResponse;
import com.javasilver.trainer.dto.QuestionView;
import com.javasilver.trainer.service.AppCatalogService;
import com.javasilver.trainer.service.QuestionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class QuestionController {

    private final QuestionService questionService;
    private final AppCatalogService catalogService;

    public QuestionController(QuestionService questionService, AppCatalogService catalogService) {
        this.questionService = questionService;
        this.catalogService = catalogService;
    }

    @GetMapping("/meta")
    public AppMetaResponse meta() {
        return catalogService.meta();
    }

    @GetMapping("/questions")
    public List<QuestionView> questions(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) Integer difficulty
    ) {
        return questionService.search(category, tag, difficulty);
    }

    @PostMapping("/answers/check")
    public AnswerCheckResponse check(@RequestBody AnswerCheckRequest request) {
        return questionService.check(request);
    }
}
