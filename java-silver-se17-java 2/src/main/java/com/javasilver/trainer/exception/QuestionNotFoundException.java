package com.javasilver.trainer.exception;

public class QuestionNotFoundException extends RuntimeException {
    public QuestionNotFoundException(String id) {
        super("問題が見つかりません: " + id);
    }
}
