export type CellValue = 0 | 1 | 2;
export type Grid = CellValue[][];

export type SimulationResult = {
  steps: Grid[];
  minutes: number;
};

export type ExecuteResult =
  | {
      ok: true;
      minutes: number;
    }
  | {
      ok: false;
      error: string;
      scoldReason: "syntax" | "runtime" | "wrong" | "dumb" | "timeout";
      scoldMessage: string;
    };
