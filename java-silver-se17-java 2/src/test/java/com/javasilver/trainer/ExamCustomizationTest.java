package com.javasilver.trainer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Duration;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ExamCustomizationTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Test
    void metaPublishesSelectableQuestionCountsAndDurations() throws Exception {
        mockMvc.perform(get("/api/meta"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.examConfig.questionCountOptions.length()").value(5))
                .andExpect(jsonPath("$.examConfig.questionCountOptions[0]").value(5))
                .andExpect(jsonPath("$.examConfig.questionCountOptions[4]").value(60))
                .andExpect(jsonPath("$.examConfig.durationMinuteOptions.length()").value(6))
                .andExpect(jsonPath("$.examConfig.durationMinuteOptions[0]").value(5))
                .andExpect(jsonPath("$.examConfig.durationMinuteOptions[5]").value(90));
    }

    @Test
    void startExamUsesRequestedQuestionCountAndDuration() throws Exception {
        var result = mockMvc.perform(post("/api/exams/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"questionCount":5,"durationMinutes":10}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.questions.length()").value(5))
                .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        Instant startedAt = Instant.parse(body.get("startedAt").asText());
        Instant expiresAt = Instant.parse(body.get("expiresAt").asText());
        long seconds = Duration.between(startedAt, expiresAt).getSeconds();

        assertEquals(600, seconds);
    }

    @Test
    void startExamRejectsUnsupportedQuestionCount() throws Exception {
        mockMvc.perform(post("/api/exams/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"questionCount":15,"durationMinutes":10}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("問題数は 5, 10, 20, 30, 60 問から選択してください。"));
    }

    @Test
    void startExamRejectsUnsupportedDuration() throws Exception {
        mockMvc.perform(post("/api/exams/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"questionCount":20,"durationMinutes":15}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("制限時間は 5, 10, 20, 30, 60, 90 分から選択してください。"));
    }

    @Test
    void startExamWithoutSelectionsUsesCurrentBankDefault() throws Exception {
        var result = mockMvc.perform(post("/api/exams/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.questions.length()").value(60))
                .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        Instant startedAt = Instant.parse(body.get("startedAt").asText());
        Instant expiresAt = Instant.parse(body.get("expiresAt").asText());
        long seconds = Duration.between(startedAt, expiresAt).getSeconds();

        assertEquals(90 * 60L, seconds);
        assertTrue(body.get("questions").isArray());
    }
}
