import assert from "node:assert/strict";
import test from "node:test";

import { summarize_timing_results } from "../src/evaluation.js";
import type { benchmark_eval_result } from "../src/types.js";

const create_eval_result = (
  duration_ms: number,
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
  },
});

test("summarize_timing_results averages local duration", () => {
  assert.deepEqual(
    summarize_timing_results([
      create_eval_result(100),
      create_eval_result(300),
    ]),
    {
      average_duration_ms: 200,
    },
  );
});

test("summarize_timing_results handles empty eval lists", () => {
  assert.deepEqual(summarize_timing_results([]), {
    average_duration_ms: 0,
  });
});
