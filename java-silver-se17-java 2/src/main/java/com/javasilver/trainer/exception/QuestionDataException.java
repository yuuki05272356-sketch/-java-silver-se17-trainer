package com.javasilver.trainer.exception;

public class QuestionDataException extends RuntimeException {
    public QuestionDataException(String message) {
        super(message);
    }

    public QuestionDataException(String message, Throwable cause) {
        super(message, cause);
    }
}
