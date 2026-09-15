package com.javasilver.trainer.controller;

import com.javasilver.trainer.dto.ExamResultResponse;
import com.javasilver.trainer.dto.ExamStartRequest;
import com.javasilver.trainer.dto.ExamStartResponse;
import com.javasilver.trainer.dto.ExamSubmitRequest;
import com.javasilver.trainer.service.ExamService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/exams")
public class ExamController {

    private final ExamService examService;

    public ExamController(ExamService examService) {
        this.examService = examService;
    }

    @PostMapping("/start")
    public ExamStartResponse start(@RequestBody(required = false) ExamStartRequest request) {
        return examService.start(request);
    }

    @PostMapping("/submit")
    public ExamResultResponse submit(@RequestBody ExamSubmitRequest request) {
        return examService.grade(request);
    }
}
