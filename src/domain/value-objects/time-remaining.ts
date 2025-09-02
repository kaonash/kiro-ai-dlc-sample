/**
 * 残り時間を表現する値オブジェクト
 */
export class TimeRemaining {
  private readonly _seconds: number;

  constructor(seconds: number) {
    if (seconds < 0) {
      throw new Error("残り時間は0以上である必要があります");
    }
    this._seconds = Math.floor(seconds);
  }

  /**
   * 残り秒数
   */
  get seconds(): number {
    return this._seconds;
  }

  /**
   * MM:SS形式の文字列表現
   */
  toString(): string {
    const minutes = Math.floor(this._seconds / 60);
    const seconds = this._seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  /**
   * 進捗率を計算（0-100%）
   * @param totalSeconds 総時間（秒）
   */
  toProgressPercentage(totalSeconds: number): number {
    if (totalSeconds <= 0) {
      return 100;
    }

    if (this._seconds >= totalSeconds) {
      return 0;
    }

    const elapsed = totalSeconds - this._seconds;
    return Math.round((elapsed / totalSeconds) * 100);
  }

  /**
   * 時間切れかどうか
   */
  isTimeUp(): boolean {
    return this._seconds === 0;
  }

  /**
   * 警告時間かどうか（30秒以下）
   */
  isWarningTime(): boolean {
    return this._seconds <= 30;
  }

  /**
   * クリティカル時間かどうか（10秒以下）
   */
  isCriticalTime(): boolean {
    return this._seconds <= 10;
  }

  /**
   * 秒数を減算した新しいインスタンスを返す
   */
  subtract(seconds: number): TimeRemaining {
    const newSeconds = Math.max(0, this._seconds - seconds);
    return new TimeRemaining(newSeconds);
  }

  /**
   * 秒数を加算した新しいインスタンスを返す
   */
  add(seconds: number): TimeRemaining {
    return new TimeRemaining(this._seconds + seconds);
  }

  /**
   * 等価性の判定
   */
  equals(other: TimeRemaining): boolean {
    return this._seconds === other._seconds;
  }

  /**
   * 分数を取得
   */
  getMinutes(): number {
    return Math.floor(this._seconds / 60);
  }

  /**
   * 秒数（分を除く）を取得
   */
  getSecondsInMinute(): number {
    return this._seconds % 60;
  }
}
