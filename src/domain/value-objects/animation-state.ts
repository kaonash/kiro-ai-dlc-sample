/**
 * イージング関数の型定義
 */
export type EasingFunction = (t: number) => number;

/**
 * アニメーション状態を表す値オブジェクト
 */
export class AnimationState {
  public readonly startTime: number;
  public readonly duration: number;
  public readonly startValue: number;
  public readonly endValue: number;
  public readonly easingFunction: EasingFunction;

  constructor(
    startTime: number,
    duration: number,
    startValue: number,
    endValue: number,
    easingFunction: EasingFunction
  ) {
    this.startTime = startTime;
    this.duration = Math.max(0, duration);
    this.startValue = startValue;
    this.endValue = endValue;
    this.easingFunction = easingFunction;
  }

  /**
   * 指定時刻での現在値を取得
   */
  getCurrentValue(currentTime: number): number {
    if (this.duration === 0) {
      return this.endValue;
    }

    const progress = this.getProgress(currentTime);
    const easedProgress = this.easingFunction(progress);
    
    return this.startValue + (this.endValue - this.startValue) * easedProgress;
  }

  /**
   * アニメーションが完了しているかを判定
   */
  isComplete(currentTime: number): boolean {
    return currentTime >= this.startTime + this.duration;
  }

  /**
   * アニメーションの進行度を取得（0-1）
   */
  getProgress(currentTime: number): number {
    if (this.duration === 0) {
      return currentTime >= this.startTime ? 1 : 0;
    }

    const elapsed = currentTime - this.startTime;
    return Math.max(0, Math.min(1, elapsed / this.duration));
  }
}