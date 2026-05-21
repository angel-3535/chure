import assert from "node:assert/strict";
import test from "node:test";

import { format_pretty_results } from "../src/pretty-results.js";
import type { benchmark_result } from "../src/types.js";

test("format_pretty_results renders pass rates as unicode bars", () => {
  const results: benchmark_result[] = [
    {
      name: "capitals",
      models: [
        {
          model: "meta-llama/llama-3.1",
          summary: {
            type: "pass_fail",
            passed: false,
            passed_evals: 1,
            total_evals: 4,
          },
        },
        {
          model: "openai/gpt-4o-mini",
          summary: {
            type: "pass_fail",
            passed: false,
            passed_evals: 3,
            total_evals: 4,
          },
        },
      ],
    },
  ];

  assert.equal(
    format_pretty_results(results),
    [
      "Benchmark Results: capitals",
      "",
      "openai/gpt-4o-mini   ███████████████░░░░░ 75% | total: 4 | fail-count: 1",
      "meta-llama/llama-3.1 █████░░░░░░░░░░░░░░░ 25% | total: 4 | fail-count: 3",
    ].join("\n"),
  );
});

test("format_pretty_results rejects score summaries because pass rate is unavailable", () => {
  const results: benchmark_result[] = [
    {
      name: "summaries",
      models: [
        {
          model: "openai/gpt-4o-mini",
          summary: {
            type: "score",
            score: 87,
          },
        },
      ],
    },
  ];

  assert.throws(
    () => format_pretty_results(results),
    /Cannot format pretty pass-rate results/,
  );
});
