export {};

type TargetParams = Record<string, unknown>;

interface YmFunction {
  (id: number, action: "hit", url: string): void;
  (
    id: number,
    action: "reachGoal",
    target: string,
    params?: TargetParams,
  ): void;
  (id: number, action: string, ...args: unknown[]): void;
}

declare global {
  interface Window {
    ym?: YmFunction;
  }
}
