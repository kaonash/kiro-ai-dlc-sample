import { ManaGenerationTimer, TimerResult } from "./ManaGenerationTimer";

export interface GameSessionManager {
  getElapsedGameTime(): number;
  isPaused(): boolean;
}

export class HybridManaTimer implements ManaGenerationTimer {
  private intervalId: Timer | null = null;
  private intervalMs: number;
  private callback: (() => void) | null = null;
  private readonly gameSessionManager: GameSessionManager;

  constructor(gameSessionManager: GameSessionManager, intervalMs: number = 100) {
    this.gameSessionManager = gameSessionManager;
    this.intervalMs = intervalMs;
  }

  start(callback: () => void): TimerResult {
    if (!callback) {
      return {
        isSuccess: false,
        error: "コールバックが無効です"
      };
    }

    if (this.isRunning()) {
      return {
        isSuccess: false,
        error: "タイマーは既に開始されています"
      };
    }

    this.callback = callback;
    this.intervalId = setInterval(() => {
      this.tick();
    }, this.intervalMs);

    return { isSuccess: true };
  }

  stop(): TimerResult {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.callback = null;

    return { isSuccess: true };
  }

  isRunning(): boolean {
    return this.intervalId !== null;
  }

  setInterval(intervalMs: number): TimerResult {
    if (intervalMs <= 0) {
      return {
        isSuccess: false,
        error: "間隔は正の値である必要があります"
      };
    }

    if (this.isRunning()) {
      return {
        isSuccess: false,
        error: "動作中は間隔を変更できません"
      };
    }

    this.intervalMs = intervalMs;
    return { isSuccess: true };
  }

  getInterval(): number {
    return this.intervalMs;
  }

  private tick(): void {
    try {
      // ゲーム一時停止中はコールバックを呼ばない
      if (this.gameSessionManager.isPaused()) {
        return;
      }

      // コールバック実行
      if (this.callback) {
        this.callback();
      }
    } catch (error) {
      // コールバック内のエラーはログに記録するが、タイマーは継続
      console.error("ManaTimer callback error:", error);
    }
  }
}