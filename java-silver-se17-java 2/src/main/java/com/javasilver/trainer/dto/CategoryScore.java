package com.javasilver.trainer.dto;

public record CategoryScore(int total, int correct, double percent) {
    public static CategoryScore of(int total, int correct) {
        double percent = total == 0 ? 0.0 : Math.round((correct * 1000.0 / total)) / 10.0;
        return new CategoryScore(total, correct, percent);
    }
}
