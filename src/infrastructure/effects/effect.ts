import { Position } from "../../domain/value-objects/position";
import { AnimationState } from "../../domain/value-objects/animation-state";

/**
 * エフェクトの基底クラス
 * 全てのビジュアルエフェクトの共通インターフェース
 */
export abstract class Effect {
  protected readonly startTime: number;
  protected readonly duration: number;
  protected readonly position: Position;
  protected _isActive = true;

  constructor(position: Position, duration: number) {
    this.position = position;
    this.duration = duration;
    this.startTime = performance.now();
  }

  /**
   * エフェクトがアクティブかどうか
   */
  get isActive(): boolean {
    return this._isActive;
  }

  /**
   * エフェクトの位置
   */
  get effectPosition(): Position {
    return this.position;
  }

  /**
   * エフェクトの進行度（0-1）
   */
  get progress(): number {
    const elapsed = performance.now() - this.startTime;
    return Math.min(elapsed / this.duration, 1);
  }

  /**
   * エフェクトが完了しているかどうか
   */
  get isComplete(): boolean {
    return this.progress >= 1;
  }

  /**
   * エフェクトを更新
   */
  update(deltaTime: number): void {
    if (this.isComplete) {
      this._isActive = false;
    }
  }

  /**
   * エフェクトを描画
   */
  abstract render(context: CanvasRenderingContext2D, deltaTime: number): void;

  /**
   * エフェクトを停止
   */
  stop(): void {
    this._isActive = false;
  }
}