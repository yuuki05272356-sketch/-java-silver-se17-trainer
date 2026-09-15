package com.javasilver.trainer.dto;

import com.javasilver.trainer.model.ExamConfig;

import java.util.List;

public record AppMetaResponse(
        ExamConfig examConfig,
        int questionCount,
        List<String> categories,
        List<String> tags
) {
}
