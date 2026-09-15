package com.javasilver.trainer.repository;

import com.javasilver.trainer.model.Question;

import java.util.List;
import java.util.Optional;

/**
 * 問題の保存場所を隠すinterface。
 * 将来DBへ移行してもService層を変えにくくする。
 */
public interface QuestionRepository {
    List<Question> findAll();
    Optional<Question> findById(String id);
}
