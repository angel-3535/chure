export interface eval_opts {
  name: string;
  cases: {
    prompt: string;
    expected: string;
    evaluator:
    | {
      type: "exact_match";
    }
    | {
      type: "function";
      func: (output: string, expected?: string) => number | boolean; //0-100;
    };
  }[];
  output: {
    format: "json";
    filename?: string;
  };
}

export const create_eval = (opts: eval_opts) => {
  return opts;
};
