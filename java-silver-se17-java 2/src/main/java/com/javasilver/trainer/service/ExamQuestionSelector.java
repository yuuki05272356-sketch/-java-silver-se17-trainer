package com.javasilver.trainer.service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.function.Function;

public final class ExamQuestionSelector {

    private ExamQuestionSelector() {
    }

    public static <T> List<T> select(
            List<T> source,
            int count,
            Collection<String> excludedIds,
            Function<T, String> idExtractor
    ) {
        if (count < 0 || count > source.size()) {
            throw new IllegalArgumentException("count out of range");
        }

        Set<String> excluded = excludedIds == null
                ? Set.of()
                : new HashSet<>(excludedIds);

        var fresh = new ArrayList<T>();
        var seen = new ArrayList<T>();

        for (T item : source) {
            if (excluded.contains(idExtractor.apply(item))) {
                seen.add(item);
            } else {
                fresh.add(item);
            }
        }

        Collections.shuffle(fresh);
        Collections.shuffle(seen);

        var selected = new ArrayList<T>(count);
        int freshCount = Math.min(count, fresh.size());
        selected.addAll(fresh.subList(0, freshCount));

        int remaining = count - selected.size();
        if (remaining > 0) {
            selected.addAll(seen.subList(0, remaining));
        }

        return List.copyOf(selected);
    }
}
