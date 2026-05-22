import assert from "node:assert/strict";
import test from "node:test";

import { summarize_timing_results } from "../src/evaluation.js";
import type { benchmark_eval_result } from "../src/types.js";

const create_eval_result = (
  duration_ms: number,
  latency_ms: number | null,
  generation_time_ms: number | null,
): benchmark_eval_result => ({
  prompt: "Sentence: The report are due tomorrow.",
  expected: "mistake",
  output: "mistake",
  result: {
    type: "pass_fail",
    passed: true,
  },
  timing: {
    duration_ms,
    openrouter: {
      generation_id: "gen-test",
      latency_ms,
      generation_time_ms,
    },
  },
});

test("summarize_timing_results averages local duration", () => {
  assert.deepEqual(
    summarize_timing_results([
      create_eval_result(100, 80, 70),
      create_eval_result(300, 240, 210),
    ]),
    {
      average_duration_ms: 200,
      average_openrouter_latency_ms: 160,
      average_openrouter_generation_time_ms: 140,
    },
  );
});

test("summarize_timing_results ignores null OpenRouter timings", () => {
  assert.deepEqual(
    summarize_timing_results([
      create_eval_result(100, null, null),
      create_eval_result(300, 240, 210),
    ]),
    {
      average_duration_ms: 200,
      average_openrouter_latency_ms: 240,
      average_openrouter_generation_time_ms: 210,
    },
  );
});

test("summarize_timing_results handles empty eval lists", () => {
  assert.deepEqual(summarize_timing_results([]), {
    average_duration_ms: 0,
    average_openrouter_latency_ms: null,
    average_openrouter_generation_time_ms: null,
  });
});
