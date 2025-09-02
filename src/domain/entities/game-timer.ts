import { TimeRemaining } from "../value-objects/time-remaining.js";

/**
 * 時刻プロバイダーインターフェース
 */
export interface TimeProvider {
  getCurrentTime(): number;
}

/**
 * システム時刻プロバイダー
 */
export class SystemTimeProvider implements TimeProvider {
  getCurrentTime(): number {
    return Date.now();
  }
}

/**
 * ゲームタイマーエンティティ
 * 3分間のゲームタイマーを管理する
 */
export class GameTimer {
  private readonly _totalDuration: number;
  private readonly _timeProvider: TimeProvider;
  private _isRunning = false;
  private _isPaused = false;
  private _startTime: number | null = null;
  private _pausedTime = 0;
  private _pauseStartTime: number | null = null;

  constructor(totalDurationSeconds: number, timeProvider: TimeProvider = new SystemTimeProvider()) {
    if (totalDurationSeconds < 0) {
      throw new Error("総時間は0以上である必要があります");
    }
    
    this._totalDuration = totalDurationSeconds;
    this._timeProvider = timeProvider;
  }

  /**
   * 総ゲーム時間（秒）
   */
  get totalDuration(): number {
    return this._totalDuration;
  }

  /**
   * タイマー実行状態
   */
  get isRunning(): boolean {
    return this._isRunning;
  }

  /**
   * 一時停止状態
   */
  get isPaused(): boolean {
    return this._isPaused;
  }

  /**
   * 開始時刻
   */
  get startTime(): number | null {
    return this._startTime;
  }

  /**
   * 一時停止累計時間（ミリ秒）
   */
  get pausedTime(): number {
    return this._pausedTime;
  }

  /**
   * タイマーを開始する
   */
  start(): void {
    if (this._isRunning || this._isPaused) {
      throw new Error("タイマーは既に開始されています");
    }

    this._startTime = this._timeProvider.getCurrentTime();
    this._isRunning = true;
    this._isPaused = false;
    this._pausedTime = 0;
    this._pauseStartTime = null;
  }

  /**
   * タイマーを一時停止する
   */
  pause(): void {
    if (!this._isRunning) {
      throw new Error("タイマーが開始されていません");
    }
    
    if (this._isPaused) {
      throw new Error("タイマーは既に一時停止されています");
    }

    this._pauseStartTime = this._timeProvider.getCurrentTime();
    this._isRunning = false;
    this._isPaused = true;
  }

  /**
   * タイマーを再開する
   */
  resume(): void {
    if (!this._isPaused) {
      throw new Error("タイマーが一時停止されていません");
    }

    if (this._pauseStartTime !== null) {
      const pauseDuration = this._timeProvider.getCurrentTime() - this._pauseStartTime;
      this._pausedTime += pauseDuration;
    }

    this._pauseStartTime = null;
    this._isRunning = true;
    this._isPaused = false;
  }

  /**
   * タイマーを停止する
   */
  stop(): void {
    this._isRunning = false;
    this._isPaused = false;
    this._pauseStartTime = null;
  }

  /**
   * タイマーをリセットする
   */
  reset(): void {
    this._isRunning = false;
    this._isPaused = false;
    this._startTime = null;
    this._pausedTime = 0;
    this._pauseStartTime = null;
  }

  /**
   * 残り秒数を取得する
   */
  getRemainingSeconds(): number {
    if (!this._startTime) {
      return this._totalDuration;
    }

    const elapsedMilliseconds = this.getElapsedMilliseconds();
    const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);
    const remainingSeconds = Math.max(0, this._totalDuration - elapsedSeconds);
    
    return remainingSeconds;
  }

  /**
   * 経過秒数を取得する
   */
  getElapsedSeconds(): number {
    if (!this._startTime) {
      return 0;
    }

    const elapsedMilliseconds = this.getElapsedMilliseconds();
    return Math.floor(elapsedMilliseconds / 1000);
  }

  /**
   * 進捗率を取得する（0-100%）
   */
  getProgressPercentage(): number {
    if (this._totalDuration === 0) {
      return 100;
    }

    const elapsedSeconds = this.getElapsedSeconds();
    const progress = Math.min(100, Math.round((elapsedSeconds / this._totalDuration) * 100));
    
    return progress;
  }

  /**
   * 時間切れ判定を行う
   */
  isTimeUp(): boolean {
    if (!this._startTime) {
      return false;
    }

    return this.getRemainingSeconds() === 0;
  }

  /**
   * 残り時間をTimeRemainingオブジェクトとして取得する
   */
  getTimeRemaining(): TimeRemaining {
    return new TimeRemaining(this.getRemainingSeconds());
  }

  /**
   * タイマーを更新する（ゲームループ用）
   */
  update(deltaTime: number): void {
    // 現在の実装では特に何もしない
    // 時間の計算は getCurrentTime() ベースで行われるため
  }

  /**
   * 経過時間をミリ秒で取得する（内部用）
   */
  private getElapsedMilliseconds(): number {
    if (!this._startTime) {
      return 0;
    }

    let currentTime = this._timeProvider.getCurrentTime();
    
    // 一時停止中の場合は、一時停止開始時刻を現在時刻とする
    if (this._isPaused && this._pauseStartTime !== null) {
      currentTime = this._pauseStartTime;
    }

    const totalElapsed = currentTime - this._startTime;
    const actualElapsed = totalElapsed - this._pausedTime;
    
    return Math.max(0, actualElapsed);
  }
}