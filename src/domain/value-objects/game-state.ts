/**
 * ゲーム状態を表現する値オブジェクト
 */
export class GameState {
  private constructor(private readonly _value: string) {}

  /**
   * 未開始状態
   */
  static notStarted(): GameState {
    return new GameState("NotStarted");
  }

  /**
   * 実行中状態
   */
  static running(): GameState {
    return new GameState("Running");
  }

  /**
   * 一時停止中状態
   */
  static paused(): GameState {
    return new GameState("Paused");
  }

  /**
   * 完了状態（時間切れ）
   */
  static completed(): GameState {
    return new GameState("Completed");
  }

  /**
   * ゲームオーバー状態（体力ゼロ）
   */
  static gameOver(): GameState {
    return new GameState("GameOver");
  }

  /**
   * 未開始状態かどうか
   */
  isNotStarted(): boolean {
    return this._value === "NotStarted";
  }

  /**
   * 実行中状態かどうか
   */
  isRunning(): boolean {
    return this._value === "Running";
  }

  /**
   * 一時停止中状態かどうか
   */
  isPaused(): boolean {
    return this._value === "Paused";
  }

  /**
   * 完了状態かどうか
   */
  isCompleted(): boolean {
    return this._value === "Completed";
  }

  /**
   * ゲームオーバー状態かどうか
   */
  isGameOver(): boolean {
    return this._value === "GameOver";
  }

  /**
   * アクティブ状態かどうか（実行中または一時停止中）
   */
  isActive(): boolean {
    return this.isRunning() || this.isPaused();
  }

  /**
   * 終了状態かどうか（完了またはゲームオーバー）
   */
  isFinished(): boolean {
    return this.isCompleted() || this.isGameOver();
  }

  /**
   * 指定された状態に遷移可能かどうか
   */
  canTransitionTo(newState: GameState): boolean {
    // 終了状態からは遷移不可
    if (this.isFinished()) {
      return false;
    }

    // 未開始からは実行中のみ
    if (this.isNotStarted()) {
      return newState.isRunning();
    }

    // 実行中からは一時停止、完了、ゲームオーバーに遷移可能
    if (this.isRunning()) {
      return newState.isPaused() || newState.isCompleted() || newState.isGameOver();
    }

    // 一時停止中からは実行中、完了、ゲームオーバーに遷移可能
    if (this.isPaused()) {
      return newState.isRunning() || newState.isCompleted() || newState.isGameOver();
    }

    return false;
  }

  /**
   * 等価性の判定
   */
  equals(other: GameState): boolean {
    return this._value === other._value;
  }

  /**
   * 文字列表現
   */
  toString(): string {
    return this._value;
  }
}
