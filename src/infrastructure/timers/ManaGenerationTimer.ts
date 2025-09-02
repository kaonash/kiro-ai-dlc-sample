export interface TimerResult {
  isSuccess: boolean;
  error?: string;
}

export interface ManaGenerationTimer {
  start(callback: () => void): TimerResult;
  stop(): TimerResult;
  isRunning(): boolean;
  setInterval(intervalMs: number): TimerResult;
  getInterval(): number;
}
