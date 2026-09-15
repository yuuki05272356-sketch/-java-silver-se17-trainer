package com.javasilver.trainer.model;

import java.util.List;

public record QuestionFileManifest(int version, List<String> files) {
    public QuestionFileManifest {
        files = files == null ? List.of() : List.copyOf(files);
    }
}
