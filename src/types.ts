export type evaluator_result = number | boolean;

export type evaluator_function = (
  output: string,
  expected?: string,
) => evaluator_result;

export interface benchmark_eval {
  system_prompt?: string;
  prompt: string;
  expected: string;
  evaluator:
    | {
        type: "exact_match";
      }
    | {
        type: "includes";
      }
    | {
        type: "function";
        func: evaluator_function;
      };
}

export interface benchmark_opts {
  name: string;
  system_prompt?: string;
  evals: benchmark_eval[];
}

export interface model_opts {
  name: string;
  reasoning?: "low" | "medium" | "high";
}

export type model_input = string | model_opts;

export type eval_result =
  | {
      type: "pass_fail";
      passed: boolean;
    }
  | {
      type: "score";
      score: number;
    };

export type eval_summary =
  | {
      type: "pass_fail";
      passed: boolean;
      passed_evals: number;
      total_evals: number;
    }
  | {
      type: "score";
      score: number;
    };

export interface benchmark_eval_result {
  system_prompt?: string;
  prompt: string;
  expected: string;
  output: string;
  result: eval_result;
}

export interface model_benchmark_result {
  name: string;
  evals: benchmark_eval_result[];
  summary: eval_summary;
}

export interface model_benchmark_summary_result {
  name: string;
  summary: eval_summary;
}

export interface model_result {
  model: string;
  benchmarks: model_benchmark_summary_result[];
}

export interface verbose_model_result {
  model: string;
  benchmarks: model_benchmark_result[];
}

export interface run_benchmarks_options {
  api_key: string;
  models: model_input[];
  benchmarks: benchmark_opts[];
  output_file?: string;
}
